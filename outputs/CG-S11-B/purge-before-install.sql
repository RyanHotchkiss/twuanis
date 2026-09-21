-- S11-C owner-only purge group. NOT authorized for target execution by S11-B.
-- Capture reviewed storage manifest and operator log before running. Purge precedes canonical install.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='120s';
SET LOCAL search_path=pg_catalog,public;
DO $$ BEGIN
 IF current_user<>'postgres' OR session_user<>'postgres' THEN RAISE EXCEPTION 'postgres maintenance session required'; END IF;
 IF to_regnamespace('twuanis_canonical_private') IS NOT NULL THEN RAISE EXCEPTION 'pre-installation purge required; do not disable incoming canonical guards'; END IF;
END $$;
LOCK TABLE auth.users IN SHARE MODE;
LOCK TABLE public.account_permissions IN SHARE MODE;
LOCK TABLE public.add_on_product_packages IN SHARE MODE;
LOCK TABLE public.add_on_products IN SHARE MODE;
LOCK TABLE public.engines IN SHARE MODE;
LOCK TABLE public.entitlements IN SHARE MODE;
LOCK TABLE public.fx_rates IN SHARE MODE;
LOCK TABLE public.geography_import IN SHARE MODE;
LOCK TABLE public.ontology_relationships IN SHARE MODE;
LOCK TABLE public.ontology_terms IN SHARE MODE;
LOCK TABLE public.package_account_permissions IN SHARE MODE;
LOCK TABLE public.package_engines IN SHARE MODE;
LOCK TABLE public.package_entitlements IN SHARE MODE;
LOCK TABLE public.package_limits IN SHARE MODE;
LOCK TABLE public.packages IN SHARE MODE;
LOCK TABLE public.activities IN ACCESS EXCLUSIVE MODE;
LOCK TABLE public.activity_events IN ACCESS EXCLUSIVE MODE;
LOCK TABLE public.bank_transfer_payments IN ACCESS EXCLUSIVE MODE;
LOCK TABLE public.entity_comparison_statistics IN ACCESS EXCLUSIVE MODE;
LOCK TABLE public.entity_distribution_statistics IN ACCESS EXCLUSIVE MODE;
LOCK TABLE public.entity_market_statistics IN ACCESS EXCLUSIVE MODE;
LOCK TABLE public.favorite_collection_items IN ACCESS EXCLUSIVE MODE;
LOCK TABLE public.favorite_collections IN ACCESS EXCLUSIVE MODE;
LOCK TABLE public.lead_entity_statistics IN ACCESS EXCLUSIVE MODE;
LOCK TABLE public.lead_trend_snapshots IN ACCESS EXCLUSIVE MODE;
LOCK TABLE public.listing_entitlements IN ACCESS EXCLUSIVE MODE;
LOCK TABLE public.listing_events IN ACCESS EXCLUSIVE MODE;
LOCK TABLE public.listing_favorites IN ACCESS EXCLUSIVE MODE;
LOCK TABLE public.listing_measurement_provenance IN ACCESS EXCLUSIVE MODE;
LOCK TABLE public.listing_publish_tokens IN ACCESS EXCLUSIVE MODE;
LOCK TABLE public.listings IN ACCESS EXCLUSIVE MODE;
LOCK TABLE public.listings_ontology_terms IN ACCESS EXCLUSIVE MODE;
LOCK TABLE public.market_cache_rebuild_logs IN ACCESS EXCLUSIVE MODE;
LOCK TABLE public.market_combination_distribution_statistics IN ACCESS EXCLUSIVE MODE;
LOCK TABLE public.market_combination_statistics IN ACCESS EXCLUSIVE MODE;
LOCK TABLE public.market_comparisons IN ACCESS EXCLUSIVE MODE;
LOCK TABLE public.market_distribution_statistics IN ACCESS EXCLUSIVE MODE;
LOCK TABLE public.market_snapshots IN ACCESS EXCLUSIVE MODE;
LOCK TABLE public.market_statistics IN ACCESS EXCLUSIVE MODE;
LOCK TABLE public.notifications IN ACCESS EXCLUSIVE MODE;
LOCK TABLE public.payment_reviewers IN ACCESS EXCLUSIVE MODE;
LOCK TABLE public.promotion_events IN ACCESS EXCLUSIVE MODE;
LOCK TABLE public.promotion_intelligence_evidence IN ACCESS EXCLUSIVE MODE;
LOCK TABLE public.properties IN ACCESS EXCLUSIVE MODE;
LOCK TABLE public.property_comparisons IN ACCESS EXCLUSIVE MODE;
LOCK TABLE public.property_notes IN ACCESS EXCLUSIVE MODE;
LOCK TABLE public.purchase_request_events IN ACCESS EXCLUSIVE MODE;
LOCK TABLE public.purchase_requests IN ACCESS EXCLUSIVE MODE;
LOCK TABLE public.push_subscriptions IN ACCESS EXCLUSIVE MODE;
LOCK TABLE public.sale_listing IN ACCESS EXCLUSIVE MODE;
LOCK TABLE public.saved_analyses IN ACCESS EXCLUSIVE MODE;
LOCK TABLE public.saved_search_alert_deliveries IN ACCESS EXCLUSIVE MODE;
LOCK TABLE public.saved_searches IN ACCESS EXCLUSIVE MODE;
LOCK TABLE public.search_combination_statistics IN ACCESS EXCLUSIVE MODE;
LOCK TABLE public.search_entity_statistics IN ACCESS EXCLUSIVE MODE;
LOCK TABLE public.search_market_statistics IN ACCESS EXCLUSIVE MODE;
LOCK TABLE public.search_ontology_terms IN ACCESS EXCLUSIVE MODE;
LOCK TABLE public.search_statistics IN ACCESS EXCLUSIVE MODE;
LOCK TABLE public.search_trend_snapshots IN ACCESS EXCLUSIVE MODE;
LOCK TABLE public.sinpe_payments IN ACCESS EXCLUSIVE MODE;
LOCK TABLE public.user_favorites IN ACCESS EXCLUSIVE MODE;
LOCK TABLE public.user_recent_activity IN ACCESS EXCLUSIVE MODE;
LOCK TABLE public.user_subscriptions IN ACCESS EXCLUSIVE MODE;
LOCK TABLE public.verified_users IN ACCESS EXCLUSIVE MODE;
LOCK TABLE public.verified_whatsapp_numbers IN ACCESS EXCLUSIVE MODE;
LOCK TABLE public.whatsapp_otps IN ACCESS EXCLUSIVE MODE;
CREATE TEMP TABLE s11_purge_allowlist(name text PRIMARY KEY) ON COMMIT DROP;
INSERT INTO s11_purge_allowlist VALUES ('public.activities'),('public.activity_events'),('public.bank_transfer_payments'),('public.entity_comparison_statistics'),('public.entity_distribution_statistics'),('public.entity_market_statistics'),('public.favorite_collection_items'),('public.favorite_collections'),('public.lead_entity_statistics'),('public.lead_trend_snapshots'),('public.listing_entitlements'),('public.listing_events'),('public.listing_favorites'),('public.listing_measurement_provenance'),('public.listing_publish_tokens'),('public.listings'),('public.listings_ontology_terms'),('public.market_cache_rebuild_logs'),('public.market_combination_distribution_statistics'),('public.market_combination_statistics'),('public.market_comparisons'),('public.market_distribution_statistics'),('public.market_snapshots'),('public.market_statistics'),('public.notifications'),('public.payment_reviewers'),('public.promotion_events'),('public.promotion_intelligence_evidence'),('public.properties'),('public.property_comparisons'),('public.property_notes'),('public.purchase_request_events'),('public.purchase_requests'),('public.push_subscriptions'),('public.sale_listing'),('public.saved_analyses'),('public.saved_search_alert_deliveries'),('public.saved_searches'),('public.search_combination_statistics'),('public.search_entity_statistics'),('public.search_market_statistics'),('public.search_ontology_terms'),('public.search_statistics'),('public.search_trend_snapshots'),('public.sinpe_payments'),('public.user_favorites'),('public.user_recent_activity'),('public.user_subscriptions'),('public.verified_users'),('public.verified_whatsapp_numbers'),('public.whatsapp_otps');
CREATE TEMP TABLE s11_expected_fk(child text,parent text,name text,definition text,validated boolean,is_deferrable boolean,deferred boolean) ON COMMIT DROP;
INSERT INTO s11_expected_fk VALUES ('public.activities','auth.users','activities_user_id_fkey','FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE',true,false,false),
('public.activity_events','auth.users','activity_events_user_id_fkey','FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL',true,false,false),
('public.bank_transfer_payments','auth.users','bank_transfer_payments_reviewed_by_fkey','FOREIGN KEY (reviewed_by) REFERENCES auth.users(id) ON DELETE SET NULL',true,false,false),
('public.bank_transfer_payments','auth.users','bank_transfer_payments_user_id_fkey','FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE',true,false,false),
('public.bank_transfer_payments','public.purchase_requests','bank_transfer_payments_purchase_request_id_fkey','FOREIGN KEY (purchase_request_id) REFERENCES purchase_requests(id) ON DELETE RESTRICT',true,false,false),
('public.favorite_collection_items','public.favorite_collections','favorite_collection_items_collection_id_fkey','FOREIGN KEY (collection_id) REFERENCES favorite_collections(id) ON DELETE CASCADE',true,false,false),
('public.favorite_collection_items','public.listings','favorite_collection_items_listing_id_fkey','FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE',true,false,false),
('public.favorite_collections','auth.users','favorite_collections_user_id_fkey','FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE',true,false,false),
('public.listing_entitlements','public.add_on_products','listing_entitlements_product_id_fkey','FOREIGN KEY (product_id) REFERENCES add_on_products(id) ON DELETE RESTRICT',true,false,false),
('public.listing_entitlements','auth.users','listing_entitlements_assigned_by_fkey','FOREIGN KEY (assigned_by) REFERENCES auth.users(id) ON DELETE SET NULL',true,false,false),
('public.listing_entitlements','auth.users','listing_entitlements_owner_id_fkey','FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE',true,false,false),
('public.listing_entitlements','auth.users','listing_entitlements_revoked_by_fkey','FOREIGN KEY (revoked_by) REFERENCES auth.users(id) ON DELETE SET NULL',true,false,false),
('public.listing_entitlements','public.listings','listing_entitlements_listing_id_fkey','FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE',true,false,false),
('public.listing_entitlements','public.purchase_requests','listing_entitlements_purchase_request_id_fkey','FOREIGN KEY (purchase_request_id) REFERENCES purchase_requests(id) ON DELETE RESTRICT',true,false,false),
('public.listing_events','auth.users','listing_events_user_id_fkey','FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL',true,false,false),
('public.listing_events','public.listings','listing_events_listing_id_fkey','FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE',true,false,false),
('public.listing_favorites','auth.users','listing_favorites_user_id_fkey','FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE',true,false,false),
('public.listing_favorites','public.listings','listing_favorites_listing_id_fkey','FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE',true,false,false),
('public.listing_measurement_provenance','public.listings','listing_measurement_provenance_listing_id_fkey','FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE',true,false,false),
('public.listing_publish_tokens','public.listings','listing_publish_tokens_published_listing_id_fkey','FOREIGN KEY (published_listing_id) REFERENCES listings(id) ON DELETE SET NULL',true,false,false),
('public.listings','auth.users','listings_owner_id_fkey','FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE SET NULL',true,false,false),
('public.listings_ontology_terms','public.listings','listings_ontology_terms_listing_id_fkey','FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE',true,false,false),
('public.listings_ontology_terms','public.ontology_terms','listings_ontology_terms_ontology_term_id_fkey','FOREIGN KEY (ontology_term_id) REFERENCES ontology_terms(id) ON DELETE CASCADE',true,false,false),
('public.market_comparisons','auth.users','market_comparisons_user_id_fkey','FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE',true,false,false),
('public.notifications','auth.users','notifications_user_id_fkey','FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE',true,false,false),
('public.payment_reviewers','auth.users','payment_reviewers_user_id_fkey','FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE',true,false,false),
('public.promotion_events','public.add_on_products','promotion_events_product_id_fkey','FOREIGN KEY (product_id) REFERENCES add_on_products(id)',true,false,false),
('public.promotion_events','public.listing_entitlements','promotion_events_entitlement_id_fkey','FOREIGN KEY (entitlement_id) REFERENCES listing_entitlements(id)',true,false,false),
('public.promotion_events','public.listings','promotion_events_listing_id_fkey','FOREIGN KEY (listing_id) REFERENCES listings(id)',true,false,false),
('public.promotion_events','public.purchase_requests','promotion_events_purchase_request_id_fkey','FOREIGN KEY (purchase_request_id) REFERENCES purchase_requests(id)',true,false,false),
('public.promotion_intelligence_evidence','public.add_on_products','promotion_intelligence_evidence_product_id_fkey','FOREIGN KEY (product_id) REFERENCES add_on_products(id)',true,false,false),
('public.promotion_intelligence_evidence','public.listing_entitlements','promotion_intelligence_evidence_entitlement_id_fkey','FOREIGN KEY (entitlement_id) REFERENCES listing_entitlements(id)',true,false,false),
('public.promotion_intelligence_evidence','public.listings','promotion_intelligence_evidence_listing_id_fkey','FOREIGN KEY (listing_id) REFERENCES listings(id)',true,false,false),
('public.property_comparisons','auth.users','property_comparisons_user_id_fkey','FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE',true,false,false),
('public.property_notes','auth.users','property_notes_user_id_fkey','FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE',true,false,false),
('public.property_notes','public.listings','property_notes_listing_id_fkey','FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE',true,false,false),
('public.purchase_request_events','auth.users','purchase_request_events_actor_id_fkey','FOREIGN KEY (actor_id) REFERENCES auth.users(id) ON DELETE SET NULL',true,false,false),
('public.purchase_request_events','public.purchase_requests','purchase_request_events_purchase_request_id_fkey','FOREIGN KEY (purchase_request_id) REFERENCES purchase_requests(id) ON DELETE RESTRICT',true,false,false),
('public.purchase_requests','public.add_on_products','purchase_requests_add_on_product_id_fkey','FOREIGN KEY (add_on_product_id) REFERENCES add_on_products(id) ON DELETE RESTRICT',true,false,false),
('public.purchase_requests','auth.users','purchase_requests_approved_by_fkey','FOREIGN KEY (approved_by) REFERENCES auth.users(id) ON DELETE SET NULL',true,false,false),
('public.purchase_requests','auth.users','purchase_requests_cancelled_by_fkey','FOREIGN KEY (cancelled_by) REFERENCES auth.users(id) ON DELETE SET NULL',true,false,false),
('public.purchase_requests','auth.users','purchase_requests_owner_id_fkey','FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE',true,false,false),
('public.purchase_requests','auth.users','purchase_requests_rejected_by_fkey','FOREIGN KEY (rejected_by) REFERENCES auth.users(id) ON DELETE SET NULL',true,false,false),
('public.purchase_requests','public.listings','purchase_requests_listing_id_fkey','FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE RESTRICT',true,false,false),
('public.purchase_requests','public.packages','purchase_requests_package_id_fkey','FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE RESTRICT',true,false,false),
('public.push_subscriptions','auth.users','push_subscriptions_user_id_fkey','FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE',true,false,false),
('public.saved_analyses','auth.users','saved_analyses_user_id_fkey','FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE',true,false,false),
('public.saved_search_alert_deliveries','auth.users','saved_search_alert_deliveries_user_id_fkey','FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE',true,false,false),
('public.saved_search_alert_deliveries','public.listings','saved_search_alert_deliveries_listing_id_fkey','FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE',true,false,false),
('public.saved_search_alert_deliveries','public.saved_searches','saved_search_alert_deliveries_saved_search_id_fkey','FOREIGN KEY (saved_search_id) REFERENCES saved_searches(id) ON DELETE CASCADE',true,false,false),
('public.saved_searches','auth.users','saved_searches_user_id_fkey','FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE',true,false,false),
('public.sinpe_payments','auth.users','sinpe_payments_reviewed_by_fkey','FOREIGN KEY (reviewed_by) REFERENCES auth.users(id) ON DELETE SET NULL',true,false,false),
('public.sinpe_payments','auth.users','sinpe_payments_user_id_fkey','FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE',true,false,false),
('public.sinpe_payments','public.purchase_requests','sinpe_payments_purchase_request_id_fkey','FOREIGN KEY (purchase_request_id) REFERENCES purchase_requests(id) ON DELETE RESTRICT',true,false,false),
('public.sinpe_payments','public.user_subscriptions','sinpe_payments_subscription_id_fkey','FOREIGN KEY (subscription_id) REFERENCES user_subscriptions(id) ON DELETE RESTRICT',true,false,false),
('public.user_favorites','auth.users','user_favorites_user_id_fkey','FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE',true,false,false),
('public.user_recent_activity','auth.users','user_recent_activity_user_id_fkey','FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE',true,false,false),
('public.user_subscriptions','auth.users','user_subscriptions_user_id_fkey','FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE',true,false,false),
('public.user_subscriptions','public.packages','user_subscriptions_package_id_fkey','FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE RESTRICT',true,false,false),
('public.user_subscriptions','public.purchase_requests','user_subscriptions_purchase_request_id_fkey','FOREIGN KEY (purchase_request_id) REFERENCES purchase_requests(id) ON DELETE RESTRICT',true,false,false),
('public.entity_distribution_statistics','public.ontology_terms','fk_distribution_entity','FOREIGN KEY (ontology_term_id) REFERENCES ontology_terms(id)',true,false,false),
('public.entity_distribution_statistics','public.ontology_terms','fk_distribution_related','FOREIGN KEY (related_term_id) REFERENCES ontology_terms(id)',true,false,false),
('public.entity_market_statistics','public.ontology_terms','fk_entity_market_statistics_term','FOREIGN KEY (ontology_term_id) REFERENCES ontology_terms(id)',true,false,false),
('public.lead_entity_statistics','public.ontology_terms','lead_entity_statistics_ontology_term_id_fkey','FOREIGN KEY (ontology_term_id) REFERENCES ontology_terms(id)',true,false,false),
('public.lead_trend_snapshots','public.ontology_terms','lead_trend_snapshots_ontology_term_id_fkey','FOREIGN KEY (ontology_term_id) REFERENCES ontology_terms(id)',true,false,false),
('public.search_entity_statistics','public.ontology_terms','search_entity_statistics_ontology_term_id_fkey','FOREIGN KEY (ontology_term_id) REFERENCES ontology_terms(id)',true,false,false),
('public.search_market_statistics','public.ontology_terms','search_market_statistics_ontology_term_id_fkey','FOREIGN KEY (ontology_term_id) REFERENCES ontology_terms(id)',true,false,false),
('public.search_ontology_terms','public.search_statistics','fk_search_ontology_search','FOREIGN KEY (search_id) REFERENCES search_statistics(id) ON DELETE CASCADE',true,false,false),
('public.search_ontology_terms','public.ontology_terms','fk_search_ontology_term','FOREIGN KEY (ontology_term_id) REFERENCES ontology_terms(id) ON DELETE CASCADE',true,false,false),
('public.search_trend_snapshots','public.ontology_terms','search_trend_snapshots_ontology_term_id_fkey','FOREIGN KEY (ontology_term_id) REFERENCES ontology_terms(id)',true,false,false);
CREATE TEMP VIEW s11_actual_fk AS
 SELECT nc.nspname||'.'||c.relname AS child,np.nspname||'.'||p.relname AS parent,f.conname::text AS name,
 replace(pg_get_constraintdef(f.oid,true),'public.','') AS definition,f.convalidated AS validated,f.condeferrable AS is_deferrable,f.condeferred AS deferred
 FROM pg_constraint f JOIN pg_class c ON c.oid=f.conrelid JOIN pg_namespace nc ON nc.oid=c.relnamespace
 JOIN pg_class p ON p.oid=f.confrelid JOIN pg_namespace np ON np.oid=p.relnamespace
 WHERE f.contype='f' AND (nc.nspname||'.'||c.relname IN(SELECT name FROM s11_purge_allowlist) OR np.nspname||'.'||p.relname IN(SELECT name FROM s11_purge_allowlist));
