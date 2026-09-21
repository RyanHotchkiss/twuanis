# CG-3B2B2-S7 — Consolidated report

**CG-3B2B2-S7 PARTIAL — FINAL VERIFICATION INCOMPLETE**

Report consolidation only. Source: the pre-existing cumulative S7 record reproduced below as a historical appendix. No repository investigation, implementation, tests, database activity or infrastructure cleanup was performed for this consolidation. Later recorded resolutions supersede earlier blocked checkpoints; historical verdicts in the appendix are not current verdicts.

## 1. Verdict and evidence boundary

The record documents completed adaptations for the identified operational writer families, their focused verification, and closure or isolation of the identified legacy bypasses. Its latest entry identifies **no new architectural decision and no specific remaining unadapted operational writer/bypass**. Test-utility modernization is no longer an S7 requirement.

However, the same record explicitly leaves final exact closure accounting and final preserved-baseline integrity evidence unfinished. Earlier verification reservations are not all explicitly discharged by later entries. This reporting task cannot convert those missing attestations into verified results. Therefore full S7 verification/closure is **not established by the existing record**. This is an evidence/completion-review limitation, not a newly discovered operational defect, a demand to modernize test utilities, or an architectural approval request. The requested consolidation is complete; the report does not certify S7 COMPLETE.

## 2. Operational writer inventory and final known classification

| Writer/path | Classification | Final recorded disposition |
|---|---|---|
| Customer Sale/Rent token creation; publish-listing route | A | Canonical creation, durable token/media operation, same-draft retry and canonical publication |
| Canonical Sale/Rent customer edit | A | Typed server adapter and canonical edit boundary; explicit measurement CLEAR; recorded-rule reclassification |
| Customer publish-existing/renew routes | A for canonical; B for legacy | Canonical package-duration/capacity boundary; explicit-null legacy branches remain temporary |
| manageListing unpublish/archive/restore/delete | A for canonical; B for legacy | Canonical lifecycle helper; guarded explicit-null legacy status update |
| Canonical duplicate | A | Fresh canonical identity/evidence, independent owned media, durable retry; no history cloning |
| Legacy-source Duplicate | Unavailable pending reconciliation | UI disabled for legacy/unknown; server canonical-only enforcement |
| Permanent deletion | B | Explicit-null legacy only, conditional database-first deletion; canonical physical deletion prohibited |
| Browser Sale/Rent CSV publication | A | Auth-derived import-operator endpoint, retained source evidence, canonical creation and receipt-linked initial publication |
| Source scrapers/normalizers | D as direct listing writers; upstream ingestion input | Observation identity/time and raw/review separation implemented; inspected local utilities do not directly write canonical listings |
| Ordinary image upload/attachment | A, media-only | Private operation, same-file retry, no lifecycle or domain-revision mutation |
| Image detach/cleanup and reorder | A, media-only | Durable detach/cleanup operation; no stale compensation; reorder compare-and-set |
| Abandoned temporary-token cleanup cron | A, ancillary operational cleanup | Database claim before storage cleanup; excludes canonical creation operations |
| Six obsolete creation/publication/lifecycle utilities | C | Unconditional reversible guards before database/activity execution |
| Bulk ontology command and assignListingOntology write helper | C | Unconditional guards; independent read resolver preserved |
| Ordinary activity endpoint/logging | D relative to protected canonical authority | Activity table only; not canonical history/receipt authority |
| Historical verification utilities | D | Dispositions below; not operational writers merely because manually executable with credentials |

This is the final known disposition from recorded work, not a newly conducted exhaustive writer discovery.

## 3. Classification rules and test-utility course correction

A means surviving operational writer adapted to the established authority. B means intentionally temporary legacy compatibility, never fallback for canonical rows. C means obsolete/replaced and guarded. D means noncanonical/out-of-scope for operational canonical writes.

Completed disposable conversions remain preserved: commercial-resolver, activation, provider, commercial-timeline and public-promotion-evidence. They use runner-created targets and rejecting-by-default authority.

promotion-performance is D: only manual verification entry found; listings access is an ownership read; writes are synthetic commercial/activity history; no operational caller or protected listing/ontology write found. promotion-intelligence, aggregate-promotion-intelligence, promotion-placement, promotion-history and comparable-cohort verification entries were also recorded as standalone verification entries without operational callers. They were not converted or run after the course correction.

Ordinary credentials, persistent synthetic history and manually unsafe shared-target execution are **test-infrastructure debt**, not additional S7 implementation requirements. This does not certify those commands safe to run against shared infrastructure or assert that S11 privileges have already been closed.

## 4. Files created — recorded inventory

Paths below are relative to /Users/cassidydaddy/twuanis. This list consolidates explicitly recorded creations; it is not a fresh filesystem diff or a claim that lost scratch artifacts exist.

Migrations:
- supabase/migrations/010_import_operator_authority.sql
- supabase/migrations/011_csv_initial_publication.sql
- supabase/migrations/012_customer_publication_entitlement.sql
- supabase/migrations/013_customer_duplicate.sql
- supabase/migrations/014_customer_edit_classification.sql
- supabase/migrations/015_customer_edit_content.sql
- supabase/migrations/016_customer_measurement_clear.sql
- supabase/migrations/017_token_canonical_creation.sql
- supabase/migrations/018_csv_source_evidence.sql
- supabase/migrations/019_csv_source_references.sql
- supabase/migrations/020_ordinary_upload_operations.sql
- supabase/migrations/021_image_detach_cleanup.sql
- supabase/migrations/022_abandoned_token_cleanup.sql

Application adapters/routes:
- lib/customer-publication-writer.ts
- lib/duplicate-listing-media.ts
- lib/canonical-customer-road-distance.ts
- lib/canonical-customer-edit.ts
- lib/token-canonical-creation.ts
- lib/csv-source-ingestion.ts
- lib/ordinary-upload-operation.ts
- app/api/duplicate-listing/route.ts
- app/api/edit-canonical-listing/route.ts
- app/api/import-canonical-csv/route.ts
- app/utils/canonicalCustomerEdit.ts
- app/utils/canonicalCustomerLifecycle.ts
- app/utils/submitCanonicalCsv.ts

Verification artifacts under scripts/verification/:
- canonical-writer-permanent-delete.cjs
- import-operator-authority.sql; source-observation-propagation.cjs
- csv-initial-publication.sql; customer-publication-entitlement.sql; customer-publication-callers.cjs
- customer-duplicate.sql; customer-duplicate-media.cjs; customer-duplicate-concurrency.py; customer-duplicate-ui.cjs
- customer-road-distance.cjs
- customer-edit-classification.sql; customer-edit-integration.cjs; customer-edit-concurrency.py
- customer-measurement-clear.sql; customer-measurement-clear.cjs; customer-measurement-clear-concurrency.py
- customer-lifecycle.cjs; customer-lifecycle.sql
- csv-normalizer-provenance.cjs; csv-evidence.sql; csv-source-references.sql; csv-evidence-concurrency.py; csv-ingestion.cjs
- retired-listing-writers.cjs; retired-ontology-writer.cjs
- ordinary-image-attachment.cjs; ordinary-upload-fixture.sql; ordinary-upload.sql; ordinary-upload-concurrency.py; ordinary-upload-operation.cjs
- image-detach.sql; image-detach.cjs; image-detach-concurrency.py; media-caller-containment.cjs; abandoned-token-cleanup.sql
- commercial-disposable-runner.cjs; commercial-disposable-authority.ts
- activation-disposable-authority.ts; activation-disposable-runner.cjs; activation-disposable-schema.sql
- provider-disposable-authority.ts; provider-disposable-schema.sql
- timeline-disposable-authority.ts; public-evidence-disposable-authority.ts

Report: outputs/CG-3B2B2-S7-report.md.

Token scratch verification and the attempted standalone CSV reference-fixture copy were not successfully preserved; they are not listed as repository artifacts.

## 5. Files modified — recorded inventory

Application routes:
- app/api/permanently-delete-listing/route.ts
- app/api/publish-existing-listing/route.ts
- app/api/renew-listing/route.ts
- app/api/publish-listing/route.ts
- app/api/upload-temporary-listing-image/route.ts
- app/api/update-listing-image/route.ts
- app/api/delete-listing-image/route.ts
- app/api/reorder-listing-images/route.ts
- app/api/cron/cleanup-temporary-listing-images/route.ts

Components:
- app/components/ListingOperationsCenter.tsx
- app/components/MarketHubMyListings.tsx
- app/components/MarketHubMyListingsLoader.tsx
- app/components/SaleListingEditForm.tsx
- app/components/RentalListingEditForm.tsx
- app/components/AuthenticatedListingPublisher.tsx
- CsvListingsGrid (the cumulative record names this component without an exact path)

Utilities and pages:
- app/utils/marketHubListing.ts; app/utils/manageListing.ts; app/utils/updateListing.ts
- app/utils/publishCsvListings.ts; app/utils/publishRentLeaseCsvListings.ts
- app/utils/createListing.ts; app/utils/createRentalListing.ts
- app/utils/publishListing.ts; app/utils/unpublishListing.ts; app/utils/archiveListing.ts; app/utils/deleteListing.ts
- app/en/sell/edit/[id]/page.tsx
- app/en/rent-out-lease-out/edit/[id]/page.tsx
- app/es/vender/editar/[id]/page.tsx
- app/es/publicar-alquiler-arrendamiento/editar/[id]/page.tsx
- lib/assign-listing-ontology.ts
- scripts/assign-ontology-to-existing-listings.ts
- scripts/scrapers/encuentra24-sale-scraper.js; scripts/scrapers/encuentra24-rent-scraper.js
- scripts/scrapers/normalizers/encuentra24-sale-normalizer.js; scripts/scrapers/normalizers/encuentra24-rent-normalizer.js
- scripts/verification/commercial-resolver.ts; activation-engine.ts; commercial-provider.ts; commercial-timeline.ts; public-promotion-evidence.ts (all under scripts/verification/)
- package.json

New S7 files were subsequently refined within the same stage, including canonical edit adapters, customer-edit-integration.cjs and shared disposable runners; they remain listed as created relative to the pre-S7 state. The exact final exhaustive changed-file manifest is not present in the cumulative record and was not regenerated here.

## 6. Files deleted

No repository-file deletion is recorded. Reversible retirement preserved original bodies/signatures. Disposable-directory removal is test cleanup, not repository deletion. The missing token scratch artifacts were reported as already absent, not as verified deliberate repository deletions.

## 7. Canonical customer writer adaptations

Customer identity is authenticated, not client-selected. Numeric canonical version 1 selects canonical authority; explicit null selects only approved legacy compatibility; malformed/unknown classifications fail closed. Server adapters validate bounded input and forward stable request identity/lossless revision. Browser callers cannot choose owner/publisher, trusted provenance, classification rules or canonical eligibility.

Customer edits send changed domains only, with complete money/geography groups where required. Content composition is atomic and receipt-bound. Sale/Rent forms preserve canonical original-denomination values. The existing token publisher creates new canonical customer listings and gates publication on media completion.

## 8. Trusted/ingestion adaptations

Migration 010 supplies independent auth.uid()-based import-operator authorization with private grant episodes. No real operator grants were performed. Browser CSV calls the authenticated server route; trusted service capability never becomes a browser flag or credential. Raw source-supported evidence alone enters canonical creation. Required unsupported evidence retains its source record and fails creation; optional unsupported evidence stays absent.

## 9. Publication and renewal

Migration 012 supplies package_limits.publication_duration_seconds: approved free/monthly 2,592,000 seconds and annual 7,776,000 seconds; only the known Market Explorer configuration was populated. Unknown package duration remains null/fail-closed; billing labels are not runtime authority. Canonical callers reach publish_customer_canonical_listing, retaining S2/S5 capacity serialization and established early/expired renewal behavior. CSV initial publication is a distinct receipt-linked, ownerless 7,776,000-second exception, not a general trusted duration policy.

Publication/renewal UI requests remain stable within the mounted workspace; page-remount persistence is not claimed. Core expected-revision protection remains authoritative.

## 10. Lifecycle, deletion, restoration and archival

Canonical unpublish/archive/restore/delete use the existing customer mutation boundary, stable requests and lifecycle history. Normal canonical deletion does not physically remove identity/history. Legacy permanent deletion requires explicit null, authenticated ownership and deleted state in the final database predicate. Storage cleanup occurs only after confirmed database deletion. Uncertain database results cause no storage removal; later cleanup failure is reported without restoring or fabricating state.

## 11. Duplication

Only owned canonical sources are eligible. A new canonical draft receives permitted facts/measurements and independently derived classifications under recorded sealed rules. Unclassified evidence remains valid and unclassified. No source lifecycle/monetary events, receipts, revision history, source appearance/observations or consumption history are cloned. Fresh creation/initial-money events belong to the new identity.

A private request/manifest fixes the new identity and destination paths. Only established customer-owned managed media is copied; external/ambiguous provenance fails closed. Media failure retains the same draft and uncertain files, returns explicit incomplete status and retries without a second identity. Completion does not overwrite intervening manual media changes. Legacy Duplicate remains unavailable until later reconciliation.

## 12. Ontology assignment

Both bulk assignment command and shared assignListingOntology write helper reject unconditionally before database/activity work. Independent resolveListingOntology remains available. No blanket delete/reinsert path survives through those guarded entries; Model C and canonical geography are not replaced by compatibility-field inference.

## 13. CSV/import/scraper adaptation

Observation IDs/timestamps are captured at source receipt and preserved verbatim. Normalizers retain raw input and separately mark heuristic/transformed output unresolved and noncanonical. Migration 018 persists bounded immutable raw/review records before conversion, including rejected observations. Stable retained-evidence identity anchors creation; no upload-time observation fabrication.

Browser batches are bounded to100 sequential rows; the endpoint accepts one bounded observation. Exact fractional facts and explicit units remain exact. Title-based property type is not accepted as observed type. Migration 019 attaches bounded external references without acquiring image bytes, then permits approved initial publication. Existing appearance/reconciliation conflicts remain with established canonical machinery.

## 14. Token and special-operation adaptation

Migration 017 atomically binds verified token/customer to canonical creation and a fixed media plan. Client listing IDs/completion flags are rejected. Same-operation retries preserve identity; attachment/publication are separately confirmed. Pending media blocks publication through token and ordinary entry points. Completed retries do not republish after a later lifecycle change. Token input freezes after creation. Migration 022 excludes these operations from abandoned-token cleanup and requires a confirmed database claim before removing temporary storage.

## 15. Protected-state bypasses found

Recorded former bypasses were browser CSV direct insert/ontology assignment; legacy edit/lifecycle/publication operations without canonical isolation; duplicate direct insertion/reference copying; token direct creation with physical-delete compensation; blanket ontology replacement; canonical eligibility of permanent deletion; and media partial-failure/stale-array hazards. Manual test DML alone is not an operational bypass under the final relevance rule.

## 16. Bypasses closed in S7

Canonical paths now use approved wrappers; explicit-null predicates isolate retained legacy mutation. Six obsolete utility guards and ontology guards stop before DML. Canonical physical deletion is unavailable. Duplicate/token failures retain committed identities. Media attachment/detachment uses private operations; reorder uses snapshot comparison, and general legacy Save cannot restore stale image arrays. Targeted final recorded app/lib matches correspond to these known guards/compatibility/media paths, not a newly identified unresolved canonical writer.

## 17. Intentional temporary bypass/compatibility gates

Legacy-only update, lifecycle, publish/renew and permanent-delete behavior remains B until reconciliation/coordinated cutover. It must not become fallback for canonical/unknown rows. Legacy duplication is unavailable. Media-only images/updated_at mutations are an established surviving path, not permission to write domain authority. Temporary compatibility retirement belongs to the coordinated transition, not silent S7 removal of legitimate legacy functionality.

## 18. Later direct-DML and privilege closure

S11 must address previously identified effective application-role broad DML/TRUNCATE concerns and coordinated privilege closure for protected state. S7 did not perform that cutover. New private operation/evidence records have the locally verified grants/RLS/function boundaries described in their entries. Do not infer that all current role/table privileges are already closed.

The cumulative record does not contain a completed final role-by-role/object-by-object closure matrix. This consolidation preserves that limitation rather than inventing exact grants or inspecting the database. Later-stage execution obligations are not new S7 test-utility work.

## 19. Canonical/legacy coexistence

Canonical version1 uses canonical authority only. Explicit null remains legacy only where approved. Unknown/malformed states fail closed. Editing/importing/duplicating does not silently promote old listings. S8–S10 reconciliation remains outside this implementation.

## 20. Model C

Exact facts, range evidence, semantic choices and derived classifications remain distinct. Source recorded sealed rule sets are reapplied server-side; old band results are not preserved after exact-value changes. No recorded rule means unclassified evidence, not an error/default. Road ranges are [0,100), [100,500), [500,1000), [1000,5000], (5000,infinity), without midpoint/imputation. Explicit area CLEAR removes current dependent derivations; omission/blank/zero is not CLEAR. Property-type changes do not silently remove measurements.

## 21. Geography

Province+Canton required; District optional. Parent-scoped bounded exact lookups produce official DTA identities. District refinement/removal is not automatically source identity conflict; Province/Canton change is. Approved upstream Pejibaye/Cartago/Jiménez alias handling resolves to Pejivalle. No fuzzy name authority or province-only canonical identity introduced.

## 22. Money and history

Sale current_price and Rent monthly_price in original CRC/USD remain authority, including positive Sale amounts below/equal to1. price_millions remains compatibility only. New token Sale input explicitly denominated in CRC millions is scaled exactly, not inferred from legacy rows. Canonical monetary mutation/history remains with existing machinery; no FX-derived value becomes original price. Currency changes carry a whole monetary observation.

## 23. Lifecycle/history preservation

Current lifecycle state is distinct from immutable history. Canonical operations append through established machinery and replay without rewriting later state. Draft retention after media failure is not physical-delete compensation. CSV/token publication guards introduce no independent lifecycle model.

## 24. Capacity coordination

Durable publisher_accounts remain serialization identity. Canonical publication delegates to established capacity checks; null allowance remains distinct from zero, and over-capacity downgrade does not auto-deactivate listings. Storage preflight remains the existing limit mechanism, not a new atomic cross-system reservation system.

## 25. Source identity/conflicts

Namespace plus source listing identity and genuine observation identity/time are preserved. Raw/review evidence is not source-authority invention. Transaction/Province/Canton conflicts remain under canonical machinery; no physical-property deduplication or historical reconciliation introduced. Source references remain references, not customer-owned media.

## 26. Revision/idempotency

Canonical requests retain expected revision and receipt semantics. Duplicate/token/private edit snapshots bind replay to original operations. Old successful replay does not undo later edits, content or lifecycle changes. Media-only changes do not manufacture domain revisions. Browser retry persistence differs by workflow as recorded; the report does not claim universal crash/remount recovery.

## 27. Concurrency results

