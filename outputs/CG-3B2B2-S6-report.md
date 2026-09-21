CG-3B2B2-S6 COMPLETE — CANONICAL READER COMPATIBILITY VERIFIED

## 1. Verdict

CG-3B2B2-S6 COMPLETE — CANONICAL READER COMPATIBILITY VERIFIED

## 2. Executive summary

Canonical readers now distinguish canonical authority from legacy compatibility. Migration 009 supplies controlled server reads; canonical populations use DTA membership; legacy acquisition is bounded before full retrieval; monetary and lifecycle readers respect their frozen authorities. Verification was offline and on disposable PostgreSQL. No production deployment occurred.

## 3. Reader inventory inspected

Reused the original inspection: monetary helper; shared Statistics matcher; Market/Explorer/Entity adapters; public selectors; PPM2 observation acquisition; geography request helpers; shared filter UI; package usage; three image routes. No new repository-wide architectural audit was performed.

## 4. Legacy authority patterns found

The inspected defects were the Sale >1 fallback, geographic text authority applied to canonical rows, PPM2 geographic re-resolution, historical deletion used as current state, and broad legacy acquisition. Final integration also corrected stale year projection and redundant Explorer-to-Entity canonical evidence acquisition.

## 5. Files created

- `lib/canonical-listing-reader.ts`
- `lib/canonical-population.ts`
- `scripts/verification/canonical-reader-boundary.sql`
- `scripts/verification/canonical-reader-closed-regression.py`
- `scripts/verification/canonical-reader-downstream.cjs`
- `scripts/verification/canonical-reader-import-graph.cjs`
- `scripts/verification/canonical-reader-lifecycle-apply.cjs`
- `scripts/verification/canonical-reader-public.cjs`
- `scripts/verification/canonical-readers.cjs`
- `supabase/migrations/009_canonical_reader_boundary.sql`
- `outputs/CG-3B2B2-S6-report.md` — this report.

## 6. Files modified

- `app/api/delete-listing-image/route.ts`
- `app/api/reorder-listing-images/route.ts`
- `app/api/update-listing-image/route.ts`
- `app/components/market-filters/types.ts`
- `app/components/market-filters/utils.ts`
- `lib/entity-engine.ts`
- `lib/explorer-engine.ts`
- `lib/listing-monetary-value.ts`
- `lib/market-engine.ts`
- `lib/package-usage.ts`
- `lib/price-meter-observation-loader.ts`
- `lib/public-listings-server.ts`
- `lib/statistics-engine.ts`

## 7. Files deleted

None.

## 8. Closed-artifact hashes before/after

All hashes below are identical before and after S6.

