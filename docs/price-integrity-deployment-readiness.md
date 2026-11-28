# Price-integrity deployment readiness

Status: the exact 19-file candidate has been built and verified against the currently serving deployment source. A fresh acceptable recoverable backup and separate Owner deployment authorization remain prerequisites. No production migration or deployment was executed in this review. Public orchestration remains intentionally guarded and is outside the delivery scope.

## Production authority and current state

Read-only inspection of the installed production database on 2026-11-27 identified one active Owner grant, for `ryanjonhotchkiss@gmail.com`. The installed `bank_population_authority` function returned `OWNER_UNMETERED` for all 17 registered `cap-%` capabilities for that account. A separate query using the installed `bank_analytical_grant_terms` function found no currently qualifying paid/receipt BANK entitlements among accounts with an active BANK-upgrade term. This is database authority evidence, not an authenticated browser execution or a guarantee about later entitlement changes.

The installed production database contains all four price-integrity tables, the eligibility view and its computed relationship. All 33 fingerprinted function signatures match migration 134 exactly; the additional finite-numeric function passed the migration's five behavioral cases. All eight expected triggers are installed, match their expected definitions and are enabled; all four expected indexes and 20 expected constraints match their migration definitions. The view is security-invoker, uses canonical revision, evaluator version 4, current and eligible status, and excludes pending entries. The four private tables have RLS enabled; service_role can SELECT and anon/authenticated cannot. The eligibility view and computed relationship have the corresponding checked SELECT/EXECUTE restrictions. Table and view ownership is postgres.

At inspection the evidence table contained 10,712 rows, historical evidence registry 2,152 rows, current decisions 10,711 rows, pending queue zero rows, and eligibility view 10,569 rows. These are point-in-time counts, not a replacement for a fresh pre-deployment snapshot or proof that every record is correct. Read-only inspection did not modify these rows.

## Application file inventory

The following local application files comprise the identified price-integrity and analytical integration work against the repository baseline. Compared directly with source uploaded for live deployment `dpl_DsCLUyadC2poQwu6p47qxcVg9a3a`, all 18 existing files differ and `orchestrator-asking-question.ts` is absent. The exact byte-derived unified candidate diff is `docs/price-integrity-live-release.patch` (SHA-256 `298c64f59d2ba7f8ca49b5e7b0d6f99dfa205620324707d1c48777db517260ec`). A direct-import inventory found no local imports absent from both the candidate and the live source. The patch was applied to a temporary artifact reconstructed from the live source, and that exact combination built and passed the listed offline suites. Review every hunk and verify the live alias has not changed before release.

- `lib/asking-area-ratio-data.ts`
- `lib/asking-price-data.ts`
- `lib/canonical-market-observation-rows.ts`
- `lib/canonical-market-population.ts`
- `lib/canonical-population-acquisition.ts`
- `lib/market-comparison-engine.ts`
- `lib/orchestrator-server.ts`
- `lib/orchestrator-asking-question.ts` (currently untracked)
- `lib/phase14-complete-analytical-population.ts`
- `lib/phase14-fundamental-population.ts`
- `lib/phase14-hydrated-population.ts`
- `lib/population-engine-execution.ts`
- `lib/price-meter-comparable-loader.ts`
- `lib/price-meter-comparison-candidate-loader.ts`
- `lib/price-meter-property-difference-context-acquisition.ts`
- `lib/price-meter-property-position-loader.ts`
- `lib/property-price-valuation-data.ts`
- `lib/statistics-engine.ts`
- `lib/weighted-price-data.ts`

Tests and evidence, not production application dependencies, include `scripts/verification/canonical-market-population.cjs`, `customer-publication-callers.cjs`, `engine16-acquisition.cjs`, `engine17-acquisition.cjs`, `market-asking-price-distribution.cjs`, `market-configuration-frequency.cjs`, `marketplace-fx-repair.cjs`, `phase14-step1.cjs`, `phase14-step3.cjs` through `phase14-step11.cjs`, `phase14-step13.cjs`, `phase14-step14.cjs`, `remates-r15-engines.cjs`, `customer-lifecycle-installed-local.py`, `customer-price-authority-local.py`, `orchestrator-cache-isolation.cjs`, `price-integrity-delivery-freshness.cjs`, and `price-integrity-migration-local.py`. The detailed matrix and test scope are in `docs/price-integrity-engine-coverage.md`. This list excludes unrelated scraper, sitemap, UX, content and description-generation work.

