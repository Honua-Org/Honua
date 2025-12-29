-- Drop duplicate indexes, keeping a single canonical index per column
-- marketplace_orders: keep idx_marketplace_orders_stripe_payment_intent_id
DROP INDEX IF EXISTS public.idx_marketplace_orders_stripe_payment_intent;

-- notifications: keep idx_notifications_created_at, idx_notifications_read, idx_notifications_recipient_id, idx_notifications_type
DROP INDEX IF EXISTS public.notifications_created_at_idx;
DROP INDEX IF EXISTS public.notifications_read_idx;
DROP INDEX IF EXISTS public.notifications_recipient_id_idx;
DROP INDEX IF EXISTS public.notifications_type_idx;