| Artifact | SHA-256, before = after |
|---|---|
| `scripts/verification/canonical-creation-authority.sql` | `f9a358b3b71fda10efc8c0a6227c4548bc1a38a4e1f64c5fe8e77bf28deaef88` |
| `scripts/verification/canonical-creation-concurrency.py` | `905c882dcaf5ccff7593ce9a18631564b3c2323971496cfe803595f9c917c23f` |
| `scripts/verification/canonical-domain-concurrency.py` | `781f98daebce7a29298166956bf69ae9343709265a98715e8e4441496358878b` |
| `scripts/verification/canonical-domain-machinery.sql` | `c50d7e4d205a642dc2852012f1bc18c146bdbe39e55200aea8b1b24e4e87455f` |
| `scripts/verification/canonical-foundation-concurrency.py` | `10f6b873b08cc564f62beb1b4c622361daae950e8738d16e40ffb5fef547112b` |
| `scripts/verification/canonical-foundation.sql` | `077423ceb6846e347f81e4638a991a7f96e088e20d87c0824489bf9fff052038` |
| `scripts/verification/canonical-listing-write.sql` | `9cd39f63e0f82d05cefb558d0954fe2ce77430766f751215baf92c5883d0a274` |
| `scripts/verification/commercial-capacity-application.cjs` | `0e4b04a2c03ddfcb2ac108c6f69e6273fcdad1b6344282b70d969fea4011c32a` |
| `scripts/verification/commercial-capacity-concurrency.py` | `fa31ac6a1408cbdc9eff8c6438862b829b93f0d5f14d883c317a66b4a86fd14c` |
| `scripts/verification/commercial-capacity-coordination.sql` | `78bfdc1539bce57d6f4664807cf9ff97240449327804e7e534ded11f3d4f6c60` |
| `scripts/verification/publisher-coordination-concurrency.py` | `009ba894feda950c4b5d06db298a652ad298851d56975eee59d29f524b52c0db` |
| `scripts/verification/publisher-coordination.sql` | `c45ca8f62369bf2e3d524e9d4e691003be753efd38ad4549a02644572347c513` |
| `supabase/migrations/003_canonical_listing_write_boundary.sql` | `6faa62f709971407113b82a0e6339e4501ce0f3fcd19956eb61b1b02f9f5c577` |
| `supabase/migrations/004_dormant_canonical_listing_foundation.sql` | `b028db71b00a1f0af24c773b077ebf75e0f6be08b40889a5fcac4b2b6bcd3604` |
| `supabase/migrations/005_dormant_publisher_coordination.sql` | `58a233408778aef4f2c53947db516dfc4b491b2503db47f8bc7d95be40508201` |
| `supabase/migrations/006_canonical_domain_machinery.sql` | `73ed1b776a787af61b35cf03cb91eb4e8135f13fff446e4f6a61be2a9721b891` |
| `supabase/migrations/007_canonical_creation_authority.sql` | `521e67d7c1ebd619c3b1d7afd4817b94542eba9775515c402c17e7e8fa3be0da` |
| `supabase/migrations/008_commercial_capacity_coordination.sql` | `4dfa770194f96f0b659b54deda8c31966dea4fc28353f74321adc31c724ffdc0` |

## 9. Canonical eligibility reader contract

Only canonical_domain_version === 1 enters canonical hydration. Legacy retrieval selects null canonical version. Missing requested canonical rows, malformed identities, missing P+C, inconsistent ancestry, duplicate singleton selections, and invalid canonical transaction identity fail closed.

## 10. Canonical Sale price behavior

Positive current_price is authoritative at 0.50, 1, 1.00, and ordinary larger values. Stale price_millions cannot override it. Missing canonical price stays absent.

## 11. Canonical Rent price behavior

Positive monthly_price remains authoritative; fractional values survive. Original denomination remains explicit CRC or USD.

## 12. Legacy monetary compatibility

The existing noncanonical compatibility branch remains, including its established millions fallback. No stored monetary values were rewritten.

## 13. Transaction identity behavior

Canonical retrieval accepts exact sale/rent and hydration rejects canonical aliases. Legacy buy/lease compatibility remains isolated, with a conservative database prefilter and the existing exact application matcher.

## 14. Canonical geography behavior

Requested official codes resolve to lossless ontology identities. Memberships bound canonical candidates; canonical evidence provides P+C(+D) and validated ancestry. Listing display text does not select canonical populations.

## 15. Province behavior

Canonical Province membership selects the Province population. Stale province text cannot change membership.

## 16. Canton behavior

Canonical Canton membership selects the Canton population. P+C terminal listings remain eligible.

## 17. District behavior

District is optional. P+C does not acquire invented District membership; P+C+D matches its District. Pejivalle 30403 is covered. Wrong ancestry fails closed.

## 18. Property-type behavior

The requested canonical property type is matched by ontology identity. Hydration requires exactly one canonical property-type selection and derives its compatibility label from the selected term, not stale listing text.

## 19. Semantic membership behavior

OR within a dimension and AND across dimensions are preserved. Analytical membership remains the derived membership relation. Semantic selection remains separately typed evidence; no universal ontology-over-fact rule was introduced.