## Database migration and prerequisites

The prepared reconciliation migration is `supabase/migrations/134_price_integrity_production_reconciliation.sql` (SHA-256 `9386757ff0f2dc320c2e2f1b81b11052a1e68a07ae2df263b0f9411b9e1ffeff`; currently untracked). It records the already-installed architecture and performs no backfill or initialization. Production has no `supabase_migrations.schema_migrations` table; the dashboard says “Run your first migration,” and no alternative application migration ledger was found. **Recommendation for this release: neither execute nor register 134 in production.** The application’s checked database dependencies already exist. Add the migration file to the project’s version-controlled source during the separately reviewed release; decide migration-ledger adoption separately. Do not run `supabase db push`: absent a tracked baseline, it could attempt unrelated historical migrations. Registration is not necessary to make the already-installed architecture work and would itself be a production mutation.

All 46 guarded column names, types, nullability and defaults match the installed four tables. The checked execution privileges for all 33 private functions match their migration expectations; the public relationship permission and table/view permissions were checked previously. The 33 fingerprinted functions, eight triggers, four indexes, 20 constraints, eligibility view and its security-invoker option match the inspected production state. PostgreSQL is 17.6; the SQL Editor session is `postgres`, with CREATE on both relevant schemas and trigger privilege on the evidence table. These are privileges of the inspected SQL Editor session, not proof that an unidentified deployment runner uses the same role or can accept the migration’s explicit `BEGIN`/`COMMIT`. No local Supabase CLI configuration or application migration ledger was found. Recheck this if migration administration is later adopted.

Supabase shows daily physical backups; the most recent visible was 2026-11-27 16:31:02 UTC (10:31:02 a.m. CST). Point-in-time recovery is not enabled. Physical database backups do not include Storage objects. No new backup was created by this read-only assessment. Before any database operation, obtain and verify a fresh restorable backup close to the change window and establish an accepted recovery point and restoration procedure; ensure separately that any required Storage objects are protected. Even for app-only deployment, record the current deployment as the rollback target and refresh the retained-state comparison below.

At 2026-11-28 00:27:18.690416 UTC (2026-11-27 6:27:18 p.m. CST), a single read-only statement reported: evidence 10,712, identity hash `84483598230af09b26a9d97eeef3fb12`; historical registry 2,152, identity hash `db2725d0cdbbd4b0969df5cddc679155`; current decisions 10,711, listing/revision/evaluator/evidence identity hash `333bbc10b14e0a532afba586a7918fed`; pending 0. The eligible view count observed in the preceding inspection was 10,569. These hashes cover selected identities, not full record contents, and are not backups. Repeat immediately before and after any authorized database operation, accounting for legitimate concurrent writes. The exact snapshot statement is recorded below.

```sql
SELECT statement_timestamp() AS captured_at,
 (SELECT count(*) FROM twuanis_canonical_private.listing_price_integrity_evidence) AS evidence_rows,
 (SELECT md5(coalesce(string_agg(id::text,',' ORDER BY id),'')) FROM twuanis_canonical_private.listing_price_integrity_evidence) AS evidence_id_hash,
 (SELECT count(*) FROM twuanis_canonical_private.price_historical_evidence_registry) AS historical_rows,
 (SELECT md5(coalesce(string_agg(retained_evidence_id::text,',' ORDER BY retained_evidence_id),'')) FROM twuanis_canonical_private.price_historical_evidence_registry) AS historical_id_hash,
 (SELECT count(*) FROM twuanis_canonical_private.listing_price_integrity_current) AS current_rows,
 (SELECT md5(coalesce(string_agg(listing_id::text||':'||canonical_revision::text||':'||evaluator_version::text||':'||coalesce(evidence_id::text,''),',' ORDER BY listing_id),'')) FROM twuanis_canonical_private.listing_price_integrity_current) AS current_identity_hash,
 (SELECT count(*) FROM twuanis_canonical_private.price_integrity_pending) AS pending_rows,
 (SELECT count(*) FROM public.analytically_eligible_marketplace_listings) AS eligible_rows;
```

Before app deployment: recheck the production alias and review all 19 patch files. The isolated artifact has been built and tested; repeat that work if its source or the live alias changes. Preserve accepted UX, supplementary description generation, scraper work, public guard and independent delivery freshness checks.

## Verification and acceptance

