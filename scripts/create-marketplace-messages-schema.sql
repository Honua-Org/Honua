-- Create marketplace_messages table for buyer-seller communication
CREATE TABLE IF NOT EXISTS marketplace_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    product_id UUID REFERENCES marketplace_products(id) ON DELETE SET NULL,
    order_id UUID REFERENCES marketplace_orders(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_marketplace_messages_sender_id ON marketplace_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_messages_recipient_id ON marketplace_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_messages_product_id ON marketplace_messages(product_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_messages_order_id ON marketplace_messages(order_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_messages_created_at ON marketplace_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_marketplace_messages_conversation ON marketplace_messages(sender_id, recipient_id, product_id, order_id);

-- Enable RLS
ALTER TABLE marketplace_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can read messages they sent or received
CREATE POLICY "Users can read their own marketplace messages" ON marketplace_messages
    FOR SELECT USING (
        auth.uid() = sender_id OR 
        auth.uid() = recipient_id
    );

-- Users can send messages
CREATE POLICY "Users can send marketplace messages" ON marketplace_messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        sender_id != recipient_id
    );

-- Users can update their own messages (for read status, etc.)
CREATE POLICY "Users can update their own marketplace messages" ON marketplace_messages
    FOR UPDATE USING (
        auth.uid() = sender_id OR 
        auth.uid() = recipient_id
    );

-- Users can delete their own sent messages
CREATE POLICY "Users can delete their own sent marketplace messages" ON marketplace_messages
    FOR DELETE USING (auth.uid() = sender_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_marketplace_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_marketplace_messages_updated_at_trigger
    BEFORE UPDATE ON marketplace_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_marketplace_messages_updated_at();

-- Create marketplace_message_threads table for organizing conversations
CREATE TABLE IF NOT EXISTS marketplace_message_threads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    participant_one_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    participant_two_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    product_id UUID REFERENCES marketplace_products(id) ON DELETE SET NULL,
    order_id UUID REFERENCES marketplace_orders(id) ON DELETE SET NULL,
    thread_type VARCHAR(20) DEFAULT 'product_inquiry' CHECK (thread_type IN ('product_inquiry', 'order_discussion', 'general')),
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(participant_one_id, participant_two_id, product_id, order_id)
);

-- Create indexes for message threads
CREATE INDEX IF NOT EXISTS idx_marketplace_message_threads_participant_one ON marketplace_message_threads(participant_one_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_message_threads_participant_two ON marketplace_message_threads(participant_two_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_message_threads_product_id ON marketplace_message_threads(product_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_message_threads_order_id ON marketplace_message_threads(order_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_message_threads_last_message_at ON marketplace_message_threads(last_message_at);

-- Enable RLS for message threads
ALTER TABLE marketplace_message_threads ENABLE ROW LEVEL SECURITY;

-- RLS Policies for message threads
CREATE POLICY "Users can read their marketplace message threads" ON marketplace_message_threads
    FOR SELECT USING (
        auth.uid() = participant_one_id OR 
        auth.uid() = participant_two_id
    );

CREATE POLICY "Users can create marketplace message threads" ON marketplace_message_threads
    FOR INSERT WITH CHECK (
        auth.uid() = participant_one_id OR 
        auth.uid() = participant_two_id
    );

CREATE POLICY "Users can update their marketplace message threads" ON marketplace_message_threads
    FOR UPDATE USING (
        auth.uid() = participant_one_id OR 
        auth.uid() = participant_two_id
    );

-- Function to create or get message thread
CREATE OR REPLACE FUNCTION get_or_create_marketplace_message_thread(
    p_participant_one_id UUID,
    p_participant_two_id UUID,
    p_product_id UUID DEFAULT NULL,
    p_order_id UUID DEFAULT NULL,
    p_thread_type VARCHAR DEFAULT 'product_inquiry'
)
RETURNS UUID AS $$
DECLARE
    thread_id UUID;
    ordered_participant_one UUID;
    ordered_participant_two UUID;
BEGIN
    -- Ensure consistent ordering of participants
    IF p_participant_one_id < p_participant_two_id THEN
        ordered_participant_one := p_participant_one_id;
        ordered_participant_two := p_participant_two_id;
    ELSE
        ordered_participant_one := p_participant_two_id;
        ordered_participant_two := p_participant_one_id;
    END IF;

    -- Try to find existing thread
    SELECT id INTO thread_id
    FROM marketplace_message_threads
    WHERE participant_one_id = ordered_participant_one
      AND participant_two_id = ordered_participant_two
      AND (product_id = p_product_id OR (product_id IS NULL AND p_product_id IS NULL))
      AND (order_id = p_order_id OR (order_id IS NULL AND p_order_id IS NULL));

    -- If no thread exists, create one
    IF thread_id IS NULL THEN
        INSERT INTO marketplace_message_threads (
            participant_one_id,
            participant_two_id,
            product_id,
            order_id,
            thread_type
        ) VALUES (
            ordered_participant_one,
            ordered_participant_two,
            p_product_id,
            p_order_id,
            p_thread_type
        ) RETURNING id INTO thread_id;
    END IF;

    RETURN thread_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update thread's last message timestamp
CREATE OR REPLACE FUNCTION update_thread_last_message()
RETURNS TRIGGER AS $$
DECLARE
    thread_id UUID;
BEGIN
    -- Get or create thread for this message
    thread_id := get_or_create_marketplace_message_thread(
        NEW.sender_id,
        NEW.recipient_id,
        NEW.product_id,
        NEW.order_id,
        CASE 
            WHEN NEW.order_id IS NOT NULL THEN 'order_discussion'
            WHEN NEW.product_id IS NOT NULL THEN 'product_inquiry'
            ELSE 'general'
        END
    );

    -- Update the thread's last message timestamp
    UPDATE marketplace_message_threads
    SET last_message_at = NEW.created_at,
        updated_at = NOW()
    WHERE id = thread_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update thread timestamp when message is created
CREATE TRIGGER update_thread_last_message_trigger
    AFTER INSERT ON marketplace_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_thread_last_message();

-- Grant necessary permissions
GRANT ALL ON marketplace_messages TO authenticated;
GRANT ALL ON marketplace_message_threads TO authenticated;
GRANT EXECUTE ON FUNCTION get_or_create_marketplace_message_thread TO authenticated;