## 20. Exact fact behavior

Typed exact/category/range evidence survives the reader boundary. Exact-compatible output fields use exact evidence only; categories and ranges are not converted to numeric observations. Canonical year evidence replaces the public year_built_range compatibility projection when read.

## 21. Measurement behavior

Existing exact property_area/construction_area values, area constraints, normalization and PPM2 mathematics remain unchanged. No midpoint, imputation, nearest band or new FX rule was introduced.

## 22. Lifecycle current-state behavior

Current state is listing_status. Historical deletion and expiration timestamps remain untouched and do not independently exclude restored or active listings.

## 23. Package usage repair

The active-listing usage query retains owner and active-status predicates and removes deleted_at IS NULL. Capacity and commercial coordination semantics were not changed.

## 24. Image operation repairs

Delete/update/reorder routes select listing_status, reject current deleted state, and guard updates against current deleted state. Authentication, ownership and image/storage logic remain otherwise unchanged. Tests performed no storage operations or image downloads.

## 25. URL/filter geographic identity

Shared geographic options emit official_code. Exact existing slug URLs remain boundary compatibility inputs. Missing legacy mapping fails closed instead of dropping geographic restrictions. Display labels are obtained from the same bounded lookup.

## 26. EN/ES behavior

Both languages use the shared value/label functions. Official identity is language-independent; localized option labels remain localized. Market titles use resolved labels rather than numeric codes. No filter interaction was changed into an analytical trigger.

## 27. Mixed canonical/legacy behavior

Disjoint canonical and legacy paths are merged deterministically by listing ID. Explicit duplicate-path testing confirms one result, with canonical evidence retained. Cached canonical evidence is never applied to a legacy row.

## 28. Shared matcher behavior

One shared matcher coordinates membership-bound canonical retrieval and request-bound legacy retrieval. Completeness-aware pagination, bounded ID chunks, stable ID order, transaction sovereignty and existing area calculations remain in place. Ontology filter terms are resolved once and reused across the two paths.

## 29. Statistics behavior

Statistics consumes the shared population. Its existing calculations remain unchanged. Requested geographic display labels are carried separately from analytical request identity.

## 30. Market behavior

Market continues through shared Statistics. Resolved request labels are used for titles; they are not substituted into population authority. No new market cache was introduced.

## 31. Explorer behavior

Explorer uses the shared Market result and passes already-loaded canonical evidence explicitly to Entity within the same call. Missing evidence is still retrieved; no persistent or module-level evidence cache exists.

## 32. Entity behavior

Geographic official-code requests use exact official_code lookup. Existing slug lookup remains available. Entity listing reads use public selectors with canonical discrimination/hydration and can reuse supplied same-request evidence.

## 33. PPM2 observation behavior

Canonical observations reuse established canonical geography and do not re-resolve listing text. Legacy rows use dictionary evidence bounded to selected legacy listing IDs. PPM2 requests no unrelated exact facts; a selected distance constraint requests the fact required to evaluate it. Analytical phases and mathematics were not redesigned.

## 34. PPM2 Apply-gate regression

Offline engine-boundary checks cover missing permits for filter-edit, refresh, prefetch, tab-navigation and URL-hydration scenarios: zero observation acquisitions. A valid permit reaches observation acquisition once; replay cannot acquire again. These are offline boundary tests, not a live browser session or a full analytical run.

## 35. Sale/Rent sovereignty

Canonical sale/rent queries remain separate; canonical buy is excluded. Mixed legacy compatibility does not mix Sale and Rent. Regression fixtures cover these cases.

## 36. Membership query behavior

Requested term IDs are batched; memberships are paged with exact counts. Canonical and legacy assignment queries are restricted to their respective row classes. Legacy assignment queries additionally use bounded geographic candidate IDs when geography is requested.

## 37. Query-shape report