Accepted local evidence includes 64 canonical population assertions, 18,037 hydration assertions, successful Phase 14 checks including 13 and 14, local migration preservation and missing-helper tests, synthetic customer Sale/Rent create/edit/publish/archive/restore/republish/duplicate lifecycles, 17-engine Sale/Rent eligible-versus-ineligible tests, 17-engine populated BANK isolation fixtures, 102 malformed/mismatched evidence tests, price-filter eligible controls, controlled mixed-currency BCCR identity checks, 457 currency and presentation assertions, cache isolation/retry, independent delivery freshness and stale finalization regressions. TypeScript and a local production build passed. Customer lifecycle tests use selected installed definitions plus an older supporting schema; transport, authority and FX engine fixtures are controlled, not live production acceptance.

After separately authorized deployment, use the Owner account in an authenticated browser to verify a representative standalone BANK question and authority, and representative Sale/Rent analytical calculations, eligibility exclusion, currency/FX identity and cache/freshness behavior. Run customer lifecycle acceptance only in an appropriately authorized disposable or specifically designated test context; do not create or alter real production listings merely for this report. Compare fresh evidence and pending counts, check application logs, and retain rollback procedures. Do not require the pre-deployment production app to exhibit changes that exist only in the local implementation.

## Defects, decisions and sequence

No new confirmed production defect was found by these read-only checks. `ADAPTER_REQUIRED` is an accepted preexisting public-orchestration boundary, not a defect for this assignment. Authentication-dependent live BANK execution and any future migration-runner behavior remain unverified, not proven failures. The exact isolated-release build and local offline suites passed as recorded below.

Recommended sequence: (1) Owner reviews the live-source patch and version-controls migration 134 as a representation, without executing or registering it in production; (2) establish a current restorable backup and fresh state snapshot, and verify the live deployment is still `dpl_DsCLUyadC2poQwu6p47qxcVg9a3a`; (3) confirm the verified isolated 19-file artifact remains unchanged and obtain separate application-deployment authorization; (4) deploy, verify the Ready production alias and preserve the previous deployment for rollback; (5) conduct authenticated post-deployment acceptance and monitor results. Any future database mutation requires separate authorization. No Owner must log in simply to establish the database grant: it has been identified above. An authenticated Owner session is needed for browser-based acceptance.

## Exact release-candidate verification, 2026-11-27

Temporary deployment artifact: `/private/tmp/twuanis-release-artifact-vxewbju7`. It is not a development workspace. Its 1,958 source files were reconstructed from deployment `dpl_DsCLUyadC2poQwu6p47qxcVg9a3a`: 1,916 local files matched Vercel’s SHA-1 content identities and 42 differing files were read from Vercel. The approved 19-file patch applied cleanly. The exact combination passed `npm run build`, including Next.js TypeScript checks. The approved local offline harnesses were temporarily overlaid as test files, run against this artifact and restored: canonical population, unified Sale/Rent with evidence/filter variants, unified BANK, orchestrator request shape, orchestrator stale finalization, delivery freshness, cache isolation, and FX/presentation all passed. Afterward all 1,958 original source identities were rechecked against either live source or the approved changed file, and the new file matched the approved local file. Next.js had rewritten `next-env.d.ts` during the build; it was restored to the live version before this check. Temporary `.env.local` and `node_modules` links were removed; `.next` is a generated ignored build output. No secrets were copied into the artifact.

`vercel deploy /private/tmp/twuanis-release-artifact-vxewbju7 --project twuanis-0 --scope ryans-projects-71456f46 --dry --json` reported 1,959 source files and ignored `.next`; it created no deployment. The artifact is under `/private/tmp`, so it is temporary and must be revalidated or reassembled if removed or if the live alias or local candidate changes.

## Version-control preparation

Review and add migration `supabase/migrations/134_price_integrity_production_reconciliation.sql`, the 19 application files listed above, the applicable verification scripts listed above, this report, `docs/price-integrity-engine-coverage.md`, and `docs/price-integrity-live-release.patch` in a deliberately scoped commit. No files were staged or committed during preparation, so unrelated work remains untouched. The local database lifecycle verification scripts currently depend on three Owner Desktop CSV exports and an older supporting schema backup; do not silently commit production exports. Before claiming those fixtures are portable, arrange approved sanitized/authorized fixture access or parameterize their locations in a separately reviewed change. Their previously accepted local results remain valid within their demonstrated scope.

## Exact backup action and deployment procedure

