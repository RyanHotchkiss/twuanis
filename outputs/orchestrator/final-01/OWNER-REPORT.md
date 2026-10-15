# ORCH-FINAL-01 — Owner release-or-defer report

**Overall: BLOCKED. Release decision: DEFER. Production unchanged.**

The paid concurrency regression is corrected locally and complete executions through 2,000 observations are demonstrated. The 5,000-observation run still exceeds the available shared environment's safe memory envelope. The mandatory 10,000- and 25,000-observation executions are unqualified. This is not a production-ready orchestrator or a complete architectural resolution.

## Exact baseline and implementation

- Repository HEAD: `406e87f6875adaad1eab8749a33ed699c3ef830d`; existing uncommitted work was preserved.
- All 1,123 ORCH-ACQ-02 source hashes match. The 44-file reconciliation and acquisition changes remain intact. Another 420 unchanged build-support files were copied into the isolated build; no existing application file was edited.
- Approved methodology release: `b6e2e5578a14a13e2e0db58096a03001c51c0407f353f53f4dabe684b6c4080b`.
- Protected archive SHA-256: `9aed567cf7dd7f32e68af625242bee8626f1e77b40d9e7a98adcc875540b3f26`.
- Existing migration files 103–109, immutable inputs, mathematical code, Package authority, credit-ledger functions, and historical archive are unchanged. The orchestrator claim wrapper receives the narrow expiry-maintenance correction below.
- Three new local SQL artifacts: **110** caches the unchanged classification predicate through PL/pgSQL; **111** reuses the existing private transaction-local indexed graph for traversal and releases redundant JSONB variables. Migration 111 is **not segmented validation** and does not solve the large-population memory boundary.
- All three artifacts have exact predecessor guards. All 391 function owners/ACLs remain unchanged; exactly three function definitions differ. Public reader, payment, entitlement, session, and ledger definitions are unchanged; the orchestrator claim wrapper is the third changed function.
- Migration 112 fixes expired-reservation replay by invoking the existing canonical maintenance helper; it changes no ledger definition, schema, entitlement or authorization. The saved migrations preserve the original 32MiB evidence ceiling and role/function timeouts. The larger limits described below exist only in explicitly named disposable qualification databases. They are not release defaults.

## Demonstrated concurrency cause and correction

The scoped Bank path repeatedly evaluates the existing classification predicate while establishing complete membership and exclusions. Nested PostgreSQL planning statistics show **475 plans / 2,190.43ms planning** for 752 predicate calls before correction, versus **6 plans / 28.19ms planning** after correction. Scope response hashes are identical; all 330 property classification results are identical. The complete scope read decreased from 2.658s to 0.330s in the controlled rollback comparison.

Thus the acquisition correction exposed repeated query-planning overhead in the existing SQL-language helper. Same-account advisory-lock waiting amplified the problem; no deadlocks or temp-file spill were recorded in the measured pair. It was not necessary to weaken a predicate or raise the eight-second timeout to resolve the original small scoped concurrency regression.

The fresh baseline pair completed one request and timed out the other with SQLSTATE57014. With migration 110, both completed at the original timeout. With both corrections installed, same-account PRIVATE and BANK pairs and a multiple-account COMBINED pair also completed. Each paid success has one reservation, one report, one witness, and exactly one consumption event. This demonstrates two simultaneous scoped executions, **not** arbitrary global concurrency or concurrent 2,000-observation capacity.

## Actual complete-population qualification

| Run | Acquired | PRIVATE / BANK | Terminal state | Lifecycle s | Finalize / commit s | Worker peak RSS MiB | DB sampled PSS MiB |
|---|---:|---:|---|---:|---:|---:|---:|
| capacity-128 | 128 | 64 / 64 | COMPLETED | 26.98 | 7.45 / 5.46 | 210.4 | 241.2 |
| capacity-500-60s | 500 | 256 / 244 | COMPLETED | 19.78 | 7.21 / 3.73 | 441.4 | 657.6 |
| capacity-1000-60s | 1,000 | 756 / 244 | COMPLETED | 28.12 | 11.35 / 4.84 | 640.0 | 1129.0 |
| capacity-2000-60s | 2,000 | 1,756 / 244 | COMPLETED | 40.71 | 16.95 / 7.73 | 938.2 | Unavailable; RSS 2,148.7 |
| capacity-2000-paid | 2,000 | 1,756 / 244 | COMPLETED | 49.45 | 22.00 / 7.41 | 814.4 | 1899.6 |
| capacity-5000-indexed | 5,000 | 4,756 / 244 | RELEASED | 53.13 | 23.06 / 0.00 | 1571.9 | 3408.6 |

