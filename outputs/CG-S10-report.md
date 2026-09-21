# CG-S10 — Canonical data replacement preparation

## Verdict

S10 COMPLETE — CANONICAL INGESTION PREPARATION VERIFIED

S9 remains closed. The completed Property Type contract is preserved. The ingestion-side source update, trusted completion, two-miss archival and same-ID 90-day republication implementation is now verified locally. The final continuation below supersedes the historical blocked checkpoints retained in this report. Upstream acquisition/completeness production is explicitly deferred; no deployment or later stage has started.

## Exact required input

A genuine source-supported property-type observation, carried as `property_type` inside the raw source observation preserved in `source_observation_input`. It must represent what the source explicitly supplies, not a type guessed from title, description, URL or normalizer heuristics. The current canonical adapter resolves an explicit typed label against the existing ontology. Unsupported or absent evidence must remain unresolved.

Why required: `lib/csv-source-ingestion.ts:26` requires nonempty `raw.property_type` before constructing canonical creation input. The canonical creation contract requires an explicit property-type selection; inventing one would violate frozen source-evidence/Model C authority.

## Current execution path and evidence

1. `scripts/scrapers/encuentra24-sale-scraper.js:1021` returns source observation metadata and fields; at1038 it assigns `raw_property_type: title`.
2. `scripts/scrapers/encuentra24-rent-scraper.js:1120` does the same; at1137 it assigns `raw_property_type: title`.
3. The Sale/Rent output contracts expose `raw_property_type`, not the required source-supported `property_type` field. Existing observation UUID/time and source namespace/listing ID are present; their generation/retry behavior was not separately audited in this stopped task.
4. `scripts/scrapers/normalizers/encuentra24-sale-normalizer.js:573` and corresponding Rent normalizer assign normalized `property_type` using `inferPropertyType`. The raw row is preserved separately as JSON, and heuristic output is explicitly marked unresolved/noncanonical review evidence. Therefore the normalized type is not a valid substitute for the missing raw evidence.
5. `app/api/import-canonical-csv/route.ts` checks authenticated import-operator authority before calling `ingestCsvObservation`.
6. `lib/csv-source-ingestion.ts` parses the raw envelope, retains it via `retain_csv_source_evidence`, then rejects missing source-supported property type before canonical creation. That fail-closed behavior is correct and must remain.

This is a static source-contract finding; no scraper, normalizer, ingestion run, test, database or website request was executed. Existing application records were not inspected.

## Is the missing information available upstream?

NOT ESTABLISHED by the inspected output contract. The code proves that a title is exported in the misleadingly named raw field and that downstream type is inferred. It does not establish that a genuine explicit source category is already captured and available for pass-through. No source website or crawling/extraction behavior was investigated. Do not presume that every listing exposes such evidence.

## Smallest required contract adjustment

Authorize a bounded acquisition-output change to carry an explicitly observed source property type in raw `property_type`, preserving its source meaning and passing it unchanged through the raw observation envelope. Do not rename the title field into property_type or copy `inferPropertyType` into raw evidence. Do not invent a new classification or source-to-ontology mapping. If no explicit source type exists or the existing ontology cannot resolve it, retain unresolved evidence and do not create the canonical listing.

A bounded follow-up must first establish the actual source field/category and whether existing acquisition already captures it. Only then can an exact implementation be specified. This is not authorization for a scraper rewrite, scheduling/crawling changes or heuristic type inference.

## Alternatives and consequences

- Authorize the narrow source-output contract work above: downstream S10 can resume once a valid source-supported input is available; unsupported observations still fail closed.
- Leave the current scraper contract unchanged: those observations remain retained/unresolved and cannot become canonical listings through this path. Separately supplied trusted observations containing genuine explicit property_type are not disproved by this finding.

Promoting a title-derived or normalizer-inferred property type is not an authorized alternative.

## Blocked S10 work

Canonical ingestion of fresh observations from these current scraper outputs, and subsequent source-appearance/update/retry integration work in this S10 run, stop here under the user's mandatory mismatch rule. The full S10 ingestion inventory, new-observation update handling and S10 verification have NOT been completed or certified. No broader defect conclusion is drawn from this bounded finding.

## Preservation

