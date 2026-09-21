# S11-C maintenance and cutover runbook — PREPARED, NOT AUTHORIZED

No automatic all-in-one runner exists. The operator must stop and record acceptance at every group. S11-B completion does not authorize any group below. No target action has occurred.

## Group 0 — approval, identity and maintenance

Entry: explicit S11-C authorization after review of installation manifest, SQL, RPC allowlist, purge and storage manifests, retained-user policy, verification and failure matrix. Pin package-checksums.json and application-source-manifest.json. Record operator, target project szhpqemhjyvvqgjgsmsw/database postgres, expected UTF8, administrative session identity, intended reviewed application artifact. Never place credentials in these artifacts or logs.

The current production artifact is inconclusive by accepted baseline. Establish the FUTURE artifact from the reviewed source manifest and dependency lockfile. When separately authorized, record commit/build/deployment identifiers and ensure source hashes match the reviewed candidate. Any additional source change requires review and affected verification. S11-B neither commits nor deploys. Verify the actual S11-C administrative connection identity separately before any mutation.

Enter maintenance before any incompatible change. Stop application requests capable of writes, Server Actions, publication/renewal, signup/default package initialization, customer edits/duplicate, token verification/creation/publication, media uploads/attach/detach/reorder, CSV/trusted ingestion and source-run completion, payment review/activation. Block direct API callers holding write credentials during maintenance as well as browser traffic. Do not rely on a cosmetic maintenance page. Pause the two actual vercel.json jobs: /api/cron/saved-search-alerts (12:00 UTC) and /api/cron/cleanup-temporary-listing-images (12:30 UTC). Pause any currently running manually initiated import worker; no additional scheduler/producer is assumed to exist.

Drain in-flight requests and verify no remaining application transactions or storage operations. Keep signup blocked through retained-user initialization and its verification. If traffic cannot be reliably quiesced, STOP. The storage metadata/delete APIs do not offer a cross-system or conditional-identity transaction: storage writers must remain stopped through deletion.

Confirm reviewed storage manifest still has exactly 300 unique bucket/key/id records with approved hash. It was captured before DB links disappear; never recapture by automatically sweeping new objects. Record reference/auth baseline with reference-snapshot.sql and record relevant catalog/guard baseline. Compare current schemas/objects against accepted S11-A evidence and installation manifest without restarting archaeology. Unexpected drift, collision, role path or policy mismatch stops execution for review.

STOP POINT 0: reviewed artifact, target identity, maintenance, drain and manifest freeze accepted.

## Group 1 — disposable database purge, before canonical guards

Execute ONLY purge-before-install.sql as postgres. The script checks private schema absence, exact 70-constraint graph, locks scope, captures 15 protected reference/auth digests and all public/auth trigger definitions/states, disables only the exact promotion-events deletion guard, deletes the 51 approved relations child-first, restores the original O guard state, checks all emptiness/FKs/protected hashes/trigger restoration, then commits.

Capture both precommit and committed markers plus per-table counts. No TRUNCATE, CASCADE, permanent FK alteration or auth-user deletion. payment_reviewers rows are deleted; reviewer architecture is preserved. Canonical private import grants do not exist yet and must start empty later. Snapshot comparisons must be equal here, before approved migration seeds alter reference structure.

STOP POINT 1: committed purge evidence accepted. Do not delete storage before this point.

## Group 2 — canonical installation and reference setup

Follow installation-manifest.md numerically: existing 002 is a prerequisite, NOT replayed. Install 003, then 004–023, then 024. Each file is its own reviewed transaction and checkpoint log entry with source hash. Do not retry already committed one-shot DDL. Absent schemas/new objects are expected; unexpected objects halt the group, not silently IF NOT EXISTS.

After 006, apply accessibility-seed.sql (or after 024 before any canonical runtime operation); exact query-76 mapping only. Apply retained-auth-setup.sql once after canonical schema exists. Preserve the 012 default duration seed and empty valid classification state; invent no rule, package, reviewer or operator. Canonical protected history guards are installed after old rows are gone, so they need no disabling.

Execute retained-auth-initialize.sql once with maintenance still active. It creates one fresh active/free Market Explorer subscription per retained auth user, and records the fixed-operation receipt. Exact replay is allowed; any divergent state fails. Do not recover paid/test packages. Do not eagerly create publisher accounts; existing canonical creation lazily initializes them.

Run initialization-verification.sql. Record a NEW reference-snapshot.sql baseline after intentional schema/seeds; compare this new baseline at final reopening, while comparing auth identity digest to the original baseline. No test reviewer/import grants may survive.

STOP POINT 2: exact installed catalog, seeds, defaults and retained identities accepted.

## Group 3 — future application and authority closure

Deploy only the separately approved future application artifact while maintenance remains enforced. Record deployment/build identity and source-manifest match. Canonical migrations/writer RPCs, including reorder, must exist before serving this artifact. No traffic may return to the unidentified old artifact.

Execute authority-closure.sql as postgres. This is its own transaction. Direct protected listing/membership writes close only now that their replacement boundaries and compatible application are ready. Preserve SELECT/RLS. Then execute verify-authority.sql and verify-private-authority.sql; every verification/denial boolean must be true, unexpected role/owner/guard rows must be absent. Compare installed canonical catalog with the reviewed manifest, including dynamic guards/indexes/constraints; required trusted postgres authority remains available.

STOP POINT 3: compatible artifact and effective privilege closure accepted. An application deployment or ACL failure leaves maintenance on. Do not restore obsolete bypass grants to make an old app work.

## Group 4 — reviewed storage cleanup

Only after committed DB purge, and while all storage writers remain quiescent, run the separate storage-delete-reviewed.cjs operation. Supply explicit target URL, service credential from the approved secret store, reviewed manifest SHA256 and an absolute durable journal location through S11_STORAGE_URL, S11_STORAGE_SERVICE_KEY, S11_REVIEWED_MANIFEST_SHA256, S11_STORAGE_JOURNAL. Never put secrets in command text, artifacts, screenshots or logs. Required flags are --execute-reviewed-storage-only --ack-maintenance --ack-db-purge-committed. No code loads .env automatically.

The operation locks the journal, fsyncs per-object attempts/requests/results, checks exact storage object ID before removal, deletes one reviewed key at a time, and verifies absence for every key. Ambiguous errors remain failed/retryable. A replaced identity is never removed. Repeat with the same manifest/journal; already-absent keys are acknowledged, prior attempts are counted as retries. Recovered partial journal lines or stale locks require operator review, not forced deletion. New nonmanifest objects and external source URLs are never enumerated/deleted. Bucket configuration is compared before/after; preserve storage policies independently (the script never changes them).

Required outcome: manifest=300; attempted=300 per completed pass; failed=0; deleted+alreadyAbsent=300; journal records final existence for every key; retryCount recorded; bucket remains the same. Retain all passes to distinguish actual deletions from prior absence. There is no claim of PostgreSQL/storage atomicity. Failures remain bounded storage remediation, not a DB rollback instruction.

STOP POINT 4: storage completion evidence accepted. Do not reopen or allow fresh storage writes until cleanup is complete or separately adjudicated; never sweep a new manifest automatically.

## Group 5 — focused verification and reopen

Follow verification-package.md. Run authority/read-only invariants, rollback-only canonical smoke using a retained auth user and exact reviewed property-type ID, focused offline authorization/Apply/bounded acquisition/interface checks against the exact future artifact, and controlled disposable source-lifecycle tests. No scraper is invoked. Capture test outcomes, final reference/auth/catalog comparison and EN/ES shared operation evidence. Test fixtures must not persist in target reference/rule/reviewer/operator data.

After the rollback-only smoke, verify listings/history/media-operation fixtures did not persist. Retained default subscriptions remain, while old purchases/payments/saved data and reviewer/operator assignments remain absent. Do not expect user_subscriptions to be empty after initialization; compare to its exact receipt instead.

Reopen only after all gates pass and an authorized operator accepts the record. Resume the two real jobs and approved operational ingress, signup last with its canonical trigger verified. Any unresolved privilege failure, unexpected canonical write bypass, missing guard/reference/auth identity, media cleanup uncertainty, wrong artifact or failed canonical operation is a no-reopen condition. S12/S13/Phase14 do not begin under this runbook.
