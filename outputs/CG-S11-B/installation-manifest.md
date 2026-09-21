# Canonical installation manifest

S11-C only; each group requires explicit checkpoint acceptance. This manifest prepares execution and does not authorize it.

## Exact ordered files

| Order | Source | SHA-256 |
|---|---|---|
| 1 | `supabase/migrations/003_canonical_listing_write_boundary.sql` | `6faa62f709971407113b82a0e6339e4501ce0f3fcd19956eb61b1b02f9f5c577` |
| 2 | `supabase/migrations/004_dormant_canonical_listing_foundation.sql` | `b028db71b00a1f0af24c773b077ebf75e0f6be08b40889a5fcac4b2b6bcd3604` |
| 3 | `supabase/migrations/005_dormant_publisher_coordination.sql` | `58a233408778aef4f2c53947db516dfc4b491b2503db47f8bc7d95be40508201` |
| 4 | `supabase/migrations/006_canonical_domain_machinery.sql` | `73ed1b776a787af61b35cf03cb91eb4e8135f13fff446e4f6a61be2a9721b891` |
| 5 | `supabase/migrations/007_canonical_creation_authority.sql` | `521e67d7c1ebd619c3b1d7afd4817b94542eba9775515c402c17e7e8fa3be0da` |
| 6 | `supabase/migrations/008_commercial_capacity_coordination.sql` | `4dfa770194f96f0b659b54deda8c31966dea4fc28353f74321adc31c724ffdc0` |
| 7 | `supabase/migrations/009_canonical_reader_boundary.sql` | `ca4d9ac57c0fb5eaf1fb988ad53ed589379cd17a4ce8d0e12fcd85cb90d28173` |
| 8 | `supabase/migrations/010_import_operator_authority.sql` | `a083fd989c6d9848e7beb8ef10a0349b749164f7903f43f0afbb55899591e09e` |
| 9 | `supabase/migrations/011_csv_initial_publication.sql` | `892881c19899bb7586aa247bf56a4755536ea4e57e65d67aca58e6b9da70cd62` |
| 10 | `supabase/migrations/012_customer_publication_entitlement.sql` | `be992016ce03b766bdf2a5a70b8577f4e076174aea12808479bc304c4c29fc21` |
| 11 | `supabase/migrations/013_customer_duplicate.sql` | `0318ce5a482ae4f59d7eacffc2aa195ec54d48b0dd188c3666d9eb892c919c95` |
| 12 | `supabase/migrations/014_customer_edit_classification.sql` | `3b4f5b8ad64d19c96bfe289e7027eb24c14de125cba12f8a177ab85c90b1a787` |
| 13 | `supabase/migrations/015_customer_edit_content.sql` | `00b7e4921acbf86cb80a05035bf8a3b5238ae93bc1fac0e932e95a159bf94c12` |
| 14 | `supabase/migrations/016_customer_measurement_clear.sql` | `8ef18175572591fa21e807f0722882b42404f5ef5d9e325e0245cd9f140367f9` |
| 15 | `supabase/migrations/017_token_canonical_creation.sql` | `f13d1abb7678dafd23a67583f2c381475b4a4574822809b54d4ae646e61470c8` |
| 16 | `supabase/migrations/018_csv_source_evidence.sql` | `f61aced295011a8c4a29a19f620e15055ffe629a84a61af37a5c8e63e8a147f8` |
| 17 | `supabase/migrations/019_csv_source_references.sql` | `030acf1095123b062560b9366af791206cd9eab55deafa5f35df8884ca054dab` |
| 18 | `supabase/migrations/020_ordinary_upload_operations.sql` | `3cc607fbe067ed9d67a1ad5057e0693f74d1e269b0f6a9a20ee584f1e0f05af6` |
| 19 | `supabase/migrations/021_image_detach_cleanup.sql` | `1c8415442e53a1d10f8e86e69cee03ee8c1d210f769f03fb423edf8c91797507` |
| 20 | `supabase/migrations/022_abandoned_token_cleanup.sql` | `a0ea2d69c7b9727a415ab0957fcf42c431ac4ea846ba5bd1a22e0235d6352909` |
| 21 | `supabase/migrations/023_source_observation_ingestion.sql` | `93dfabee4b5c1d9cfc76259e6e691e24bc2c0bc5f5813a3af2c5b26b2128b8d1` |
| 22 | `supabase/migrations/024_image_reorder_boundary.sql` | `88fb5901237345dfe80de60b9a4a858c3c37fa41e9be64bc20968a129821c4de` |

## Objects and dependencies

`installation-source-inventory.json` lists every ordered source declaration with line and final exact function signature. Full hashed SQL is authoritative for dynamic DO blocks. `installed-canonical-catalog.json` lists the final 28 canonical tables (including the administrative receipt), every column, 171 constraints, 60 indexes, 20 noninternal table triggers, RLS, ownership and ACL, plus all 69 functions. `rpc-allowlist.md` covers 35 exact public signatures; `verify-authority.sql` and `verify-private-authority.sql` validate effective exposure. The catalog is disposable-installation evidence, not a claim that those objects already exist on the target.

## Collision classification against accepted S11-A catalog