- The 128 run used baseline limits. 500 and 1,000 initially timed out at eight seconds; separate successful runs used 60-second function timeouts with the original evidence ceiling. 2,000 used a 64MiB ceiling and 60-second function timeouts. Worker budget 120s, worker lease 180s and reservation lease 600s remained unchanged.
- The paid 2,000 run consumed exactly one token. Owner qualification runs are explicitly unmetered; they are not presented as paid-accounting proof.
- At 5,000, the complete 4,756 PRIVATE +244 BANK population was acquired and all 17 engine invocations produced evidence. The graph had 96,291 roots and 275,655 nodes, with 121,089,270 UTF-8 bytes of graph and 129,367,978 bytes including its envelope. Validation did **not** complete.
- The local memory guard cancelled only the active qualification query when the shared Docker VM had 605,736KiB available, below the 700MiB guard. Sampled DB PSS peaked at3,408.6MiB. The run released its reservation and committed no report or witness. This is an infrastructure safety cancellation, not a successful test and not a claim that PostgreSQL naturally OOM-killed this run.
- **10,000 and 25,000: BLOCKED / NOT RUN.** Repeating larger monolithic validation on the same shared machine after this boundary would not establish capacity. There was no truncation, downsampling, approximate calculation, or fabricated production inventory.

These are controlled local synthetic qualification populations and actual application execution through local authenticated GoTrue/PostgREST contracts. They are not hosted-production measurements. Runs had differing background load and warm caches; do not infer a scaling curve from their wall times.

`capacity-evidence.json` records exact per-engine raw and eligible membership, wire requests/bytes, evidence counts, report/witness physical column sizes, and ledger events. `resource-summary.json` records sampled process CPU/RSS/PSS, locks, connections and database statistics. HTTP/database request counts are exact at the instrumented boundary; nested internal SQL statement counts and exclusive evidence-capture CPU were not measured for every capacity run. PSS is unavailable for the first 2,000 run; the paid rerun supplies an actual PSS measurement. TOAST column size excludes table/index/WAL overhead. No provider bill or cost claim is made.

## Integrity, numerical and commercial acceptance

- Existing37-scenario matrix: all expected terminal outcomes; additional PRIVATE 17-engine Rent and COMBINED 7-engine Rent complete successfully. Province/canton/district, property type, attribute restrictions, canonical/Owner-Desired subjects, comparables, reference populations and national scope remain represented.
- Bank predicate pushdown still transfers 13 scoped observations per acquisition/freshness phase, instead of 126 nationwide observations. Shared Private retrieval remains 18 rows in each of two phases (36 total), not 108 redundant raw transfers.
- Mathematical output comparison:538/538 exactly equal after excluding duration and the explicitly identified cache digest. The 446 changed cache digests correctly bind the updated Bank source revision already present in the cloned baseline; the independent mathematical content is unchanged. Offline replay separately reproduces the **entire original result including cache identity** from each captured input.
- Independent numerical/membership checks: **29,133/29,133**, covering all 17 engines and the seven-engine configuration. Oracle uses independent rational arithmetic and direct canonical membership; this is separate from archived replay.
- Historical protected replay: **647 exact engine replays across 41 reports**, all 17 covered, zero network access; lossless compression roundtrips and all evidence-node hashes checked.
- Evidence attacks:21/21 expected results, including valid control, altered hashes, binary64 mismatches, missing/duplicate roots, source-scope/exclusion/member tampering, input/output mismatches and cross-account evidence. Validation remains database-authoritative.
- Authority:48/48 matrix results plus19/19 source/security boundary checks. Non-Owner administrator identity alone does not grant Package/Bank capability. Service-only and private schema access restrictions remain enforced.
- Real paid fault tests: forced database timeout and terminated database backend release with zero charge; killed worker returns WORKING during its live lease; retry after natural lease expiry completes the same execution once; duplicate submission returns the completed execution; superseded worker is denied with`WITNESS_CURRENT_ATTEMPT_REQUIRED`.
- Natural Package expiry during execution leaves no completed report and no charge. After Package expiration, the original customer retrieves an exactly equal committed report; another account is denied. New execution authority is denied after expiration.
- The natural ten-minute expiry test exposed a pre-existing replay defect: the UI said RELEASED while the expired ledger reservation remained RESERVED. Migration 112 adds only the existing canonical maintenance call under the existing account lock before returning RELEASED. The exact expired retry now records one RESERVATION_RELEASED event, no report and zero charge; another identical retry creates no additional event. This reuses the existing ledger and authority. The defect and corrected receipts are both retained.

