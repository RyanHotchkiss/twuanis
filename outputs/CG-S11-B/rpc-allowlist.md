# Source-derived exact RPC allowlist

Default PUBLIC and anon EXECUTE denied. Private helpers deny all API roles; trusted postgres owns required underlying data authority. Current entitlement/reviewer functions are preserved, not redeclared by this allowlist. Installation must use postgres; verify resulting catalog before reopening.

| Exact signature | Caller roles | Security | Final definition |
|---|---|---|---|
| `public.write_my_listing_canonical(uuid,text,text,text,text,text)` | none; internal/trigger only | DEFINER | 003_canonical_listing_write_boundary.sql:198 |
| `public.write_listing_canonical_server(uuid,text,text,text,text,text)` | none; internal/trigger only | DEFINER | 003_canonical_listing_write_boundary.sql:217 |
| `public.create_customer_canonical_listing(uuid,jsonb)` | authenticated | DEFINER | 007_canonical_creation_authority.sql:266 |
| `public.create_trusted_canonical_listing(uuid,jsonb,jsonb)` | service_role | DEFINER | 007_canonical_creation_authority.sql:273 |
| `public.mutate_customer_canonical_listing(uuid,bigint,uuid,jsonb)` | authenticated | DEFINER | 016_customer_measurement_clear.sql:390 |
| `public.mutate_trusted_canonical_listing(uuid,bigint,uuid,jsonb,jsonb)` | service_role | DEFINER | 007_canonical_creation_authority.sql:290 |
| `public.assign_default_market_package()` | none; internal/trigger only | DEFINER | 008_commercial_capacity_coordination.sql:8 |
| `public.approve_sinpe_payment(uuid)` | authenticated | DEFINER | 008_commercial_capacity_coordination.sql:52 |
| `public.activate_purchase(uuid)` | service_role | DEFINER | 008_commercial_capacity_coordination.sql:257 |
| `public.read_canonical_listing_evidence(uuid[],text[],text[])` | service_role | DEFINER | 009_canonical_reader_boundary.sql:3 |
| `public.read_legacy_geographic_candidates(text[],text[],text[],text[],text)` | service_role | DEFINER | 009_canonical_reader_boundary.sql:61 |
| `public.read_legacy_geography_dictionary(uuid[])` | service_role | DEFINER | 009_canonical_reader_boundary.sql:87 |
| `public.is_current_user_import_operator()` | authenticated | DEFINER | 010_import_operator_authority.sql:36 |
| `public.create_csv_canonical_listing(uuid,jsonb,jsonb)` | service_role | DEFINER | 011_csv_initial_publication.sql:15 |
| `public.initially_publish_csv_listing(uuid)` | service_role | DEFINER | 011_csv_initial_publication.sql:42 |
| `public.publish_customer_canonical_listing(uuid,bigint,uuid,text)` | authenticated | DEFINER | 012_customer_publication_entitlement.sql:37 |
| `public.prepare_customer_duplicate(uuid,uuid)` | authenticated | DEFINER | 013_customer_duplicate.sql:14 |
| `public.attach_customer_duplicate_media(uuid)` | service_role | DEFINER | 013_customer_duplicate.sql:86 |
| `public.edit_customer_canonical_listing(uuid,bigint,uuid,jsonb,jsonb)` | authenticated | DEFINER | 015_customer_edit_content.sql:11 |
| `public.prepare_token_canonical_listing(text,uuid,jsonb,jsonb)` | service_role | DEFINER | 017_token_canonical_creation.sql:15 |
| `public.get_token_canonical_operation(text,uuid)` | service_role | DEFINER | 017_token_canonical_creation.sql:47 |
| `public.attach_token_canonical_media(text,uuid)` | service_role | DEFINER | 017_token_canonical_creation.sql:59 |
| `public.publish_token_canonical_listing(text)` | authenticated | DEFINER | 017_token_canonical_creation.sql:77 |
| `public.retain_csv_source_evidence(jsonb,jsonb)` | service_role | DEFINER | 018_csv_source_evidence.sql:19 |
| `public.complete_csv_source_references(uuid,uuid)` | service_role | DEFINER | 019_csv_source_references.sql:4 |
| `public.prepare_ordinary_upload(uuid,uuid,integer)` | service_role | DEFINER | 020_ordinary_upload_operations.sql:13 |
| `public.get_ordinary_upload(uuid,uuid)` | service_role | DEFINER | 020_ordinary_upload_operations.sql:23 |
| `public.attach_ordinary_upload(uuid,uuid)` | service_role | DEFINER | 020_ordinary_upload_operations.sql:32 |
| `public.detach_listing_image(uuid,uuid,text)` | service_role | DEFINER | 021_image_detach_cleanup.sql:11 |
| `public.get_image_detach_operation(uuid,uuid)` | service_role | DEFINER | 021_image_detach_cleanup.sql:36 |
| `public.confirm_image_cleanup(uuid,uuid)` | service_role | DEFINER | 021_image_detach_cleanup.sql:44 |
| `public.claim_abandoned_listing_token(uuid)` | service_role | DEFINER | 022_abandoned_token_cleanup.sql:3 |
| `public.ingest_canonical_source_observation(uuid,jsonb)` | service_role | DEFINER | 023_source_observation_ingestion.sql:29 |
| `public.complete_canonical_source_run(text,uuid,timestamptz,jsonb,jsonb)` | service_role | DEFINER | 023_source_observation_ingestion.sql:108 |
| `public.reorder_listing_images(uuid,uuid,text,text[])` | service_role | DEFINER | 024_image_reorder_boundary.sql:35 |
