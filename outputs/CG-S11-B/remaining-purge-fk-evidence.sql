-- READ ONLY: missing dependency coverage for existing disposable tables.
-- No application rows, credentials, images, function execution, or mutations.
WITH requested(name) AS (VALUES
 ('entity_comparison_statistics'),
 ('entity_distribution_statistics'),
 ('entity_market_statistics'),
 ('lead_entity_statistics'),
 ('lead_trend_snapshots'),
 ('market_cache_rebuild_logs'),
 ('market_combination_distribution_statistics'),
 ('market_combination_statistics'),
 ('market_distribution_statistics'),
 ('market_snapshots'),
 ('market_statistics'),
 ('properties'),
 ('sale_listing'),
 ('search_combination_statistics'),
 ('search_entity_statistics'),
 ('search_market_statistics'),
 ('search_ontology_terms'),
 ('search_statistics'),
 ('search_trend_snapshots'),
 ('verified_users'),
 ('verified_whatsapp_numbers'),
 ('whatsapp_otps')
)
SELECT r.name AS table_name,
 c.oid IS NOT NULL AS table_exists,
 c.relkind AS relation_kind,
 c.relispartition AS is_partition,
 coalesce((SELECT jsonb_agg(jsonb_build_object(
  'constraint', f.conname,
  'child', f.conrelid::regclass::text,
  'parent', f.confrelid::regclass::text,
  'definition', pg_get_constraintdef(f.oid, true),
  'validated', f.convalidated,
  'deferrable', f.condeferrable,
  'initially_deferred', f.condeferred
 ) ORDER BY f.conrelid::regclass::text,f.conname)
 FROM pg_constraint f
 WHERE f.contype='f' AND (f.conrelid=c.oid OR f.confrelid=c.oid)), '[]'::jsonb) AS incoming_and_outgoing_fks
FROM requested r
LEFT JOIN pg_class c ON c.oid=to_regclass(format('public.%I',r.name))
ORDER BY r.name;