UPDATE s11_expected_fk SET definition=replace(definition,'public.','');
DO $$ BEGIN
 IF EXISTS((TABLE s11_actual_fk EXCEPT TABLE s11_expected_fk) UNION ALL (TABLE s11_expected_fk EXCEPT TABLE s11_actual_fk)) THEN
 RAISE EXCEPTION 'purge FK drift; abort without expanding scope'; END IF;
END $$;
CREATE TEMP TABLE s11_preserved(name text PRIMARY KEY,n bigint,digest text) ON COMMIT DROP;
INSERT INTO s11_preserved SELECT 'auth.users',count(*),md5(coalesce(string_agg(md5(to_jsonb(x)::text),'' ORDER BY md5(to_jsonb(x)::text)),'')) FROM auth.users x;
INSERT INTO s11_preserved SELECT 'public.account_permissions',count(*),md5(coalesce(string_agg(md5(to_jsonb(x)::text),'' ORDER BY md5(to_jsonb(x)::text)),'')) FROM public.account_permissions x;
INSERT INTO s11_preserved SELECT 'public.add_on_product_packages',count(*),md5(coalesce(string_agg(md5(to_jsonb(x)::text),'' ORDER BY md5(to_jsonb(x)::text)),'')) FROM public.add_on_product_packages x;
INSERT INTO s11_preserved SELECT 'public.add_on_products',count(*),md5(coalesce(string_agg(md5(to_jsonb(x)::text),'' ORDER BY md5(to_jsonb(x)::text)),'')) FROM public.add_on_products x;
INSERT INTO s11_preserved SELECT 'public.engines',count(*),md5(coalesce(string_agg(md5(to_jsonb(x)::text),'' ORDER BY md5(to_jsonb(x)::text)),'')) FROM public.engines x;
INSERT INTO s11_preserved SELECT 'public.entitlements',count(*),md5(coalesce(string_agg(md5(to_jsonb(x)::text),'' ORDER BY md5(to_jsonb(x)::text)),'')) FROM public.entitlements x;
INSERT INTO s11_preserved SELECT 'public.fx_rates',count(*),md5(coalesce(string_agg(md5(to_jsonb(x)::text),'' ORDER BY md5(to_jsonb(x)::text)),'')) FROM public.fx_rates x;
INSERT INTO s11_preserved SELECT 'public.geography_import',count(*),md5(coalesce(string_agg(md5(to_jsonb(x)::text),'' ORDER BY md5(to_jsonb(x)::text)),'')) FROM public.geography_import x;
INSERT INTO s11_preserved SELECT 'public.ontology_relationships',count(*),md5(coalesce(string_agg(md5(to_jsonb(x)::text),'' ORDER BY md5(to_jsonb(x)::text)),'')) FROM public.ontology_relationships x;
INSERT INTO s11_preserved SELECT 'public.ontology_terms',count(*),md5(coalesce(string_agg(md5(to_jsonb(x)::text),'' ORDER BY md5(to_jsonb(x)::text)),'')) FROM public.ontology_terms x;
INSERT INTO s11_preserved SELECT 'public.package_account_permissions',count(*),md5(coalesce(string_agg(md5(to_jsonb(x)::text),'' ORDER BY md5(to_jsonb(x)::text)),'')) FROM public.package_account_permissions x;
INSERT INTO s11_preserved SELECT 'public.package_engines',count(*),md5(coalesce(string_agg(md5(to_jsonb(x)::text),'' ORDER BY md5(to_jsonb(x)::text)),'')) FROM public.package_engines x;
INSERT INTO s11_preserved SELECT 'public.package_entitlements',count(*),md5(coalesce(string_agg(md5(to_jsonb(x)::text),'' ORDER BY md5(to_jsonb(x)::text)),'')) FROM public.package_entitlements x;
INSERT INTO s11_preserved SELECT 'public.package_limits',count(*),md5(coalesce(string_agg(md5(to_jsonb(x)::text),'' ORDER BY md5(to_jsonb(x)::text)),'')) FROM public.package_limits x;
INSERT INTO s11_preserved SELECT 'public.packages',count(*),md5(coalesce(string_agg(md5(to_jsonb(x)::text),'' ORDER BY md5(to_jsonb(x)::text)),'')) FROM public.packages x;
CREATE TEMP TABLE s11_trigger_before ON COMMIT DROP AS
 SELECT t.oid,t.tgenabled,pg_get_triggerdef(t.oid) AS definition FROM pg_trigger t
 JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN('public','auth');
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_trigger t WHERE t.tgrelid='public.promotion_events'::regclass
 AND t.tgname='prevent_promotion_events_delete' AND t.tgfoid='public.prevent_promotion_event_mutation()'::regprocedure
 AND t.tgtype=11 AND NOT t.tgisinternal AND t.tgenabled='O') THEN RAISE EXCEPTION 'reviewed promotion DELETE guard mismatch'; END IF;
 IF EXISTS(SELECT 1 FROM pg_trigger t JOIN pg_constraint c ON c.oid=t.tgconstraint WHERE c.contype='f' AND t.tgenabled NOT IN('O','A')) THEN RAISE EXCEPTION 'disabled FK trigger'; END IF;