Recorded independent-session cases: duplicate4; classified edit3; measurement CLEAR3; token3; CSV evidence/reference3; ordinary upload3; image detach/reorder3 concurrency/interleaving cases. Affected edit concurrency was rerun after CLEAR, not counted as a new distinct suite. Permanent-delete fake-client interleavings are not PostgreSQL races. Bounded passed cases reported no observed deadlock/timeouts; no exhaustive concurrency proof is claimed.

## 28. Server-only boundary

Repeated focused import-graph checks passed. Most recent recorded result:186 client roots,272 visited modules,zero failures; one edit-stage graph had273 visited modules. Canonical server helpers are not imported by browser flows. Later recorded graph checks exist after token work; token's own checkpoint did not claim a newly run graph. No new graph run for this report.

## 29. EN/ES

Shared language-aware forms and operation controls use identical canonical semantics. Explicit CLEAR, duplicate availability/incomplete status and media retry controls were covered by recorded source/offline checks. Spanish rental edit navigation was corrected to the existing route. No rendered end-to-end bilingual browser validation is claimed.

## 30. TypeScript

Repeated recorded --noEmit --incremental false checks passed, including the latest public-evidence increment. Targeted whitespace checks passed in recorded increments. No compiler/linter/test executed for consolidation.

## 31. Verification ledger — previously obtained results

Counts are per recorded suite, not a fabricated stage-wide assertion total. Intermediate superseded counts and repeated regressions are not added.

| Suite | Recorded final result |
|---|---|
| Permanent-delete |39 offline assertions, including fake-client interleavings |
| Import-operator |41 SQL assertions |
| Source observation propagation |16 offline checks |
| CSV initial publication |38 SQL assertions, replacing earlier36 |
| Customer duration |22 SQL assertions |
| Publication/renewal callers |40 offline assertions |
| Duplicate |32 SQL +37 offline +4 concurrency |
| Legacy Duplicate UI |11 checks |
| Road-distance adapter |39 offline |
| Customer edit/classification/content |29 SQL +37 offline +3 concurrency |
| Measurement CLEAR |25 SQL +37 offline +3 concurrency; affected edit suites also passed |
| Lifecycle caller |21 offline +7 SQL |
| Token creation/media/publication |30 SQL +22 offline +3 concurrency; scratch harness not preserved |
| Normalizer provenance |20 offline |
| CSV retention/references/integration |24 SQL retention +11 SQL references +25 offline +3 concurrency |
| Obsolete utilities |6 offline |
| Ontology retirement/read preservation |6 offline |
| Ordinary upload retention predecessor |20 offline; superseded attachment interface, not current regression proof |
| Ordinary upload operation |15 SQL +15 offline scenarios +3 concurrency |
| Image detach/reorder |13 SQL +9 offline +3 concurrency/interleaving |
| Media caller containment |4 checks |
| Abandoned-token cleanup |7 SQL |
| Commercial resolver |Existing fixture passed;46 SQL statements,6 inserts/deletes; isolation passed |
| Activation |Actual local approval/activation and duplicate rejection passed;4 RPC invocations per successful run; isolation/capacity checks passed |
| Provider |SINPE15 and bank-transfer15 supported assertions passed; isolation passed |
| Commercial timeline |Existing content/order/ownership/relationship checks passed;47 statements,9 inserts/deletes |
| Public promotion evidence |Existing threshold/privacy/evidence-shape checks passed;85 statements,70 inserts/deletes |

SQL used disposable local fixtures. Several later fixtures were minimal/signature-compatible rather than the full canonical stack. Offline storage/auth/database calls were mocked where specified. No production/PostgREST/RLS/full-browser/live-Storage validation is inferred. Token results survive in session evidence despite lost scratch artifacts. No tests rerun for this report.

## 32. Closed-artifact integrity and regression evidence

Initial recorded baseline:5,314 files, with five existing files changed at the first increment and5,309 unchanged. Later duplicate and customer-edit checkpoints report SHA-256 comparisons confirming closed migrations003–009 unchanged. These are historical comparisons, not final worktree-wide proof. The record contains no final complete hash manifest/before-after values for all S1–S6 artifacts. Exact final hashes are NOT RECOVERABLE FROM THE EXISTING CUMULATIVE RECORD. Targeted interface regressions are listed above; closed suites were not automatically rerun.

## 33. Repository-diff result

Recorded increments preserve unrelated dirty work and confine described changes to S7. No final exhaustive pre-S7-to-final diff attestation is available in this record. No fresh status, diff or hash inspection was conducted for consolidation. This report-only edit is the sole action of the consolidation task.

## 34. Corrections during S7

Recorded corrections include: CSV initial-publication revision1 restriction replaced by receipt-bound successful revision; SQL CASE parentheses; negative-value expected SQLSTATE corrected to established22023; concurrency empty-output handling; ES-target bigint syntax; storage-size/nullability checks; Spanish rental route; source_paths SQL ambiguity; rejection of raw non-string CSV evidence; harness syntax/source-assertion fixes; awaited activation export wiring; safely quoted identifier validator accepting sender_account_last4. Unsupported automatic provider submission-event assertion was removed by explicit authorization, with no replacement event or production event-writer change. Superseded scratch prototypes were not represented as final implementations.

## 35. Unresolved defects and evidence limitations

No specific unresolved operational canonical writer/bypass is identified in the latest recorded disposition. No new architectural decision is pending. The record does not establish full-stage completion solely from that absence.

Outstanding evidence reservations include final closure/integrity attestation; early CSV-publication concurrency/remaining adversarial cases and full legacy-success/concurrency coverage were marked pending and are not explicitly all discharged later. Later CSV reference concurrency must not be relabeled as proof of every earlier publication scenario. Final reporting does not run or invent these checks.

Known implementation limits: retained uncertain/temp files can consume storage; lost initial ordinary-upload response before operation ID is not automatically recoverable; media cleanup retry handles may be component-local; publication operation identity is not promised across remount; storage allowances are preflight rather than globally atomic; token scratch test artifacts were lost. These limits do not by themselves prove a protected-state bypass and were not redesigned here.

## 36. Architectural contradictions

No unresolved contradiction is identified in the latest record. All explicit decisions remain frozen: geography minimum, money authority, Model C/rule reuse/unclassified evidence, explicit CLEAR, independent managed duplicate media, retain-draft retry, customer duration, operator trust, source-supported CSV evidence, receipt-linked publication and separate storage cleanup. Synthetic test events/DML confer no production authority.

## 37. Later-stage obligations and S8 prerequisites

S8 was not started and is not authorized by this report. Before progression, obtain a supported S7 closure determination from the existing evidence and any separately authorized remaining requirements; this report does not silently waive them. Later stages own legacy reconciliation and eventual retirement of class-B paths, controlled deployment/catalog compatibility checks, and S11 coordinated broad-DML/TRUNCATE privilege closure. No legacy backfill, canonical promotion, production role grants or real import-operator grants were performed here.

Test-infrastructure debt is separate: manually configured D utilities and persistent synthetic history are not a requirement to rebuild every harness before S7 can close. Ordinary activity notification parity is also distinct from canonical history authority. No production-only submission-event trigger is assumed or invented.

## 38. May S7 be CLOSED?

**Not certified by this report.** Operational adaptations are recorded as completed, and no named unresolved operational writer remains in the latest checkpoint. Nevertheless the cumulative evidence explicitly stops short of final verification/closure attestation and retains the limitations above. A COMPLETE verdict would exceed the supplied record. This is not a newly manufactured architectural blocker and does not authorize new work. The report consolidation itself is complete.

## 39. Production connection

S7 record reports no production connection/query. Consolidation accessed only this local report. No live verification was performed or implied.

## 40. Deployment

No deployment recorded or performed. Locally verified migrations are not represented as deployed.

## 41. Stage/commit/push

No staging, commit or push recorded or performed. Unrelated work was not modified by consolidation.

## 42. S8 status

**S8 NOT STARTED.** No implementation, tests, migration changes, cleanup or exploration performed for this reporting task.

**CG-3B2B2-S7 PARTIAL — FINAL VERIFICATION INCOMPLETE**

---


## Bounded final S7 verification — current determination

**CG-3B2B2-S7 PARTIAL — FINAL VERIFICATION INCOMPLETE**

Performed only the authorized integrity/evidence checks. No new writer inventory, Class-D investigation, implementation, test execution, database startup, production access, deployment, staging, commit or push. Existing accepted verification remains evidence; no assertion totals increased.

### A. Implementation defects

None established by this bounded pass. Missing attestation is not a defect. The previously established operational writer dispositions remain unchanged. No architectural/product decision was introduced.

### B. Verification results and remaining coverage

No executable verification failed: no tests were run in this pass. Read the existing csv-initial-publication.sql and customer-publication-callers.cjs solely to connect the recorded reservations to actual test coverage.

The preserved CSV suite covers coherent receipt-linked creation, initial publication/deadline, sequential replay, no extra source observations, generic-import rejection, missing eligibility/source/time, failed-publication draft preservation, role grants and publication after a genuine correction. It does not run independent concurrent sessions. Existing later CSV evidence/reference concurrency establishes retention/reference convergence, not simultaneous initial-publication behavior. Surviving /private/tmp/s7-csv-lab/evidence.log and references.log confirm24 and11 assertions respectively, consistent with the report, not additional publication coverage. Its reference-fixture.sql is a minimal signature-compatible schema with a stub lock_capacity_policy, not a recovered full canonical publication fixture.

The preserved customer-publication-callers.cjs validates canonical delegation and failures; its fake direct-update method intentionally throws and its legacy coverage is a predicate-presence assertion. Thus it does not discharge the recorded full legacy publish/renew success/concurrency reservation. Previously accepted lifecycle and permanent-delete checks retain their narrower scope and are not relabeled as those missing cases.

Still unverified from available evidence:
- independent-session CSV initial-publication concurrency through the actual canonical boundary;
- remaining adversarial CSV eligibility/state scenarios beyond the preserved suite (the original reservation does not enumerate a complete additional case list; none invented here);
- actual legacy publish/renew success and relevant race behavior beyond existing structural discriminator assertions.

No narrow ready-to-run full publication fixture was recovered from the inspected surviving evidence. Reconstructing the canonical stack and adding missing cases would consume the limited remaining allocation; this pass stops rather than substitute the minimal reference fixture for actual publication authority or claim coverage it cannot provide.

### C. Historical integrity evidence unavailable

The S6 report identifies /private/tmp/cg-s6-before.json; it is absent. The narrowly checked candidate /private/tmp/cg-s7-before.json and previously referenced /private/tmp/cg-s7-work are also absent. The S7 report retains historical comparison results but not a final recoverable pre-S7 manifest/hash set. This is a bounded recovery result, not a claim that no backup exists anywhere.

Git status shows closed migrations003–009 and numerous closed verification artifacts are untracked. HEAD (507fa49, Repair PPM2 and shared population retrieval) predates those uncommitted canonical stages; it is not a substitute pre-S7 baseline. Consequently current content cannot be compared to authoritative closed-stage bytes using this available Git history alone. Fresh current hashes would not recover the missing historical proof, so they were not represented as such.

Repository status lists67 tracked modified paths. A name-only comparison to the consolidated report identified42 explicitly named paths plus app/components/CsvListingsGrid.tsx, which the report named by component only:43 correspond to recorded S7 modifications. The other24 are earlier PPM2/reader/commercial files outside that named S7 list. They are NOT classified as accidental S7 modifications. Without the pre-S7 dirty-worktree manifest, attribution and byte preservation cannot be established merely from a HEAD diff. Untracked prior-stage and S7 additions similarly cannot be given a newly verified historical baseline from status alone.

Still missing: authoritative recoverable baseline content/hashes for closed artifacts and pre-existing dirty files, or equivalent reliable historical evidence, sufficient for a final closed-artifact and unrelated-work preservation comparison. Prior recorded comparisons remain valid historical attestations, not final comparison results. No historical evidence was reconstructed.

### D. Later-stage obligations

S11 coordinated broad-DML/TRUNCATE privilege closure and retirement of temporary legacy compatibility remain later-stage obligations, not new S7 defects. S8–S10 reconciliation and controlled production/catalog validation remain outside this pass. No additional later-stage requirements were invented. S8 NOT STARTED.

### E. Class-D infrastructure debt

No standalone promotion/comparable verification utility was investigated, converted, repaired or executed. Its ordinary-credential/persistent-fixture debt is not a reason for this verdict. Already-completed disposable conversions were not reopened.

### Final outcome

The bounded pass clarifies why the existing ledger does not discharge the specific recorded closure reservations. It cannot certify COMPLETE. Further historical recovery is not cheaply established, and rebuilding missing actual-boundary verification is not practical within the stated remaining-allocation constraint. Stop here without new implementation or a manufactured architectural blocker.

**CG-3B2B2-S7 PARTIAL — FINAL VERIFICATION INCOMPLETE**


# Historical cumulative record — preserved verbatim

The following is the original chronological record. Superseded blockers and partial counts are retained for provenance; the consolidated sections above state the final known disposition.

# CG-3B2B2-S7 — cumulative blocked-state report

Verdict: **CG-3B2B2-S7 BLOCKED — ARCHITECTURAL DECISION REQUIRED**

S7 is not complete and may not be closed. S8 has not started.

## Chronology

1. Initial writer inventory found the active customer permanent-delete feature. Stopped for survival classification; no code changes at that stop.
2. User authorized temporary legacy-only compatibility, canonical physical deletion prohibited, retirement at coordinated cutover. Inspected storage-first deletion and stopped for its destructive partial-failure outcome; no code changes at that stop.
3. User required a narrow consistency repair prioritizing recoverability. Implemented server-side legacy classification, conditional database-first deletion, explicit cleanup failure reporting, and shared EN/ES UI gating. Completed focused offline verification.
4. Resumed the writer inventory at customer/CSV creation. Found browser CSV publication assigning scraped/realtor provenance through the public Supabase client. Stopped before adapting that path because the authority of CSV submitters is unresolved.

## Completed permanent-delete implementation

Temporary legacy compatibility only; retire at coordinated cutover after reconciliation removes the need for this path.

The route authenticates, reads the listing including canonical_domain_version using its server client, checks ownership, then requires an explicit null discriminator. Canonical version 1, missing/undefined, unexpected versions and malformed values fail closed before storage inspection or destructive work. Existing deleted-state eligibility remains required. Client-supplied classification is ignored.

Owned file paths are collected without mutation. Database deletion is conditional on listing ID, authenticated owner, deleted state and canonical_domain_version IS NULL. Storage removal begins only after a confirmed returned deleted row. Database error, thrown/uncertain response, or zero deleted rows results in no storage removal. Conditional predicates also protect against a restore/classification change before deletion.

After confirmed deletion, storage cleanup is attempted. A cleanup error or exception produces a successful database-deletion result with storageCleanupPending and a warning; it does not claim a known removed-file count. Server logging retains listing ID, owner, bucket and attempted paths. The UI removes the deleted listing and displays a localized warning. This is not atomic cross-service deletion and is not a background cleanup system. A process interruption after database deletion can still leave recoverable orphan files. No surviving listing loses files due to a subsequent database deletion failure in this operation.

UI list loading and refresh project the existing canonical discriminator. Missing discriminator stays missing rather than becoming legacy. The shared EN/ES actionable permanent-delete control requires explicit null; server enforcement remains authoritative.

## Files modified

- app/api/permanently-delete-listing/route.ts
- app/components/ListingOperationsCenter.tsx
- app/components/MarketHubMyListings.tsx
- app/components/MarketHubMyListingsLoader.tsx
- app/utils/marketHubListing.ts

## Files created

- scripts/verification/canonical-writer-permanent-delete.cjs
- outputs/CG-3B2B2-S7-report.md (this cumulative checkpoint)

No files deleted. No migration created. No S6 implementation file was modified by this S7 increment.

## Verification of completed increment

- 39 named focused offline assertions passed, executing the actual route via TypeScript transpilation with fake authentication/database/storage dependencies and network calls forbidden.
- Tests cover canonical rejection, unchanged canonical fixture evidence/history/files, forged client classification, malformed/missing classifications, ownership/authentication/state/read failures, successful legacy deletion, database failure/exception/zero-row results, restore/classification interleavings, cleanup failure/exception diagnostics, activity failure, and shared UI gating/projection source checks.
- Interleavings are deterministic fake-client tests, not live PostgreSQL concurrency tests. Canonical preservation assertions concern the fixture and absence of mutation calls, not a live database run.
- TypeScript: tsc --noEmit --incremental false passed.
- Existing server-only import graph check: 186 client roots, 272 visited modules, zero failures.
- S7-file diff whitespace check passed.
- Baseline recorded before S7 edits: 5,314 files. Exactly five existing files changed; 5,309 original files byte-identical. All closed migrations and all existing verification artifacts unchanged. Unrelated dirty work preserved.
- A syntax typo in the draft test harness was corrected before its successful run; it was not a production-code failure.

## Writer inventory retained — incomplete, not a final classification

- Customer sale/rental creation utilities: app/utils/createListing.ts and createRentalListing.ts; direct listing insertion and assignListingOntology calls identified. Full caller survival classification pending.
- app/api/publish-listing/route.ts: active publication path identified; detailed adaptation pending.
- app/utils/updateListing.ts: edit path identified, pending.
- app/utils/manageListing.ts: lifecycle and duplicate writers identified, pending.
- app/utils/publishListing.ts, unpublishListing.ts, archiveListing.ts, deleteListing.ts: direct writer candidates identified, full reachability/classification pending.
- app/api/publish-existing-listing/route.ts and renew-listing/route.ts: publication/renewal endpoints identified, pending.
- app/api/permanently-delete-listing/route.ts: class B temporary legacy compatibility, repaired as described above.
- app/api/delete-listing-image/route.ts, reorder-listing-images/route.ts, update-listing-image/route.ts: image/listing mutations identified; S6 changes preserved, S7 adaptation pending.
- lib/assign-listing-ontology.ts: blanket membership mutation identified, pending.
- scripts/assign-ontology-to-existing-listings.ts: legacy assignment utility identified, pending.
- app/utils/publishCsvListings.ts and publishRentLeaseCsvListings.ts: active browser CSV writers traced; blocked on trusted authority/survival classification.
- scripts/scrapers/: scraper candidates identified by filenames only; no completed writer/call-graph conclusion.
- Token operations, additional ingestion/backfill/fixture writers and remaining protected-table/RPC paths: inventory incomplete.

No uninspected writer has been declared safe or closed. No final privilege cutover performed. Previously identified broad DML/TRUNCATE concerns remain for the later exact inventory and coordinated cutover.

## New blocker: CSV trust and provenance authority

Actual chain in both language families:

EN/ES sale/rental page → CsvStagingModal → CsvPublishActions or CsvPublishActionsRentLease → publishCsvListings or publishRentLeaseCsvListings → public browser Supabase client → listings insert → assignListingOntology.

The helpers set listing_origin='scraped', listing_source_type='realtor', accept source identity from input, and insert active sale/rent listings without deriving customer ownership. Rental pages have an authentication UI gate; that is not trusted-ingestion authorization.

