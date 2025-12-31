DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN 
    SELECT n.nspname AS schema,
           p.proname AS name,
           pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'get_customer_analytics',
        'update_product_search_vector',
        'update_green_points_tier',
        'generate_order_number',
        'get_marketplace_image_url',
        'get_verification_document_url',
        'get_review_image_url',
        'award_green_points',
        'redeem_green_points',
        'get_user_green_points_tier',
        'get_tier_multiplier',
        'award_order_completion_points',
        'award_review_points',
        'create_order_tracking_entry',
        'notify_order_status_change',
        'notify_new_order',
        'notify_new_review',
        'update_seller_status',
        'get_seller_stats',
        'can_user_become_seller',
        'update_sellers_updated_at',
        'notify_seller_status_change'
      )
  LOOP
    EXECUTE format('ALTER FUNCTION %I.%I(%s) SET search_path = pg_catalog, public', r.schema, r.name, r.args);
  END LOOP;
END $$;

