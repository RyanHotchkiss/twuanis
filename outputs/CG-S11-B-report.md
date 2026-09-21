# CG-S11-B — Consolidated cutover artifact preparation report

## A. Verdict

**S11-B COMPLETE — CUTOVER ARTIFACT PACKAGE PREPARED AND VERIFIED**

Query-77 closed the remaining 22-table FK evidence gap. The completed package now contains the installation/collision manifest, narrow image-reorder boundary, exact privilege/RPC closure, child-first guarded purge, retained-auth initialization, fixed 300-object storage manifest and conservative deletion procedure, maintenance checkpoints, focused verification and failure matrix. The required local/disposable checks passed. No unresolved architectural/product decision or implementation defect remains within S11-B preparation.

This verdict is preparation completion only. It does not assert that the target is installed, purged, closed, tested or deployed. S11-C requires separate explicit authorization after review.

## B. Files created/modified

Modified cumulatively during S11-B (existing files, including already-dirty/untracked work preserved):

- `outputs/CG-S11-B-report.md` — this cumulative report updated in place.
- `app/api/reorder-listing-images/route.ts` — existing direct conditional write replaced by the narrow service RPC; existing validation/responses retained.
- `scripts/verification/image-detach.cjs` — only the two affected reorder mocks adapted to RPC transport.

Created during S11-B:

- `supabase/migrations/024_image_reorder_boundary.sql`
- `outputs/CG-S11-B/README.md`
- `outputs/CG-S11-B/accessibility-seed.sql`
- `outputs/CG-S11-B/application-source-manifest.json`
- `outputs/CG-S11-B/authority-closure.sql`
- `outputs/CG-S11-B/authority-verification.csv`
- `outputs/CG-S11-B/canonical-smoke.sql`
- `outputs/CG-S11-B/disposable-install-fixture.sql`
- `outputs/CG-S11-B/disposable-purge-fixture.sql`
- `outputs/CG-S11-B/disposable-verification.md`
- `outputs/CG-S11-B/failure-matrix.md`
- `outputs/CG-S11-B/initialization-verification.sql`
- `outputs/CG-S11-B/installation-manifest.md`
- `outputs/CG-S11-B/installation-reference-gap.md`
- `outputs/CG-S11-B/installation-source-inventory.json`
- `outputs/CG-S11-B/installed-canonical-catalog.json`
- `outputs/CG-S11-B/private-authority-verification.csv`
- `outputs/CG-S11-B/purge-allowlist.json`
- `outputs/CG-S11-B/purge-before-install.sql`
- `outputs/CG-S11-B/purge-order.md`
- `outputs/CG-S11-B/purge-scope-draft.json`
- `outputs/CG-S11-B/reference-snapshot.sql`
- `outputs/CG-S11-B/remaining-purge-fk-evidence.sql`
- `outputs/CG-S11-B/reorder-verification.md`
- `outputs/CG-S11-B/retained-auth-initialize.sql`
- `outputs/CG-S11-B/retained-auth-setup.sql`
- `outputs/CG-S11-B/retained-auth-verification.md`
- `outputs/CG-S11-B/rpc-allowlist.md`
- `outputs/CG-S11-B/runbook.md`
- `outputs/CG-S11-B/storage-delete-reviewed.cjs`
- `outputs/CG-S11-B/storage-manifest.json`
- `outputs/CG-S11-B/verification-package.md`
- `outputs/CG-S11-B/verification-results.md`
- `outputs/CG-S11-B/verify-authority.sql`
- `outputs/CG-S11-B/verify-private-authority.sql`
- `outputs/CG-S11-B/verify-purge.py`
- `outputs/CG-S11-B/verify-reorder-database.py`
- `outputs/CG-S11-B/verify-reorder-normalization.cjs`
- `outputs/CG-S11-B/verify-reorder-route.cjs`
- `outputs/CG-S11-B/verify-retained-auth-concurrency.py`
- `outputs/CG-S11-B/verify-retained-auth.py`
- `outputs/CG-S11-B/verify-source-after-closure.cjs`
- `outputs/CG-S11-B/verify-storage.cjs`
- `outputs/CG-S11-B/package-checksums.json`