Closed Migration 007 separates authenticated customer authority from service-role trusted creation. Its customer wrapper derives owner from auth.uid(); its trusted wrapper creates ownerless system/imported authority and is executable only by service_role. Moving browser CSV input behind a service-role route without an approved operator authorization rule would invent a trust grant. Reinterpreting these imported rows as customer-owned listings would change provenance and ownership. Retiring the UI would decide survival policy.

Smallest decision: should this browser CSV workflow survive as an authorized operator-only trusted import interface, or be retired in favor of server-only ingestion? If it survives, identify the approved existing server-verifiable operator authorization rule. No such trust policy has been selected or implemented in this run.

## Remaining S7 work / closure

Original S7 writer inventory, complete A/B/C/D classification, adapters, bypass closure, exact later privilege closure inventory, relevant domain/idempotency/concurrency verification and final 42-item completion report remain unfinished. Their results cannot be inferred from the permanent-delete tests.

Resolve CSV trust/survival policy, resume from this checkpoint, and complete the remaining S7 contract. S8 prerequisites include completed and verified S7; S8 is not authorized here.

No production connection or query. No application startup. No PostgreSQL startup/connection. No deployment. No staging, commit or push. S1–S6 closed artifacts preserved. S8 not started.

## Continuation: approved decisions and new eligibility stop

Subsequent user decisions resolved dedicated auth.uid()-based operator authority (independent of payment reviewers), immediate ownerless CSV publication for exactly 7,776,000 seconds, genuine source observation identity/time captured at observation rather than upload, and a narrow source-free initial-publication operation that must not renew or fabricate observations. Closed S4 source mutation otherwise still requires observation evidence.

Implemented in this continuation:

- Added supabase/migrations/010_import_operator_authority.sql: private grant episodes keyed to auth.users, unique active grant, durable grant/revoke times and administrative identities, postgres-controlled grant/revoke helper, auth.uid()-only boolean authorization RPC granted to authenticated. Ordinary application roles including service_role have no authority-table access or grant/revoke execution. No actual operator grants. Server CSV adapter not yet connected.
- Modified scripts/scrapers/encuentra24-sale-scraper.js and encuentra24-rent-scraper.js: generate observation UUID and timestamp immediately after successful source HTML receipt, include both in row and CSV headers. No scraping/network run occurred.
- Modified scripts/scrapers/normalizers/encuentra24-sale-normalizer.js and encuentra24-rent-normalizer.js: preserve observation_id and observed_at verbatim, including absence. No historical backfill performed.
- Added scripts/verification/import-operator-authority.sql and source-observation-propagation.cjs.

Verification: 41 SQL assertions passed in cg_s7_verification, a disposable local clone of the closed cg_s6_integrated fixture; all fixture authority grants rolled back. Includes grant/revoke/regrant, audit retention, application privileges and existing fixture payment-review independence. These do not verify the pending HTTP ingestion adapter. Migration compiled/applied only locally. Sixteen offline propagation checks passed; they execute both normalizer functions and statically check scraper capture placement/CSV fields. They do not run live scrapers or prove the pending CSV ingestion path. Permanent-delete checks were not repeated. JavaScript-only changes and SQL introduced no TypeScript implementation; prior TypeScript result remains the earlier result, not a new full-stage verification. Targeted diff whitespace check passed.

New architectural blocker: closed S4 provenance identifies generic create_trusted/imported/source-backed rows, but not the CSV-only import class. Migration 007 records operation_type=create_trusted, listing_origin=imported, source class and genuine observation. None records the ingress workflow as CSV. The narrow publication authorization explicitly requires secure server-side proof of the applicable CSV import class and forbids automatically extending 90 days to other trusted classes. No publication wrapper has been implemented using the generic marker.

Smallest proposed decision: authorize a private, server-written CSV eligibility record tied to the actual canonical creation receipt, established only by the authorized CSV creation path, so the narrow initial-publication boundary can verify it. This is proposed only; no such record/schema or policy was implemented. Generic trusted creation must not automatically establish CSV publication eligibility.

S7 remains BLOCKED — ARCHITECTURAL DECISION REQUIRED. CSV adapter, row-level rejection, initial publication and remaining writers are unfinished. No S7 completion claim. No production connection/query, deployment, stage/commit/push, reconciliation or S8.

## Continuation: receipt-linked CSV eligibility authorized and implemented

The user authorized the private eligibility record anchored to the actual CSV canonical creation receipt. Added migration 011_csv_initial_publication.sql with:

- private csv_initial_publication table, actual creation receipt FK, unique listing identity, fixed private publication request identity and successful-publication expected revision;
- service-role-only create_csv_canonical_listing wrapper composing closed trusted canonical creation with receipt-linked eligibility in one database transaction;
- rejection of adopting an existing generic trusted creation into the CSV exception;
- service-role-only initially_publish_csv_listing wrapper accepting only the creation receipt, checking eligibility/receipt/listing correspondence, ownerless canonical imported state and creation event;
- fixed 7,776,000-second lifecycle command via existing s3_command, with no source observation payload or chronology mutation;
- canonical receipt replay with persisted expected revision; no new publication after prior publication, including restored drafts; failed publication rolls back its expected-revision update.

An initial draft of this new wrapper required revision 1. Corrected it to permit a coherent unpublished draft corrected through genuine source mutation after failed publication. The successful publication expectation is persisted for replay. No closed migration changed.

Added scripts/verification/csv-initial-publication.sql. Final new migration compiled in cg_s7_publication, a fresh disposable clone of the completed S6 fixture with migrations 010 and 011 applied. Thirty-eight focused SQL assertions passed. The earlier draft's 36 passing assertions are superseded, not added to the total. Coverage includes coherent creation, actual receipt eligibility, canonical active state/deadline, unchanged observations/chronology, replay/deadline/history stability, generic creation rejection, missing metadata/eligibility, failed creation/publication, privilege checks and successful publication after a genuine monetary correction.

This is NOT complete verification of all requested CSV scenarios. Concurrency, remaining adversarial eligibility/state tests, actual HTTP operator enforcement, CSV adaptation and broader S7 work remain pending. No browser route is connected to the new wrappers yet. Migration 011 is implementation work, not approved deployment/cutover.

Next architectural decision: customer publication/renewal duration. Closed migration 007 mutate_customer_canonical_listing explicitly rejects publish/renew with 'owner publication requires future trusted duration policy'. The current customer publish/renew routes inspected earlier do not supply a canonical publication duration; the only approved numeric duration applies specifically to trusted ownerless CSV imports and explicitly does not decide customer policy. Applying that duration to customers would broaden the decision. A server-owned customer duration rule (and its package source, if package-derived) must be explicitly established before completing the original S7 customer publication/renewal adaptations.

No customer duration chosen. Prior completed permanent-delete, operator, and scraper work preserved. S7 remains BLOCKED — ARCHITECTURAL DECISION REQUIRED; CSV integration and full verification remain unfinished. No S8, production, deployment, staging, commit or push.

## Continuation: customer entitlement and application caller integration

STOP 8 resolved by explicit package_limits.publication_duration_seconds entitlement. Approved seconds: free/monthly 2,592,000; annual 7,776,000. Only known Market Explorer configured. Unknown packages remain NULL/fail closed; billing is never runtime authority. Migration 012_customer_publication_entitlement.sql was implemented in the prior continuation and passed 22 focused SQL assertions in cg_s7_customer. Its fixture-only assertion-table privilege was corrected during harness development; no production issue was involved. Harness preserved as scripts/verification/customer-publication-entitlement.sql.

The first caller edit was rejected by automatic approval review for account usage exhaustion and did not execute. User explicitly resumed that exact operation. It has now executed:

- Added lib/customer-publication-writer.ts, server-only, validating stable request identity/lossless expected revision and calling publish_customer_canonical_listing with the verified customer JWT client. No client duration/package/owner forwarded.
- Modified app/api/publish-existing-listing/route.ts and app/api/renew-listing/route.ts. Auth and ownership checks precede authority branching. Canonical rows reach the canonical boundary before legacy state shortcuts, permitting receipt replay. Missing/unknown discriminators fail closed. Explicit legacy rows retain prior behavior; final legacy update also requires canonical_domain_version IS NULL.
- Modified app/components/MarketHubMyListingsLoader.tsx, app/utils/marketHubListing.ts, app/components/MarketHubMyListings.tsx and app/components/ListingOperationsCenter.tsx to carry canonical_revision as text and keep a stable publication/renewal request UUID for the same listing/revision/action within the mounted workspace. Shared EN/ES handlers use identical semantics. Page-remount persistence is not claimed; stale expected revisions remain protected by the core.
- Added scripts/verification/customer-publication-callers.cjs: 40 offline assertions passed against actual route/helper code with mocked database/auth, forbidden network. Tests prove one canonical RPC per invocation, fixed event, no injected commercial authority, no legacy DML/package lookup on canonical paths, replay routing, invalid classification/auth/revision rejection and canonical RPC failure reporting. Legacy predicate presence is checked structurally; full legacy success/concurrency testing remains part of unfinished final S7 verification.
- TypeScript --noEmit --incremental false passed after replacing a BigInt literal with BigInt(string) for the existing ES2017 target.
- Server-only graph: 186 client roots, 272 modules, zero failures. Targeted diff whitespace check passed.

Customer caller integration is implemented with focused verification; full S7 verification/concurrency, CSV integration and remaining writers are not complete. No closed migration was edited. No production, deployment, stage/commit/push or S8. Disposable PostgreSQL remains stopped from the previous checkpoint; this continuation did not start it.

## Next inventory decision: duplicate-listing media semantics

Tracing the original S7 duplicate writer found app/utils/manageListing.ts duplicateListing copies sourceListing.images directly to the new draft. Storage paths are listing-owned (user ID / listing ID / filename); image upload routes enforce that layout. The temporary legacy permanent-delete route enumerates/removes the source listing's folder after successful deletion. Therefore existing reference-copy duplication can leave a surviving duplicate pointing to files removed with the original. This is a static execution-path finding, not a live destructive test.

Frozen duplicate rules establish a new listing identity and prohibit history/source-identity copying but do not settle whether duplicate media should be independently owned copies or shared objects with a retention contract. Independent copies also consume storage; shared retention would require protecting references across listing deletion. No new media ownership/product policy was selected.

Smallest requested decision: authorize duplicate listings to receive independent copies of customer-owned image files under the new listing identity, subject to existing storage limits (recommended), or specify the intended shared-media retention policy. No duplicate writer/media change has been implemented.

S7 remains BLOCKED — ARCHITECTURAL DECISION REQUIRED. Preserve this checkpoint; do not rerun accepted work solely because execution resumes.


## Continuation: independent duplicate media approved; failure disposition unresolved

The user resolved duplicate ownership: independent copies of customer-owned images under the new listing ID, subject to existing storage limits; no source-owned/shared paths and no generalized shared-media retention system. This decision is frozen. No Migration 012 or publication/renewal integration work was reopened.

Targeted inspection at the preserved duplicate checkpoint found:

- app/utils/manageListing.ts duplicateListing currently inserts a draft with sourceListing.images unchanged. No duplicate repair has yet been applied.
- Closed Migration 007 s4_create_core generates the new listing UUID internally and commits canonical creation/history/receipt through create_customer_canonical_listing. Its content whitelist is title/description/whatsapp; storage copying cannot occur inside that database transaction. The adapter learns the new listing ID from creation, before copying into its permanent folder.
- app/api/publish-listing/route.ts existing creation failure handling removes copied files and physically deletes createdListingId. Reusing that rollback for a canonical duplicate would violate the frozen prohibition on ordinary physical deletion of canonical listings/history.
- app/api/update-listing-image/route.ts retains the pre-existing listing but removes the uploaded object after attachment error (and in its catch). This is an existing-listing upload workflow, not an established disposition for a newly committed duplicate whose media copy fails. It also does not establish safe destructive cleanup after an uncertain database attachment outcome.
- lib/package-usage.ts and the image route provide existing storage allowance checking. No new storage allowance or shared-media architecture was selected.

Smallest new decision required: authorize retaining the newly created canonical duplicate as an unpublished draft if image copying/attachment fails, reporting its ID and incomplete-media status, with retry targeting that same creation identity rather than creating another duplicate. Original images must remain untouched. Destructive cleanup must not remove a copied object whose attachment outcome is uncertain; retain it for recovery until non-reference is established. This is proposed failure/recovery behavior, not implemented or assumed approved. The previous CSV draft behavior is specific to that approved workflow and was not silently generalized to duplicate media.

CG-3B2B2-S7 BLOCKED — ARCHITECTURAL DECISION REQUIRED

Only this cumulative report was edited in this continuation. No duplicate implementation or new verification was performed. Existing S7 changes and unrelated dirty files were preserved. No PostgreSQL startup, production connection, application startup, deployment, stage/commit/push, or S8. Remaining original S7 writer inventory/adaptation remains pending at this checkpoint; S7 cannot be closed.


## Continuation: duplicate draft retention/retry approved; classification policy decision

The user authorized retaining the new unpublished canonical draft on media failure, returning its identity with incomplete-media status, retrying that same identity, preserving originals and uncertain copied objects, and prohibiting physical deletion compensation or a generalized transaction/media system. That failure policy is resolved and must not be reopened.

Targeted implementation design found a narrow durable duplicate manifest can bind a request to one creation result and fixed destination paths. Preparation would atomically persist creation plus manifest; retry would reuse existing copies and conditionally attach without overwriting later user edits. No further media retry policy was selected or requested. Prototypes were written only in /private/tmp/cg-s7-work/013.sql, duplicate-media.ts, and duplicate-route.ts. They are UNVERIFIED scratch drafts, NOT repository migrations/application implementation, NOT approved artifacts and NOT ready to apply. In particular the prototype creation adapter does not preserve classification-rule application and must not be promoted unchanged.

A separate canonical duplication semantic blocks safely connecting this design:

- Migration 007 s4_domains whitelists fact fields without rule_set and measurement fields as value only. Its customer creation boundary rejects caller-selected classification policy, explicitly covered by the existing S4 verification.
- Migration 007 creation machinery applies exact-fact/measurement classification only when a rule_set is supplied internally; copying raw exact evidence through the public customer contract does not restore source classification-rule membership origins.
- Existing canonical listing_membership_origins can record classification_rule_id for those source facts/measurements. Copying those memberships directly would bypass canonical derivation. Copying raw values alone would omit those derived classifications. Selecting a rule set for the duplicate is not specified by the frozen new-identity/no-history-copy rule.

Smallest new decision requested: should a canonical duplicate reapply the source listing's sealed classification rule set for each copied exact fact/measurement, through server-selected canonical machinery, rather than copy derived membership rows or silently drop their classifications? This would create fresh derived origins under the new identity, not clone history. No policy has been chosen or implemented. A different intended classification policy must be specified if source-rule reuse is not desired.

CG-3B2B2-S7 BLOCKED — ARCHITECTURAL DECISION REQUIRED

Only this cumulative report changed in the repository during this continuation. No scratch migration was applied or copied into the repository; no application caller was changed. No verification was run, because the semantic creation adapter is unresolved. Completed S7 work was not reopened. PostgreSQL remains stopped; no production/application/network activity, deployment, stage/commit/push, or S8. Duplicate integration and remaining original S7 writer adaptation remain incomplete.


## Continuation: server-selected sealed classification approved; missing source rule binding

The user authorized fresh classification through server-controlled canonical machinery using applicable existing sealed rules, with no direct copying of derived membership/origin rows and no client rule selection. Media copying is restricted to legitimately customer-owned Twuanis-managed source-listing objects; external URLs and uncertain ownership must fail closed, never be downloaded or rehosted. These decisions are frozen.

Focused inspection of the classification interfaces identified the remaining rule-selection gap:

- For a classified source dimension, listing_membership_origins.classification_rule_id joins listing_classification_rules.rule_set_id and the private classification_seals table. This provides a deterministic existing source rule binding; no new choice is needed for that case.
- Canonical exact facts and measurements can legitimately exist without any classification rule binding. Migration 006 applies classification only when rule_set is supplied. Migration 007 customer creation accepts exact facts/measurements without a rule set; its existing full-creation fixture includes such values. The fixture was read, not rerun.
- listing_classification_rule_sets permits multiple versions per domain, with uniqueness only on (domain,version). The inspected canonical machinery supplies no default/current rule selector for a source dimension without a recorded binding. Neither highest version nor any matching sealed range is authorized as a default.

Smallest decision: for a copied exact fact/measurement with NO recorded source classification-rule binding, should duplication preserve it as unclassified canonical evidence, or reject duplication until an explicit applicable rule is established? Recommendation: preserve the unclassified state; reapply only the source's deterministically recorded sealed rules. Do not pick a latest rule or invent a default. This recommendation is not implemented or assumed authorized.

CG-3B2B2-S7 BLOCKED — ARCHITECTURAL DECISION REQUIRED

Stopped under the user's explicit instruction to stop if the applicable sealed rule cannot be deterministically identified. Only this report changed. No application/migration edits, scratch promotion, verification, PostgreSQL startup, production/network access, deployment, stage/commit/push, or S8. Prior scratch prototypes remain unverified and must not be applied. Resume at the missing-rule-binding decision; do not repeat completed inspections.


## Continuation: canonical duplicate implementation and verified media recovery

The user resolved the missing-rule case: copy valid canonical facts/measurements, reapply only the source's recorded applicable sealed rules through server-controlled machinery, and leave otherwise valid evidence unclassified. No default rule is selected. Independent customer-owned media, retained draft on copy/attachment failure, same-identity retry, no destructive compensation, and exclusion of external scraper/source images remain frozen.

Implemented repository files (these supersede the earlier unverified scratch prototypes):

Created:
- supabase/migrations/013_customer_duplicate.sql
- lib/duplicate-listing-media.ts
- app/api/duplicate-listing/route.ts
- scripts/verification/customer-duplicate.sql
- scripts/verification/customer-duplicate-media.cjs
- scripts/verification/customer-duplicate-concurrency.py

Modified:
- app/utils/manageListing.ts: duplicateListing now calls authenticated server boundary; persistent per-owner/source localStorage operation identity survives failed/uncertain/incomplete responses. No browser direct listing insertion or copying of source image references remains in this helper. A confirmed complete result clears that attempt, allowing a later deliberate duplicate.
- app/components/MarketHubMyListings.tsx: shared EN/ES duplicate handling adds the new draft to the workspace, reports its ID and incomplete-media warning, and keeps the original operation available for retry. Retry instructions explicitly target Duplicate on the original listing to finish the same draft.
- this cumulative report.

No files deleted. No closed migrations modified. Prior S7 caller work and unrelated dirty changes preserved.

### Canonical evidence and fresh identity

Migration 013 introduces only a private duplicate command/manifest record keyed by authenticated owner and request. The server reads a locked owned canonical source. It builds permitted canonical input from official geographic identities, semantic selections, exact/category/range fact evidence, exact measurements and original-denomination canonical money. It calls existing s4_create_core with fresh private creation identity; it does not clone source receipts/history/provenance. The new listing is a draft with its own creation receipt/event and, when money is present, its own initial monetary observation. price_millions is not copied or used as authority; the source remains unchanged.