## Architecture and production decision

**Current implementation: SYNCHRONOUS. No qualified final large-population architecture has been established.** The small concurrent regression is fixed, but a function-plan correction and indexed traversal do not constitute durable execution or bounded evidence admission. No durable queue, segmented witness storage/validation, checkpoint worker or global validation semaphore has been implemented. The existing per-account two-execution limit is not a global resource bound.

A larger isolated database could establish a higher monolithic boundary, but the evidence does not identify a minimum provider tier sufficient for 5,000–25,000 observations. A completed bounded/durable lifecycle remains an alternative architectural requirement, not something this packet claims to deliver. Moving the same monolithic validation into a worker would not by itself fix database memory.

The Owner's current NANO allowance (up to 0.5GB) cannot accommodate the observed 1,899.6MiB DB PSS of the paid2,000 run. A 2GB database would have essentially no headroom for that measured workload. The5,000 run exceeded3.3GiB before completion, so 4GB cannot be called sufficient from these results. Worker peaks are814–938MiB at 2,000 and1,572MiB at 5,000; these are observations, not guarantees for 2GB/4GB Vercel configurations. Exact deployed function allocation/duration remains unverified. No infrastructure configuration was changed.

**Remaining release blockers:**
1. Complete and qualify 5,000, 10,000 and 25,000 observations; 25,000 is mandatory for capacity PASS.
2. Establish a complete final architecture and safe global concurrency/recovery policy, including bounded evidence processing if required.
3. Qualify representative large PRIVATE/BANK/COMBINED,7/17, transaction and subject configurations; the large tests here are COMBINED Sale.
4. Qualify exact hosted database/worker memory, CPU, duration and storage; local results alone cannot establish production capacity.
5. Complete the per-stage resource measurements not captured above. Do not label the entire resource matrix PASS.

No UI source changed. Prior EN/ES, desktop/mobile and theme evidence is retained by source identity; no new end-to-end browser acceptance is claimed for a durable customer lifecycle that does not exist. TypeScript and the isolated production build pass. Existing ONVO/SINPE, commercial configuration, listing records, measurements, discovery, production environment, and five cron definitions are unchanged. The Knowledge Architecture reuse matrix remains unchanged; no Knowledge/SEO project work began.

## Local artifacts and recovery

The only repository implementation additions are migrations 110, 111 and 112 listed in`implementation-manifest.json`. None is installed in production. No files were staged, committed, pushed or deployed. Full raw test bodies and capability-bearing fixture files remain in the private temporary workspace and are deliberately excluded from this packet.

Every disposable installation was into`twuanis_orch_final_01*`. Existing baseline definitions and source hashes are retained for local recovery. Roll back a disposable database by recreating it from the approved baseline, or use its saved exact predecessor definitions; do not run an experimental reverse migration on production. The larger qualification limits are excluded from the deliverable migrations.

**Owner decision supported by this evidence: DEFER production release.** The task remains blocked; no partial result has been relabeled as complete acceptance.