No file was deleted. No original Migration 003–023 source hash changed from the recorded S11-B source inventory; no closed 004–023 artifact was edited. No unrelated dirty-worktree change was discarded. Temporary local fixture data/logs remain under /private/tmp/s11b-prep; the database is stopped. Repository status remains dirty; neither this work nor unrelated work was staged, committed, pushed or merged.

## C. Canonical installation manifest summary

`installation-manifest.md` orders 22 exact files: 003, then 004–023, then new 024. The existing target Migration 002 invariants are prerequisites, not replay instructions. 003 supplies the private normalization dependency used later; its old public mutation wrappers are denied after installation. Full source hashes and declaration locations are in installation-source-inventory.json.

The final disposable catalog captures 28 canonical/administrative tables, 171 constraints, 60 indexes and 20 table-local noninternal triggers, plus canonical alterations/triggers on existing listings/package_limits/token tables separately. It records 69 final functions, including 35 exact public signatures. Tables/functions are postgres-owned with exact RLS, security mode, search_path and ACL evidence. Dynamic DO-created guards are represented in the final catalog; full hashed SQL remains authoritative.

Install before exposing a compatible application. Purge current disposable rows BEFORE canonical immutable/history guards exist. Apply the query-76 accessibility mapping after 006, retained administrative receipt setup after schema creation, and default-access initialization after purge and 008/012. Source identity, facts/measurements, rule seals, history and lifecycle remain frozen architecture.

The manifest specifies required public/reference/auth tables and functions, order, one-shot assumptions, deliberate existing-table alterations and object collision handling. It does not treat the synthetic fixture as a complete target schema clone.

## D. Collision findings

Current accepted pre-cutover catalog has neither private schema nor the canonical public tables. These new objects are safe under that baseline; unexpected presence at execution is drift and stops cutover. Existing listings gains approved canonical columns/index and numeric monthly_price; package_limits gains the approved publication duration column/guard/default seed. 008 intentionally replaces the three existing commercial/signup function signatures established by query-70. 014/016 replace earlier canonical functions in-order; 019 adds its approved source evidence FK.

No unresolved collision requires an architectural adaptation. No IF NOT EXISTS concealment, object drop/rename, CASCADE, permanent FK change or alternative canonical design was introduced. Installation still requires live S11-C drift gates; accepted historical deployment-identity uncertainty is not reopened.

## E. Image reorder implementation and verification

Migration 024 adds private normalization helpers and `public.reorder_listing_images(uuid,uuid,text,text[])`. The public function is SECURITY DEFINER, postgres-owned, fixed pg_catalog/pg_temp search_path, EXECUTE service_role only. Private helpers have no API exposure. It locks the target row and rechecks owner, eligible nondeleted state, exact previous raw image state, maximum 25 and normalized multiset including duplicate multiplicity. Mutation is limited to images and updated_at. Concurrent reorder/upload/detach cannot silently overwrite a stale image set.

Route authentication, owner check, validation and HTTP behavior remain intact, including existing 500 behavior on failed conditional mutation. EN/ES use the same API, with no new language-specific path, upload/detach policy or general listing-patch authority.

Verification preserved and completed: 17 database checks (including accessibility and three independent-session interleavings), 19 normalization parity cases, 11 actual-route offline cases, 9 directly affected detach regressions, TypeScript pass. The final import check found 187 client roots, 274 visited modules and zero server-only violations. Details and fixture corrections are in reorder-verification.md.

## F. Authority-closure package

`authority-closure.sql` is prepared and locally rehearsed, NEVER target-applied. It closes direct INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER on listings and memberships, including relevant column grants. It closes scoped destructive/auxiliary privileges on ontology and commercial/authority objects, explicitly including entitlements, package_entitlements, user_subscriptions and saved_analyses for anon/authenticated/service_role and PUBLIC.