Recorded classification origins are consulted only to identify the same sealed typed rule set. No source membership/origin rows are inserted into the duplicate. Existing s3_command rederives those classifications against the copied exact evidence, creating fresh origins and a fresh operation receipt/revision in the same preparation transaction. Valid evidence without a recorded rule remains unclassified. Ambiguous/incoherent recorded rules fail closed. No client classification-rule input is accepted. Sealed rules are unchanged.

The preparation transaction persists the new identity, receipt and fixed media destinations atomically. A repeat owner/request returns the same manifest/identity, without rereading and changing the input snapshot or creating another duplicate. Publisher-before-operation-before-listing locking follows the existing canonical boundary. Same-request/different-source conflicts reject.

### Independent media and failure handling

The source must have customer provenance, authenticated ownership, no source appearance identity, and canonical eligibility. Source media must be bounded (at most 25) own-listing managed JPEG storage paths; URLs, other listing folders, traversal/unknown paths and uncertain provenance fail closed before creation/copy. This adapter never downloads external image URLs or scans scraped inventory.

The server uses existing package storage usage/limits before each new copy. Fixed, privately persisted new-listing destination paths let retries reuse successfully copied objects; uncertain object lookup does not count as absence. There is no overwrite, storage removal or listing deletion in this flow. Copy/attachment errors or thrown/uncertain outcomes after confirmed preparation return the same draft ID with mediaStatus=incomplete. The browser retains the request identity for retry. A lost preparation response is recovered by retrying that identity.

Attachment uses a service-role-only narrow RPC, locks the new listing and manifest, validates canonical owned draft state and refuses to overwrite user-changed images. It writes only new-owned destination paths and marks completion atomically. Completed attachment replays. A pending duplicate cannot be published until media completion is confirmed; no change to Migration 012 or duration policy. Existing storage usage checks remain preflight checks, not a new atomic cross-system storage reservation mechanism; races with unrelated uploads retain that existing limitation. No live Storage behavior was exercised.

### Verification actually completed

- Final Migration 013 compiled/applied in fresh disposable cg_s7_duplicate_final, cloned from the existing completed cg_s7_customer fixture. No S1–S6 baseline suites were rerun.
- 32 focused SQL assertions passed (superseding the earlier 31): fresh canonical identity/evidence; recorded classification reuse; unclassified exact fact/measurement preservation; positive Sale below 1; fresh lifecycle/monetary events; no source history/identity clone; unchanged source; same-request identity; no receipt multiplication; new-owned destinations; pending-publication rejection; attachment replay; manual-media conflict preservation; external/foreign-folder/provenance rejection; authority/grant restrictions.
- 37 offline assertions passed (superseding the earlier 33): actual server helper/route and browser helper with fake clients and network forbidden, copy errors and lost responses, attachment errors and lost responses, same-identity completion, no recopy of retained successful objects, unknown storage state/size source failures, allowance rejection, foreign ownership, auth/ID checks, no client rule/media/owner authority, persistent browser retry request across lost response/incomplete result, clearing only after completion.
- Four independent-session PostgreSQL concurrency cases passed: simultaneous same-request preparation produces one identity; distinct requests produce distinct drafts; simultaneous attachment replays without additional canonical receipts; source monetary mutation versus duplication yields a coherent serialized snapshot. No deadlocks/timeouts observed in these bounded cases; not a claim of exhaustive race testing.
- TypeScript --noEmit --incremental false passed. During development it caught possibly absent Storage size metadata; the implementation now explicitly checks numeric, safe, nonnegative size before allowance calculation.
- Server-only import graph passed: 186 client roots, 272 visited modules, zero failures.
- Targeted diff whitespace check passed.
- SHA-256 comparison against the preserved pre-S7 baseline confirmed migrations 003–009 unchanged. Migrations 010–012 were not edited in this continuation.
- Disposable PostgreSQL was stopped after testing. No production connections, live storage requests, application startup, deployment, staging, commit, push or S8.

### Resumed remaining writer inventory: legacy-source duplication decision

Continuing past the canonical duplicate work found that ListingOperationsCenter.canDuplicate is based on lifecycle actions only, not canonical eligibility. Thus the existing product offers duplication for legacy source rows as well. Such rows do not establish the canonical facts/selections/geographic identities required by the new boundary. The original duplicate helper copied legacy display fields directly. The new canonical adapter fails closed for noncanonical sources; this is an implementation safety guard, not an approved final decision to retire legacy-source duplication.

The original S7 contract requires canonical creation for duplicates and forbids inventing legacy reconciliation/backfill rules. The newly approved copying rules concern canonical source evidence. Silently treating legacy display values/memberships as canonical evidence would select a new authority/conversion policy. Leaving legacy duplication unavailable until reconciliation or replacing it with a customer-confirmed canonical creation flow is a product choice.

Smallest required decision: may duplication from legacy source rows remain explicitly unavailable until those source rows are reconciled in the later authorized stage? Recommended narrow choice: yes; keep the canonical duplicate path and clearly gate legacy-source Duplicate in EN/ES. Alternative requires a separately specified customer-confirmed canonical creation flow; do not infer legacy facts or silently canonicalize source rows. No final UI restriction/retirement policy was implemented without that decision.

Additional bounded inventory progress: createListing.ts/createRentalListing.ts exports had no matching application callers in the scoped application search; they remain retirement candidates, not yet declared fully unreachable/closed. updateListing.ts still directly writes submitted fields and remains unfinished. No broad automatic audit or settled investigation repeated.

CG-3B2B2-S7 BLOCKED — ARCHITECTURAL DECISION REQUIRED

Canonical duplicate work above is implemented with focused verification. S7 as a whole is NOT complete: legacy-source duplicate disposition, remaining writer inventory/adaptations (including customer edit/lifecycle/token creation, CSV integration, ontology bypasses) and full S7 verification remain outstanding. Do not close S7. Resume at this precise legacy-source duplicate product decision, preserving all newly implemented files and passed evidence. S8 NOT STARTED.


## Continuation: legacy Duplicate containment implemented

User authorized legacy-source duplication to remain unavailable until later S8–S10 reconciliation. Missing/invalid classification fails closed. This is now implemented in the shared EN/ES ListingOperationsCenter: canDuplicate requires currentListing.canonicalDomainVersion === 1 AND the existing lifecycle action eligibility. Both the rendered button and click handler already consume canDuplicate, so legacy/unknown classifications have no actionable Duplicate control. No inference, promotion or reconciliation occurs. Migration 013 server enforcement remains unchanged and authoritative.

Modified app/components/ListingOperationsCenter.tsx; added scripts/verification/customer-duplicate-ui.cjs. Eleven focused assertions passed, evaluating the actual parsed component predicate for numeric canonical 1, null, missing, string 1, 0, 2, object and boolean discriminators, checking lifecycle exclusion and both handler/render guards. TypeScript --noEmit --incremental false passed. The accepted 32 SQL / 37 offline / 4 concurrency duplicate checks and server-only checks were not rerun; those implementations were unchanged. PostgreSQL was not started.

## Remaining inventory resumed: customer-edit distance-range authority

The active SaleListingEditForm and RentalListingEditForm submit through app/utils/updateListing.ts, which still directly updates listing fields. The accessibility controls use data/property-data.ts pavedRoadDistanceRangeOptions and submit the distance_to_paved_road_range string for unpaved-road input. Those options are under_100m (<100 m), 100_500m (100–500 m), 500_1000m (500–1,000 m), 1_5km (1–5 km), and over_5km (>5 km).

Canonical fact evidence for distance_to_paved_road requires exact evidence or a range with explicit lower/upper inclusivity; it cannot use the category form. The middle option labels do not specify endpoint inclusion. A targeted search for these option identifiers in the relevant lib/data/app-utils/verification code found their definitions only, not an authoritative conversion mapping. Consequently conversion to canonical range facts would select new evidence semantics at 500 m and 1,000 m (and must also preserve the explicit >5 km endpoint). No mapping or edit-adapter code was implemented on an assumption.

Smallest new semantic decision: authorize the following meter intervals for NEW customer input conversion: under_100m = [0,100); 100_500m = [100,500); 500_1000m = [500,1000); 1_5km = [1000,5000]; over_5km = (5000,+infinity). This recommendation produces no gaps/overlap and preserves the strict outer labels, but remains a proposed contract, not an implemented choice. It does not authorize retroactive conversion/reconciliation of legacy evidence. If overlapping inclusive middle intervals are intended instead, specify that explicitly.

CG-3B2B2-S7 BLOCKED — ARCHITECTURAL DECISION REQUIRED

S7 remains incomplete. Resume at the customer-input distance-range boundary decision. Prior duplicate implementation and verification remain preserved; do not reconstruct or repeat them. No production/network requests, application startup, PostgreSQL startup, deployment, stage/commit/push, or S8 occurred in this continuation. Repository changes this turn are only the UI gate, its focused verification script and this report.


## Continuation: approved road-distance range adapter implemented

The user authorized meter intervals [0,100), [100,500), [500,1000), [1000,5000], (5000,+infinity) exclusively for new canonical customer selections. Range evidence must never be imputed into exact measurement. Legacy reconciliation is not authorized. This contract is resolved and must not be reopened.

Created lib/canonical-customer-road-distance.ts, server-only. customerRoadDistanceRange accepts only the five explicit option identifiers and returns kind=range with decimal-string endpoints and explicit inclusivity. No midpoint, representative value, exact-value property, category authority, default or legacy parsing exists. applyCustomerRoadDistanceEdit authenticates the customer, checks server-read owned canonical eligibility, validates request identity/lossless revision, and sends only the selected distance range to the established mutate_customer_canonical_listing boundary. An omitted selection performs no mutation, preserving existing exact or range evidence. Legacy, unknown classification, ownership/read failures and invalid options fail closed. Canonical errors propagate; request/revision remain caller-stable for retry.

Created scripts/verification/customer-road-distance.cjs. Thirty-nine focused offline assertions passed using the actual adapter with fake clients/network forbidden: unique interval coverage at all required endpoints and representative adjacent values; range-only payloads; invalid/legacy/prototype-key rejection; auth/classification rejection; no change when input is omitted; established canonical RPC and exact payload; request/revision forwarding; failure propagation. TypeScript --noEmit --incremental false passed. No PostgreSQL or prior duplicate verification rerun. No live integration is claimed.

IMPORTANT implementation state: this narrow adapter is NOT yet connected to SaleListingEditForm/RentalListingEditForm or the general updateListing coordinator. The complete customer-edit adapter remains unfinished; the tests verify this module, not an end-to-end edit flow. Existing Duplicate containment and its 11 checks, and earlier 32 SQL / 37 offline / 4 concurrency duplicate verification, remain preserved unchanged.

## Customer-edit classification decision

Continuing customer-edit integration exposed the same boundary under a different operation: editing an existing exact fact/measurement rather than duplicating unchanged evidence. Migration 007 s4_domains strips/rejects rule_set from customer fact/measurement payloads. Migration 006 starts ruleid/ids empty and only derives classification when a rule_set is supplied; mutation of a previously classified exact value without that server-selected rule removes its classified membership origins. The legacy full-form edit submits those fields even when another field was changed, so direct forwarding is not safe. Unchanged domains must be omitted regardless of the decision.

The frozen approval expressly establishes source-rule reuse for canonical DUPLICATION. It has not explicitly selected the applicable classification policy when a customer CHANGES an existing classified exact fact/measurement, potentially crossing a band. Reusing its recorded sealed rule set, clearing derived classification, or selecting another version have different analytical effects. No client-selected rule or invented latest/default version will be introduced.

Smallest new decision requested: authorize existing-listing customer edits to reapply that listing's previously recorded sealed rule SET to the new exact value through server-controlled machinery, deriving fresh/current memberships for the appropriate band; evidence without a recorded rule stays unclassified. This is the recommended preservation of existing classification policy, not permission to reuse an old band's membership or alter sealed rules. If the recorded set cannot classify the new value, the existing canonical validation fails closed. No changed-value classification policy was implemented on assumption.

CG-3B2B2-S7 BLOCKED — ARCHITECTURAL DECISION REQUIRED

Only the two new road-distance files and this cumulative report changed in this continuation. No application form or closed migration was edited; no production/network request, application startup, PostgreSQL startup, deployment, stage/commit/push, or S8. S7 remains incomplete. Resume with the new range module/tests intact at the existing-listing edit classification policy decision; do not repeat settled interval or duplicate work.


## Continuation: customer-edit classification and range/form integration

The user authorized changed exact facts/measurements to retain the listing's recorded sealed RULE SET, recomputing the result for the new value; previously unclassified evidence stays unclassified. No caller rule selection, default version, rule modification, legacy promotion or reconciliation is permitted. That decision is resolved.

### New implementation

Created:
- supabase/migrations/014_customer_edit_classification.sql
- supabase/migrations/015_customer_edit_content.sql
- lib/canonical-customer-edit.ts
- app/utils/canonicalCustomerEdit.ts
- app/api/edit-canonical-listing/route.ts
- scripts/verification/customer-edit-classification.sql
- scripts/verification/customer-edit-integration.cjs
- scripts/verification/customer-edit-concurrency.py

Modified:
- app/components/SaleListingEditForm.tsx
- app/components/RentalListingEditForm.tsx
- app/utils/updateListing.ts
- app/en/sell/edit/[id]/page.tsx
- app/en/rent-out-lease-out/edit/[id]/page.tsx
- app/es/vender/editar/[id]/page.tsx
- app/es/publicar-alquiler-arrendamiento/editar/[id]/page.tsx
- app/components/ListingOperationsCenter.tsx (Spanish rental edit link only; Duplicate gating unchanged)
- this report.

No files deleted. Migrations 003–013 were not edited. The previously verified road-distance adapter itself was not changed.

Migration 014 replaces the existing public customer mutation wrapper through a NEW migration, retaining its signature/auth-derived authority and existing S3 mutation machinery. It normalizes/rejects client authority fields first, reads the recorded rule set under publisher/operation/listing locks, and injects only that server-selected sealed typed rule into changed exact evidence. S3 recomputes the appropriate band and replaces obsolete derived membership/origins. No recorded rule means no injected rule. Private customer_domain_edits snapshots preserve normalized input and the server-derived command for deterministic receipt replay after later edits. Conflicting request reuse rejects. Existing receipts predating this snapshot table retain their original replay semantics. Failed mutations roll back snapshot creation.

Established exact road-distance evidence cannot be replaced with range evidence by a new range selection. Unchanged exact/range evidence is omitted from form patches. Old successful receipts can replay without undoing later exact evidence. No midpoint/imputation is performed.

Migration 015 composes bounded title/description/WhatsApp edits with the existing customer domain mutation in one transaction. Its private request record binds content to the request and prevents replay from rewriting later content. It writes no protected domain fields directly. Domain revision behavior remains owned by S3; ordinary content-only edits do not manufacture a domain revision. Classification rules remain immutable and browser rule identifiers are rejected.

The server edit route verifies the customer token and owned canonical status, accepts a bounded whitelist of changed fields, and resolves explicitly selected ontology terms by exact typed level-1 name with bounded lookups; ambiguous/missing terms fail closed. Geographic lookups are exact, parent-scoped and bounded, yielding official DTA codes validated by the core. No fuzzy matching or universe acquisition. Canonical money uses original-denomination current_price/monthly_price and never price_millions. Only the established customer boundary receives domain authority.

The browser coordinator sends changed fields only, preserves full monetary/geographic input groups for stable retries, carries lossless expected revision, and persists request identity across uncertain responses. Both shared EN/ES forms use it for canonical rows. Sale canonical editing displays original currency and actual amount, including positive amounts below/equal to 1, rather than the legacy CRC-millions selector. The legacy selector remains for legacy rows. Changing accessibility alone no longer clears canonical road-distance evidence. Images remain managed through existing image operations and are not resubmitted by the canonical domain edit patch.

The legacy update helper now checks authenticated ownership, requires server-read explicit null canonical discriminator, rejects unknown/protected input fields, and rechecks owner plus canonical_domain_version IS NULL in the final update. Canonical/unknown rows cannot fall back through this helper. Legacy rows are not promoted. Existing canonical editor state loading now retrieves revision and monetary values as text. Spanish rental edit navigation points to its actual existing publicar-alquiler-arrendamiento route.

### New verification completed

- Migration 014 compiled in a fresh disposable clone cg_s7_customer_edit of the preserved duplicate fixture; Migration 015 compiled there. No production or linked Supabase access.
- Final customer-edit SQL suite: 29 assertions passed. Earlier 16/27 intermediate counts are superseded. Coverage includes changed exact facts/measures, cross-band reclassification under the same sealed rule set, removal of obsolete band membership, unclassified evidence preservation, injected-rule rejection, stale revision rejection, rollback of failed request snapshots, approved range storage, sealed-rule immutability, atomic content/domain writes, content-request conflicts, replay after subsequent edits, exact-distance preservation, and pre-snapshot receipt compatibility.
- 37 focused offline integration assertions passed against actual server translator/route/browser coordinator and legacy helper with fake clients/network forbidden. Coverage includes new range payload integration, omitted unchanged exact facts, original currency/amount, authority-field rejection, typed lossless term resolution, bounded parent-scoped geography, invalid classification/authentication, stable browser requests and complete retry input groups, both form call sites, and legacy DML guards. This is not a rendered browser end-to-end run.
- Three independent-session PostgreSQL concurrency cases passed: identical classified edit yields one receipt/revision; competing stale edits yield one winner and one 40001 rejection; old receipt replay concurrent with a new edit retains the new exact value and recomputed band. No deadlocks/timeouts observed in these cases.
- TypeScript --noEmit --incremental false passed after final integration.
- Server-only graph: 186 client roots, 273 visited modules, zero failures.
- Targeted changed-file whitespace check passed.
- Closed migration 003–009 hashes still match the preserved pre-S7 baseline. Migrations 010–013 were not edited in this continuation.
- Corrections during implementation: Migration 015 needed parentheses around its CASE bound expression; the first compile failed transactionally and the correction compiled. One negative-value fixture expected 23514 but the established decimal validator returns 22023; corrected the test expectation. The concurrency harness initially assumed every SQL command prints a result; fixed empty-output handling. The Spanish rental route path assumption was corrected to the actual existing route before final checks.
- Original range 39-check suite and accepted duplicate/legacy-Duplicate suites were not rerun. Their code/behavior was preserved; the new SQL/integration suites cover the newly affected interfaces.
- Disposable PostgreSQL was stopped after verification. No application startup, production/network/storage requests, deployment, staging, commit, push or S8.

### Remaining customer-edit measurement-removal decision

Continuing the writer behavior inventory found a concrete mismatch for removing an already-established area measurement. Both forms can submit null/blank property_area or construction_area; property-type selection also explicitly resets construction_area to null (SaleListingEditForm contains this in its property-type handlers). The existing canonical measurement mutation accepts a required positive exact value only; unlike fact evidence, it has no clear operation. The new adapter therefore fails closed for this input and the atomic edit leaves stored data intact.