Only this report was created. No product code, scraper, normalizer, migration, schema, grants or configuration changed. Unrelated dirty work preserved. No tests, application startup, PostgreSQL startup/connection, production access, external image acquisition, purge, deployment, staging, commit or push. S11 privilege work remains deferred. No S12/S13 or Phase14 work.

## Prompt completeness note

The supplied attachment ends mid-sentence in Section29 at “Record the future”. The explicit Section4 and Section28 stop instructions are complete and sufficient for this finding; no missing instructions were invented.

S11 — COORDINATED CANONICAL CUTOVER HAS NOT STARTED.


## Continuation — explicit Property Type source contract

Both acquisition paths use source namespace `encuentra24`: Sale and Rent are separate paths, not two independent providers.

| Path | Explicit source evidence | Origin | Disposition |
|---|---|---|---|
| Sale | `ad.subCategoryType = "Casa"` | Current public Sale detail HTML, primary ad ID `32595503`, matched ad link ID | DEFECT FOUND → REPAIRED → VERIFIED |
| Rent | `ad.subCategoryType = "Apartamento"` | Retained source HTML `scripts/scrapers/detail-page.html`, primary ad ID `32422931`, matched ad link ID | DEFECT FOUND → REPAIRED → VERIFIED |

Sale evidence URL: https://www.encuentra24.com/costa-rica-es/bienes-raices-venta-de-propiedades-casas/venta-casa-en-barrio-dent-casa-comercial-con-uso-de-suelo-mixto/32595503

Rent retained-source URL: https://www.encuentra24.com/costa-rica-es/bienes-raices-alquiler-apartamentos/inversion-apartamento-en-venta-en-escazu-3-habitaciones/32422931

The evidence is the explicit primary-ad field, not either title, URL vocabulary or recommended listing. A cached older Sale page was deleted/redirected; a current Sale detail linked by the public category page supplied the final proof. Read-only public source HTML was inspected; no scraper/crawler, application, database or image acquisition was run. The Rent snapshot is extraction-contract evidence, not a claim of current live-page availability. Neither sample is an existing Twuanis database listing.

### Narrow changes

- Added `scripts/scrapers/encuentra24-property-type.js`: decodes source Next Flight JSON without executing page scripts, selects primary `ad` records whose ID and link ID match the requested source identity, returns the exact nonempty `subCategoryType`. Conflicting/missing values remain empty. No title/description/category inference, translation or canonical mapping.
- Updated both scrapers to export that exact value in `property_type` and `raw_property_type`, adding the `property_type` CSV header. Title remains title. The existing general ad extractor and every unrelated scraper field are unchanged.
- Updated only the explanatory comment in `lib/csv-source-ingestion.ts`; its strict evidence requirement and canonical resolution behavior are unchanged. Legacy title-valued raw fields are still not accepted as canonical property type.
- Normalizers are unchanged: the entire raw row passes through `source_observation_input`; heuristic labels remain explicitly noncanonical review.
- Added `scripts/verification/source-property-type.cjs` for focused offline verification. Its optional current Sale HTML check uses `/private/tmp/s10-sale-source.html` if present; no network request is made by the test.

### Verification obtained

40 assertions passed in the focused offline run, including both real source HTML samples; missing/malformed/ambiguous type rejection; wrong listing/link identity rejection; exact Unicode/whitespace preservation; duplicate consistent source records; normalizer retry/raw-envelope preservation; and both actual ingestion functions passing the explicit raw value to the mocked canonical domain translator. Missing type retains evidence and rejects creation. RPCs and domain translation were mocked: this is not live ontology mapping or database integration certification. Existing exact canonical resolution still rejects unknown/ambiguous labels, and no new mapping was introduced.

All three changed/added scraper JavaScript modules passed syntax checks. Targeted before-snapshot comparison proved that reversing only the declared Property Type edits restores each scraper byte-for-byte. No unrelated scraper output computation was changed. No full scraper execution, S9 rerun or database verification was performed.

### Next unresolved ingestion item — later observations

Continued only into the previously recorded source-appearance/new-observation update checkpoint:

1. `ingestCsvObservation` retains immutable raw evidence, then always calls `create_csv_canonical_listing`, completes initial references and initially publishes.
2. Migration 007 `s4_create_core` rejects a genuinely new observation of an already-created source appearance with `existing source: use controlled source mutation`. This prevents a duplicate creation but leaves the later observation unapplied.
3. Existing `mutate_trusted_canonical_listing` / S3 command machinery supplies canonical domain mutation, replay protection, stale-observation handling and Transaction/Province/Canton conflict recording. Those frozen rules are not reopened.
4. However, Migration 019 `complete_csv_source_references` is deliberately creation-only: matching creation receipt/request evidence, unchanged ownerless draft and one completion evidence ID. A later observation cannot use it to update `images`/`source_url`. S3/S4 domain mutation does not accept these fields.

### Smallest unresolved policy

For an accepted genuinely newer observation of the SAME source appearance, should source-provided external image references and source URL replace their current listing projections, or remain retained raw evidence only? If replacement is intended, an empty/missing image field cannot silently be treated as proof that all previous references should be removed: the acquisition contract does not establish a complete authoritative snapshot or an explicit source CLEAR signal.

The frozen no-download/no-rehosting rule establishes reference ownership/transport, not later-observation replacement/removal semantics. Initial-draft completion authority likewise does not authorize applying later reference snapshots. No new reference-update behavior was invented.

Alternatives and consequences:

- Retain later references only as immutable raw evidence, leaving current projections unchanged: avoids unsupported removal but current displayed references can remain stale.
- Authorize current-reference replacement on new observations and define missing/empty versus explicit removal: permits current projections to follow the source, but needs the precise source evidence rule before implementation. Merely failing to extract a URL must not be invented as an explicit deletion.

Blocked scope: the complete later-observation CSV integration and its verification. The Property Type contract is complete independently. No update adapter, migration, source reconciliation, lifecycle renewal or new publication policy was implemented at this stop. Existing same-source identity, replay, conflicts and 90-day initial-publication decisions remain intact.

### Preservation and stage boundary

The files changed by this continuation are the two scrapers, one new Property Type helper, one new focused test, an ingestion comment and this cumulative report. Previously dirty work is preserved. No normalizer/migration/schema/grant changes, production Twuanis access, database connection/startup/purge, deployment, staging, commit or push. Public source HTML requests were solely for the expressly authorized upstream evidence check. No external image bytes were acquired. S11 privileges remain deferred; S11/S12/S13/Phase14 have not started.

S10 PARTIAL — BLOCKED BY SOURCE-REFERENCE UPDATE POLICY

S11 — COORDINATED CANONICAL CUTOVER HAS NOT STARTED.


## Continuation — same-source update and disappearance policy received

The user's continuation resolves the preceding source-reference policy blocker. The completed Property Type repair and its 40 assertions remain preserved; neither investigation nor verification was repeated.

### Newly frozen requirements

- Exact source namespace + source listing ID lookup only; no population matching or cross-source deduplication.
- Genuine observation ID/time and idempotent retry; no repeated effects on replay.
- Valid price, exact Property Area/Construction Area and nonempty valid source URL may update on a new observation. Canonical monetary history and Model C remain mandatory.
- Title/description/external image references may refresh at most once every six months; only a successful eligible replacement resets the clock. Missing/empty/unavailable values never wipe current presentation or URL. Images remain references only.
- Only successful complete source runs count toward absence. Failed/partial runs neither increment nor reset misses. Two consecutive complete misses archive for source non-observation, without claiming sold/rented/leased.
- Reappearance preserves the same source identity and history, resets misses and must restore public availability through canonical lifecycle authority.
- Transaction/Province/Canton conflicts remain authoritative; no expanded automatic update whitelist.

These requirements are accepted policy, NOT a claim that implementation or verification is complete.

### Precise Section 22 stop — re-publication duration

A narrow check of the existing lifecycle/publication authority found:

1. Migration 006 `s3_command`, retained by its current Migration 016 replacement, defines `restore` as archived/deleted → draft. It does not restore public active status.
2. `publish` permits draft → active, but requires a positive bounded trusted `duration_seconds`, establishing a new deadline from the publication time. There is no automatic authorized duration for source reappearance.
3. Migration 011 `initially_publish_csv_listing` authorizes 7776000 seconds (90 days) for initial CSV publication. It uses a fixed persisted publication request and returns the already-completed operation on replay. It is not a second-publication authority for an archived-and-restored appearance.
4. Migration 012 customer package-duration authority requires an authenticated owner/publisher; it does not govern ownerless scraped appearances.