The Owner should open Supabase → twuanis-real-estate → Database → Backups → Scheduled backups and confirm a newly completed physical backup immediately before the deployment window, with an acceptable recovery point and a tested/understood restore procedure. The inspected page listed scheduled backups and restore controls, but no on-demand creation control; PITR is not enabled. If the next scheduled backup is too old for the accepted recovery point, arrange an approved fresh restorable backup through the available Supabase support/backup process or an independently verified database backup procedure before proceeding. Protect any required Storage objects separately. Do not click Restore. Repeat the retained-state snapshot query above close to the change window.

After explicit application-deployment authorization and after confirming `twuanis.com` still resolves to `dpl_DsCLUyadC2poQwu6p47qxcVg9a3a`, verify the artifact and patch hashes and deploy a production-environment candidate without automatic promotion:

```sh
cd ~/twuanis
vercel deploy /private/tmp/twuanis-release-artifact-vxewbju7 --project twuanis-0 --scope ryans-projects-71456f46 --prod --skip-domain
```

Inspect the resulting deployment ID, source and build status; verify the candidate without changing production data. Once Ready and approved for promotion, use `vercel promote <candidate-deployment-id> --scope ryans-projects-71456f46`, verify the production aliases, run the approved authenticated standalone BANK and representative Sale/Rent acceptance checks, and monitor logs. The prior deployment ID remains the rollback target. Migration 134 must neither be executed nor registered for this release. Only after successful deployment and verification, synchronize the corresponding local source and GitHub to the deployed baseline while preserving unrelated uncommitted work, as separately directed.

## Release recheck, 2026-11-28

The production alias still resolved to Ready deployment `dpl_DsCLUyadC2poQwu6p47qxcVg9a3a`. The temporary release artifact was rechecked against all 1,958 uploaded source-file identities and the approved local changes, plus the one new candidate file: zero mismatches. Temporary environment and dependency links were absent. This was a source-integrity and alias recheck; the accepted build and verification suites were not rerun.

## Authorized deployment and production acceptance, 2026-11-28

The Owner confirmed the physical backup dated 2026-11-28 04:44:06 UTC, accepted its recovery point, and authorized deployment and promotion. The release artifact was explicitly linked to existing Vercel project `twuanis-0` (`prj_XTn9YvpEiY9uyq5eHauJ9MNWhnxk`); the link-generated temporary environment file was removed before deployment. The pre-deployment read-only snapshot at 09:45 UTC showed 10,712 evidence rows (identity hash `84483598230af09b26a9d97eeef3fb12`), 2,152 historical rows (identity hash `db2725d0cdbbd4b0969df5cddc679155`), 10,711 current rows (identity hash `333bbc10b14e0a532afba586a7918fed`), zero pending, and 10,569 eligible. Counts and hashes were read across two closely spaced read-only queries.

Deployment `dpl_BfvXAXvBKbcvvJGqutVe2bNmwEnd` built Ready without initial domain promotion. Its 1,959 uploaded source files matched the verified artifact. Candidate homepage and a representative Sale listing loaded, and currency conversions appeared. It was then promoted; both `twuanis.com` and `www.twuanis.com` resolve to the new Ready deployment. Public `robots.txt` and `/sitemap.xml` returned 200; a command-line listing request received 429, while the same listing loaded in the authenticated browser. The rollback deployment is `dpl_DsCLUyadC2poQwu6p47qxcVg9a3a`.

After Owner sign-in, live standalone Sale Asking Price Distribution returned a two-listing CRC distribution for the selected Atenas Farm. Live Rent Asking Price Distribution returned 44 structural listings and 43 contributing prices for the selected Escazú Condo, with CRC monthly results and one listing without an eligible price. Live BANK Market Summary for House returned 15 BANK listings and identified verified direct-sale pricing as the applicable monetary basis. These are representative acceptance checks, not exhaustive live coverage. No production migration or migration-history registration occurred.

The deployed application source was committed as `a51a32dc3c17b7074157313b9dc8e8aed3542859` on GitHub branch `production-authority/2026-11-28-price-integrity`, together with migration 134, verification and documentation. All 1,959 deployed source files match that commit except 20 deliberately updated `scripts/verification/` files included for requested verification versioning; no runtime-source file differed. The local workspace was aligned to the same branch without modifying working-file contents; all 23,691 previously modified or untracked file contents checked were unchanged. Other unfinished local differences remain present.