A new removal policy is required before this edit case can be completed. Smallest decision: may a customer clear an established canonical property/construction-area measurement (including the existing property-type-change behavior), or must the UI retain it and prohibit clearing? If clearing is authorized, a narrow canonical clear operation would need to remove the measurement and its derived classification/origins atomically with revision/receipt handling. No zero substitution, inferred measurement, direct NULL write, silent retention contrary to submitted input, or closed-migration modification has been implemented.

CG-3B2B2-S7 BLOCKED — ARCHITECTURAL DECISION REQUIRED

The approved range and changed-value classification behavior is now integrated and verified as above. Customer editing is not wholly closed because measurement removal remains unresolved. Remaining original S7 writer work also includes lifecycle helpers, token creation/publication, CSV integration, ontology assignment/bypass closure, remaining inventory/retirement classification, ordinary activity integration review, and final proportional S7 verification. No S7 completion claim. Resume at measurement removal with all new files and evidence preserved; do not rerun settled suites. S8 NOT STARTED.

## Continuation: explicit canonical area CLEAR and lifecycle caller adaptation

The user authorized customer CLEAR for property_area and construction_area. Omission remains unchanged; a valid positive SET replaces exact evidence; only an explicit CLEAR removes current evidence and its dependent current derivations. Property-type changes must preserve measurements unless an established invariant rejects the combination. This decision is resolved; no new compatibility rule was introduced.

### Implementation completed in this continuation

Created:
- supabase/migrations/016_customer_measurement_clear.sql
- app/utils/canonicalCustomerLifecycle.ts
- scripts/verification/customer-measurement-clear.sql
- scripts/verification/customer-measurement-clear.cjs
- scripts/verification/customer-measurement-clear-concurrency.py
- scripts/verification/customer-lifecycle.cjs
- scripts/verification/customer-lifecycle.sql

Modified:
- lib/canonical-customer-edit.ts
- app/utils/canonicalCustomerEdit.ts
- app/components/SaleListingEditForm.tsx
- app/components/RentalListingEditForm.tsx
- app/utils/manageListing.ts
- scripts/verification/customer-edit-integration.cjs (affected form signature assertion)
- this cumulative report.

No files deleted. No edits to closed migrations or Migration 012/customer publication-duration integration. Prior duplication work remains intact.

Migration 016 extends the existing domain normalizer, command function and customer wrapper through new CREATE OR REPLACE definitions, retaining existing function authority/search paths/grants. Customer measurement CLEAR accepts exactly {"kind":"clear"}. The existing S3 command removes the current exact value and uses its existing origin/projection reconciliation to remove dependent current membership origins and obsolete derived memberships. Other domains and historical receipts/events remain intact. Revision, expected-revision, receipt replay, atomic composition and rollback remain under the established command. Clearing an absent measurement is a no-op. Trusted/source normalization does not acquire customer CLEAR authority. Rule injection is skipped for CLEAR; there is no invented replacement evidence or historical-rule inference on a later SET.

The browser/API distinguish UNCHANGED, SET and CLEAR explicitly. Changed positive values become {kind:'set',value}; explicit clear controls become {kind:'clear'}; omission is not sent. Blank, null, zero, malformed or authority-injected payloads cannot implicitly clear. Both shared language-aware forms include explicit clear/undo controls and a pending-clear explanation. Typing a new measurement resets pending clear. Canonical property-type handlers preserve construction_area; legacy behavior remains separate. Existing canonical validation remains authoritative. These checks do not claim a rendered browser end-to-end run.

Continuing the surviving-writer inventory, the active manageListing lifecycle helper no longer directly updates canonical listing_status. Its four callers pass explicit unpublish/archive/restore/delete events to changeCustomerListingLifecycle. It confirms authenticated ownership and numeric canonical discriminator, forwards lossless expected revision and a persisted operation UUID to mutate_customer_canonical_listing, whose server-side auth.uid and lifecycle state machine remain authoritative. Lost/uncertain responses retain the same request and original revision for retry. Explicit legacy-null rows retain their existing status update, with both ownership and discriminator checked again in the final database predicate. Unknown/malformed discriminator fails closed. Publication cannot pass through this helper; its approved duration boundary remains separate. Existing ordinary activity logging remains best-effort and is not a replacement for canonical receipts/history.

The four separate older utility files publishListing.ts/unpublishListing.ts/archiveListing.ts/deleteListing.ts have no references in the scoped app/lib import search. Their final retirement/containment remains part of the pending inventory; they were not silently declared closed or changed in this continuation.

### Verification completed

- Migration 016 compiled on fresh disposable cg_s7_measurement_clear cloned from the completed customer-edit fixture. Unix socket only, no production connection.
- 25 new measurement-clear SQL assertions passed: explicit removal, dependent derivation removal, unrelated origin preservation, history/receipt preservation, omission, replay/no-op, atomic composition, SET after CLEAR, old-clear replay after later SET, property-type measurement preservation, malformed/implicit-clear rejection, failed-input rollback, and source-authority rejection.
- 37 new offline measurement-clear checks passed against actual browser coordinator and server translator with fake clients and network forbidden; includes both dimensions, invalid payloads, unchanged omission, explicit UI clear and EN/ES controls.
- Three new independent-session clear concurrency cases passed: simultaneous identical CLEAR produces one receipt/revision; old CLEAR replay concurrent with later SET preserves the new value; competing CLEAR/SET at the same revision yields one winner and one stale-revision rejection. No observed deadlock/timeout.
- Directly affected customer-edit regressions passed on the updated fixture: 29 database assertions, 37 offline integration checks, three prior edit concurrency cases. Unaffected duplicate/range suites were not repeated.
- New lifecycle integration: 21 offline checks passed, covering all four event mappings, no canonical direct DML, lossless revision, stable lost-response retry, unknown discriminator/ownership/auth rejection, guarded legacy update and publication exclusion.
- Seven local lifecycle SQL assertions passed: archive, restore, soft delete, restore deleted identity, historical receipt replay preserving later state, unpublish, and exactly expected lifecycle event count. The active-state precondition for unpublish was fixture-only; this does not claim new package/publication testing.
- TypeScript --noEmit --incremental false passed after lifecycle integration.
- Targeted changed-file whitespace check passed. No new server-only import was introduced into the browser lifecycle helper (only a type import); the prior full server-only graph result remains preserved, not claimed rerun.
- Disposable PostgreSQL was stopped after verification.
- No production/network/storage requests, application startup, deployment, staging, commit, push or S8.

### Next precise decision: token-based creation/publication failure and retry

Continuing at the next pending writer, app/api/publish-listing/route.ts currently inserts a listing, copies temporary images into new permanent paths, attaches images, removes temporary files, and then marks listing_publish_tokens published. Its catch handler (around lines 1126–1146) removes copied permanent files and physically deletes the newly created listing; the token is released for retry. This legacy compensation cannot be carried into canonical creation, whose committed identity/history cannot be physically deleted. Token-to-listing success association is currently written only at the end. The approved retain-draft/same-ID media retry policy expressly concerned DUPLICATION; no token-creation failure policy was silently inferred from it.

Smallest required new decision: authorize token-based canonical creation to retain the SAME unpublished canonical draft if media completion fails, bind the verified token/customer operation to that same identity for retry, return the draft ID with explicit incomplete status, retain temporary source media until completion and retain uncertain copied files, and publish only after media completion under the already-approved customer package-duration/capacity boundary. Do not physically delete the canonical listing as compensation or create a second identity on retry. No generalized distributed transaction or new duration policy is proposed.

The token route was inspected but NOT adapted on an assumed failure policy. Resume here after that decision. Customer CLEAR and the active lifecycle helper work above are implemented and verified; do not restart them. Remaining S7 work includes token creation/publication, CSV integration, ontology assignment/bypass closure, older helper retirement/containment, activity integration review and final proportional S7 verification. S7 remains incomplete.

CG-3B2B2-S7 BLOCKED — ARCHITECTURAL DECISION REQUIRED

S8 NOT STARTED.

## Continuation: token canonical creation completed; CSV evidence boundary inspected

The user authorized token-based creation to retain the same canonical draft on media failure, persist the server-controlled media operation, retry the same identity and publish only after media completion through existing canonical authority. Implemented that decision. The subsequent continuation explicitly preserved token implementation and required resuming the CSV investigation; no token implementation was restarted.

### Token implementation now present

Created supabase/migrations/017_token_canonical_creation.sql and lib/token-canonical-creation.ts. Modified app/api/publish-listing/route.ts, app/components/AuthenticatedListingPublisher.tsx and app/api/upload-temporary-listing-image/route.ts. No prior migration changed.

Migration 017 adds private token_creation_commands with one token/customer/listing association, fixed managed-media source/destination pairs, attachment-completion state, server-created publication request identity and publication result. Service-only preparation locks the existing token, checks the snapshot and managed token-scoped JPEG paths, then commits canonical creation and its immutable copy plan in one transaction. A competing owner cannot claim or inspect the operation. Existing operations return the same identity without reconstructing their original input. External URLs, mismatched token paths and duplicate sources fail closed. Existing already-published legacy tokens cannot be silently enrolled as new canonical creations.

Service-only attachment uses the recorded plan, checks the owned canonical draft and refuses to overwrite different attached images. A trigger prevents publication while required token media remains incomplete. Token input/media snapshot is frozen after canonical creation. The customer publication wrapper derives auth.uid(), checks the owned operation and media completion, and calls the existing publish_customer_canonical_listing boundary. It atomically records token completion and its publication result. It introduces no new duration or lifecycle policy. Completed retries do not republish after a later lifecycle change.

The server coordinator reuses existing destination objects, copies only after a definite absence and verified source metadata, checks the existing storage allowance, and performs no external-image download or destructive compensation. Copy/attachment uncertainty returns the same draft ID and explicit incomplete status; publication uncertainty returns the same ID with media complete status. Temporary source files and uncertain destination objects are retained. Automatic temporary-file garbage collection is not introduced; retained temporary objects are a known cleanup obligation, not a claim of zero storage overhead.

The route accepts only the token, verifies the customer JWT and independently supplies owner identity. Client listing IDs and completion flags are rejected. The browser displays the returned listing ID and warning, and retries only on explicit action rather than looping automatically after failure. The temporary-upload error handler no longer removes a file whose token attachment outcome may be uncertain.

New customer input uses the existing bounded typed/geographic translator. The existing Sale form explicitly displays CRC millions; that NEW customer input is scaled exactly into original CRC current_price, without consulting legacy listing price_millions or performing FX conversion. Rent retains monthly_price/original currency. No legacy listing reconciliation occurs.

### Completed token verification — existing session evidence, not rerun

- Migration 017 compiled on the disposable cg_s7_token clone. The earlier fixture lacked listing_publish_tokens; the test added a fixture table containing the fields used by the application. This is local fixture verification, not verification of production catalog compatibility. Production was not accessed.
- 30 database assertions passed, including same-identity retry, owned fixed destinations, owner rejection, publication gating through both token and ordinary publication entry points, frozen token input, attachment idempotency, the existing 2,592,000-second customer entitlement fixture, atomic token/publication completion, old completed receipt replay after unpublish, grants/search paths, external-media rejection and failure injection. Injected token-completion failure rolled back publication/receipts while retaining the committed draft and completed media; retry published that same identity.
- 22 offline checks passed against the new coordinator/route with fake database/storage clients. Coverage includes uncertain copy, attachment and publication, destination reuse, storage limits, external/mismatched path rejection, no destructive cleanup, explicit retry UI, client authority-field rejection and exact CRC-million scaling. The token input test mocked the previously verified domain translator; it was not a complete browser integration run.
- Three independent-session PostgreSQL concurrency cases passed: concurrent prepare produced one identity/creation receipt; concurrent attachment converged; concurrent publication produced one canonical publication receipt/revision/deadline. No observed timeout/deadlock in those cases.
- TypeScript passed after correcting ES-target-incompatible bigint literal syntax and explicitly narrowing optional storage size. The final combined command exited zero after TypeScript and the 22 offline checks.
- Targeted whitespace check passed. A new full server-only graph check has not been run; the new server coordinator explicitly imports server-only, and the browser continues to call its HTTP route without importing it.
- The scratch verification scripts and disposable PostgreSQL directory used for these results were no longer present when the September 18 continuation attempted to preserve/stop them. That command made no successful repository test-file copy and did not stop a cluster: pg_ctl reported that its data directory did not exist. Do not claim repository verification scripts were preserved or a successful shutdown at this checkpoint. Results above are supported by prior tool output in this session. No reconstruction or rerun was performed merely to recover temporary artifacts.

### CSV/import continuation findings

Continued only the already-pending import path: the Sale/Rent browser publication helpers, approved 010 operator authority and 011 CSV initial-publication boundary, the source normalizers and the immediate staging components. No CSV implementation change was made.

The browser writers still insert directly and call assignListingOntology. Frozen architecture determines that authority must move to a server-verified import-operator path and canonical creation/initial-publication machinery. Migration 010 already establishes the independent auth.uid()-based operator authority; Migration 011 already establishes receipt-linked ownerless initial publication. Neither decision was reopened. Genuine observation_id/observed_at are propagated by the current normalizers; no upload/current-time fabrication is permitted. External image strings remain references: no image bytes were acquired and no customer-media ownership was inferred for them.

A distinct unresolved evidence issue appears before canonical input can safely be constructed. In scripts/scrapers/normalizers/encuentra24-sale-normalizer.js:
- normalizeBathrooms rounds raw numeric evidence upward with Math.ceil before producing a category label (1.5 becomes '2 Bathrooms').
- normalizeBedrooms/normalizeParking collapse large counts into open-ended categories; normalizeYearBuilt reduces years to decade labels.
- inferPropertyType uses title/description/URL text; inferEnvironment maps even the word 'playa' to 'Beachfront'. Other semantic fields also use heuristic inference.
- normalizeRow emits these normalized/inferred fields without retaining the corresponding raw fields or a sealed derivation-rule identity.
The Rent normalizer likewise routes raw bedroom/bathroom/year fields through these normalizers. CsvListingsGrid displays title/description/geography/price and images; the inspected bulk Publish action does not record per-field source evidence or explicit confirmation of those heuristic classifications.

Operator authorization answers WHO may import. It does not establish that a heuristic-derived label is a source-observed natural fact, an operator-confirmed canonical semantic selection, or a classification produced under an authorized sealed rule. Existing Model C forbids recovering exact observations from these labels or inventing rule versions. Conversely, treating all such labels as accepted canonical category/semantic evidence would choose a source-evidence acceptance policy not supplied by the frozen rules.

Smallest decision required: should canonical CSV ingestion require source-supported canonical evidence, keeping heuristic/rounded normalizer outputs only as unresolved noncanonical review information, and rejecting creation when a required field (for example property type) has only an unconfirmed heuristic result? This is the recommended narrow disposition. It does not authorize reconstruction of lost exact values, new classification rules, historical reconciliation, or acquisition of source images. Explicit operator confirmation as a new evidence authority would require its own authorization; it was not assumed from the existing bulk Publish button.

No competing CSV adapter or classification policy was implemented. Resume at this evidence-acceptance decision, preserving Migration 017 and all preceding S7 work. Remaining inventory still includes CSV integration, ontology assignment/bypass closure, older helper retirement/containment, activity integration review and final focused S7 verification. Do not declare S7 complete.

CG-3B2B2-S7 BLOCKED — ARCHITECTURAL DECISION REQUIRED

No production access, deployment, staging, commit or push. S8 NOT STARTED.

## Continuation: authorized CSV evidence/inference separation; durable retention decision

The user resolved the prior evidence policy: operator authorization does not make heuristic output canonical. Source-supported evidence may enter canonical ingestion only under established contracts; exact fractional bathroom evidence must not be rounded. Optional unsupported evidence stays absent. A required field supported only by inference fails closed. Raw source input must be preserved, while unresolved review information must remain distinguishable. No default classification rules, historical reconciliation or review product is authorized.

### Narrow upstream retention implemented

Modified only scripts/scrapers/normalizers/encuentra24-sale-normalizer.js and encuentra24-rent-normalizer.js, preserving the previously implemented genuine observation metadata fields. Each output row now also carries:
- source_observation_input: JSON serialization of every incoming row field without normalization, including original numeric strings, units, observation identity/time and otherwise unrecognized fields.
- unresolved_normalizer_review: a separate JSON object with status=unresolved and canonical_authority=false containing the existing transformed fact/measurement/semantic/monetary outputs.

This is preservation and explicit labeling, not certification that every incoming field is source-supported. Upstream inferred fields, if any, are not granted canonical authority merely by appearing in the snapshot. The older top-level compatibility output remains for existing consumers; the future canonical adapter must ignore it as an authority source. No current browser CSV writer was silently converted, and no claim is made that the server ingestion path is complete. The Rent normalizer's existing rounded monetary compatibility output also remains review information; its original monthly_price string is preserved in the input snapshot for correct future ingestion.

Created scripts/verification/csv-normalizer-provenance.cjs. Twenty focused offline checks passed by evaluating the actual normalizer functions with filesystem/network activity forbidden, then round-tripping the output through CSV serialization. Coverage: both Sale/Rent; all original fields unchanged; fractional bathroom counts and exact years preserved; original measurement strings/units; monetary fractions; explicit noncanonical review tagging; genuine metadata unchanged; no fabricated missing metadata; CSV JSON escaping round-trip. Targeted whitespace check passed. No application runtime, database, network or production access; no token or prior completed suite rerun. These JavaScript-only changes do not affect TypeScript or browser/server import boundaries.

### Newly exposed storage/provenance decision

Inspected only the existing canonical fact/source structures and their relevant write statements. Migration 004 already permits positive fractional bathroom exact_value; no bathroom-contract change is needed. listing_fact_evidence represents CURRENT canonical exact/category/range evidence and has a bounded evidence_reference string, not an unresolved-input store. listing_source_observations records genuine identity/time, outcome, payload_fingerprint and a bounded evidence_reference, but no raw observation or review payload. Its later addition is result_revision. source_identity_conflicts stores fixed transaction/geographic identity conflicts, not arbitrary normalization review data. The established command stores a fingerprint of its canonical input rather than retaining the raw imported CSV payload.

The new CSV columns prevent upstream loss, but do not establish durable server-side storage after ingestion or for rows rejected before canonical creation. A hash cannot reconstruct the source input. Using canonical fact rows for heuristic review would violate the resolved policy; inventing a storage target behind evidence_reference or silently enlarging immutable source-history objects would choose a new provenance/storage design.

Smallest precise decision requested: authorize ONE bounded, private, immutable CSV evidence record keyed by genuine source namespace + source listing ID + source observation ID, storing the original input and separately labeled unresolved normalizer output, with a link to the canonical source observation when one is created. This would permit retention even when required evidence is insufficient and no canonical listing is created. No moderation workflow, operator-confirmation authority, classification rules or source-image acquisition is proposed. Detailed helper structure and bounds can remain ordinary implementation choices after authorization.

No durable store or competing storage alternative was implemented. The user explicitly required stopping if existing canonical structures cannot support the necessary unresolved-review retention without a new storage/provenance decision. Stop at this decision; do not reopen the resolved source-supported-versus-heuristic policy or redo token work. CSV server adaptation, operator boundary integration, remaining writer containment and final S7 verification remain unfinished.