Therefore the mechanically available sequence is restore → draft → publish, but the duration for that new publication is not determined. Section 22 expressly requires stopping when existing lifecycle/publication machinery does not completely determine restoration. The user's no-calendar-disappearance rule does not itself establish a replacement publication duration or remove the existing deadline requirement.

### Smallest decision needed

For the SAME ownerless scraped appearance archived specifically after two successful complete source misses, does a genuine reappearance authorize a fresh 90-day publication starting at successful re-publication?

- Authorizing fresh 90 days allows the existing restore and publish transitions to be coordinated under a narrowly scoped source-reappearance authority, preserving identity/history and replay safety.
- Reusing only a remaining prior deadline can leave no valid duration when that deadline has passed, so it requires an additional expired-deadline rule.
- Indefinite publication would change the existing bounded-duration contract and is not inferred from the disappearance policy.

No restoration duration was selected. No source-update/run/miss implementation was started at this explicit policy stop. The next implementation checkpoint remains the same-source update/disappearance integration under the now-resolved whitelist and absence rules, with re-publication duration still unresolved.

### Work and verification this continuation

Only this cumulative report changed. Read-only, targeted lifecycle/publication inspection supplied the finding; no tests were run, no prior stages were reopened, and no completed checks were repeated. No product code, scraper, migration, schema, grants or configuration changed. No database connection/startup, production operation, network request, deployment, staging, commit or push occurred. Unrelated dirty work and completed Property Type changes remain intact.

The supplied continuation ends mid-sentence in Section 32 at “STOP if implementation”. No missing instruction was invented; the complete Section 22 stop rule directly governs this finding.

S10 PARTIAL — BLOCKED BY REAPPEARANCE PUBLICATION DURATION

S11 — COORDINATED CANONICAL CUTOVER HAS NOT STARTED.


## Continuation — reappearance duration resolved; source-run input checkpoint

**SAME-SOURCE REAPPEARANCE AFTER TWO-MISS ARCHIVAL RECEIVES A FRESH 90-DAY PUBLICATION PERIOD BEGINNING AT AUTHORIZED REPUBLICATION TIME.**

The governing duration is 7776000 seconds. Preserve the existing identity, prior source/lifecycle/publication history and the ordinary six-month presentation gate. Do not extend an old deadline, reuse remaining duration, or date publication from the source observation timestamp. Customer publication policy is unchanged. The preceding duration blocker is resolved, not reopened.

### Next concrete blocker: upstream evidence of a complete source run

Before implementing two-miss archival and its corresponding restoration authority, the narrow acquisition-output check found that current inputs cannot distinguish a complete source-wide inventory observation from a capped regional batch. No scraper was executed and no Property Type extraction work was revisited.

Evidence:

- Both scrapers use source namespace `encuentra24`, but run separately for Sale/Rent with a required `regionSlug` argument.
- Each has `MAX_LISTINGS = 120` and `MAX_PAGES = 20`. Sale stops collecting cards at the cap and slices the detail list to MAX_LISTINGS; Rent has the same bounded structure.
- Sale lines 1180–1253 and Rent lines 1270–1344 show regional acquisition and capped pagination. A zero-card page ends the loop but supplies no independently established completion proof.
- Sale lines 1283–1336 and Rent lines 1374–1427 skip invalid observations and catch individual listing errors, then write the collected rows. A written CSV therefore does not certify a successful complete run.
- The output carries per-observation UUID/time, not a source-run identity, defined coverage, completion/failure record, or complete observed-ID manifest. Exported accepted rows do not include every source identity encountered and skipped.
- `app/api/import-canonical-csv/route.ts` receives one observation per request; it cannot infer completed source inventory from the end of an upload or individual successful imports.

### Why this evidence is required

The authorized absence rule counts ONLY successful COMPLETE runs FOR THAT SOURCE. A regional Sale-only batch cannot establish absence of a Rent appearance or an appearance in another region sharing the same namespace. A capped/failed/filtered export likewise cannot prove non-observation. Counting such batches would violate the explicit failed/partial-run exclusions and could archive still-observed listings.

Neither source listing identity nor transaction/geography may be repurposed into a new source namespace merely to avoid this problem. No source coverage partition policy was invented. Missing run-completion evidence remains non-authoritative for absence.

### Smallest required contract decision/authorization

