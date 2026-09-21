# Disposable evidence and reproduction boundaries

S11-B used PostgreSQL 17 on the Unix socket /private/tmp/s11b-prep/socket, port 55439, with TCP disabled. No Supabase credentials were supplied. All fixtures are local only. Do not point these helpers at the target.

`disposable-install-fixture.sql` contains synthetic prerequisite DDL and the supplied current definitions needed for intentional replacement. It is not a target installation artifact. In a newly created disposable UTF8 database, create mock API roles (service_role BYPASSRLS), then apply this fixture, 002 to simulate the already-installed target prerequisite, and the separately listed 003–024 files. Apply accessibility seed, retained setup/init and authority closure. This is reproduction guidance, not an automatic cutover script. The verification already passed and need not be rerun without a relevant change.

The fixture intentionally includes source_url, bilingual ontology names and token phone columns that the first synthetic harness omitted. Those omissions were corrected in the fixture; no product columns or migrations were added for them. The existing test roles originally omitted service_role BYPASSRLS; the local role was aligned to the supplied target role context before authority assertions.

`canonical-smoke.sql` was executed in the installed fixture and rolled back. `verify-authority.sql` produced 1,201 checks and `verify-private-authority.sql` another 2,958 checks, all passing. The two CSV files preserve those results. They are fixture evidence; final target catalog checks remain an S11-C gate.

For the focused source probe, create a separate disposable clone named s11b_source_closure, add the established fixture district 30403 (Pejivalle, parent canton 304) if absent, and run verify-source-after-closure.cjs. It hard-codes the local socket/database guard. It performs 38 focused checks, including controlled fixture timestamp changes, so it is never a target script. No scraper/image download occurs.

Purge tests used a separate source-derived 70-FK/51-disposable/15-protected fixture; column types are synthetic UUIDs because those checks concern dependency order/guard transactionality, not analytical data types. verify-purge.py contains five failure/success scenarios. The graph shape and promotion guard are exact supplied evidence, not a recreation of the entire target database. Its fixture is preserved as disposable-purge-fixture.sql. Storage checks use an in-memory API mock only; verify-storage.cjs reports 10 scenarios after retry/bucket accounting additions.

Earlier retained-auth and reorder evidence remains recorded in their dedicated verification notes. No completed S1–S10 suites were repeated. The local server is stopped at final handoff.