CG-3B2B2-S7 BLOCKED — ARCHITECTURAL DECISION REQUIRED

No deployment, production access, staging, commit or push. S8 NOT STARTED.

## Recovered completed checkpoint: CSV persistence, integration and six helper guards

This entry records work already completed before the preceding usage-limit interruption. It does not represent new implementation or repeated verification. The prior report append was rejected because of the account usage limit, leaving the cumulative report behind the worktree.

Created in that completed increment:
- supabase/migrations/018_csv_source_evidence.sql
- supabase/migrations/019_csv_source_references.sql
- lib/csv-source-ingestion.ts
- app/api/import-canonical-csv/route.ts
- app/utils/submitCanonicalCsv.ts
- scripts/verification/csv-evidence.sql
- scripts/verification/csv-source-references.sql
- scripts/verification/csv-evidence-concurrency.py
- scripts/verification/csv-ingestion.cjs
- scripts/verification/retired-listing-writers.cjs

Modified in that increment: the two publishCsvListings/publishRentLeaseCsvListings utility entry points, CsvListingsGrid, and the six separate createListing/createRentalListing/publishListing/unpublishListing/archiveListing/deleteListing utilities. No closed migration or completed token implementation changed. The attempted copy of a standalone reference-fixture SQL file was part of the rejected report-update command and did not complete; do not claim that fixture file was saved.

Migration 018 implements the approved private immutable evidence record with separate raw/review JSONB, genuine appearance/observation IDs and timestamp, bounds of 262144/65536 bytes, no required listing ID, serialized same-identity deduplication, and conflicts for changed raw/timestamp/review. Update/delete/truncate are rejected. Direct table DML is revoked, RLS enabled, and only the service-role retention RPC may insert validated evidence. The record supplies no canonical authority and no fabricated observation metadata.

The new HTTP endpoint independently verifies the authenticated user's Migration 010 import-operator authority before ingestion. It bounds streamed request bytes to 524288 and accepts one observation. Original CSV fields must remain strings to avoid lossy numeric JSON coercion. Envelope metadata must agree with the genuine observation metadata; historical CSV lacking the envelope is rejected. Retention commits BEFORE attempting canonical conversion, so rejected creation retains evidence. Both browser CSV writers now call this endpoint instead of inserting listings/assigning ontology directly. A maximum 100-row sequential browser batch keeps rejected rows and errors available for retry/review.

Canonical conversion uses source-supported raw fields, not normalized compatibility labels. Existing raw_property_type contains a title and is not accepted as an observed type. Missing a genuine required property_type retains evidence and fails creation; current scraper rows with only an inferred type therefore remain unresolved. Exact bathroom strings such as 2.5 and years remain exact; explicit m²/m2 exact measurements are accepted, while ambiguous unitless values/ranges are not imputed. Original current_price/monthly_price and CRC/USD are preserved without price_millions or FX. No default classification rules are introduced. The established typed/geographic translator remains bounded and exact; the frozen Cartago/Jiménez/Pejibaye source alias resolves upstream to Pejivalle. The existing canonical creation boundary still rejects legacy source promotion or later observations requiring controlled source mutation.

Creation delegates to Migration 011 create_csv_canonical_listing, using the retained evidence UUID as stable operation request identity while preserving genuine source observation ID/time. Migration 019 attaches retained external URL references atomically/idempotently, using a completion link on the existing CSV eligibility record; the immutable evidence is unchanged. It verifies the actual creation receipt, source appearance and unchanged ownerless draft. Reference bounds are 100 URLs of at most4096 characters. No image bytes are downloaded/copied/rehosted. A publication guard requires reference completion for this new evidence-backed path; initial publication then uses the already-approved receipt-linked 7776000-second canonical lifecycle function. Replay cannot overwrite later reference changes.

Completed verification preserved:
- 24 evidence-retention SQL assertions.
- 11 source-reference SQL assertions, including injected completion failure/rollback and replay. These used a minimal signature-compatible disposable fixture, not a rerun of the full canonical stack or a production catalog check.
- Three independent-session evidence/reference concurrency cases: identical retention converges, conflicting raw input has one winner, reference completion converges without revision changes.
- Final 25 offline CSV integration assertions. Earlier checkpoint stated24; one later passed precision-preservation assertion brought the final count to25. The existing domain translator was mocked at its boundary; no full browser end-to-end claim.
- Server-only graph:186 client roots,272 visited modules,zero failures.
- Final TypeScript and targeted whitespace checks passed.
- New corrections: offline test brace error; PL/pgSQL local images variable ambiguity fixed by source_paths; raw non-string CSV fields rejected to avoid coercion loss.
- Disposable PostgreSQL was successfully stopped after verification. No production access or old token/normalizer/duplicate/customer suites rerun.

The six obsolete direct-write utilities have reversible entry guards preserving their original bodies/signatures. Caller evidence distinguished active manageListing functions and the token publisher's local function from these separate utility exports. Initial replacement-stub approval was rejected; the narrower guards were approved after confirming callers. Six offline checks passed proving rejection before database/activity work. A void-returning always-throw helper preserves TypeScript narrowing in retained code. All that work remains completed and is not reopened here.

## Current continuation: blanket ontology maintenance disposition and approval block

Focused inspection only: package.json and exact script/helper references under app/lib/scripts. No configured script caller or active application caller was found. The direct helper references are the manual scripts/assign-ontology-to-existing-listings.ts command and the two creation utilities already unconditionally guarded before their calls. Fresh inspection confirmed both guards and their always-throw implementations; no completed helper investigation/tests were repeated.

The command is a manually invoked historical bulk-maintenance/backfill utility. It selects all active listings, with no canonical discriminator filter. assignListingOntology resolves compatibility fields, deletes all matching listings_ontology_terms rows, then inserts a rebuilt set. The code does not directly write membership-origin, semantic-selection or fact tables, but can delete/replace their protected ontology projections, including geography/derived memberships, without canonical machinery. No claim is made that current database grants necessarily permit every attempt; the application path itself has no canonical exclusion. Existing canonical machinery supersedes this rebuild for canonical listings. No legitimate surviving legacy-only maintenance dependency was found in the inspected caller boundary.

Proposed classification: C — obsolete/replaced, with reversible entry guards on the bulk command and assignListingOntology only; preserve the independent read resolver and all original code/signatures. The user's current prompt explicitly allows retirement where evidence and frozen architecture make it unambiguous. No S8 reconciliation, optimization of the obsolete loop, or execution against real data was attempted.

Automatic approval review rejected that guard operation twice. First reason: apparent active creation callers. Additional read-only evidence showed those callers are already retired. Second reason: explicit authorization to choose retirement over a legacy-only restricted path was still required. Neither rejected operation changed files or created its proposed verification script. No ontology guard or new ontology verification result is claimed. Do not work around this rejection.

Required user input to unblock execution: explicitly authorize class-C retirement of scripts/assign-ontology-to-existing-listings.ts AND the assignListingOntology write function in lib/assign-listing-ontology.ts, using reversible guards and preserving the read resolver; or choose temporary legacy-only survival. The present obstacle is automatic approval review, not a new canonical-identity decision.

The next pending inventory item remains the three image APIs. A location-only read identified their image/storage update sites, but no S7 safety/closure verdict or implementation is claimed for them. Remaining inventory and final S7 verification are still incomplete.

CG-3B2B2-S7 PARTIAL — WRITER ADAPTATION REVIEW REQUIRED

This continuation ran no database/application/test workload, accessed no production, and performed no deployment, staging, commit or push. S8 NOT STARTED.

## Continuation: explicitly authorized ontology retirement completed

The latest user prompt explicitly authorized class C reversible retirement of BOTH the bulk ontology command and shared WRITE helper. This resolves the preceding automatic-approval block. The independent READ resolver survives.

Modified scripts/assign-ontology-to-existing-listings.ts: an unconditional always-throw entry guard runs before dotenv configuration, dynamic database imports, population retrieval or the historical loop. Modified lib/assign-listing-ontology.ts: assignListingOntology begins with an unconditional always-throw guard, before resolution, membership deletion/insertion or any activity. Original implementations/signatures remain behind those guards. resolveListingOntology was not edited. No replacement compatibility writer or reconciliation was introduced.

Created scripts/verification/retired-ontology-writer.cjs. Six focused offline cases passed: script stops before environment/database access; shared write export rejects before database access; empty-input read resolver remains callable; nonempty-input read resolver executes its two mocked read queries; each of the two already-retired creation callers remains contained. All dependencies are mocked, no real database/network activity. Exact-reference inspection confirmed the only production references remain the guarded script and the two previously retired creation helpers; no active surviving caller was found. TypeScript --noEmit --incremental false passed. Targeted diff whitespace check passed. No imports or client/server module edges changed, so no new server-only boundary exposure was introduced; the earlier full graph result is preserved, not claimed rerun. No completed CSV/token/duplicate/customer/lifecycle suites were rerun.

## Next unresolved writer: ordinary image attachment failure semantics

Moved forward to the three pending image APIs only. They authenticate ownership and reject deleted listings, then write images/updated_at; these route reads do not project a canonical discriminator. Reorder validates the same image multiset. Delete mutates the array before path validation/storage removal, with subsequent restoration attempts. Upload checks package allowance, uploads an owner/listing-scoped JPEG, then attaches its path. No S7 closure/adaptation claim is made for these routes; none was changed in this continuation.

A genuinely new cross-system cleanup decision is required in app/api/update-listing-image/route.ts. The attachment update at lines 576 onward can commit while its response is lost. The updateError/no-row branch at lines 603–615 removes the uploaded object; the catch branch at lines 659–666 also removes it after thrown errors. Neither proves attachment did not commit. Thus cleanup can remove an image which remains attached to a surviving listing. This is a concrete source-code failure path, not a runtime reproduction; no production/storage request was made.

The approved no-destructive-cleanup-on-uncertainty policies explicitly cover canonical duplication and token creation. Ordinary customer image uploads are a separate surviving workflow, including already-published listings. Do not silently generalize a draft/publication policy or build new media transaction machinery.

Smallest decision requested: authorize ordinary customer image upload to retain the owned uploaded object when attachment success cannot be established, preserve the existing listing identity and lifecycle state, and report an explicit attachment-unconfirmed result identifying the owned path for recovery rather than deleting the possibly attached object. This does not ask to introduce a saga, rehost external media, change storage allowances, or retry by creating another listing. Retry details must remain within established ownership/state evidence; any further genuinely new semantic decision would be separately surfaced.

Resume at this precise ordinary image-upload uncertainty policy. The two ontology retirements are complete and must not be reopened. The remaining image API disposition/adaptation, remaining scraper/backfill/fixture inventory, activity integration and final S7 closure requirements remain unfinished.

CG-3B2B2-S7 BLOCKED — ARCHITECTURAL DECISION REQUIRED

No PostgreSQL startup/connection, application startup, production access, deployment, staging, commit or push. No closed migration changed. S8 NOT STARTED.

## Continuation: ordinary upload uncertain-attachment retention implemented

User authorized file retention with ATTACHMENT UNCONFIRMED for uncertain ordinary attachment, without lifecycle transitions. Modified only app/api/update-listing-image/route.ts for this behavior; added scripts/verification/ordinary-image-attachment.cjs. No completed ontology or other writer work reopened.

The route marks when attachment is attempted. Unknown/transport/PostgREST response errors and thrown attachment responses retain the uploaded file and return HTTP 202, success:false, status:ATTACHMENT_UNCONFIRMED, server-generated storage path and an explicit warning. It reports neither confirmed success nor definitive attachment failure. The catch path cannot destructively compensate an uncertain attachment. Only explicit SQL statement rejection (SQLSTATE classes22/23,42501,40001,40P01) or a successful zero-row response establishes non-attachment for the existing cleanup branch. Other error codes conservatively remain uncertain. Existing authentication, owned listing path, JPEG validation, package allowance and deleted-listing exclusion remain in place. No external media is fetched or rehosted. The request does not accept browser confirmation or a client-chosen uploaded path.

Only images and updated_at are written. No lifecycle/status/deadline/history/revision mutation or new media-specific listing state is introduced. Normal confirmed success retains its existing response. The warning explicitly discourages re-upload; it does not claim a safe retry mechanism already exists.

New focused verification:20 offline route cases passed. Six outcomes (success, explicit constraint rejection, zero-row non-attachment, unknown PostgREST response error, transport error, and commit followed by thrown/lost response) across active/draft/archived fixtures, plus foreign-owner/deleted-listing exclusion. Cases assert retained files and explicit non-success/non-definitive-failure status for uncertainty; confirmed rejection cleanup; server-owned returned path; no storage removal after simulated committed attachment; unchanged lifecycle/deadline/revision; only images/updated_at writes and no lifecycle-event table access. Fake FormData provides untrusted confirmation for other fields, which is not consumed. All database/auth/package/storage dependencies mocked: no live request, actual upload or PostgreSQL run. TypeScript --noEmit --incremental false and targeted diff whitespace passed. Imports/module edges unchanged; no new server-only dependency enters a client module. Earlier full server-only graph verification preserved, not rerun. No completed S7 suites rerun.

## Current smallest unresolved decision: ordinary upload retry identity

The user's retry section explicitly requires stopping if safe retry needs a new architectural decision. This route still creates a fresh randomUUID storage path on every multipart invocation. It has no durable ordinary-upload command/receipt identity, no saved intended attachment and no endpoint that can retry the same upload operation. Migration013 duplicate_commands and Migration017 token_creation_commands are bound to their respective creation workflows; they do not authorize arbitrary ordinary uploads on existing/published listings. Repurposing them would silently change their frozen authority. Returning an owned path alone does not authorize the browser to assert attachment or select a retry operation.

Consequently, retention/status is implemented and verified, but a repeat of the original upload request would create another object. No automatic retry or new operation-state architecture has been introduced. No claim of end-to-end retry completion or complete image-writer adaptation is made.

Smallest decision: authorize a narrowly scoped server-controlled ordinary-upload operation identity/record binding authenticated owner + listing + uploaded path, so retries can verify or complete attachment of that SAME file without another upload, with server/database evidence determining completion and no lifecycle transition. Alternatively explicitly defer retry to manual review for ATTACHMENT_UNCONFIRMED. The current prompt requires stopping before choosing new retry identity/authority semantics; this is not an implementation-permission request for the already-completed retention change.

Resume here. Pending image deletion/reordering and later inventory remain unchanged; do not restart the inventory or reopen completed ontology retirement. No generalized saga/reconciliation/garbage collection has been built.

CG-3B2B2-S7 BLOCKED — ARCHITECTURAL DECISION REQUIRED

No application or PostgreSQL startup, production access, deployment, staging, commit or push. No migration changed. S8 NOT STARTED.

## Continuation: authorized ordinary-upload operation and same-file retry

Implemented the authorized narrow ordinary-upload operation without reopening completed writers. Added supabase/migrations/020_ordinary_upload_operations.sql and lib/ordinary-upload-operation.ts; adapted app/api/update-listing-image/route.ts to establish the operation before upload and accept operationId-only retry after fresh authentication. The server creates a UUID and binds owner/listing/fixed owned JPEG path/byte size; private operation table has RLS and no application-role direct DML. Only service-role RPCs prepare/read/attach. Browser-supplied listing mismatch is rejected, browser paths/confirmation are ignored, and knowledge of the UUID does not bypass current ownership checks.

Retry loads the authoritative operation, checks the retained object's metadata/size when incomplete, and invokes attachment without upload/copy/remove. Missing or uncertain storage evidence remains unconfirmed; no replacement file is created. Attachment serializes operation then listing row, appends at most once to the current image array under the existing25-image bound, and commits completion atomically with the attachment. Two different operations serialize on listing to prevent lost updates. Completed replay does not re-add a subsequently removed image; it acknowledges that operation's completion and returns current images. Current owner/lifecycle eligibility is checked even for completed replay. Unknown canonical versions fail closed; explicit legacy/null and canonical1 are accepted for this media-only path, without creating canonical evidence from legacy fields.

Lifecycle status/deadline/history and canonical revision are unchanged. Only images/updated_at and the private completion flag mutate. Fixed search paths and service-only RPC grants preserve server authority. Media paths are server-owned; no external image acquisition or generalized media system exists. Confirmed SQL rejection is returned distinctly as ATTACHMENT_REJECTED; the operation's file is now retained for same-file retry rather than deleted. Uncertain responses remain ATTACHMENT_UNCONFIRMED. This directly affected former cleanup behavior and implements the newly authorized same-file semantics. No abandonment/garbage-collection policy was selected. A first response lost before the client receives the operation ID is not claimed automatically recoverable by this API; no automatic resubmission is introduced.

Created persisted focused verification artifacts:
- scripts/verification/ordinary-upload-fixture.sql
- scripts/verification/ordinary-upload.sql
- scripts/verification/ordinary-upload-concurrency.py
- scripts/verification/ordinary-upload-operation.cjs

Verification completed:
-15 SQL assertions: private state/authority, owner rejection, atomic completion failure rollback, retry, no resurrection, current ownership/deleted-state enforcement, lifecycle/deadline/revision preservation, fixed search paths.
-15 offline HTTP route/server-helper scenarios across active/draft/archived and confirmed success/rejection/transport/unknown/committed-response-lost outcomes. Each also exercises repeated same-file retry, no re-upload, no duplicate attachment, listing substitution rejection, ignored client path/completion, and owner reauthorization. All storage/auth/database calls mocked.
-3 independent-session PostgreSQL concurrency cases: four simultaneous retries of one operation; two different operations without lost updates; two operations competing for the final image slot, one winner. No duplicate media paths or lifecycle/deadline/revision changes.
-TypeScript --noEmit --incremental false passed after correcting a nullable-path compile error.
-Server-only import graph:186 client roots,272 visited modules,zero failures.
-Targeted route diff whitespace passed.

SQL/concurrency used only the separately named s7_upload database in the existing disposable Unix-socket lab, port55442. The persisted minimal fixture compiles the actual new migration but is not the full canonical migration stack or production schema. PostgreSQL was stopped afterward. The prior20-case pre-operation suite is retained as historical evidence; it targets the superseded direct-table attachment/cleanup path and was not falsely reported rerun or currently passing. New operation scenarios cover the directly affected behavior. No CSV/token/duplicate/customer/lifecycle/ontology suites rerun.

## Next pending writer: ordinary image-delete storage failure

Continued directly to app/api/delete-listing-image/route.ts. This path removes the image from listings.images first. After storage.remove reports an error (lines478 onward), it restores the entire earlier existingImages array (around499 onward). A lost storage response does not prove deletion failed: the object may already be gone. Restoring the old array can therefore restore a broken image reference and overwrite concurrent image changes. Ownership validation also occurs after the initial database update; moving that check earlier is routine implementation, not the policy question. No delete/reorder endpoint changes were made here.

The upload authorization concerns preserving potentially attached uploaded objects; it does not establish ordinary DELETE's user-visible partial-success and storage-failure outcome. Whole-listing permanent-delete policy concerns a different explicitly legacy-only operation. Applying either silently would choose the ordinary image-delete compensation policy.