Authorize an upstream run-evidence contract identifying the source run, its defined coverage, all observed source listing IDs (separate from accepted canonical rows), and explicit complete/partial/failed status. Completion must have a trustworthy acquisition basis, not be inferred from CSV creation or asserted merely because a capped batch ended.

The unresolved coverage question is: **Should a qualifying Encuentra24 run aggregate all required regional Sale and Rent acquisitions before it can count as one complete run for the `encuentra24` source?** If absence is instead intended per separately defined coverage partition, that is a different scope rule and requires explicit authorization; it cannot be silently substituted for source-wide completeness.

Smallest coherent upstream adjustment would emit run/coverage/outcome and observed-ID evidence alongside observations, preserving cap/failure information and failing closed whenever complete coverage cannot be established. The existing caps are not removed or raised under this finding. Merely adding a boolean `complete` does not establish actual completeness. Designing acquisition coverage or a completion coordinator is outside the Property Type-only scraper adjustment previously authorized.

Alternatives/consequences:

- Authorize a trustworthy source-wide completion contract/coordinator: permits the already-decided two-miss policy once all required coverage is established.
- Keep current capped regional observations: positive observations can remain inputs, but these batches cannot authorize negative observations or source-disappearance archival.
- Explicitly choose coverage-scoped absence: requires defining stable scope membership and completion semantics rather than assuming them from geography/transaction filters.

### Implementation and verification disposition

Stopped under original S10 Section 4 (required upstream output change) and latest continuation Section 18 (new decision/scraper redesign boundary). The 90-day decision is recorded and accepted. Same-source update/run/miss/restoration integration remains unimplemented; no completion or new passing verification is claimed. This stop does not invalidate the completed Property Type repair or its 40 assertions.

Only this report changed during this continuation. No tests or previously completed investigations were rerun; no application/scraper/normalizer/migration/schema/configuration changes, database connection/startup, production/network operation, deployment, stage/commit/push, data purge or later-stage work occurred. Existing dirty work remains preserved.

S10 PARTIAL — BLOCKED BY SOURCE-RUN COMPLETENESS CONTRACT

S11 — COORDINATED CANONICAL CUTOVER HAS NOT STARTED.


## Final continuation — ingestion-side completion boundary implemented

**S10 CONSUMES TRUSTED SOURCE-RUN COMPLETION EVIDENCE.**

**S10 DOES NOT DETERMINE HOW A SCRAPER EARNS THAT COMPLETION ASSERTION.**

**WITHOUT VERIFIED COMPLETION, POSITIVE OBSERVATIONS ARE INGESTED BUT ABSENCE PRODUCES ZERO EFFECT.**

The previous source-run blocker is resolved by the user's explicit boundary correction. No further scraper inspection, execution or modification occurred in this continuation. No acquisition coverage policy was invented.

### Files changed in this continuation

- Added `supabase/migrations/023_source_observation_ingestion.sql`.
- Modified `lib/csv-source-ingestion.ts` to retain immutable raw evidence first, then call the atomic ingestion RPC. Invalid/absent monetary replacement and invalid/nonpositive/range measurement replacement are omitted rather than treated as CLEAR; canonical creation still requires its established valid monetary evidence.
- Added `scripts/verification/s10-source-ingestion.cjs`.
- Added `scripts/verification/s10-csv-adapter.cjs` for the directly affected adapter regression contract; the historical S7 test artifact was preserved.
- Updated this cumulative report in place.

No closed migration was edited. Completed Property Type scraper/normalizer work remains untouched.

### Minimal ingestion state and authority

Migration 023 adds private, RLS-enabled, direct-access-revoked tables:

1. `source_ingestion_state`: exact namespace/listing-ID key, unique canonical listing ID, successful presentation-refresh time, positive-receipt time, miss count 0–2 and the canonical revision of source-absence archival.
2. `source_ingestion_results`: retained-evidence-ID result receipt for whole-operation replay, including restoration/publication and presentation effects.
3. `source_run_completions`: immutable-by-application source/run key, asserted run-start and observed-ID payload, completion result and processing time. Service/browser roles cannot directly write this table.

Two SECURITY DEFINER functions with fixed `pg_catalog,pg_temp` search paths are executable only by `service_role`:

- `ingest_canonical_source_observation(evidence_id, translated_input)`.
- `complete_canonical_source_run(source, run_uuid, started_at, completion_json, observed_ids_json)`.

