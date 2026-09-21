# S11-B verification ledger

All execution was offline or isolated local PostgreSQL; no target request or storage deletion.

| Verification | Result |
|---|---|
| Retained default-access initialization, preserved completed work | 15 checks and 1 independently connected concurrent retry case passed |
| Reorder/accessibility PostgreSQL | 17 checks, including 3 concurrent row-lock interleavings, passed |
| Reorder JavaScript/PostgreSQL normalization parity | 19 cases passed |
| Actual shared API route offline | 11 cases passed |
| Affected image-detach integration regression | 9 cases passed |
| TypeScript | Passed --noEmit --incremental false |
| Fresh pre-canonical fixture installation | All 22 files 003–024 installed in dependency order; guarded seed, retained setup/init and closure passed |
| Actual canonical operations after closure | Authenticated creation/publication/renewal and service read passed; subsequent rollback-only canonical-smoke.sql covered customer edit/duplicate/token/media/reorder/detach/archive successfully |
| Effective function/table/column privilege catalog | 1,201 assertions passed, including 69 function contracts; authority-verification.csv |
| Canonical table/private schema and trusted-owner checks | 2,958 assertions passed across 28 canonical/administrative tables; private-authority-verification.csv; no disabled guards returned |
| New initialization verification SQL | 8 booleans true: receipt, auth/default identities, no assignments and reviewer denial |
| Purge graph and failure handling | 5 scenarios passed: phase guard, FK drift, injected rollback, reference-change rollback, complete success; all 51 disposable empty, all 15 protected preserved, exact promotion guard and 70 FKs retained |
| New reference snapshot SQL | Executed read-only on graph fixture; all 15 existing protected objects reported; 5 not-yet-installed canonical reference objects explicitly absent |
| Storage mocked API | 10 scenarios passed: success, already absent/retry counts, lost response, denied delete, replacement ID, nonmanifest new object, configuration drift, wrong bucket, malformed count and external path rejection |
| Source observation/lifecycle after authority closure | 38 focused checks passed, actual translator and SQL service-role boundaries; no scraper/network |
| Server-only import graph | 187 client roots, 274 visited modules, zero failures |

Counts are scoped checks, not a synthetic confidence score or a claim of full hosted end-to-end coverage. The 36 early direct-write/TRUNCATE checks are included in the later broader privilege coverage, not an additional total. The three reorder interleavings are included in the 17 database checks.

Fixture/harness corrections: UTF8 database replaced SQL_ASCII for Unicode checks; quiet psql output fixed status-line parsing; synthetic fixture received existing source_url/bilingual ontology/phone columns; service role gained the supplied BYPASSRLS context; read-only catalog/verifier SQL alias/parenthesis typos were corrected before successful final checks. These corrections did not change existing canonical migrations or product semantics. No unresolved implementation failure remains.

Original stage verification and accepted historical S7 limitations remain as recorded. No S9/S10 wholesale rerun. The prepared focused S11-C analytical commands remain future gates, not falsely reported as new target passes.