Required SELECT/RLS paths remain. Minimum service_role SELECT on ontology_terms is added without mutation grants. Exact canonical RPC roles remain available. Closure occurs only after all replacement boundaries, including reorder, and the compatible reviewed application are ready behind maintenance. API roles must not own scoped objects or inherit another write-capable role. Existing BYPASSRLS context is checked; it does not defeat SQL privilege revocation.

No TRUNCATE statement was used for verification. Effective catalog checks passed: 1,201 function/table/column assertions, plus 2,958 private-schema/canonical-table/owner/RLS checks. Successful authenticated creation/publication/renewal and service evidence reads after closure demonstrated that denying direct writes did not disable those canonical paths.

## G. Function/RPC exposure and obsolete mutation closure

`rpc-allowlist.md` lists every exact public regprocedure, final source, owner, security mode and intended role; `verify-authority.sql` checks exact settings and detects unexpected broader overloads. No wildcard name-only grant. Default PUBLIC execute is denied; private machinery remains inaccessible to API roles. Trusted postgres underlying authority remains available.

Both Migration 003 public mutation wrappers are dormant and denied. `recover_listing_measurement(uuid,text,numeric,text,text,text,text)` is superseded by canonical measurement commands: the completed bounded exact-symbol check found no runtime caller in app/lib/scripts. Its exact PUBLIC/API EXECUTE is revoked without dropping the function. Existing legitimate reader compatibility and entitlement/reviewer authority are preserved; no broad obsolete-function cleanup was performed.

## H. Purge package

Final evidence is query-71 UNION query-77: 70 relevant FK constraints, no cycle/protected incoming blocker. All 65 public table dispositions are explicit: 51 disposable/application or identity-bound test relations deleted; 14 public system/reference/configuration relations plus auth.users preserved. `search_ontology_terms` precedes `search_statistics`; both ontology parents remain preserved. Reviewer assignments are deleted, not reviewer architecture. Canonical import assignments begin empty after later installation.

`purge-before-install.sql` requires an administrative postgres session and absence of the target private schema, uses bounded reviewed table scope and locks, checks exact FK definitions, deletes child-first and preserves count/digest evidence for all 15 protected relations. It captures all public/auth trigger states/definitions, temporarily disables only the established promotion-events BEFORE DELETE guard, restores its exact enabled O state before commit and aborts on mismatch. FK triggers and unrelated guards remain active. No TRUNCATE or blanket CASCADE.

Five disposable scenarios passed: wrong phase, unexpected FK, injected post-delete failure with rollback, protected-reference mutation with rollback, and successful all-table purge with exact guard/FK/reference preservation. The fixture is graph/guard equivalent, not a copy of production data. Canonical guards are installed afterward, avoiding unnecessary disablement of target history protections.

## I. Retained-auth initialization

**RETAINED AUTH INITIALIZATION POLICY RESOLVED**

Every retained auth identity receives exactly one fresh active/free Market Explorer subscription after disposable subscriptions are removed. No fake paid access survives; no auth recreation, old subscription migration or eager publisher creation. Canonical publisher initialization remains lazy.

Owner-only setup and initialization are separate artifacts. The initializer checks the exact active existing package, locks auth/config/subscriptions/receipt in fixed order, requires empty subscriptions on first execution, inserts fresh rows using approved signup fields, and records the auth set and exact resulting rows atomically. Same-operation retry is read-only if all receipt/state checks match; drift fails closed. No public RPC exposes this procedure.

Preserved verification: 15 database checks and one independent-session concurrent replay case. New read-only initialization verification returned eight true checks. Exact accessibility mapping is 1172→2wd, 1173→paved, 1174→4x4, 1175→walkable, 1176→boat; guarded seed rejects reference drift. Default publication policy remains Migration012's 30 days; source reappearance remains 90 days. No policy reopened.

## J. Storage package

`storage-manifest.json` fixes exactly the 300 reviewed listings-images bucket/key/object-ID records from query-75, including source CSV hash. No future objects or external source URLs are included. No image bytes were inspected or acquired.