No browser completion endpoint was added. The existing observation endpoint still independently checks authentication and import-operator authority. Extra browser completion fields do not invoke the completion function. Trusted completion is a separate server authority, not a field promoted from ordinary CSV input.

### Positive ingestion and identity

Immutable raw source evidence is committed through the existing retention RPC before application. The new application RPC takes a source-scoped transaction lock and performs an exact namespace + source listing-ID lookup. It does not search geography, text, money, measurements, images or the listing population for candidates.

New appearances use the existing CSV canonical creation, initial external-reference completion and initial 90-day publication functions in one transaction, then establish ingestion state. Established S10 appearances use existing S3 canonical domain/source-observation machinery. Untracked legacy/older appearances are not silently adopted or reconciled; fresh canonical ingestion is the supported preparation path, consistent with the disposable-development-data decision.

Same retained observation replay returns the prior result before any canonical, presentation, miss or lifecycle effect. Raw observation changes under the same identity remain rejected by existing immutable retention. Source identity conflicts and stale source observations remain recorded by canonical machinery without overwriting current evidence. Transaction and Province/Canton conflict checks precede restoration. District handling remains delegated to the established geography authority.

### Update whitelist and raw evidence

Only valid money, exact Property/Construction Area, and valid nonempty source URL may update immediately. Sale uses current_price; Rent uses monthly_price, preserving original currency and monetary history. Missing/invalid replacement monetary evidence does not overwrite current money. Ranges, zero/nonpositive areas and ambiguous units are not manufactured into exact measurements or CLEAR operations.

Existing recorded sealed measurement rules are obtained server-side from membership origins and reapplied through S3; no browser-selected/default rule is introduced. Unclassified evidence remains unclassified. Other fact/semantic fields are retained as raw observation evidence but are not added to the automatic update whitelist.

Title, description and external image references are refreshed only when the single successful-presentation clock is at least six calendar months old. Each usable nonempty replacement is applied; unavailable/empty fields preserve their current values. A successful eligible replacement advances the clock; an all-empty/invalid attempt does not. Initial ingestion establishes the initial clock. Reappearance does not bypass it.

External images remain references in the existing pipe-separated representation, bounded to 100 URLs of at most 4096 characters. No bytes, image comparisons, AI, mirrors or storage operations are involved. Source URL refresh is independent of the six-month clock and never clears an existing URL on missing/invalid input.

### Trusted run completion

Only the literal JSON boolean `true` enables absence processing. SQL/JSON null, false, strings such as unknown/failed/partial/"true", objects and other unsupported completion values return `absence_applied:false` before any absence state changes. They do not break a prior miss sequence.

Verified assertions require a nonempty source namespace, UUID run identity, finite nonfuture run-start timestamp and an explicit observed-ID array. The array is bounded to 100,000 IDs / 16 MiB, each nonempty ID at most 256 characters. IDs are deduplicated/sorted before receipt comparison. A replay of the same source/run/payload returns its recorded result; changed payload under that run identity rejects. Previously unverified calls do not consume an authoritative completion identity. New verified completions with an equal/older start than a recorded completed run reject rather than apply out-of-order negative evidence.

The trusted producer owns the meaning and truth of completion and its source context. S10 neither derives completion from process success nor defines regional/Sale/Rent aggregation.

### Misses, archival and restoration

The completion function joins the explicit observed-ID set against only that namespace's registered ingestion states. Observed IDs reset misses. Absent eligible appearances receive one miss per distinct verified run. A positive observation received after the asserted run began is protected from that run's delayed absence claim. Failed/unverified calls do not increment/reset anything merely because a run occurred.

First miss leaves lifecycle unchanged. Second miss calls the existing canonical archive transition with factual reason `no longer observed at source`, records the archive revision and preserves history. It does not claim sold/rented/leased or replace publication expiration policy with a calendar disappearance rule.

A valid new positive observation resets misses even without verified completion. When the listing is still at the recorded source-absence archive revision, the operation composes canonical restore → evidence update → publish atomically. Publication uses 7776000 seconds from the actual publication operation. It neither extends the previous deadline nor uses the source observation timestamp as publication time. Previous archive/publication events remain immutable. A subsequent two-miss sequence starts again at zero. Unrelated/manual archive or changed archive revision is not silently overridden.