Canonical path: bounded geographic request resolution → requested membership candidates → active/transaction-filtered listing chunks → canonical evidence batches → in-memory calculation. Legacy path: bounded request-to-compatibility mapping → paged legacy candidate-ID RPC → scoped memberships if requested → bounded listing chunks → existing exact compatibility filters. PPM2 adds only selected legacy dictionary batches, not a geography-universe read. Mixed requests execute the two disjoint paths and merge by ID. A genuinely unfiltered national request retains its explicit national scope; it is not a geographic request widened after filtering.

## 38. Query-count/boundedness results

Canonical evidence: ceil(C/25) RPC calls for C distinct requested canonical IDs; zero for C=0. Legacy dictionary: ceil(L/25) RPC calls for L selected legacy IDs; zero for L=0. Geography request mapping uses one bounded lookup per supplied selection, then one DTA hierarchy-resolution query when nonempty. Listing/membership calls depend on 25-item/encoded-size chunks and actual pages received; pages request 500 rows and use exact counts, so a short page is not treated as completion. Actual production wire counts were not measured.

## 39. Egress-risk assessment

No per-listing evidence/dictionary lookup or whole geographic dictionary acquisition was added. Canonical/legacy membership reads are disjoint, legacy full listing data is bounded first, and the demonstrated Explorer/Entity evidence duplication is removed. Output still grows with the explicitly selected population. No production byte-volume claim is made.

## 40. Server-only import result

The import-graph check covered 186 client entry points and 272 visited modules, with zero reachable server-only modules. Canonical acquisition remains in server-only modules; client filter utilities carry request values and labels only.

## 41. Authorization regression

Canonical and legacy RPCs are callable by the intended service-role server authority. anon/authenticated/PUBLIC execution is denied; direct canonical evidence-table SELECT remains denied. Existing route ownership/authentication checks and package gates were preserved. No raw canonical browser API was added.

## 42. Adversarial stale-text result

Passed: changing canonical listing geographic text leaves population membership unchanged; changing membership changes the selected population.

## 43. Adversarial stale-price result

Passed: canonical Sale 0.50, 1, 1.00 and ordinary positive amounts override stale legacy millions. Missing canonical price does not fall back.

## 44. Adversarial lifecycle-history result

Passed: restored draft with deletion history is not treated as currently deleted; active rows with expiration history pass the current-state guard. Currently deleted rows remain rejected.

## 45. Malformed canonical evidence behavior

Required malformed/missing evidence fails closed. Tested missing canonical response, missing Canton, wrong ancestry, canonical alias transaction and malformed boundary requests. Database constraints continue to enforce fact kind/type integrity.

## 46. Mixed-population deduplication

Explicit duplicate-path test passed. Canonical evidence wins the merged ID entry; legacy rows cannot gain canonical evidence from the request-local handoff.

## 47. S1 regression

Closed hashes preserved. Targeted database comparison confirms existing constraints, triggers, table security and functions unchanged; no full S1 suite rerun.

## 48. S2 regression

Publisher/capacity functions and security unchanged in the targeted comparison; no full S2 suite rerun.

## 49. S3 regression

Domain machinery, history protections and closed verification artifacts unchanged; no full S3 suite rerun.

## 50. S4 regression

Creation/owner/trusted authority functions and security unchanged; no full S4 suite rerun.

## 51. S5 regression

Commercial coordination and activation code unchanged. Across S1–S5, targeted comparison confirmed 38 functions, 27 table-security definitions, 147 constraints and 18 triggers unchanged.

## 52. S6 assertion/test count

Final named assertions: 59 shared reader/matcher/handoff; 13 downstream; 13 public/Entity/Explorer; 31 lifecycle/Apply = 116 offline. SQL: 23 canonical-boundary + 11 legacy-lookup + 11 security = 45. Total: 161 named assertions. Additional actual denied-role calls, import-graph validation, four catalog comparison groups, clean TypeScript checking and S6-scoped diff checks passed. Repeated executions are not added to these totals.

