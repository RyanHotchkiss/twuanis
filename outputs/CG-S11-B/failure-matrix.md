# Failure and rollback matrix

| Checkpoint/failure | Required response | Retry/rollback boundary |
|---|---|---|
| Before purge: no maintenance, changed catalog/manifest, unknown target, missing approved artifact | Stop with no mutation | Resolve exact drift; no automatic adaptation. |
| Purge fails, lock timeout, injected trigger failure, missing FK, hash/guard mismatch | Transaction rolls back data and exact trigger changes; keep maintenance | Diagnose failed transaction only. Verify no commit marker; retry same reviewed group after resolution. |
| Purge commits, later installation fails | Keep maintenance. Old disposable data is intentionally gone | Do not restore fake data or auth users. Resume after last committed migration with reviewed error resolution; no blind replay. |
| Migration fails within its transaction | That file rolls back; earlier committed files remain | Verify transaction state; no drop/CASCADE/IF NOT EXISTS workaround. |
| Retained-auth initialization fails | Its transaction rolls back subscriptions and receipt together | Exact operation retry. Existing mismatched rows/receipt fail closed; never overwrite paid/test state silently. |
| App build/deploy fails before reopening | Remain quiesced; DB may be installed but unused | Deploy a corrected reviewed canonical-compatible artifact. Old unknown artifact is not an automatic fallback. |
| Authority-closure SQL fails | That transaction rolls back grants; traffic remains blocked | Fix exact artifact defect and affected verification before retry. No partial exposure is accepted. |
| Closure commits but canonical smoke/read fails | Keep maintenance | Diagnose required function/table role. Do not restore broad direct writes, public RPC execution or TRUNCATE. |
| DB purge committed, storage deletion partly fails | Keep exact manifest/journal and bounded remediation state | Retry failed/uncertain keys conservatively; existing absence acknowledged. No database rollback required. |
| Storage API returns uncertain result | Final metadata absence is authoritative; other outcomes fail | Retain journal and retry; never assume success from transport response alone. |
| Key has a different object ID | Do not delete replacement | Stop that key and report; no expansion of deletion authority. Quiescence prevents races after metadata check. |
| Storage succeeds but DB purge rolled back | Prohibited by sequence; storage requires verified DB commit | If operator violated sequence, fail closed: bytes cannot be rolled back by SQL. No claim of coordinated atomicity or automatic restoration. |
| Interruption between DB and storage | Preserve DB commit/install/closure receipts and storage manifest | Resume exact remaining group; never infer pending storage deletion from vanished DB links. |
| Storage bucket/config or reference/auth/guard mismatch | No reopen | Investigate precise mismatch; do not recreate identities, mutate reference rules or weaken guards. |
| Reopen verification fails | Maintenance continues | No automatic reopen; no next stage. |

Disposable data requires no preservation/migration system. Storage removal is irreversible; this package deliberately orders it after committed DB purge and retains per-object evidence. No automatic down migration, schema dropping, broad regrant or restoration of obsolete writers is authorized.
