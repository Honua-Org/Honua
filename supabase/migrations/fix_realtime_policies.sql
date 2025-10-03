-- Grant necessary permissions for realtime subscriptions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.marketplace_orders TO anon, authenticated;
GRANT SELECT ON public.messages TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.notifications TO anon, authenticated;

-- Create RLS policies for marketplace_orders if they don't exist
DROP POLICY IF EXISTS "Users can view their own orders" ON public.marketplace_orders;
CREATE POLICY "Users can view their own orders" ON public.marketplace_orders
    FOR SELECT USING (
        auth.uid() = buyer_id OR 
        auth.uid() = seller_id
    );

DROP POLICY IF EXISTS "Users can insert their own orders" ON public.marketplace_orders;
CREATE POLICY "Users can insert their own orders" ON public.marketplace_orders
    FOR INSERT WITH CHECK (
        auth.uid() = buyer_id
    );

DROP POLICY IF EXISTS "Sellers can update their orders" ON public.marketplace_orders;
CREATE POLICY "Sellers can update their orders" ON public.marketplace_orders
    FOR UPDATE USING (
        auth.uid() = seller_id
    );

-- Create RLS policies for messages if they don't exist
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
CREATE POLICY "Users can view messages in their conversations" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conversations c
            WHERE c.id = conversation_id
            AND (c.participant_one_id = auth.uid() OR c.participant_two_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON public.messages;
CREATE POLICY "Users can insert messages in their conversations" ON public.messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM public.conversations c
            WHERE c.id = conversation_id
            AND (c.participant_one_id = auth.uid() OR c.participant_two_id = auth.uid())
        )
    );

-- Create RLS policies for notifications if they don't exist
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (
        auth.uid() = recipient_id
    );

DROP POLICY IF EXISTS "Users can insert notifications" ON public.notifications;
CREATE POLICY "Users can insert notifications" ON public.notifications
    FOR INSERT WITH CHECK (
        auth.uid() = actor_id
    );

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (
        auth.uid() = recipient_id
    );

-- Ensure RLS is enabled on all tables
ALTER TABLE public.marketplace_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;