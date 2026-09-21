# Focused S11-C verification package

Preparation is complete; target execution remains separately authorized. All database mutation tests performed during S11-B used disposable local PostgreSQL. Do not run an existing whole-stage S9/S10 suite.

## Catalog and administrative gates

1. purge-before-install.sql verifies all 51 disposable relations, the exact 70-FK graph, all 15 protected/auth digests and full captured trigger restoration inside the maintenance transaction. Empty listings alone is insufficient. The final committed marker is required. All children precede parents; graph drift aborts, rather than accepting orphan evidence.
2. Compare pre-purge and immediate post-purge reference-snapshot.sql output. Compare auth digest across all groups. After approved installation/seeds, take a separate reference baseline and compare it before reopening: package_limits gains its approved duration column, so pre-install and post-install whole-row hashes are not supposed to be identical.
3. initialization-verification.sql proves default receipt/cardinality and absent reviewer/import assignments; no publisher identity is eagerly manufactured. Execute before smoke. Recheck after smoke rollback.
4. verify-authority.sql: exact 69 function identities, owner/security/search_path, PUBLIC/anon/authenticated/service execution, unexpected overloads, direct table and column denial, all four explicit S9 TRUNCATE tables, other scoped REFERENCES/TRIGGER authority, ontology SELECT, role membership/ownership and BYPASSRLS context. Never execute TRUNCATE.
5. verify-private-authority.sql: canonical table/private schema denial, RLS and trusted postgres authority; no disabled canonical/FK guards. Compare canonical table/index/constraint/trigger definitions against installed-canonical-catalog.json (canonical objects only; fixture baseline public columns are not target schema declarations). Confirm the promotion-events guard remains enabled O. Existing permitted read/RLS paths remain unchanged.
6. Preserved existing entitlement RPCs retain their reviewed auth-only EXECUTE/RLS behavior. For a retained user, `current_user_has_entitlement('price-m2-intelligence')` must agree with the existing active/time-valid subscription → package_entitlements → active entitlements rule. New default Market Explorer does not invent paid PPM2 access. Test unauthorized application execution before analytical acquisition using the offline probe below; do not temporarily grant a retained user paid access merely for a smoke test.

## Actual canonical operations after closure

Run canonical-smoke.sql with psql variables `owner` (a retained test/auth UUID) and `property_term` (reviewed existing level-1 property-type ID), administrative session, ON_ERROR_STOP. It uses actual authenticated/service roles and auth.uid context, begins a transaction and always ends ROLLBACK. It covers create, exact-value/content edit, publication, renewal, duplicate, token creation/attachment/publication, ordinary upload state, reorder, detach, archive, and service evidence RPC. No actual storage bytes or external image URLs are acquired. Required local reference geography is province 3 / canton 304; validate these established official codes before executing the prepared smoke. It requires the fresh default package capacity supplied by retained initialization.

Failure leaves the connection transaction aborted: issue ROLLBACK/close it and keep maintenance. Do not commit its fixtures. Verify empty disposable listing/domain/receipt/media state afterward. This is a database-boundary check, not a claim that SMTP/WhatsApp/payments/storage vendors or every UI path were exercised. The real shared image route was independently tested offline for response compatibility.

Payment reviewer and import operator arrays must remain empty. Invoke existing `is_payment_reviewer(auth.uid())` and `is_current_user_import_operator()` as an authenticated retained identity: false. Existing enforcement must deny unassigned reviewer/import access; do not create assignments merely to make tests succeed. Successful canonical commercial machinery was previously verified; no re-opening policy design.

## Focused application checks — offline, no target requests

From the reviewed repository with its locked dependencies:

- `node scripts/verification/s9-ppm2-authorization.cjs`: actual action/permit code with identity/entitlement and engine stubs; denies missing/invalid authorization before acquisition, enforces active entitlement and Apply ordering in EN/ES.
- `node scripts/verification/s9-comparison-gate.cjs`: explicit Compare and one-use permit; complete URL state alone cannot enter the engine.
- `node scripts/verification/s9-ordinary-engine-probe.cjs`: actual ordinary engine, counted stub population/membership/FX boundaries; one canonical population and one bounded membership acquisition, no hidden geography reload. Exercises existing Phase 7–10 path.
- `node scripts/verification/s9-phase11.cjs`, `node scripts/verification/s9-phase12.cjs`: existing focused in-memory interface adapters; no analytical redesign.
- `node scripts/verification/s9-phase12a-integration.cjs`: bounded canonical comparable path and evidence RPC contract, not a legacy reconciliation run.
- `node scripts/verification/canonical-reader-import-graph.cjs`: server-only reachability check. S11-B result: 187 client roots, 274 visited modules, zero failures.
- `node outputs/CG-S11-B/verify-reorder-route.cjs`: real route under controlled auth/RPC mocks; EN/ES share the same API path. No UI fork was introduced.

These existing focused scripts are prepared S11-C regressions, not re-executed S9 suites during this continuation. Pair their acquisition/interface checks with the real service evidence RPC smoke and effective post-closure grants; stubs alone cannot prove target authorization. Compare counts/assertions to their frozen expected values, stop on any unexpected retrieval or import path. No powerset/nested acquisition is introduced by the sole changed application route.

## S10 source lifecycle — controlled disposable database only

`verify-source-after-closure.cjs` executes the actual translator and service-role SQL boundaries after authority closure, using a named isolated local database `s11b_source_closure` on the fixed local socket/port. It never contacts a scraper or downloads external bytes. It requires a fresh installed fixture with district 30403 under canton 304. Do not repoint this fixture-mutating harness at Supabase.

38 focused checks passed during S11-B: source namespace+source ID identity; replay versus new observation; whitelist money and exact area changes/history; ignored nonwhitelist fact; missing/invalid/range input does not invent exact replacement; nonempty URL update and empty preservation; six-month presentation gate; positive ingestion without trusted completion; unknown/failed/absent completion creates no negative evidence; first miss active, second archived for source non-observation; idempotent completion; same-ID reappearance with 90 days/reset/history; later absence cycle; namespace isolation; browser completion execution denied. Final source file is included; existing S10 semantics are preserved, not reinvented.

The token/customer/media smoke uses real DB boundaries but no real external media. Storage cleanup has its own exact 300-object journal/existence checks; do not confuse these two scopes.

## Storage and final gate

Run the reviewed storage procedure only in its separate authorized S11-C group. Require all 300 final key checks, deleted/alreadyAbsent/failed/retry counts and unchanged bucket/configuration. Future objects are untouched. Keep journal durable beyond process lifetime.

No reopening until reference/auth/default-access/guard/privilege/artifact checks, canonical operations, focused analytical checks and storage cleanup are accepted. Do not erase historical S7 verification limitations; S11-B adds focused cutover evidence only.
