-- Marketplace Messages Schema Migration
-- This creates the messaging system for buyer-seller communication

-- Create marketplace_conversations table
CREATE TABLE IF NOT EXISTS marketplace_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES marketplace_products(id) ON DELETE CASCADE,
    buyer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_id, buyer_id, seller_id)
);

-- Create marketplace_messages table
CREATE TABLE IF NOT EXISTS marketplace_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES marketplace_conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'offer', 'system')),
    metadata JSONB DEFAULT '{}',
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_marketplace_conversations_product_id ON marketplace_conversations(product_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_conversations_buyer_id ON marketplace_conversations(buyer_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_conversations_seller_id ON marketplace_conversations(seller_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_conversations_updated_at ON marketplace_conversations(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_marketplace_messages_conversation_id ON marketplace_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_messages_sender_id ON marketplace_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_messages_created_at ON marketplace_messages(created_at DESC);

-- RLS Policies for marketplace_conversations
ALTER TABLE marketplace_conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own conversations" ON marketplace_conversations;
CREATE POLICY "Users can view their own conversations" ON marketplace_conversations
    FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

DROP POLICY IF EXISTS "Buyers can create conversations" ON marketplace_conversations;
CREATE POLICY "Buyers can create conversations" ON marketplace_conversations
    FOR INSERT WITH CHECK (auth.uid() = buyer_id);

DROP POLICY IF EXISTS "Users can update their own conversations" ON marketplace_conversations;
CREATE POLICY "Users can update their own conversations" ON marketplace_conversations
    FOR UPDATE USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- RLS Policies for marketplace_messages
ALTER TABLE marketplace_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view messages in their conversations" ON marketplace_messages;
CREATE POLICY "Users can view messages in their conversations" ON marketplace_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM marketplace_conversations 
            WHERE id = conversation_id 
            AND (buyer_id = auth.uid() OR seller_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can send messages in their conversations" ON marketplace_messages;
CREATE POLICY "Users can send messages in their conversations" ON marketplace_messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM marketplace_conversations 
            WHERE id = conversation_id 
            AND (buyer_id = auth.uid() OR seller_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can update their own messages" ON marketplace_messages;
CREATE POLICY "Users can update their own messages" ON marketplace_messages
    FOR UPDATE USING (auth.uid() = sender_id);

-- Function to update conversation updated_at when new message is added
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE marketplace_conversations 
    SET updated_at = NOW() 
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update conversation timestamp
DROP TRIGGER IF EXISTS update_conversation_timestamp_trigger ON marketplace_messages;
CREATE TRIGGER update_conversation_timestamp_trigger
    AFTER INSERT ON marketplace_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_timestamp();

-- Function to get unread message count
CREATE OR REPLACE FUNCTION get_unread_message_count(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    unread_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO unread_count
    FROM marketplace_messages m
    JOIN marketplace_conversations c ON m.conversation_id = c.id
    WHERE (c.buyer_id = user_uuid OR c.seller_id = user_uuid)
    AND m.sender_id != user_uuid
    AND m.read_at IS NULL;
    
    RETURN unread_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;