### Atomicity, concurrency and query shape

Positive application and verified completion share the same source-scoped transaction lock after the existing capacity-policy lock. Same-source operations serialize. Source lookup uses the existing exact identity index (confirmed in the canonical fixture). Completion expands the observed set once as a materialized relation and joins only tracked states under that source key; each affected canonical lifecycle transition uses the established machinery. No unrelated customer population, cross-source matching, analytical phases or scraper work is acquired/executed.

All canonical application, source state, presentation and receipt effects share one transaction. A failed final receipt rolls them back together; independently retained raw evidence survives. Completion failure rolls back misses and archive history together. Source-sized reconciliation remains database-local; no per-observation broad population retrieval loop was introduced.

### Focused verification — final results

- **61 integration assertions passed** using the actual new migration, actual TypeScript adapter/domain translator and existing canonical SQL chain in a newly named clone of the retained synthetic Unix-socket PostgreSQL fixture.
- The 61 include **three independent-session concurrency cases**: same-observation creation, same-run completion and same-observation restoration. Each converged without duplicate identities, misses or publication effects.
- Coverage includes new/same/cross-source identity; positive ingestion without completion; Sale/Rent money and currency history; exact areas; whitelist containment; six-month gating; non-wiping and empty-refresh clock behavior; missing/false/unknown/malformed completion; trusted/browser privileges; first/second misses; unverified-run neutrality; positive and run-observed resets; repeated archival/reappearance; exact 90-day duration from canonical publication; source-history preservation; stale observations; transaction conflict; replay conflicts; out-of-order completion rejection; positive-after-run-start protection; fixed function security; and source identity index availability.
- Failure injection after restoration effects but before its final result receipt proved lifecycle/revision/money rollback with raw evidence retention. Completion finalization failure proved miss/archive rollback. Both retries succeeded without duplicate effects.
- **25 directly affected offline adapter assertions passed**: raw/review separation, exact fractions/years/areas, frozen geographic alias pass-through, immutable observation metadata, retention-before-application, invalid envelope rejection, authentication/import-operator gates, streamed payload bounds and absence of direct browser listing inserts.
- **TypeScript --noEmit --incremental false passed.** New JavaScript test syntax and targeted diff whitespace checks passed.
- The previously completed **40 Property Type assertions remain historical completed evidence**, not rerun. The historical S7 CSV harness records the old RPC transport; the new S10 harness covers the changed transport without modifying/reopening closed artifacts.

Corrections during this new verification: a test-harness local variable shadowed the server-start flag; it was corrected and the disposable server stopped before resuming. A new SQL `images` local conflicted with the column name; renamed to `source_images` and the affected integration rerun passed. A forged-completion test was corrected to put arbitrary browser fields outside the strictly string-valued raw CSV envelope. No remaining failing assertion is known from these runs.

Verification limits: synthetic fixture schema/data, not live production catalog, PostgREST transport, browser end-to-end or production privilege verification. No prior S9 suite was rerun. TypeScript and offline route checks supplement, but do not constitute, deployment verification. Disposable PostgreSQL was stopped after the final run; no production connection occurred.

### Remaining work and stage disposition

**DEFERRED UPSTREAM ACQUISITION WORK:** a future trusted producer must establish trustworthy completion assertions. Current scraper batches do not activate absence accounting automatically. This is deliberately dormant negative-evidence behavior, not an unresolved S10 ingestion defect. Positive ingestion does not depend on that producer.

S11 retains coordinated deployment/cutover and previously recorded privilege closure. No migration was deployed. S12/S13, scraper redevelopment, cross-source physical-property deduplication and Phase14 remain outside this work. Existing development data was not inspected, repaired, reconciled or purged. No new source-status mappings, customer-duration policy, extra automatic mutable fields or classification rules were introduced.

The cumulative ledger's unresolved ingestion items—raw Property Type contract, same-source creation/update/retry, references/presentation policy, trusted run completion, miss accounting and same-ID restoration—are now implemented and locally verified within the authorized boundary. No additional unresolved S10 decision is established by this completed work. Earlier blocked sections remain historical checkpoints, not open findings.

S10 COMPLETE — CANONICAL INGESTION PREPARATION VERIFIED

S11 — COORDINATED CANONICAL CUTOVER HAS NOT STARTED.
