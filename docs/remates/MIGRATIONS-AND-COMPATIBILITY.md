# Migration installation and production compatibility

All 24 reviewed migration artifacts 062–085 were installed successfully on 2026-10-11. [Installation evidence](MIGRATION-INSTALLATION-EVIDENCE.json) records every original artifact identity, installed SHA-256, production variant flag, timestamps and provider receipt digest. Each file executed atomically; the entire chain was not atomic. The preexisting production migration ledger was absent and manual Management API installation did not create conventional version-ledger entries. Installed object fingerprints and per-file receipts establish installation.

Production-compatible variants only:

- 082: installed SHA-256 `26ca63de9b01aa84f001f55c9ae642f549f76a6c0c876ba47514d8fbae360fd2`. Reconciles verified FX predecessor definition and unauthorized TRUNCATE privileges while preserving insertion, duplicate/conflict behavior, immutable history and analytical resolution.
- 085: installed SHA-256 `6a3e47d24cc015ec08e2140c7fe07ff9a0e63b6fcfc5029764765686fbe719dd`. Reconciles verified Owner-function ACL predecessor without broadening authority or adding bypasses.

Historical migrations remain unchanged. Original/variant hashes are both retained; do not substitute the staging hash for the installed production variant. Local production-predecessor rehearsal passed before installation.

Production postconditions verified 69 function fingerprints/owners/ACL/search paths and security modes against reviewed definitions; 55 private Remates tables retained RLS; 12 rollback-only effective FX UPDATE/DELETE/TRUNCATE probes passed across four intended roles. Original financial/history/ordinary records were preserved. Database SQL bodies and private response logs remain outside this public documentation.

No new installation follows from this record. Future changes require fresh predecessor inspection and separate authorization. Recovery uses the [approved procedure](RECOVERY-PROCEDURE.md), not destructive down-migration or weakened predecessor guards.
