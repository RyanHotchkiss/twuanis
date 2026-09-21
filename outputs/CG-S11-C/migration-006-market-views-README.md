# Two-view Migration006 bridge

Authorized C2-R2 scope: only public.market_canton_stats and public.market_listing_base. Captured catalog evidence: ../CG-S11-C-evidence/c2-r2-final-dependencies.json. No canonical migration is edited.

Execute migration-006-market-views-bridge.sql using psql -X -w -v ON_ERROR_STOP=1. Its relative includes resolve from this directory. Precondition SQL compares exact captured view definitions/owner/ACL/options/comments/column metadata; asserts bigint and absent006 marker; rejects additional view/row-type dependents. Explicit RESTRICT drops are canton then base.

The prelude starts a transaction. Unchanged006 begins with BEGIN, producing the expected already-in-transaction warning; it does not create a nested transaction. Its COMMIT commits both drops and006. A precommit error with ON_ERROR_STOP and connection closure rolls back006 and both drops. Tested injected-error recovery leaves the original views present without manual repair.

Restoration immediately follows in a second transaction, base then canton, each metadata-asserted. Only base monthly_price changes from bigint to numeric. Existing numeric average and double-precision median semantics are unchanged. Exact existing auxiliary ACLs are restored, not broadened or cleaned up. Defaults/options/comments are checked, including their captured absence. No CASCADE.

There is a short committed view-absence interval between006 COMMIT and restoration COMMIT. Maintenance protects it; no claim of full-sequence atomicity. If restoration fails, its transaction rolls back,006 remains committed, and execution must STOP before007. Preserve numeric type, inspect exact failure and restore forward using the reviewed restoration artifact after resolving the failure. Do not reexecute the bridge/006.

Disposable PostgreSQL17 test uses the existing local-only socket, no target credentials. The initial full S11-B fixture failed parsing in unrelated commercial function text. The bounded harness therefore uses only its prerequisite DDL/seed prefix, adds the relevant created_at field, applies002–005 locally, and creates the exact two views. No frozen fixture/migration was changed. Tests reproduced original006 failure, wrong-order drop rejection, ordered-drop/injected-error rollback, successful unchanged006+restoration, metadata parity, identical integer-population results, fractional100.25/200.75 rental average and median150.5, sale/rent/null/status/canton filtering, and successful007 local installation. Details in ../CG-S11-C-evidence/c2-r2-disposable-results.json and transcript.

MIGRATION006 SOURCE WAS NOT PATCHED. SHA256 remains73ed1b776a787af61b35cf03cb91eb4e8135f13fff446e4f6a61be2a9721b891.
