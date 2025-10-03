-- Replace Fincra payment support with Stripe in marketplace_orders table

-- Drop the old check constraint
ALTER TABLE marketplace_orders DROP CONSTRAINT IF EXISTS marketplace_orders_payment_method_check;

-- Add the new check constraint that includes 'stripe' instead of 'fincra'
ALTER TABLE marketplace_orders ADD CONSTRAINT marketplace_orders_payment_method_check
CHECK (payment_method IN ('green_points', 'mixed', 'stripe'));

-- Update any existing orders with 'fincra' payment method to 'stripe'
UPDATE marketplace_orders SET payment_method = 'stripe' WHERE payment_method = 'fincra';

-- Drop the old Fincra payment reference column since we have stripe_payment_intent_id
ALTER TABLE marketplace_orders DROP COLUMN IF EXISTS fincra_payment_reference;

-- Create index for Stripe payment intent ID
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_stripe_payment_intent_id
ON marketplace_orders(stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL;