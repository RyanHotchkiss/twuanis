# Recovery procedure and verified limits

Maximum RPO **24 hours** approved. Target RTO **4 hours** approved as an operational target; it is not a demonstrated full-service recovery guarantee. PITR was disabled; no activation is implied.

## Database recovery evidence

Reviewed backup: 2026-10-11T05:03:36.845Z. One isolated provider-supported restoration rehearsal passed schema/functions/RLS/ACL/Owner-continuity and representative immutable evidence verification. Temporary project deletion was independently verified. Restore submission at 16:00:41Z; SQL availability observed at 16:05:16.625248Z (4m35.625s); healthy observation at 16:06:01.918763Z (5m20.919s). These are measured observation bounds, not exact provider completion times or full-service restoration times.

Verified: 202 relations, 2,155 columns, 262 functions, 166 policies, 823 constraints, 166 triggers, canonical Owner continuity, six administrative aggregate baselines and three Storage bucket metadata records. Backup contained 47 FX observations versus 48 in then-current production; post-backup changes require explicit reconciliation within the adopted RPO. Actual provider charges remained pending billing; the approximate compute estimate was not a guaranteed cap.

## Private Storage recovery

Only four approved production objects, aggregate 80,220 bytes, were captured into an Owner-encrypted APFS image at the approved private local destination. Original byte lengths and SHA-256 digests were verified, then verified again after closing and reopening read-only. Passphrase entry was private. This proves capture/reopen integrity, **not a completed cloud Storage restoration**. Bucket/object names, individual object digests, private destination, passphrase, payloads and encrypted image are intentionally excluded from GitHub.

Retention: seven days after accepted production smoke testing, maximum 30 days after capture; hard maximum 2026-11-10T16:37:20Z. Production smoke remains PARTIAL; deployment acceptance alone must not silently start the seven-day smoke-acceptance clock. Retention cleanup requires the approved private procedure; no artifact is deleted by this documentation task.

## Authorized recovery sequence to prepare before execution

1. Identify the failure and preserve non-sensitive incident evidence. Stop unsafe activation; inspect current configuration and schema compatibility.
2. For an application regression, retain deployment `dpl_GUrkRvhGaRxQwSanaS6uLC2hrga2` as the documented predecessor candidate. Obtain separate rollback authorization and reverify compatibility with installed migrations, canonical Package enforcement and existing cron definitions. Do not assume an old deployment is universally compatible.
3. For database recovery, obtain separate provider-supported restoration authorization, choose a current verified backup, measure its age against RPO and protect restored access. Do not restore destructively into production without approval.
4. Database backup restores Storage metadata, not automatically object bytes. Through separately authorized private access, unlock the capture, verify the private manifest and restore only the required objects to matching metadata/identities. Verify bytes and permissions before cutover. No new export or public destination.
5. Reconcile post-backup FX, immutable administrative/publication history, entitlements and Storage metadata/object consistency. Do not invent missing evidence.
6. Verify Owner continuity, RLS/ACLs, Package authorization, disabled Remates runtime, all ordinary cron definitions and focused EN/ES smoke before any separately authorized cutover/activation.

Original rehearsal and Storage verification reports are fingerprinted in [provenance](EVIDENCE-PROVENANCE.json). Private operational recovery instructions remain under restricted Owner custody. No credentials or recovery payloads are part of this repository bundle.
