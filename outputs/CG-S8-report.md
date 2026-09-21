# CG-S8 — Legacy writer retirement / canonical cutover preparation

## A. Verdict

**S8 COMPLETE — LEGACY WRITER RETIREMENT / CANONICAL CUTOVER PREPARATION VERIFIED**

Bounded application retirement completed against the current dirty worktree. S1–S7 were not reopened. S7's historical verification limitations remain unchanged. Existing listings were not read from a database, repaired, reconciled, migrated or purged. The previous reconciliation roadmap is superseded by the user's disposable-development-data decision.

## B. Operational legacy mutation inventory

| Path/function | Runtime purpose | S8 classification/action | Evidence |
|---|---|---|---|
| app/utils/updateListing.ts / updateListing | Legacy branch of shared Sale/Rent edit forms | RETIRE NOW: unconditional rejection; removed legacy DML and activity write | Six executable offline input cases reject before database access |
| app/utils/canonicalCustomerLifecycle.ts / changeCustomerListingLifecycle | manageListing unpublish/archive/restore/delete | RETIRE NOW: removed explicit-null direct-update branch; canonical RPC unchanged |20 affected lifecycle checks, including legacy rejection and canonical retry |
| app/api/publish-existing-listing/route.ts / POST | My Listings publication | RETIRE NOW: canonical branch unchanged; all noncanonical rows rejected before legacy commercial lookup/DML | Affected publication caller checks |
| app/api/renew-listing/route.ts / POST | My Listings renewal | RETIRE NOW: canonical branch unchanged; all noncanonical rows rejected before legacy commercial lookup/DML | Affected renewal caller checks |
| app/api/permanently-delete-listing/route.ts / POST | Former legacy-only physical deletion | RETIRE NOW:410 response, no authentication/database/storage imports or operations | Three executable response cases; dependencies forbidden |
| app/components/ListingOperationsCenter.tsx | Shared EN/ES action availability | RETIRE NOW: edit/publish/renew/unpublish/archive/restore/remove require numeric canonical1; permanent-delete unavailable; existing canonical Duplicate gate preserved |32 executable discriminator checks, permanent-control check |
| Shared Sale/Rent edit-form legacy dispatcher | Directly visited old legacy edit pages | GUARD NOW: dispatcher remains but reaches retired updateListing guard; canonical dispatch preserved | Two source contracts plus executable guarded helper tests; no reader/form redesign |
| Older creation/publication/lifecycle utilities and blanket ontology writer | Already retired S7 paths | NOT S8: existing entry guards preserved; no reopening |
| Canonical token creation, CSV ingestion, duplicate and canonical edit | Surviving canonical operation | NOT S8: no changes to these established authorities |
| Shared media upload/detach/reorder and temporary-token cleanup | Media-only operations needed by canonical listings | NOT S8: not legacy-only machinery; retain existing S7 boundaries, no domain-authority changes |
| Reader compatibility and historical/test/manual utilities | Read/test/nonoperational behavior | NOT S8; not investigated or modernized |
| Broad application database privileges and coordinated authority cutover | Database enforcement | DEFER TO S11; no privilege changes performed |

Reachability confirmed within the known surface: Sale/Rent forms call updateListing only in their legacy branch; manageListing's four actions call the lifecycle helper; MarketHubMyListings calls publish-existing, renew and permanent-delete endpoints. This was not a new repository-wide inventory.

## C. Exact changes

Modified:
1. app/utils/updateListing.ts — retired legacy-only edit entry with an unconditional explanatory error.
2. app/utils/canonicalCustomerLifecycle.ts — removed legacy status update, retaining canonical auth/revision/receipt dispatch.
3. app/api/publish-existing-listing/route.ts — removed legacy publication execution after canonical branch; return409 for noncanonical rows.
4. app/api/renew-listing/route.ts — equivalent legacy renewal retirement.
5. app/api/permanently-delete-listing/route.ts — replaced legacy physical-delete implementation with410 endpoint. Administrative purge is a separate authority and is not implemented.
6. app/components/ListingOperationsCenter.tsx — canonical-only action predicates; permanent-delete control disabled.
7. scripts/verification/customer-lifecycle.cjs — replace obsolete legacy-success expectation with rejection-before-write expectation.
8. scripts/verification/customer-publication-callers.cjs — replace legacy-predicate-presence expectation with actual legacy rejection/no-commercial-lookup checks.

Created:
- scripts/verification/s8-legacy-retirement.cjs — focused offline retirement verification.
- outputs/CG-S8-report.md — this report.

No repository files deleted. No migrations or canonical SQL/core adapters changed. Edits were restricted to these named files; unrelated existing dirty work was not reset or cleaned. A small before-hash record for initial target files was written to /private/tmp/cg-s8-before.json; it is not a whole-repository baseline or an S7 historical attestation.

## D. Verification

-44 new focused retirement checks passed: legacy editing rejects before database access, permanent deletion returns410 without consuming input, shared action predicates reject null/missing/string1 and accept numeric1, canonical edit dispatch remains.
-20 affected lifecycle checks passed: four canonical mappings, lossless revision, no canonical direct DML, stable lost-response retry, auth/ownership/unknown rejection, explicit-null retirement, publication exclusion and active caller integration.
-40 affected publication/renewal caller checks passed: actual route/helper execution with fake clients; canonical RPC, replay, authority exclusion, error handling and legacy rejection before DML/package lookup.
-TypeScript --noEmit --incremental false passed.
-Server-only import graph passed:186 client roots,272 modules,zero failures.
-Targeted diff whitespace check passed.

An initial mechanical route edit stopped at an inner catch, leaving invalid syntax. TypeScript and the caller harness detected it. Corrected removal through the outer catch; final TypeScript and caller checks passed. No frozen semantics changed to address that edit error.

Tests use actual transpiled application code with fake clients and forbidden network access; UI predicates are executable source-derived checks, not rendered browser tests. Existing canonical database machinery was unchanged, so no new SQL/concurrency suite or PostgreSQL startup was necessary. No broad build that could initialize application data access, mega-audit or S9 performance verification was run. Changes remove legacy retrieval/mutation branches; no population query, cache, nested acquisition or analytical engine was added or changed.

## E. Remaining transition machinery

No executable Class-B domain edit/publication/renewal/lifecycle/permanent-delete branch remains in the bounded retired paths. Legacy form dispatch/error presentation and read/display compatibility remain; they cannot restore the removed mutation authority. Shared media paths remain necessary canonical functionality, not legacy-only domain writers. Already-dead utility bodies/guards were not cleaned up.

S11 still owns coordinated database privilege/authority cutover. Application retirement does not claim current service-role/broad direct database privileges have been revoked. No database FK was changed, no data purge performed, and no administrative deletion workflow introduced. Broader reader/dead-code retirement belongs outside this bounded S8 stage.

## F. Out-of-scope findings

Class-D verification infrastructure debt and missing historical S7 baselines remain unchanged and do not block this bounded S8 result. Existing legacy edit pages may still display old values; saving fails through the retired guard. No effort was spent preserving or analyzing disposable listing contents. S7 source/media/history rules remain authoritative.

## G. Architectural decisions

**No new architectural/product decision required.**

Retirement follows the explicit S8 authorization that legacy-only mutation of disposable development listings is no longer needed. Canonical deletion/history, money, geography, Model C, publication duration/capacity, ingestion and source identity remain unchanged.

## H. Next stage

**S9 — FULL CANONICAL SYSTEM VERIFICATION HAS NOT STARTED.**

No production access, deployment, purge, schema/privilege change, staging, commit or push.