`storage-delete-reviewed.cjs` is a standalone later S11-C operation, not an automatic cutover. Explicit maintenance/DB-commit acknowledgements, exact target URL, reviewed manifest hash and durable journal are mandatory. Credentials are supplied separately and never recorded. The procedure uses per-object identity checks, fsynced attempts/results, final metadata existence checks, conservative retries, replacement rejection and bucket/config comparison. It records attempted/deleted/alreadyAbsent/failed/retry counts. Ten offline scenarios passed.

Storage writes must remain quiescent: metadata check and deletion are not one conditional atomic API operation. Database purge commits first; storage failure leaves a bounded retry state, not a DB rollback requirement. Storage deletion never deletes the bucket/config/policies. No real storage API was called.

## K. Maintenance/cutover runbook and application identity

`runbook.md` separates approval/maintenance, pre-install purge, installation/default initialization, future application/authority closure, storage cleanup, and focused verification/reopening. Each group has an explicit stop point and evidence gate. It identifies actual signup, customer/token/media, ingestion and commercial paths and the two configured cron endpoints; it does not invent services. In-flight work must drain, and direct credential-bearing writers must also pause.

`failure-matrix.md` distinguishes transaction rollback from already committed DB groups and irreversible storage operations. No automatic regrant/down-migration, fake-data restoration, object drop or fallback to the unknown old app is authorized. No one-command full cutover runner was created.

`application-source-manifest.json` pins 694 relevant tracked/untracked source/config/migration/verification inputs plus current HEAD as context. It identifies the future reviewed candidate, not the historical deployed artifact. S11-C must record the actual separately authorized commit/build/deployment and match reviewed hashes. S11-B does not manufacture that identity by committing or deploying.

## L. Verification package and limits

`verification-results.md` consolidates completed checks; CSV catalog evidence and focused harnesses are included. Fresh disposable installation accepted every 003–024 file, seed, administrative default initialization and closure. The rollback-only canonical smoke passed create/edit/publish/renew/duplicate/token/media/reorder/detach/archive and evidence-read boundaries. The focused source probe passed 38 actual translator/SQL checks after closure, preserving identity/retry/whitelist/history, six-month presentation refresh, trusted completion, first/second miss, factual archive and same-ID 90-day reappearance. No scraper was invoked.

`verification-package.md` prepares the exact focused S11-C authorization/Apply/Compare, bounded acquisition, canonical reader, Phase7–12A interface, server-only and shared EN/ES checks. Existing S9/S10 suites were NOT rerun wholesale or silently relabeled as new target evidence. Reference/auth snapshots, default receipt checks, absent reviewer/operator assignments, exact trigger/FK restoration and all 300 storage final checks are explicit reopen gates.

Local fixture/harness problems (SQL_ASCII versus UTF8, psql status-line parsing, omitted existing synthetic columns, local BYPASSRLS fixture flag, and two read-only SQL syntax mistakes) were corrected and the affected checks passed. None required changing frozen canonical migrations or inventing product policy. No unresolved test failure remains. Hosted provider behavior, real storage transport, actual future deployment and target verification remain S11-C execution obligations; historical S7 verification limitations remain accepted, not erased.

## M. Remaining decisions

None within the approved S11-B preparation scope. Query-76 accessibility and query-77 FK gaps are closed. Retained-auth policy remains resolved. All target execution, future deployment identity and reopen acceptance require the separate S11-C authorization/checkpoints; these are not permission to start now.

## N. Explicit S11-C boundary

The local package is complete for review. Disposable PostgreSQL was stopped after the final new checks. No target connection or operation, Supabase setting change, application deployment, environment change, staging, commit, push or merge occurred. S12, S13 and Phase14 were not started/resumed.

**S11-C HAS NOT STARTED.**

**NO CANONICAL MIGRATION HAS BEEN INSTALLED INTO THE TARGET.**

**NO TARGET DATABASE PRIVILEGE HAS BEEN CHANGED.**

**NO TARGET DATABASE DATA HAS BEEN PURGED.**

**NO TARGET SUBSCRIPTION HAS BEEN INITIALIZED.**

**NO TARGET STORAGE OBJECT HAS BEEN DELETED.**

**NO APPLICATION DEPLOYMENT HAS OCCURRED.**
