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
        'release_inventory',
        'complete_sale',
        'update_product_analytics_on_order',
        'create_inventory_for_new_product',
        'update_product_analytics_on_view',
        'update_product_analytics_on_message',
        'get_seller_analytics',
        'get_top_products'
      )
  LOOP
    EXECUTE format('ALTER FUNCTION %I.%I(%s) SET search_path = pg_catalog, public', r.schema, r.name, r.args);
  END LOOP;
END $$;