## 53. Corrections made during S6

Corrected a category fixture missing its required ontology level; optional-label access for the minimal local schema; missing test-only package-usage mock; a test request field name; conservative legacy transaction prefilter; duplicate evidence acquisition; stale year projection; unused fact acquisition; and fail-closed missing legacy mapping. An unverified option-ID type experiment was removed after it exposed an unrelated dormant parser type dependency. Rejected batch edits did not execute.

## 54. Unresolved defects

No S6-blocking defect remains from the required local verification. Production PostgREST transport, browser rendering and real egress volume were not exercised because production/application execution was outside this verification run. Offline query fakes and disposable PostgreSQL are the evidence basis.

## 55. Architectural contradictions

Both identified reader-access scope blockers were resolved by explicit user authorization. No frozen S1–S5 decision was reopened. No new unresolved architectural decision remains.

## 56. PRE-CUTOVER obligations

Deploy the additive reader boundary and compatible application readers together through a separately authorized rollout. Keep canonical writer activation gated until remaining writer adaptation/reconciliation/cutover obligations are satisfied. Do not treat local verification as production deployment or legacy reconciliation.

## 57. S7 obligations

Writer adaptation, bypass closure and any S7-specific verification remain future authorized work. None started.

## 58. S8 obligations

Legacy reconciliation/backfill remains future authorized work. S6 creates no canonical memberships, provenance or canonical flags for legacy listings.

## 59. Exact S7 prerequisites

Explicit authorization and the governing S7 prompt; acceptance of this S6 result; retention of closed artifact integrity and remaining deployment/cutover gates. S6 completion does not itself authorize S7.

## 60. Whether S6 may be CLOSED

Yes, as locally implemented and verified reader compatibility. This does not authorize deployment or canonical writer activation.

## 61. Whether S7 may begin

Not under the current authorization. It requires a separate explicit instruction.

## 62. Git status before/after

The original /private/tmp/cg-s6-before.json baseline was retained. Of 5,303 pre-existing files, 13 were changed by S6 and 5,290 remained byte-identical. Ten implementation/test files plus this report were added; none deleted. Original unrelated dirty/untracked work was preserved. No staging, commit or push occurred.

## 63. Confirmation no closed artifact changed

Confirmed by before/after SHA-256 comparison of migrations 003–008 and their closed verification artifacts.

## 64. Confirmation no writer/commercial artifact changed

No canonical listing writer, commercial mutation machinery, Sale/Rent writer/editor, scraper, CSV, duplicate/token writer or publication/renewal adaptation changed. The three expressly authorized image routes changed only their lifecycle reader/query guards.

## 65. Confirmation no production connection

Confirmed. Only offline fakes and socket-only disposable PostgreSQL were used. The disposable database was stopped after verification.

## 66. Confirmation no deployment

Confirmed.

## 67. Confirmation no stage/commit/push

Confirmed.

## 68. Confirmation S7 not started

Confirmed.

## 69. Canonical reader boundary design

read_canonical_listing_evidence accepts explicit UUID batches and requested fact/semantic dimensions. It returns only canonical rows and the identity/evidence needed by authorized server readers.

## 70. Reader boundary privilege model

postgres-owned STABLE SECURITY DEFINER functions; fixed pg_catalog search_path; schema-qualified relations; no dynamic SQL; no caller-selected table/column; no PUBLIC/anon/authenticated EXECUTE. Only the intended service-role server can execute the public readers. The private normalization helper is not callable by application roles.

## 71. Reader boundary result shape

Canonical row identity/version; typed facts with exact/category/range fields; semantic dimension/term identity; narrowly required geographic identity and labels. Ontology IDs and numeric evidence are serialized as decimal strings. No actor/source provenance, receipts, lifecycle/monetary history, conflicts or private rule machinery is returned.

