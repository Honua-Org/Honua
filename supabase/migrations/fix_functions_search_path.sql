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
        'sync_user_email',
        'update_conversation_timestamp',
        'update_marketplace_stock_movements_updated_at',
        'get_unread_message_count',
        'get_invites_leaderboard',
        'handle_new_user',
        'handle_immediate_user',
        'create_notification',
        'get_invite_leaderboard',
        'add_user_points',
        'update_notifications_updated_at',
        'check_stock_availability',
        'sync_product_stock',
        'update_follow_counts',
        'get_green_points_balance',
        'add_green_points',
        'get_green_points_history',
        'award_marketplace_purchase_points',
        'update_updated_at_column',
        'approve_organization_upgrade',
        'reject_organization_upgrade',
        'calculate_user_reputation',
        'get_user_reputation_level',
        'add_reputation_points',
        'add_product_image',
        'remove_product_image',
        'reorder_product_images',
        'generate_product_image_path',
        'update_inventory',
        'reserve_inventory'
      )
  LOOP
    EXECUTE format('ALTER FUNCTION %I.%I(%s) SET search_path = pg_catalog, public', r.schema, r.name, r.args);
  END LOOP;
END $$;