Smallest new decision: once ordinary image detachment is confirmed, authorize keeping it detached when storage deletion fails or is uncertain, returning a separate explicit storage-cleanup pending/unconfirmed status, preserving lifecycle, and never restoring the stale image array as compensation. This asks neither for background cleanup nor a generalized media manager. Server ownership validation and concurrency-safe detachment would then be implementation work under that policy. Stop before changing this unresolved behavior.

CG-3B2B2-S7 BLOCKED — ARCHITECTURAL DECISION REQUIRED

Upload retry implementation/verification complete; remaining image-delete/reorder and subsequent original inventory not complete. No production/network access, application startup, deployment, staging, commit or push. Closed migrations unchanged. S8 NOT STARTED.

## Recovered completed media checkpoint — prior report append interrupted

The preceding report append was rejected by automatic approval review because the account usage limit prevented the review from running. The implementation and verification had already completed. This entry preserves those existing session results; no media work or verification was repeated.

Completed Migration021 image_detach_cleanup.sql and delete-listing-image adaptation: private server-owned detach/cleanup receipts; owner/listing/path validation before mutation; listing-row-locked detachment; no stale rollback; separate confirmed or pending/unconfirmed storage cleanup; same-operation cleanup retry; external references never physically deleted; current lifecycle/deadline/history/revision preserved. Repeated references to the one deleted object are detached together. Private grants/RLS/fixed function search paths prevent browser-controlled completion. Completed cleanup replay does not mutate images.

Directly affected reorder writer now uses the exact validated images snapshot as a conditional-update predicate. Sale/Rental shared EN/ES forms display cleanup pending and offer same-operation retry. Legacy Save no longer resubmits images; updateListing rejects that general-edit field, preventing stale Save from restoring media. Pending cleanup handles are held in component state; automatic recovery after navigation is not claimed.

Completed Migration022 abandoned_token_cleanup.sql and cron adaptation: claim/delete eligible old unverified tokens in the database before storage cleanup, under row lock, excluding tokens tied to canonical creation commands. Existing24-hour cutoff unchanged. Failed/unconfirmed claims cause no storage deletion. Pending canonical creation retains token and temporary media. Physical cleanup failure may leave files and is reported through existing failure logging; no generalized cleanup system was added.

Files created in that completed increment:
- supabase/migrations/021_image_detach_cleanup.sql
- supabase/migrations/022_abandoned_token_cleanup.sql
- scripts/verification/image-detach.sql
- scripts/verification/image-detach.cjs
- scripts/verification/image-detach-concurrency.py
- scripts/verification/media-caller-containment.cjs
- scripts/verification/abandoned-token-cleanup.sql

Files modified: app/api/delete-listing-image/route.ts; app/api/reorder-listing-images/route.ts; app/components/SaleListingEditForm.tsx; app/components/RentalListingEditForm.tsx; app/utils/updateListing.ts; app/api/cron/cleanup-temporary-listing-images/route.ts. No files deleted.

Completed verification preserved:13 image-detach SQL assertions;9 offline delete/reorder cases;3 concurrency/interleaving cases (same detach convergence,cleanup concurrent with new upload,stale reorder exclusion);4 caller containment cases (one executable legacy guard,two UI source contracts,one cron source ordering contract);7 abandoned-token SQL assertions. Final TypeScript passed; server-only graph186 client roots/272 modules/zero failures; targeted whitespace passed. Corrected a new harness brace typo and narrowed a UI source assertion to the actual Save payload. SQL used the minimal s7_upload disposable fixture, not the full canonical stack or production; PostgreSQL stopped successfully afterward. No previously completed suites rerun.

Forward inventory inspection found scraper/local CSV utilities and geography audits without direct canonical listing writes; none was run. Next actual fixture writer was scripts/verification/commercial-resolver.ts. Its configured service-role client directly inserts synthetic listings and physically deletes fixture listing IDs. The preceding run stopped for this writer's survival classification. Activity integration, remaining fixture dispositions and final bypass/privilege accounting were not declared complete.

## Current continuation: commercial-resolver disposable-only disposition accepted

User explicitly classifies verify-commercial-resolver as D: noncanonical test/verification utility permitted ONLY in positively identified disposable infrastructure. Production/staging/shared/remote configured Supabase targets are prohibited. Synthetic fixture semantics must remain noncanonical; no canonical production creation adaptation is authorized. This disposition is resolved and must not be reopened.

Narrow inspection only: commercial-resolver.ts client setup/entry point, the existing ordinary-upload fixture and canonical-creation concurrency transport, and candidate infrastructure filenames under scripts/supabase. No commands ran the verification harness, database, application or network. No secrets were read. No completed tests or inventory were repeated.

Remaining evidence: commercial-resolver.ts loads project environment with loadEnvConfig(process.cwd()), then constructs @supabase/supabase-js with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. Its actual resolver dependency also uses that Supabase client. Existing persisted disposable verification uses psql over a /private/tmp Unix socket with explicit database/port checks. Those checks are specific to SQL connections and do not attest any HTTP Supabase/PostgREST endpoint. No existing runner-owned HTTP endpoint/credential-to-disposable-cluster binding was found in this inspected infrastructure boundary. A localhost URL, NODE_ENV or a caller-supplied safety flag would not establish the required guarantee.

Smallest unresolved security/infrastructure decision: authorize a runner-owned disposable harness that creates its own fresh local database environment and supplies a transport bound exclusively to that environment, without reading ordinary configured Supabase URL/service-role credentials. This requires establishing the missing execution/transport isolation contract; the current utility cannot safely be made runnable merely by reusing the existing SQL test's socket-name checks on an HTTP URL. No weak guard, transport shim or new test infrastructure was implemented. Per the explicit instruction to stop when no reliable existing disposable-environment mechanism exists for this fixture, stop here before selecting that contract.

Fixture containment and its new required verification remain unimplemented; the utility must not be run in its current form. The original fixture is unchanged at this stop. Media work remains complete. No S7 completion claim.

CG-3B2B2-S7 BLOCKED — ARCHITECTURAL DECISION REQUIRED

This continuation performed only bounded reads and this report append. No production/network access, application/database startup, tests, deployment, staging, commit or push. S8 NOT STARTED.

## Continuation: runner-owned commercial-resolver harness completed

The authorized verify-commercial-resolver fixture is now class D, executable only through its runner-owned disposable capability. Created scripts/verification/commercial-disposable-runner.cjs and commercial-disposable-authority.ts. Modified commercial-resolver.ts to remove project environment loading, ordinary credential reads and createClient construction; its authority accessor throws by default. Modified package.json verify-commercial-resolver to invoke the runner. No application/resolver implementation changed.

The runner creates a fresh mkdtemp directory, initializes a new PostgreSQL cluster with local test-only authority, starts it without TCP listening using its own private Unix socket, and verifies the server data_directory equals the directory it created. It never accepts a target URL/socket/database from the caller. Subprocess environment is explicitly limited to PATH/LC_ALL; configured Supabase and PostgreSQL environment values are not inherited. No Supabase HTTP transport is instantiated. The actual TypeScript fixture and real commercial resolver/package-limits/package-usage/listing-entitlement modules run through a strict import allowlist in a separate VM context. Only that context receives the bound in-process client capability; direct execution uses the default rejecting authority module. No application import of the harness was found; the only app/lib/package reference is the npm verification command.

The test-only adapter implements only the fixture's required from/select/equality/in/gte/order/limit/cardinality/insert/delete behavior and product relationship, with SQL against runner-owned JSONB fixture rows. Reads/writes are actual PostgreSQL operations; table names and writes are allowlisted, unbounded deletion is prohibited, and inserted listing fixtures must remain noncanonical. Storage is explicitly an empty test fixture, with no external object operations. Minimum package/subscription/product data is seeded locally, plus three synthetic listings/three entitlements generated by the original verification. This is bounded test transport, NOT a production data layer or full PostgREST emulator. It verifies resolver behavior, not production relational constraints, RLS, real Storage, or HTTP protocol fidelity.

Runner cleanup stops the owned server then removes only its generated directory, including on normal exceptions and SIGINT/SIGTERM. Cleanup failure surfaces as failure and does not authorize fallback; stop failure prevents directory removal. Hard process/host termination cannot guarantee finally execution; no claim of crash-proof garbage collection. Client use after runner destruction throws. Unsupported imports/query/table behavior fails closed.

Focused verification completed:
- Original commercial-resolver fixture passed against a fresh runner-created target:46 SQL statements,6 synthetic inserts and6 synthetic deletes; no listing/entitlement artifacts left before destruction.
- A second focused credential-isolation run with deliberately supplied NEXT_PUBLIC_SUPABASE_URL=https://forbidden-target.invalid and a noncredential service-role value also passed against its own fresh target. No HTTP connection or remote fallback exists in the test runtime. The second run was new adversarial isolation coverage, not a rerun of unrelated completed S7 work.
- Default authority rejects even with ordinary environment credentials present. Bound transport rejects after destruction; runner verifies its directory was removed.
- Both clusters were stopped and removed successfully.
- TypeScript --noEmit --incremental false passed.
- Server-only graph186 client roots/272 modules/zero failures; exact app/lib harness-reference search found none.
- Targeted fixture/package diff whitespace passed.

No completed media,CSV,token,duplicate,ontology,customer-edit or lifecycle suites rerun. No production connection/network request, deployment, staging, commit or push. Fixture disposition/containment is closed; do not reopen it.

## Next unresolved fixture: activation verification authority/survival

Moved forward to scripts/verification/activation-engine.ts (package verify-activation), without executing it. This utility still loads ordinary project environment and configured service-role credentials. Unlike the just-contained resolver fixture, it requires externally supplied ACTIVATION_VERIFY_USER_ID and ACTIVATION_VERIFY_LISTING_ID, creates purchase requests, inserts synthetic provider evidence, calls approvePurchase and the activate_purchase RPC, and subsequently deletes activation artifacts and restores the previously existing subscription status/expired_at. Evidence locations: client setup around119; approveVerificationPurchase around580; activateThroughRpc around633; existing-subscription restoration around1237.

The approved disposition explicitly covered verify-commercial-resolver and its minimum synthetic listing/entitlement fixtures. It does not settle survival of this separate purchase/provider-approval/activation verification writer or authorize preserving its configured-existing-account workflow. Reusing the narrow resolver adapter to simulate activation would fail to test the actual activation RPC; creating synthetic payment/reviewer/account authority for this separate suite, or retiring an active verification command, requires its disposition to be resolved first. No production/payment behavior or activation fixture was changed.

Smallest decision requested: retain verify-activation exclusively as a runner-owned disposable test, with synthetic user/listing/subscription/purchase/provider/reviewer fixtures and actual local activation machinery, prohibiting configured existing/shared accounts and remote service-role targets; or retire it. This is the next utility's survival/authority decision, not a reopening of the established runner isolation contract. No activation tests were run.

CG-3B2B2-S7 BLOCKED — ARCHITECTURAL DECISION REQUIRED

S7 remains incomplete: subsequent fixture dispositions, activity integration and final bypass/privilege/report closure still pending. S8 NOT STARTED.

## Continuation: verify-activation disposable containment completed

User-authorized disposition D implemented. Created scripts/verification/activation-disposable-authority.ts, activation-disposable-runner.cjs and activation-disposable-schema.sql. Modified scripts/verification/activation-engine.ts and package.json verify-activation. Removed fixture project-env loading, configured Supabase client creation and externally supplied account/listing/package/add-on IDs. Its default authority accessor always throws; only the runner's isolated module loader supplies a live test capability. No production engine or closed migration was changed. The completed commercial-resolver harness was neither modified nor rerun.

Runner follows the same established mkdtemp/initdb/private Unix-socket/transport-capability/stop-remove pattern, with its own fresh target and explicit data_directory equality verification. It provides no caller-selected target and strips ordinary environment values from PostgreSQL subprocesses. No HTTP/Supabase/provider client is constructed. An explicit three-module allowlist loads the real activation fixture, purchase-engine and approval-engine. Network, messaging, provider APIs, application imports and environment secrets are unavailable in that test context. Synthetic UUID identities, products, baseline subscription and listing exist only in the generated database. Storage/provider communication is not required by this tested path; provider evidence is inserted by the original fixture as local synthetic purchase events.

Actual local machinery: installed unchanged Migrations004/005/008, including actual durable publisher coordination and activate_purchase. Reused ONLY schema prefixes from existing S1/S2/S5 SQL fixture artifacts; no closed assertions/scenarios or S1-S6 baseline suites were rerun. New schema supplement supplies the minimum columns required by the real purchase/approval TypeScript code. The relational test transport operates actual typed PostgreSQL tables and calls only the allowlisted actual activate_purchase RPC. Unsupported imports/tables/RPCs fail closed, and unbounded update/delete are rejected. It is not a new application data layer or general PostgREST implementation.

Verification completed:
- Real fixture passed: package purchase creation, synthetic evidence, approval, atomic subscription replacement and purchase linkage, duplicate activation rejection, add-on purchase/approval/atomic entitlement activation/linkage, duplicate add-on activation rejection. Four actual RPC invocations per successful run.
- Runner asserts durable publisher identity remains; package activation resolves the new NULL/unlimited allowance; fixture cleanup restores the synthetic baseline's distinct zero allowance; actual S2 capacity_state confirms zero with consumption1 is over capacity. This is focused affected coverage, not a rerun of the full S5 concurrency suite.
- Synthetic purchases and entitlements are absent after fixture cleanup; original synthetic subscription restored. Actual database/cluster then stopped and removed.
- A focused adversarial run with invalid configured Supabase URL/service-role and ACTIVATION_VERIFY_USER_ID could not redirect execution: only newly generated local identities/target were used. Ordinary credentials were never read for this execution.
- Default authority rejects outside the runner. Post-destruction transport fails closed and the generated directory is absent. No fallback exists.
- TypeScript --noEmit --incremental false passed; server-only graph186 roots/272 modules/zero failures; targeted diff whitespace passed.

Initial new-runner wiring awaited the wrong exported entry name, so its first trial failed before activation and cleaned up its cluster. Corrected the fixture export to await verifyActivationEngine(). The subsequent functional run and final credential/capacity run passed and each destroyed its fresh target. No activation validation was weakened. No external service effects occurred. No claim of full production schema, real PostgREST, provider integration, or new concurrency regression proof; actual S2/S5 code executes in representative disposable schema with synthetic state. Hard process/host termination is not claimed crash-proof; cleanup failure surfaces and cannot cause target fallback.

verify-activation disposition/containment is complete. Do not reopen this work on continuation.

## Next unresolved utility: verify-provider

Continued to scripts/verification/commercial-provider.ts without running it. It loads ordinary project configuration and service-role credentials and uses hardcoded TEST_USER_ID/TEST_PACKAGE_ID. Unlike verify-activation's local synthetic provider-evidence event, it invokes submitPurchaseToProvider through createSinpeProvider or createBankTransferProvider. The inspected provider implementations insert provider-specific payment submission records; no claim is made that this inspection found a real bank capture/network call. Those functions and the utility were not changed or executed.

The current authorization selects verify-activation's survival and permits minimum synthetic evidence needed for its activation checks. It does not choose the separate provider-submission utility's survival or its provider-specific synthetic submission fixtures. Running its configured hardcoded-account path is prohibited; retiring the command or selecting a new provider test disposition is not silently inferred.

Smallest next decision: retain verify-provider ONLY as a runner-owned disposable utility exercising actual local SINPE/bank-transfer submission code with entirely synthetic account/package/payment/reference data and no external effects, or retire it. Existing runner isolation mechanics are resolved and need not be reauthorized; the question is this separate provider-submission fixture's disposition. Stop before implementing that choice. Other pending fixture/activity/final bypass accounting remains incomplete.

CG-3B2B2-S7 BLOCKED — ARCHITECTURAL DECISION REQUIRED

No completed commercial-resolver/media/CSV/token/duplicate/ontology/customer-edit/lifecycle suites rerun. No production/network access, application startup, deployment, staging, commit or push. All newly created disposable clusters stopped/removed. S8 NOT STARTED.

## Continuation: verify-provider isolation implemented; audit-event authority blocker

Accepted authorized class D disposition for verify-provider. Extended the EXISTING activation-disposable-runner.cjs with an explicitly selected provider mode (sinpe or bank-transfer), reusing its runner-owned cluster, relational transport, credentials isolation, module capability and destruction lifecycle. No third runner architecture created. Modified commercial-provider.ts to remove project environment/configured client construction and hardcoded persistent user/package authority; it now requires a rejecting-by-default provider-disposable-authority capability. Runner supplies freshly generated identities. Registered the actual locally created provider in the existing registry so submitPurchaseToProvider exercises the real implementation; no registry/production behavior changed. Updated package.json verify-provider to invoke the existing runner in provider mode.

Created scripts/verification/provider-disposable-authority.ts and provider-disposable-schema.sql (minimum disposable bank-transfer payment table). Modified scripts/verification/commercial-provider.ts, scripts/verification/activation-disposable-runner.cjs and package.json. No production engine/migration changed. Shared transport now supports the fixture's count/head queries and its two local payment tables. Provider-mode module allowlist adds only the existing submission/provider/registry modules; it exposes no network/provider credentials, fetch or external communication. No activation RPC is permitted as expected provider-mode behavior (runner checks invocation count stays zero). A baseline subscription snapshot is compared after submission when the fixture passes.

Ran only SINPE initially, with deliberately invalid ordinary Supabase URL/service-role environment values. The runner created its own cluster and identities and executed actual local purchase/submission/SINPE code. Fifteen of the existing sixteen provider assertions passed: purchase pending, identity/amount/currency preservation, submitted payment row linked to purchase, and no added subscription/entitlement. The final existing assertion failed: Purchase audit trail exists —0 events. The runner surfaced failure and stopped/removed its database. Bank-transfer and remaining success-path containment assertions have NOT been claimed passed or executed; provider verification is incomplete.

Bounded investigation of this failure: purchase-engine.ts resolvePurchase reads purchase_request_events, but createPurchaseRequest inserts purchase_requests without an event write. The inspected commercial-submission and SINPE/bank-transfer implementations insert payment submissions but do not write purchase_request_events. No corresponding purchase-created/submitted audit trigger was found in the local migration/test SQL search. Approval/activation event writes belong to later transitions; invoking those to satisfy this submission-only test would broaden its purpose. This is evidence about the inspected local code/fixture, NOT proof that production has no such trigger. No production schema or network was accessed.

The failed assertion is unchanged. No synthetic audit row, invented trigger, weakened provider assertion or new production audit semantics was introduced. The missing baseline behavior cannot be truthfully substituted with a made-up event merely to make the test pass.

Because shared runner code changed, ran the specifically authorized affected verify-activation regression once: actual package/add-on activation, duplicate rejection, publisher/NULL-versus-zero checks and cleanup passed; cluster destroyed. This did not reopen its implementation or run commercial-resolver/other completed suites. TypeScript --noEmit --incremental false passed; server-only graph186 roots/272 modules/zero failures; targeted fixture/package whitespace passed. No app/lib reference to the new provider fixture authority was found. Both clusters created this continuation stopped and removed, including the failed provider run.