| Operation | Classification | Required disposition |
|---|---|---|
| 002 geography structural invariants | DEPENDENCY — MUST PRECEDE | Already installed target baseline. Do not replay 002. Fixture setup uses it only to represent that prerequisite. |
| 003 twuanis_private, normalization helper and dormant wrappers | NEW — SAFE TO CREATE; DEPENDENCY | Schema absent in accepted target catalog. Install before 006 (normalization dependency). Deny both old public mutation wrappers in final closure; never use them for canonical creation. |
| 004 twuanis_canonical_private and 12 public canonical tables | NEW — SAFE TO CREATE | Absent from accepted 65-table catalog. Install one-shot after purge. postgres owner; API direct access denied. |
| 004 listings publisher_account_id/canonical_revision/publication_expires_at and index | EXISTING — INTENTIONAL ALTERATION | New columns/constraint/index on existing empty listings. Existing table and read policies preserved. |
| 005 publisher functions/guard initializer | DEPENDENCY — MUST FOLLOW 004 | Initializes structural capacity guard, not arbitrary publisher identities. |
| 006 canonical_domain_version, monetary widening, result revisions, rule seals/accessibility reference, domain machinery | EXISTING — INTENTIONAL ALTERATION plus NEW — SAFE TO CREATE | monthly_price becomes numeric; exact migration controls history/rule guards and domain semantics. Run on purged data. No synthetic classification seed. |
| 007 creation/mutation functions | NEW — SAFE TO CREATE; DEPENDENCY | Requires 004–006. Canonical publisher initialization stays lazy. |
| 008 assign_default_market_package(), approve_sinpe_payment(uuid), activate_purchase(uuid) | EXISTING — INTENTIONAL REPLACEMENT | Exact current signatures/return types match supplied query-70. Existing signup trigger remains attached to same function OID. Canonical commercial implementation replaces function bodies. |
| 009–011 readers and CSV/import boundaries | NEW — SAFE TO CREATE; DEPENDENCY | Preserve analytical read compatibility; service-only evidence and approved import paths. No operator assignment seed. |
| 012 package_limits.publication_duration_seconds, guard, commands | EXISTING — INTENTIONAL ALTERATION plus NEW — SAFE TO CREATE | Existing default Market Explorer gets 2,592,000 seconds (30 days); preserve other package architecture. Null for unconfigured policies fails closed. |
| 013–015 duplicate/customer editing | NEW — SAFE TO CREATE; EXISTING — INTENTIONAL REPLACEMENT | 014 replaces the 007 customer mutation function after installing receipt state; 015 composes content through it. |
| 016 domain/command/customer mutation functions | EXISTING — INTENTIONAL REPLACEMENT | Replaces only earlier installed signatures to implement explicit measurement clear. Mandatory later version, no optional alternate. |
| 017–022 token/media/source receipt boundaries | NEW — SAFE TO CREATE; DEPENDENCY | 019 intentionally adds source evidence FK to 011 initial-publication state. Install strictly numerically. |
| 023 source observation/run machinery | NEW — SAFE TO CREATE; DEPENDENCY | S10 same-source whitelist/disappearance/reappearance architecture. No scraper producer or importer/operator invented. |
| 024 narrow image reorder helpers/RPC | NEW — SAFE TO CREATE | Shared API route uses service-only boundary, requires listings and media writers. No broad patch capability. |
| retained-auth setup / initialization | NEW — SAFE TO CREATE; DEPENDENCY | Setup only after 004; initialization only after purge, 008/012 and exact Market Explorer validation. Owner-only receipt, no runtime grant. |
| recover_listing_measurement(uuid,text,numeric,text,text,text,text) | EXISTING — INTENTIONAL ALTERATION (EXECUTE ACL only) | Superseded direct area/provenance mutation. No app/lib/scripts caller found in bounded exact-symbol check. Revoke PUBLIC/API execute; no drop. |

No unresolved COLLISION — REQUIRES CUTOVER-SPECIFIC ADAPTATION remains in the accepted evidence. Any newly present schema/table/function, changed signature or owner, unexpected column/index/constraint, reference mismatch or preexisting receipt at execution is drift: stop before choosing an adaptation. Do not hide it with IF NOT EXISTS, CASCADE, renaming or unconditional drops.

## Reference/configuration installation

Apply `accessibility-seed.sql` after 006 using exact reviewed IDs 1172–1176; it validates type/level/label and fails on mismatch. Mapping: 1172→2wd, 1173→paved, 1174→4x4, 1175→walkable, 1176→boat. Sealed classification rules are not invented; no recorded rule remains valid unclassified evidence. Preserve ontology official_code identities and all existing packages/entitlements/add-ons. 012 is the sole approved duration-column seed. Canonical capacity-policy singleton initialization is structural. Reviewer/import-operator assignments start empty.

## Installation compatibility and one-shot execution

Purge existing disposable rows before installing canonical immutable/history guards. Do not rerun a migration that committed; retain per-file SHA/result/transaction receipts in the S11-C operator log. SQL files have their own BEGIN/COMMIT boundaries. A failure stops at that file, leaves traffic quiesced, and requires inspection of the exact failed transaction before retry. Do not concatenate everything into an automatic cutover.

Existing auth/users, current public application/reference tables and required columns, auth.uid(), pgcrypto UUID support, unaccent and existing approved geography invariants remain prerequisites. The local installation fixture represents required contracts; it does not reproduce every Supabase extension, target policy or hosted deployment. Target compatibility is based on supplied S11-A catalogs plus fail-closed execution checks; final catalog and smoke gates remain mandatory S11-C obligations.

Before direct UPDATE revocation, install every canonical writer including 024 and deploy the reviewed compatible application behind maintenance. Old unknown deployed application must never receive traffic with the new closed database. Retained-auth initialization follows 008/012 and precedes reopening. Storage deletion is a separate explicit group after committed DB purge.
