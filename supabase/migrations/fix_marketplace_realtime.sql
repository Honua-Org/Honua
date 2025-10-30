-- Fix realtime permissions for marketplace tables
-- Grant necessary permissions for realtime subscriptions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.marketplace_orders TO anon, authenticated;
GRANT SELECT ON public.marketplace_messages TO anon, authenticated;
GRANT SELECT ON public.marketplace_conversations TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.notifications TO anon, authenticated;

-- Ensure RLS is enabled and policies exist for marketplace_messages
ALTER TABLE public.marketplace_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.marketplace_messages;
CREATE POLICY "Users can view messages in their conversations" ON public.marketplace_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.marketplace_conversations c
            WHERE c.id = conversation_id
            AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
        )
    );

-- Enable realtime for marketplace tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.marketplace_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.marketplace_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.marketplace_conversations;