Smallest required decision/evidence: identify the authoritative existing mechanism that creates the purchase/submission audit event expected by verify-provider and supply/locate its definition for the disposable schema. If that behavior does not already exist, deciding whether to add submission audit behavior or change the fixture's audit expectation is a new commercial/audit contract decision outside containment authority. Do not infer either choice. Preserve the current isolated implementation and resume at this exact audit-event mismatch.

CG-3B2B2-S7 BLOCKED — ARCHITECTURAL DECISION REQUIRED

Provider containment implementation is in place but provider verification/disposition closure remains incomplete. No forward inventory work beyond this blocker. No production access, external financial effects, network requests, application startup, deployment, staging, commit or push. S8 NOT STARTED.

## Surgical forensic trace: provider assertion 16 provenance

Read-only investigation of the single failing assertion completed. No implementation/test/DB/application/network execution was performed; only this report is updated. Provider containment and the failing assertion remain unchanged.

1. Original definition: scripts/verification/commercial-provider.ts, currently around801, under VERIFY PURCHASE AUDIT TRAIL. The condition is purchaseAfterSubmission.events.length >0, evaluated after resolvePurchase reloads the newly created, still-pending purchase following provider submission.
2. Origin/history: git pickaxe identifies commit528dbcd29f55d33e85a025d04ea38ad55e823700, dated2026-08-10 03:36:58 -0600, message “bro”. That commit ADDED the provider test, purchase-engine, commercial-submission, approval-engine and both provider modules together. The assertion already existed in that original version. The original createPurchaseRequest also inserted only the purchase row and then called resolvePurchase; no submission audit writer was subsequently removed in the inspected path history. Commit text does not explain the assumption or identify a database trigger. The test section shows its intended purpose—expecting some purchase audit history after submission—but the reason that expectation was chosen is not recoverable from this bounded history.
3. Exact expected record: lib/purchase-engine.ts resolvePurchase queries public.purchase_request_events by purchase_request_id=purchase.id, ordered created_at ascending, and normalizes those rows into events. Assertion16 accepts ANY one such row; it specifies no event_type, transition, actor or submission origin. It does NOT query generic activity_events, canonical receipts, listing lifecycle/monetary/source history or subscription history.
4. Creation/submission path: createPurchaseRequest inserts purchase_requests and returns resolvePurchase. submitPurchaseToProvider resolves the pending purchase, selects a registered provider, invokes its submitPurchase and validates the returned purchase identity. The actual SINPE/bank-transfer adapters insert their respective payment rows in submitted state. None of these inspected writers inserts purchase_request_events. The failed disposable result is consistent with that source path, not proof of production catalog behavior.
5. Actual existing event writers: approval-engine writes purchase_${decision} with prior/resulting purchase status, reviewer actor and metadata. Migration008 public.activate_purchase writes purchase_activated with activation_type/activation_id. These are authoritative later-transition events; verify-provider explicitly tests that purchase remains pending and no subscription/entitlement is created. Invoking approval/activation merely to make assertion16 pass would change its purpose.
6. Other/test writers: activation verification explicitly inserts provider_test_activation_verified as synthetic approval evidence. Commercial-timeline verification explicitly inserts purchase_created (null→pending) and subsequent events as fixture data. Timeline's purchase_created fixture appeared in commit0cac156 on2026-08-10, message “making money in a month”. This proves a test fixture recognizes that label, NOT that production creation/submission automatically emits it. The commercial timeline reader only reads the event table; it cannot supply the missing row.
7. Trigger evidence: bounded search in local migrations/relevant test SQL found no production purchase-created/submitted trigger. The S5 fixture has an injected failure trigger on event insertion for rollback tests; that is not an event-producing mechanism. The locally mentioned twuanis_public_schema.sql is empty (0 bytes), so it supplies no missing production catalog evidence. No production inquiry was made or inferred.
8. Event table semantics: the existing representative purchase_request_events schema records purchase identity, event_type, prior/resulting status, actor and metadata. It contains no fixture default/trigger guaranteeing an event on purchase/payment insertion. The table accommodates explicit approval/activation/test event writers but does not itself establish submission audit ownership. Other event domains were not substituted.
9. Finding: assertion16 is UNSUPPORTED BY THE INSPECTED LOCAL CREATION/SUBMISSION CONTRACT, while an unrecorded production trigger cannot be ruled out without authoritative evidence. The repository does not establish automatic event creation at this point. It is not accurate to claim no commercial audit mechanism exists at all: approval/activation event mechanisms DO exist, but own different transitions. No evidence justifies inventing a purchase_created/provider_submitted writer in S7.

Correcting/removing assertion16 would accurately describe the inspected local submission behavior (pending purchase + submitted provider payment, with no guaranteed audit event). It cannot be represented as proof that an undocumented production audit obligation was intentionally removed. The existing assertion is therefore retained pending architectural disposition.

Smallest decision: authorize removing/correcting ONLY the unsupported automatic-event expectation in verify-provider, leaving existing event writers/readers and all other submission assertions unchanged; OR identify/supply an authoritative existing creation/submission audit mechanism to load into the disposable fixture. If a new automatic audit event is desired, that is a separate commercial contract decision and not a containment correction.

CG-3B2B2-S7 BLOCKED — ARCHITECTURAL DECISION REQUIRED

No code/assertion changes or tests, no PostgreSQL/application startup, no production/network access, no deployment, staging, commit or push. No completed S7 work reopened. S8 NOT STARTED.

## Continuation: unsupported provider assertion removed; provider verification complete

Accepted the explicit decision that automatic submission audit events are not an established repository contract. Removed ONLY the Purchase audit trail exists assertion and its section heading from commercial-provider.ts. All other fifteen assertions remain. No replacement event/assertion, production event writer, trigger, schema or commercial semantics were introduced or changed. The completed forensic trace above was not repeated.

Focused verification: SINPE passed all15 supported assertions with deliberately invalid ordinary Supabase credentials. Bank-transfer initially exposed a disposable transport limitation: its identifier validator rejected the existing sender_account_last4 field. Changed only the shared runner identifier regex to permit digits after the first character, retaining strict identifier validation and SQL quoting. Bank-transfer then passed all15 supported assertions with poisoned ordinary credentials. Both successful runs passed runner checks for synthetic payment/purchase identity, pending purchase, zero activation calls, unchanged subscription state, no entitlement, default authority rejection and destroyed-transport rejection. No remote/shared target or external financial transport was exposed. Each run, including the failed bank-transfer attempt, stopped and removed its runner-owned cluster.

Because the shared identifier validator changed, ran one directly affected activation regression: real local package/add-on activation, approval, duplicate rejection, durable publisher/capacity checks, fixture cleanup and four RPC calls passed. Cluster stopped/removed and destroyed transport rejected. Existing approval/activation event implementation remains unchanged; no event architecture was rewritten. Completed unrelated suites were not rerun. TypeScript --noEmit --incremental false passed; server-only graph186 roots/272 modules/zero failures passed; targeted diff whitespace passed.

## Forward checkpoint: commercial-timeline fixture disposition

Continued directly to the next unresolved utility, scripts/verification/commercial-timeline.ts. Did not execute or modify it. package.json verify-commercial-timeline still invokes this file directly. It loads project environment and ordinary Supabase service-role credentials (lines1–60), selects a listing belonging to hardcoded TEST_USER_ID (around395–433), inserts synthetic purchase/payment/subscription/entitlement/activity/promotion history, and physically deletes its fixture rows in cleanup (around120–225). This is a distinct timeline fixture writer against configured existing-account state, not the now-contained provider fixture. Its manually supplied purchase_created event remains fixture data; no event-provenance investigation was repeated.

The frozen decisions select resolver, activation and provider utilities individually for disposable-only survival. They do not establish the survival disposition of this separate timeline utility and its synthetic multi-domain history fixtures. Neither retiring it nor choosing those new fixtures is silently inferred from permission to remove the provider assertion. Existing isolation mechanics are settled and need no redesign.

Smallest required decision: retain verify-commercial-timeline as class D, runner-owned disposable-only verification using fresh synthetic identities and its existing explicit timeline fixture semantics, or retire the utility. Do not execute its ordinary configured-target path. Stop before implementing this disposition. Remaining activity integration, subsequent unresolved utilities and final S7 closure remain pending.

CG-3B2B2-S7 BLOCKED — ARCHITECTURAL DECISION REQUIRED

No production access, network requests, external financial effects, application startup, deployment, staging, commit or push. All clusters created this continuation stopped and removed. S8 NOT STARTED.

## Continuation: verify-commercial-timeline disposable containment complete

Accepted class D disposable-only survival. Modified commercial-timeline.ts to obtain its client and fresh user ID exclusively through timeline-disposable-authority.ts, whose normal implementation throws. Removed project environment loading, ordinary client construction and hardcoded account dependency. Exported the awaited verification promise. Updated package.json verify-commercial-timeline to select timeline mode in the EXISTING commercial-disposable-runner.cjs. No competing runner architecture created.

Timeline mode has an explicit two-module allowlist: the fixture and actual lib/commercial-timeline.ts. It injects only the bound disposable client/user capability, without network transport, ordinary credentials or arbitrary imports. It provisions a new Unix-socket-only PostgreSQL cluster, verifies server data directory and no TCP address, and generates fresh synthetic user/listing/catalog IDs. User identity is a runner-generated UUID in this noncanonical JSONB fixture adapter, not a real auth account. Only the required seven history tables are writable in timeline mode. Seed listing/catalog data remain outside the writable set. Existing fixture inputs and reader assertions remain unchanged; synthetic purchase_created and other historical events remain TEST INPUT ONLY. No production event writer, trigger, lifecycle semantics or application file was changed.

Focused poisoned-credential run passed all existing timeline assertions: content/source/relationship preservation, newest-first order, stage chronology, ownership isolation and duplicate promotion suppression across ownership paths. Actual local timeline implementation ran against synthetic PostgreSQL-backed rows; no expected timeline was mocked. Nine history rows inserted and nine deleted, 47 SQL statements. Runner additionally checked every history table empty and the seed listing retained, default authority rejected, cluster stopped/removed, post-destruction transport rejected and directory absent. Ordinary configured URL/key could not redirect the capability; no external provider or financial transport exists in the module boundary. This adapter verifies reader behavior/containment, not production schema constraints or PostgREST/RLS fidelity.

Because the shared runner was extended, ran only its directly affected commercial-resolver regression: existing assertions passed, six synthetic rows inserted/deleted, 46 SQL statements, default authority rejection and cluster destruction passed. No provider/activation or unrelated completed suites rerun. TypeScript --noEmit --incremental false passed. Server-only graph186 roots/272 modules/zero failures passed. Targeted whitespace check passed. No application/lib references to the timeline test entry/authority were found.

Files changed this continuation: scripts/verification/commercial-timeline.ts, scripts/verification/commercial-disposable-runner.cjs, package.json, this cumulative report. Created scripts/verification/timeline-disposable-authority.ts. No application reader/writer changed. Both newly created disposable environments destroyed.

## Forward checkpoint: public-promotion-evidence fixture disposition

Continued to the next previously identified unresolved utility scripts/verification/public-promotion-evidence.ts, without executing/modifying it. It loads ordinary project configuration, creates a service-role client from NEXT_PUBLIC_SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY, and takes ACTIVATION_VERIFY_USER_ID as persistent account authority (around85–145). It directly inserts synthetic active listings (around315), listing entitlements (around441), promotion_intelligence_evidence (around565), then physically deletes fixture rows (around1317–1391). Its purpose is public promotion evidence reader verification; it imports the actual reader around1451. This is separate from commercial-timeline's historical input fixture.

Frozen approvals authorize individual resolver/activation/provider/timeline utility dispositions. They do not decide survival or retirement of this separate public-promotion-evidence fixture, nor authorize its synthetic listing/analytical-evidence writes against configured state. The existing disposable infrastructure mechanics are settled. Smallest decision: retain verify-public-promotion-evidence as class D, runner-owned disposable-only verification with fresh synthetic identity and existing test-only listing/entitlement/evidence fixtures, or retire it. Stop before choosing that disposition. Do not run its ordinary configured-target path.

CG-3B2B2-S7 BLOCKED — ARCHITECTURAL DECISION REQUIRED

Remaining unresolved utilities/activity integration/final S7 closure are still pending. No production access, network requests, external financial effects, application startup, deployment, staging, commit or push. S8 NOT STARTED.

## Continuation: verify-public-promotion-evidence containment complete

Accepted class D disposable-only survival. Removed ordinary environment/client construction and configured existing-account authority from public-promotion-evidence.ts. It now requires public-evidence-disposable-authority.ts, whose default implementation rejects, and exports an awaited verification promise. package.json selects public-evidence mode in the EXISTING commercial-disposable-runner.cjs. No new runner architecture.

The mode permits only the fixture, actual public-promotion-evidence reader and actual aggregate-promotion-intelligence-engine. Only listings, listing_entitlements and promotion_intelligence_evidence are writable. Fresh runner-generated identity/catalog state and exclusively bound PostgreSQL-backed fixture transport are supplied. Existing fixture semantics and behavioral assertions are preserved; no production writer/reader/engine/schema semantics changed. Direct synthetic DML remains test setup only. No application/lib references to the fixture entry or authority were found.

Focused verification with poisoned Supabase URL/service-role and ACTIVATION_VERIFY_USER_ID passed: nine observations remain private;25 produce public evidence; medians/interquartile context retained; sparse WhatsApp metric suppressed; min/max, listing/entitlement IDs and raw evidence excluded; causal/individual-prediction claims withheld; evidence-only disclaimer retained. Actual local reader and aggregate calculations executed.34 evidence rows,34 entitlements and2 listings inserted/removed (70 each),85 SQL statements. Runner checked zero residual listing/entitlement/evidence rows, default authority rejection, stopped/removed cluster and rejected post-destruction transport. No external transport/financial effects or configured real identity were available.

Because shared harness mode dispatch changed, one directly affected resolver regression passed (six inserts/deletes,46 statements, default rejection and destroyed target). Timeline/provider/activation and unrelated completed suites were not rerun. TypeScript --noEmit --incremental false passed; server-only graph186 roots/272 modules/zero failures passed; targeted diff whitespace passed. Both fresh disposable clusters destroyed. Representative JSONB fixture transport verifies real reader behavior and containment, not production relational constraints/RLS/PostgREST fidelity.

Changed: scripts/verification/public-promotion-evidence.ts, scripts/verification/commercial-disposable-runner.cjs, package.json, this report. Created scripts/verification/public-evidence-disposable-authority.ts. No application implementation changed.

## Forward checkpoint: promotion-performance utility disposition

Continued to previously identified unresolved scripts/verification/promotion-performance.ts, without executing or modifying it. It uses ordinary Supabase service-role credentials and ACTIVATION_VERIFY_USER_ID/ACTIVATION_VERIFY_LISTING_ID (around145–187). It inserts historical cancelled entitlements (around451), promotion events (around561), and synthetic activity (around942). Cleanup deletes mutable activity but explicitly retains promotion events and associated entitlements as historical lineage (around1990–2010). It also deletes stale activity by testSuite metadata. Thus its current configured-account execution can leave persistent synthetic history; this is a separate utility from public-evidence verification.

Existing utility-specific approvals do not settle this utility's survival/disposition or retention of its synthetic history. Smallest decision: retain verify-promotion-performance as class D, runner-owned disposable-only verification preserving existing historical fixture semantics but destroying the entire target afterward, or retire it. Existing harness mechanics need no new architectural choice; the unresolved decision is this utility's disposition. Stop before choosing or executing its configured-target path.

CG-3B2B2-S7 BLOCKED — ARCHITECTURAL DECISION REQUIRED

Remaining utilities/activity integration/final closure remain pending. No production/network access, application startup, deployment, staging, commit or push. S8 NOT STARTED.

## Course correction: test-utility relevance gate; no further modernization

Latest instruction supersedes utility-by-utility survival approval stops for nonoperational verification scripts. verify-promotion-performance is classified D — NONCANONICAL TEST/VERIFICATION UTILITY, unchanged and not executed.

Six-question finding:
1. Repository references identify only the explicit package.json verify-promotion-performance command. No application/Server Action/route/job/deployment or other operational caller was found by exact entry/name searches.
2. It can mutate a configured persistent database IF manually invoked with ordinary credentials. No ordinary application/operational invocation was found. This manual-execution hazard is test-infrastructure debt, not evidence of operational reachability.
3. No operational survival requirement at canonical cutover was found.
4. Its listings access is a read (ownership lookup). Writes concern synthetic entitlement/promotion/activity state, not protected canonical listing state or listings_ontology_terms.
5. It is not called by publication/renewal/lifecycle/customer mutation/ingestion paths. It constructs historical test input.
6. No operational canonical bypass is established. It cannot independently confer privileges after S11. This is conditional on the required S11 privilege closure actually being implemented; S7 does not claim current broad credentials are safe or future grants already closed.

Record ordinary service-role credentials, configured identity, stale testSuite cleanup and persistent synthetic entitlement/promotion history as TEST-INFRASTRUCTURE DEBT. No harness conversion, retirement or production execution authorized/needed in S7 merely for those properties.

Applied the same reachability gate to the remaining previously named promotion-intelligence and aggregate-promotion-intelligence fixtures and the package's promotion-placement/history/comparable-cohort verification entries: exact entry/name searches found standalone verify commands only, no operational invocation. They are not promoted into S7 modernization projects. Their manually configured execution must not be mistaken for safe shared/production verification, and no post-S11 role-privilege guarantees are inferred. No scripts executed or changed.

## Forward progress: pending activity integration and final bypass accounting

Reviewed the previously pending activity integration boundary. Canonical customer edit calls edit_customer_canonical_listing and returns confirmed listing identity; the legacy updateListing helper logs best-effort listing_updated via lib/activity. /api/activity authenticates and inserts activity_events only. It is not the canonical lifecycle/monetary/revision/receipt authority and does not mutate listings or ontology memberships. The absence of an ordinary activity notification on the canonical edit path is not a canonical-write bypass; no new activity/event architecture or writer was added. This closes the activity item for canonical authority purposes, without claiming ordinary activity-event feature parity.

Advanced remaining direct-DML accounting using targeted protected-table expressions in app/lib, not a restarted architecture inventory. Matches correspond to recorded guarded obsolete utilities/ontology assignment, explicitly legacy-null compatibility edit/lifecycle/publication/renewal/permanent-delete branches, and media reordering. The reorder path writes images plus updated_at under existing owned-listing/current-images predicates; it does not write geography, monetary/lifecycle identity, canonical version/revision or ontology memberships. Existing media decisions remain closed.

No new architectural decision found in this continuation. S7 final exact privilege-closure accounting, preserved-baseline integrity evidence and full consolidated42-item final report are not completed by this relevance classification. Do not represent these remaining closure requirements as a request to modernize more test utilities. Resume at final closure accounting, not at a utility disposition question.

No code changed, tests rerun, PostgreSQL/application started, production/network accessed, deployment/staging/commit/push performed. Only this cumulative report updated. S8 NOT STARTED.