## 72. Reader boundary bounds

Canonical evidence and legacy dictionary calls accept 1–25 explicit UUIDs. Canonical dimension allowlists are capped at five fact and six semantic dimensions. Legacy candidate calls require explicit geographic selection and bounded selection arrays. Legacy dictionary responses exceeding 1,000 matching entries fail instead of truncating.

## 73. Reader boundary query shape

The canonical RPC reads only the requested listing identities and requested fact/semantic dimensions, plus their geographic memberships. The legacy candidate RPC returns matching IDs rather than full listing rows. The legacy dictionary RPC considers only the supplied noncanonical listing IDs and returns matching dictionary candidates for the unchanged compatibility resolver.

## 74. Reader boundary security tests

Authorized role success, actual denied-role calls, no PUBLIC execute, direct-table denial, safe function properties, oversized/empty/null/malformed requests, canonical exclusion from legacy, unrequested evidence exclusion, lossless bigint and typed evidence preservation passed. Functions contain read-only bodies and are STABLE.

## 75. Migration 009 summary

Existing canonical function preserved while the explicitly authorized legacy functions and private normalization helper were added. Before legacy extension: f14ec96dfe7c5c8f283681da95ed0b97fd2b70ba8b1cf126e5ce50020d7a07a2. Final: ca4d9ac57c0fb5eaf1fb988ad53ed589379cd17a4ce8d0e12fcd85cb90d28173. Integrated migration was applied and verified only in disposable PostgreSQL. No Migration 010 was created.

## 76. Model C evidence access

Facts remain exact/category/range; property-type selection remains semantic evidence; population membership remains a derived relation; human-readable fields remain compatibility/display projections. Common public readers request the four numeric fact dimensions they display; distance evidence is requested when its filter needs it; PPM2 otherwise requests no unrelated exact facts.

## 77. Underlying table restrictions

Confirmed unchanged. service_role receives function EXECUTE, not direct SELECT on listing_fact_evidence or listing_semantic_selections. Existing table RLS/ACL definitions remain unchanged.

## 78. Resume confirmation

S6 resumed from its original baseline and current worktree. Completed migrations, reader work and successful evidence were retained. No S1–S5 restart, worktree reset or full closed-suite rerun occurred.

## 79. Cumulative chronology

Before the first blocker: inspection and original baseline only. After canonical-reader authorization: Migration 009 canonical boundary, server adapter, money/lifecycle repairs, matcher and downstream work; initial 23 SQL, 26 core offline, 11 downstream and 9 public checks. Before legacy authorization: 11 temporary legacy assertions passed; repository integration was rejected and did not run. After explicit legacy authorization: functions integrated, bounded acquisition wired, lifecycle/Apply harness completed, security and catalog regression verified. After the final interruption: finished handoff missing-evidence/isolation tests and remaining projection/query guards, then finalized the affected tests and repository review. These stages are cumulative, not separate S6 runs.

## 80. Explorer → Entity handoff before/after

Before: a shared market population with C canonical rows required ceil(C/25) evidence RPCs; Entity could then request ceil(E/25) more for E canonical rows, including overlap. After: Entity requests only M genuinely missing IDs, requiring ceil(M/25); an entirely overlapping set adds zero evidence RPCs. The map is explicitly passed within the same call, never persisted or installed globally. Tests verify missing-only acquisition, exact/category/range preservation, legacy separation, unrequested-row exclusion, no mutation of the supplied map and fresh acquisition in a separate request.

## 81. Verification limits and final state

No live production request, local website startup, image storage operation or full browser session was used to claim success. Query counts are source-level/batched models plus fake-client observations, not measured production wire volume. Existing unrelated whitespace findings were left alone; S6-scoped diff checking and TypeScript checking are clean. The disposable database is stopped.

CG-3B2B2-S6 IMPLEMENTATION COMPLETE — S7 NOT STARTED