END $$;
ALTER TABLE public.promotion_events DISABLE TRIGGER prevent_promotion_events_delete;
CREATE TEMP TABLE s11_deleted(name text PRIMARY KEY,deleted_count bigint) ON COMMIT DROP;
WITH deleted AS (DELETE FROM public.activities RETURNING 1) INSERT INTO s11_deleted SELECT 'public.activities',count(*) FROM deleted;
WITH deleted AS (DELETE FROM public.activity_events RETURNING 1) INSERT INTO s11_deleted SELECT 'public.activity_events',count(*) FROM deleted;
WITH deleted AS (DELETE FROM public.bank_transfer_payments RETURNING 1) INSERT INTO s11_deleted SELECT 'public.bank_transfer_payments',count(*) FROM deleted;
WITH deleted AS (DELETE FROM public.entity_comparison_statistics RETURNING 1) INSERT INTO s11_deleted SELECT 'public.entity_comparison_statistics',count(*) FROM deleted;
WITH deleted AS (DELETE FROM public.entity_distribution_statistics RETURNING 1) INSERT INTO s11_deleted SELECT 'public.entity_distribution_statistics',count(*) FROM deleted;
WITH deleted AS (DELETE FROM public.entity_market_statistics RETURNING 1) INSERT INTO s11_deleted SELECT 'public.entity_market_statistics',count(*) FROM deleted;
WITH deleted AS (DELETE FROM public.favorite_collection_items RETURNING 1) INSERT INTO s11_deleted SELECT 'public.favorite_collection_items',count(*) FROM deleted;
WITH deleted AS (DELETE FROM public.lead_entity_statistics RETURNING 1) INSERT INTO s11_deleted SELECT 'public.lead_entity_statistics',count(*) FROM deleted;
WITH deleted AS (DELETE FROM public.lead_trend_snapshots RETURNING 1) INSERT INTO s11_deleted SELECT 'public.lead_trend_snapshots',count(*) FROM deleted;
WITH deleted AS (DELETE FROM public.listing_events RETURNING 1) INSERT INTO s11_deleted SELECT 'public.listing_events',count(*) FROM deleted;
WITH deleted AS (DELETE FROM public.listing_favorites RETURNING 1) INSERT INTO s11_deleted SELECT 'public.listing_favorites',count(*) FROM deleted;
WITH deleted AS (DELETE FROM public.listing_measurement_provenance RETURNING 1) INSERT INTO s11_deleted SELECT 'public.listing_measurement_provenance',count(*) FROM deleted;
WITH deleted AS (DELETE FROM public.listing_publish_tokens RETURNING 1) INSERT INTO s11_deleted SELECT 'public.listing_publish_tokens',count(*) FROM deleted;
WITH deleted AS (DELETE FROM public.listings_ontology_terms RETURNING 1) INSERT INTO s11_deleted SELECT 'public.listings_ontology_terms',count(*) FROM deleted;
WITH deleted AS (DELETE FROM public.market_cache_rebuild_logs RETURNING 1) INSERT INTO s11_deleted SELECT 'public.market_cache_rebuild_logs',count(*) FROM deleted;
WITH deleted AS (DELETE FROM public.market_combination_distribution_statistics RETURNING 1) INSERT INTO s11_deleted SELECT 'public.market_combination_distribution_statistics',count(*) FROM deleted;
WITH deleted AS (DELETE FROM public.market_combination_statistics RETURNING 1) INSERT INTO s11_deleted SELECT 'public.market_combination_statistics',count(*) FROM deleted;
WITH deleted AS (DELETE FROM public.market_comparisons RETURNING 1) INSERT INTO s11_deleted SELECT 'public.market_comparisons',count(*) FROM deleted;
WITH deleted AS (DELETE FROM public.market_distribution_statistics RETURNING 1) INSERT INTO s11_deleted SELECT 'public.market_distribution_statistics',count(*) FROM deleted;
WITH deleted AS (DELETE FROM public.market_snapshots RETURNING 1) INSERT INTO s11_deleted SELECT 'public.market_snapshots',count(*) FROM deleted;
WITH deleted AS (DELETE FROM public.market_statistics RETURNING 1) INSERT INTO s11_deleted SELECT 'public.market_statistics',count(*) FROM deleted;
WITH deleted AS (DELETE FROM public.notifications RETURNING 1) INSERT INTO s11_deleted SELECT 'public.notifications',count(*) FROM deleted;
WITH deleted AS (DELETE FROM public.payment_reviewers RETURNING 1) INSERT INTO s11_deleted SELECT 'public.payment_reviewers',count(*) FROM deleted;
WITH deleted AS (DELETE FROM public.promotion_events RETURNING 1) INSERT INTO s11_deleted SELECT 'public.promotion_events',count(*) FROM deleted;
WITH deleted AS (DELETE FROM public.promotion_intelligence_evidence RETURNING 1) INSERT INTO s11_deleted SELECT 'public.promotion_intelligence_evidence',count(*) FROM deleted;
WITH deleted AS (DELETE FROM public.properties RETURNING 1) INSERT INTO s11_deleted SELECT 'public.properties',count(*) FROM deleted;
WITH deleted AS (DELETE FROM public.property_comparisons RETURNING 1) INSERT INTO s11_deleted SELECT 'public.property_comparisons',count(*) FROM deleted;
WITH deleted AS (DELETE FROM public.property_notes RETURNING 1) INSERT INTO s11_deleted SELECT 'public.property_notes',count(*) FROM deleted;
WITH deleted AS (DELETE FROM public.purchase_request_events RETURNING 1) INSERT INTO s11_deleted SELECT 'public.purchase_request_events',count(*) FROM deleted;
WITH deleted AS (DELETE FROM public.push_subscriptions RETURNING 1) INSERT INTO s11_deleted SELECT 'public.push_subscriptions',count(*) FROM deleted;
WITH deleted AS (DELETE FROM public.sale_listing RETURNING 1) INSERT INTO s11_deleted SELECT 'public.sale_listing',count(*) FROM deleted;
WITH deleted AS (DELETE FROM public.saved_analyses RETURNING 1) INSERT INTO s11_deleted SELECT 'public.saved_analyses',count(*) FROM deleted;
WITH deleted AS (DELETE FROM public.saved_search_alert_deliveries RETURNING 1) INSERT INTO s11_deleted SELECT 'public.saved_search_alert_deliveries',count(*) FROM deleted;
WITH deleted AS (DELETE FROM public.search_combination_statistics RETURNING 1) INSERT INTO s11_deleted SELECT 'public.search_combination_statistics',count(*) FROM deleted;
WITH deleted AS (DELETE FROM public.search_entity_statistics RETURNING 1) INSERT INTO s11_deleted SELECT 'public.search_entity_statistics',count(*) FROM deleted;
WITH deleted AS (DELETE FROM public.search_market_statistics RETURNING 1) INSERT INTO s11_deleted SELECT 'public.search_market_statistics',count(*) FROM deleted;
WITH deleted AS (DELETE FROM public.search_ontology_terms RETURNING 1) INSERT INTO s11_deleted SELECT 'public.search_ontology_terms',count(*) FROM deleted;
WITH deleted AS (DELETE FROM public.search_trend_snapshots RETURNING 1) INSERT INTO s11_deleted SELECT 'public.search_trend_snapshots',count(*) FROM deleted;
WITH deleted AS (DELETE FROM public.sinpe_payments RETURNING 1) INSERT INTO s11_deleted SELECT 'public.sinpe_payments',count(*) FROM deleted;
WITH deleted AS (DELETE FROM public.user_favorites RETURNING 1) INSERT INTO s11_deleted SELECT 'public.user_favorites',count(*) FROM deleted;
WITH deleted AS (DELETE FROM public.user_recent_activity RETURNING 1) INSERT INTO s11_deleted SELECT 'public.user_recent_activity',count(*) FROM deleted;
WITH deleted AS (DELETE FROM public.verified_users RETURNING 1) INSERT INTO s11_deleted SELECT 'public.verified_users',count(*) FROM deleted;
WITH deleted AS (DELETE FROM public.verified_whatsapp_numbers RETURNING 1) INSERT INTO s11_deleted SELECT 'public.verified_whatsapp_numbers',count(*) FROM deleted;
WITH deleted AS (DELETE FROM public.whatsapp_otps RETURNING 1) INSERT INTO s11_deleted SELECT 'public.whatsapp_otps',count(*) FROM deleted;
WITH deleted AS (DELETE FROM public.favorite_collections RETURNING 1) INSERT INTO s11_deleted SELECT 'public.favorite_collections',count(*) FROM deleted;
WITH deleted AS (DELETE FROM public.listing_entitlements RETURNING 1) INSERT INTO s11_deleted SELECT 'public.listing_entitlements',count(*) FROM deleted;
WITH deleted AS (DELETE FROM public.saved_searches RETURNING 1) INSERT INTO s11_deleted SELECT 'public.saved_searches',count(*) FROM deleted;
WITH deleted AS (DELETE FROM public.search_statistics RETURNING 1) INSERT INTO s11_deleted SELECT 'public.search_statistics',count(*) FROM deleted;
WITH deleted AS (DELETE FROM public.user_subscriptions RETURNING 1) INSERT INTO s11_deleted SELECT 'public.user_subscriptions',count(*) FROM deleted;
WITH deleted AS (DELETE FROM public.purchase_requests RETURNING 1) INSERT INTO s11_deleted SELECT 'public.purchase_requests',count(*) FROM deleted;
WITH deleted AS (DELETE FROM public.listings RETURNING 1) INSERT INTO s11_deleted SELECT 'public.listings',count(*) FROM deleted;
ALTER TABLE public.promotion_events ENABLE TRIGGER prevent_promotion_events_delete;
DO $$ DECLARE x record;n bigint;d text; BEGIN
 FOR x IN SELECT * FROM s11_preserved LOOP
 EXECUTE format('SELECT count(*),md5(coalesce(string_agg(md5(to_jsonb(x)::text),%L ORDER BY md5(to_jsonb(x)::text)),%L)) FROM %s x','','',x.name) INTO n,d;
 IF n<>x.n OR d<>x.digest THEN RAISE EXCEPTION 'protected content changed: %',x.name; END IF; END LOOP;
 FOR x IN SELECT name FROM s11_purge_allowlist LOOP
 EXECUTE format('SELECT count(*) FROM %s',x.name) INTO n;
 IF n<>0 THEN RAISE EXCEPTION 'disposable rows remain: %',x.name; END IF; END LOOP;
 IF EXISTS(SELECT 1 FROM s11_trigger_before b FULL JOIN
 (SELECT t.oid,t.tgenabled,pg_get_triggerdef(t.oid) AS definition FROM pg_trigger t
 JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN('public','auth')) a USING(oid)
 WHERE b.oid IS NULL OR a.oid IS NULL OR b.tgenabled IS DISTINCT FROM a.tgenabled OR b.definition IS DISTINCT FROM a.definition) THEN RAISE EXCEPTION 'trigger restoration mismatch'; END IF;
 IF EXISTS((TABLE s11_actual_fk EXCEPT TABLE s11_expected_fk) UNION ALL (TABLE s11_expected_fk EXCEPT TABLE s11_actual_fk)) THEN RAISE EXCEPTION 'FK definition changed'; END IF;
END $$;
-- Capture these count/hash records and COMMIT confirmation in the maintenance log.
TABLE s11_deleted;
TABLE s11_preserved;
SELECT 'S11_PURGE_PRECOMMIT_VERIFIED' AS checkpoint;
COMMIT;
SELECT 'S11_PURGE_COMMITTED' AS checkpoint;
