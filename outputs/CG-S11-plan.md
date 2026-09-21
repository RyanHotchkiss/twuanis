# CG-S11-P — Coordinated canonical cutover plan

Planning only. This document authorizes nothing. S1–S10 remain closed; no prior verification was rerun. Only this planning document is a repository change in this pass.

## A. Executive cutover summary

S11 must make the database enforce the canonical operations already used by the application: close direct listing/membership mutation, preserve narrow canonical RPC execution, close effective destructive privileges, remove disposable application data without deleting reference authority, and release compatible application/database versions together.

**Plan status: prepared, with mandatory catalog-evidence and purge-scope gates before execution.** This is not a claim that live privileges, migration deployment or the full deployed FK graph have been verified. No database was connected. The supplied database exports are historical evidence; the current worktree is implementation evidence, not a deployed catalog. `twuanis_public_schema.sql` is empty, so it cannot establish the missing catalog facts.

A concrete remaining application dependency exists: `app/api/reorder-listing-images/route.ts` directly updates `public.listings.images` and `updated_at` through `supabaseAdmin`. A narrow reorder RPC preserving existing ownership, multiset and optimistic comparison rules must precede direct UPDATE revocation. No repair was made during planning.

Canonical history DELETE/TRUNCATE guards and RESTRICT foreign keys mean an administrative purge cannot simply delete listings or invoke customer deletion. Plan a bounded owner-only, dependency-ordered DELETE transaction with only the specifically identified immutable-data guards temporarily disabled and restored before commit. No permanent FK changes and no blanket CASCADE.

## B. Current authority state

Evidence used: cumulative S8/S9/S10 reports; Migration 003 public wrappers; canonical schema/ACL/FK/function declarations in Migrations 004–023; the existing image-reorder route; supplied query-54 through query-60 export headers and query-60 ACL records. No scraper inspection, row-content audit, live catalog lookup or historical utility inventory.

| Area | Established current repository / recorded evidence | What is not established |
|---|---|---|
| Legacy application writers | S8 retired legacy edit, lifecycle, publish, renew and permanent-delete branches; permanent-delete returns 410 | Deployed application version |
| Direct listing/membership ACLs | Broad closure explicitly deferred by S8; reorder still relies on service table UPDATE | Effective deployed table/column grants, inheritance, ownership and RLS for these tables |
| Foundation canonical tables | Migration 004 enables RLS and revokes all table access from PUBLIC/anon/authenticated/service_role; private helpers similarly inaccessible | Whether exact current definitions/ACLs are deployed without drift |
| Canonical public RPCs | Role-specific EXECUTE declarations in 007–023, mostly SECURITY DEFINER, postgres-owned deployment model | Current target object owners, inherited EXECUTE and overloads |
| Old CG3 public wrappers | Migration 003 explicitly revokes EXECUTE from PUBLIC and all three API roles | Whether later target-side grants reopened them |
| S10 | Migration 023 plus adapter verified locally; completion is service-only with no public completion endpoint | Deployment status; upstream trusted completion producer intentionally absent |
| Entitlement authority | S9 supplied definitions establish current-user entitlement resolution; preserve its logic and RLS | A fresh target catalog snapshot |
| TRUNCATE | Eight recorded anon/authenticated pairs below; query-60 additionally records service_role destructive grants on three authority tables | Current effective closure or inheritance paths; no browser SQL/TRUNCATE route has been established |

No environment is identified here as production. Deployment target identity is an execution prerequisite.

## C. Required cutover actions

| Action | Classification | Disposition |
|---|---|---|
| Retire legacy customer domain/lifecycle/permanent-delete branches | ALREADY SATISFIED in worktree | Preserve S8 guards; verify deployed version at cutover, do not redo S8 |
| Preserve canonical money, Model C, geography, source identity and S10 semantics | ALREADY SATISFIED implementation | Cutover changes authority, not semantics |
| Replace surviving reorder direct UPDATE with a narrow RPC | REQUIRED | Same image multiset, no added/removed bytes/URLs, owner and nondeleted-state checks, exact prior-image concurrency guard |
| Close listing and membership direct DML | REQUIRED | Per-object table and column grants, all effective API-role paths |
| Close recorded effective TRUNCATE grants | REQUIRED | Include all eight recorded pairs, plus evidenced service-role paths where no runtime truncation is legitimate |
| Verify/install canonical definitions and required EXECUTE allowlist | REQUIRED | Compare target manifest with worktree; apply only missing approved migrations, not blanket replay |
| Ensure CG3/other replaced exposed mutation RPCs cannot reopen old authority | REQUIRED verification / conditional revoke | No new grant to dormant wrappers |
| Administrative disposable-data purge | REQUIRED for intended fresh-data cutover | Scope approval and complete FK/trigger catalog first |
| Resolve mixed administrative/reference records before purge | REQUIRES USER DECISION | Section N |
| Produce scraper completion evidence | NOT S11 | Deferred upstream acquisition; absence remains fail-closed |
| Cross-source deduplication, legacy reader removal, Class-D utility modernization | NOT S11 | No operational writer justification to reopen them |
| Delete auth identities or redesign customer deletion | NOT S11 | Auth identity deletion is not necessary |

## D. Database privilege closure matrix

Notation: A=anon, U=authenticated, S=service_role; I/U/D/T=INSERT/UPDATE/DELETE/TRUNCATE. “Unknown” is not “denied.” A table grant and each column grant must both be checked. Desired denials include PUBLIC, inherited role paths and SET ROLE reachability; RLS alone does not close TRUNCATE, and BYPASSRLS does not replace a missing SQL privilege.

| Exact object(s) | Roles | Current evidence | Desired | Planned operation / dependency |
|---|---|---|---|---|
| public.listings | A,U,S; PUBLIC/inherited sources | Effective ACL unknown; S direct UPDATE required by current reorder route | No direct I/U/D/T, including column INSERT/UPDATE; preserve necessary SELECT under existing policy | Revoke named mutation grants from table and every explicitly granted column; remove effective inherited sources on this object. First deploy narrow reorder RPC/caller and confirm canonical writers |
| public.listings_ontology_terms | A,U,S; PUBLIC/inherited sources | Closure deferred; exact current ACL unknown | No direct I/U/D/T; authorized reads survive | Revoke mutation table/column grants. Canonical definer owner retains necessary DML; preserve read access required by bounded analytics |
| public.listing_semantic_selections, listing_fact_evidence, listing_membership_origins | A,U,S,PUBLIC | Migration 004 revokes ALL | Preserve denial; no direct write or browser evidence exposure | Reassert only if catalog drift; preserve service canonical read RPC, not broad grants |
| public.canonical_operation_receipts, listing_source_observations, source_identity_conflicts, listing_lifecycle_events, listing_monetary_events | A,U,S,PUBLIC | Migration 004 revokes ALL; immutable guards on designated history tables | Preserve denial; history written solely through canonical authority | Revoke drifted table/column privileges; preserve guards and owner execution |
| public.publisher_accounts, capacity_policy_guard | A,U,S,PUBLIC | Migration 004 revokes ALL | Same | Preserve private initialization/locking helpers; never grant callers direct mutation |
| public.listing_classification_rule_sets, listing_classification_rules; public.ontology_terms | A,U,S,PUBLIC | Rule-table denial declared; ontology current ACL unknown | No API-role direct mutation of sealed/reference authority; retain required ontology SELECT | Verify rule guards/seals; close ontology mutation grants if present, subject to catalog-confirmed legitimate admin owner path. No rule/term edits |
| All private tables created in 010–023, listed in G | A,U,S,PUBLIC | Local migrations deny direct access | Same | Preserve schema/table/sequence denial and public wrapper access only |
| public.entitlements | A,U | query-60 direct TRUNCATE grant to each | Effective T=false | Explicit per-role TRUNCATE revocation plus PUBLIC/inherited source closure; preserve SELECT/RLS |
| public.package_entitlements | A,U | query-60 direct TRUNCATE grant to each | Effective T=false | Same |
| public.user_subscriptions | A,U | query-60 direct TRUNCATE grant to each | Effective T=false | Same; preserve authenticated own-row SELECT and commercial RPC execution |
| public.saved_analyses | A,U | S9/user-supplied evidence: effective TRUNCATE=true for each; origin not freshly established | Effective T=false | Resolve grant provenance then revoke all effective T paths; preserve authenticated own-row CRUD policies and anon SELECT denial |
| public.entitlements, package_entitlements, user_subscriptions | S | query-60 direct TRUNCATE=true | Effective T=false | Revoke T from S and any effective sources; postgres admin remains separate |
| Same three query-60 tables | A,U,S | Direct REFERENCES and TRIGGER also recorded | No unnecessary API-role REFERENCES/TRIGGER authority on these authority tables | Include narrowly scoped revocations after confirming no intended operational dependency; not a database-wide hardening exercise |
| public.user_subscriptions | S | query-60 I/SELECT/U/D grants | Preserve only actual surviving commercial requirement; do not assume all direct DML needed | Bounded caller/catalog preflight distinguishes definer-only writes from any remaining caller DML. Do not blindly remove a required operational path or preserve an unreviewed bypass |
| public.saved_analyses | S | Current T grant unknown | No operational T | Verify and close if effective; do not invent a historical finding |

Known eight S9 pairs are exactly the Cartesian product {entitlements, package_entitlements, user_subscriptions, saved_analyses} × {anon, authenticated}. Query-60 proves direct grant origin for the first six pairs; saved_analyses effective authority is recorded but grant origin remains a preflight fact.

Revoke unnecessary grant options as well. Do not remove owner authority from the trusted SECURITY DEFINER owner. If an API role owns a protected object or can assume its owner role, per-object REVOKE alone is insufficient: include ownership/role-path correction in the reviewed target-specific change set. Do not globally revoke a shared role or change default privileges on unrelated public objects. New cutover RPCs must revoke default PUBLIC EXECUTE in their creation transaction.

## E. Canonical RPC/function authority matrix

The following names identify exact functions in the numbered migration sources. During execution, resolve their full signatures/overloads to regprocedure and compare definitions before applying ACLs; do not revoke an arbitrary name across unknown overloads. SD=SECURITY DEFINER. Retained table writes execute as the trusted owner, not by granting callers direct table DML.

| Functions | Purpose / caller | Post-cutover EXECUTE / security | Owner table access required |
|---|---|---|---|
| create_customer_canonical_listing; mutate_customer_canonical_listing; edit_customer_canonical_listing | Customer creation/domain edit/content edit and lifecycle callers; final definitions 007/015/016 | authenticated only; SD; auth.uid/ownership/revision checks | Listings, canonical facts/semantics/origins/receipts/history; private edit commands and publisher coordination |
| publish_customer_canonical_listing | publish-existing / renew routes | authenticated only; SD; explicit package duration and capacity | Listings, lifecycle/receipts, customer_publication_commands; read packages/limits/subscriptions |
| prepare_customer_duplicate | canonical duplicate caller | authenticated only; SD | New listing/canonical evidence and duplicate_commands |
| attach_customer_duplicate_media | trusted duplicate-media completion | service_role only; SD | Listing presentation and duplicate command state; retain existing ownership/retry checks |
| prepare_token_canonical_listing; get_token_canonical_operation; attach_token_canonical_media | token server workflow | service_role only; SD | listing_publish_tokens, token_creation_commands and canonical creation/media objects |
| publish_token_canonical_listing | authenticated token publication | authenticated only; SD | Existing customer publication authority, token state |
| retain_csv_source_evidence; ingest_canonical_source_observation | import endpoint after independent operator gate | service_role only; SD | csv_source_evidence; source_ingestion_state/results; established canonical creation/update/reference/lifecycle tables |
| complete_canonical_source_run | future trusted completion producer, no browser endpoint | service_role only; SD | source_run_completions/state and canonical archival machinery; no scraper authority |
| create_csv_canonical_listing; complete_csv_source_references; initially_publish_csv_listing | Existing CSV chain, called internally by S10 | Current service_role EXECUTE declared, SD | csv_initial_publication, retained evidence and canonical creation/publication; keep for coordinated compatibility unless bounded caller evidence authorizes tightening external access |
| create_trusted_canonical_listing; mutate_trusted_canonical_listing | Trusted canonical authority and internal CSV/other approved server paths | service_role only; SD | Canonical tables/private machinery; no browser grant |
| prepare_ordinary_upload; get_ordinary_upload; attach_ordinary_upload | Ordinary media server routes | service_role only; SD | ordinary_upload_operations and listing media fields |
| detach_listing_image; get_image_detach_operation; confirm_image_cleanup | Image detach/cleanup routes | service_role only; SD | image_detach_operations and listing media; storage authority remains separate |
| claim_abandoned_listing_token | Existing trusted cleanup job | service_role only; SD | listing_publish_tokens; no canonical listing deletion |
| Proposed narrow reorder RPC (name/signature assigned at implementation) | app/api/reorder-listing-images/route.ts | service_role only; SD; mandatory authenticated-owner input from server, owner/state/prior-images/multiset rechecked in DB | Only images/updated_at on one owned listing; no general JSON patch |
| read_canonical_listing_evidence(uuid[],text[],text[]) | Server canonical reader | service_role only; SD, read-only SQL body | SELECT on canonical evidence/ontology/listings; no browser grant |
| read_legacy_geographic_candidates; read_legacy_geography_dictionary | Retained read compatibility, not writer authority | Existing service_role read execution; no expansion | SELECT only; removal is later-stage work |
| is_current_user_import_operator | Import endpoint authenticated client | authenticated only; SD | Read private operator grants; do not grant browser grant-management authority |
| current_user_has_entitlement | Existing PPM2 server authorization | Preserve evidenced authenticated execution and current-user identity semantics | Existing entitlement mapping/subscription reads and RLS/security context; no redesign |
| approve_sinpe_payment; activate_purchase; assign_default_market_package | Payment reviewer, trusted purchase activation, auth trigger | 008: authenticated reviewer-gated approval; service_role activation; trigger-only default assignment; SD | Commercial transactions/subscriptions plus publisher coordination; no direct listing lifecycle side effects |
| Private s3_command, s4_create_core, s4_domains, geographic writer, rule sealing and publisher helpers | Internal composition only | No API/PUBLIC EXECUTE or private schema USAGE; invoker/definer details retained | Owner internal access; never expose helpers to recover caller privileges |
| write_my_listing_canonical(uuid,text,text,text,text,text); write_listing_canonical_server(uuid,text,text,text,text,text) | Dormant Migration 003 wrappers superseded by later canonical architecture | Keep EXECUTE denied to PUBLIC/A/U/S, as migration declares | Owner may retain object; do not activate these as a cutover shortcut |

Current local grants match these declared allowlists; **effective deployed grants are not certified**. Preserve narrow functions rather than handing service_role broad listing/table rights. No general RPC audit is proposed.

## F. Class-B compatibility closure

S8 already removed operational legacy domain edit, publication, renewal, lifecycle and physical-deletion branches in updateListing, canonicalCustomerLifecycle, publish-existing-listing, renew-listing, permanently-delete-listing and their controls. Do not rewrite those completed paths.

At cutover confirm the deployed build contains these exact retirements and that old clients receive guarded failures. Catalog-check the dormant CG3 wrappers for effective denial; if a target-side historical grant exists, revoke it. Reader compatibility, dead bodies and Class-D verification utilities are not operational write blockers and are not modernization targets.

Image reorder is surviving legitimate media work, not a reclassification of S8 as incomplete. It requires a database boundary before S11 closes its table privilege. The new RPC must preserve its current behavior: authenticate in the server route, validate ownership, reject deleted listing, require the exact existing image multiset including multiplicities, and compare prior stored images to prevent lost updates. No download, replacement, detach or storage deletion is authorized by reorder.

## G. Disposable-data purge plan

This is administrative removal of test/application rows, not customer deletion and not canonical reconciliation. Auth users need not be deleted; keep auth identities outside purge. No old listing/saved-work/subscription data migration or preservation pipeline is planned.

### Preserve

Schema, functions, indexes, constraints and policies; ontology_terms and official DTA codes; listing_classification_rule_sets/rules; classification_seals; accessibility_identity; capacity_policy_guard control row; packages, package_limits, entitlements, package_entitlements and legitimate commercial reference definitions. Preserve administrative import/reviewer authority until its scope is decided below. Do not remove configuration merely because an application FK points at it.

### Remove disposable rows

All listing inventory and its current evidence, receipts, histories, source conflicts, source-run and source-ingestion state; test saved analyses/searches/favorites; test activity/notifications; test purchase/payment/subscription and listing-derived commercial activity; draft token/media-operation state. No row-by-row analysis of listing contents is needed.

Known exact canonical tables and dependency order (children before parents):

1. Private source_ingestion_results before csv_source_evidence. Private source_run_completions and source_ingestion_state may be emptied before listings. source_ingestion_state is not a source/reference definition table.
2. Private duplicate_commands (both source_id and listing_id), customer_content_edits, customer_domain_edits, customer_publication_commands, token_creation_commands, ordinary_upload_operations and image_detach_operations before their listing/receipt/token parents. csv_initial_publication before canonical_operation_receipts and csv_source_evidence because it references all three.
3. public.source_identity_conflicts and public.listing_monetary_events before listing_source_observations; listing_monetary_events and listing_lifecycle_events before canonical_operation_receipts. Then listing_source_observations and canonical_operation_receipts. All these listing children precede listings.
4. public.listing_membership_origins, listing_semantic_selections, listing_fact_evidence and listings_ontology_terms before listings. Do not delete referenced ontology/classification rules.
5. External-to-canonical application descendants: purchase_request_events/payment/activation/promotion/add-on histories, saved-work/favorite/activity/notification rows and any other catalog-confirmed listing descendants, child-first. public.purchase_requests.listing_id → listings.id is a known edge; it is NOT the complete graph. Use actual FK edges to order purchase/payment/subscription children relative to purchase_requests and user_subscriptions; this plan does not fabricate missing target FK definitions.
6. listing_publish_tokens after private token commands and all catalog-confirmed token children; listings after all inbound listing FKs are clear; disposable user_subscriptions and publisher_accounts after their catalog-confirmed children. Package/reference parents and auth.users remain.

**Mandatory graph gate:** collect the target's inbound/outbound FK closure for these roots, plus triggers, partitions and non-FK operational dependencies. Produce an explicit schema-qualified allowlist and topological order; resolve RESTRICT cycles before execution. The empty local schema dump prevents certifying the full target order now. A newly discovered dependent table is not implicitly authorized for deletion. Do not execute until each table is classified disposable or protected.

### Mechanism

Use a dedicated owner/admin transaction under maintenance/quiescence. Acquire the existing exclusive capacity-policy coordination lock and explicit locks on the approved table set in a deterministic order. Use DELETE on the explicit disposable allowlist, not TRUNCATE CASCADE, schema drop, FK removal, replication-role bypass or blanket trigger disablement.

Migration 004 installs reject_immutable_rows on designated canonical histories; Migration 018 guards raw evidence. In the reviewed administrative purge transaction only, disable the exact DELETE-blocking immutable guards on disposable tables; keep FK constraint triggers active and reference-rule/seal guards intact. Inventory any additional lifecycle/side-effect triggers that would turn administrative deletion into domain events and explicitly review their handling. Restore every guard to its original enabled state before commit. A failure rolls back row deletion and transactional trigger-state changes together. No permanent purge function callable by application roles is created.

Auth identities survive; test subscriptions do not. Before reopening, confirm retained users can initialize their publisher identity using existing ensure_publisher_account authority and receive only the already-established default access where the existing account policy requires it. Do not silently recreate paid test subscriptions or invent a new entitlement bootstrap. If retained-auth initialization cannot use existing authority, stop for the precise missing rule.

Storage object deletion is not included in this database purge. Database media-operation records are disposable; deleting actual managed objects requires a separately approved bounded storage manifest. External source URLs are never downloaded or deleted at the source.

## H. Cutover dependency graph

Review/authorization → target identity + read-only catalog/ACL/FK manifest → resolve purge-scope decisions → freeze reviewed worktree artifact versions → rehearse targeted changes on disposable fixture → maintenance/quiescence → missing canonical DB prerequisites + narrow reorder RPC → deploy compatible application while paused → ACL closure + administrative purge + guard restoration transaction → effective-privilege/read/write checks → fresh synthetic canonical smoke checks → reopen traffic/jobs.

Required RPC definitions/EXECUTE precede table DML revocation. Compatible application callers precede reopening. Purge occurs after authority closure statements inside the same maintenance transaction, before fresh canonical ingestion is admitted. An independent early TRUNCATE-only closure is technically separable, but still requires explicit execution authorization and target validation; this planning pass does not perform it.

## I. Atomic/coordinated groups and migration plan

1. **Prerequisite deployment group:** install only missing, hash-reviewed canonical migrations through 023 in dependency order. Some files are one-shot; do not replay against existing objects. Target drift/collisions require a reviewed adaptation, not IF NOT EXISTS camouflage. Preserve reference seeds required by geography, sealed rules, accessibility and packages. This group is schema prerequisites, not blanket activation.
2. **Media boundary group:** one new migration creates the narrow reorder SD function, revokes default PUBLIC/anon/authenticated execution and grants service_role execution in the same transaction. Then change only the route's write operation to call it; preserve its validation/error behavior. Validate concurrency before proceeding.
3. **Authority closure group:** one reviewed transactional migration applies the per-object role/column grants from D, tightens unexpected exposed legacy EXECUTE and preserves E. Keep SELECT and legitimate storage/ordinary app-data rights. Postgres remains canonical function owner; no API-role ownership/BYPASSRLS is introduced.
4. **Administrative purge group:** target-specific, explicit owner-run maintenance procedure reviewed separately from permanent schema migrations. Order children first, handle named guards, remove test rows, restore guards and validate protected references/FKs before commit. Prefer running closure and purge within a single coordinated transaction where the execution tool preserves that boundary; do not assume separately auto-committed migration files are atomic together.
5. **Reopen group:** only after committed privilege/guard checks and fresh allowed-operation smoke checks. No automatic ingestion until approved deployment is coherent; completion producer remains absent.

No migration number, SQL file or implementation patch was created here.

## J. Preflight requirements

- Explicit implementation approval, target project/host/database identity and environment classification. No production connection is authorized by this plan.
- Capture target migration versions, function definitions/owners/security/search_path/ACLs, role memberships and ability to assume roles, protected table/column ACLs, RLS policies and effective privileges. Distinguish direct grants, PUBLIC, inheritance and owner power. Use has_table_privilege/has_column_privilege/has_function_privilege plus ACL/membership records; no destructive TRUNCATE test.
- Refresh all eight S9 pairs and service-role findings; verify saved_analyses owns-row policies and entitlement helper semantics remain intact.
- Full bounded FK/trigger closure and table classification for G. Verify no unknown dependent object, unexpected immutable guard or missing reference identity remains.
- Confirm canonical function dependencies through 023, exact source identity index, correct sealed/DTA/reference identities, package publication durations, genuine operator/reviewer configuration and retained-auth bootstrap.
- Identify active app release, route/client roles, jobs, in-flight writes, token/media operations, auth signup and ingestion. Quiesce them during incompatible windows. Preserve maintenance capability independently of ordinary application authority.
- Confirm code artifact corresponds to reviewed dirty worktree; no automatic clean/reset/stage/commit. Explicit deployment authorization is separate.
- Obtain decisions in N. Record protected reference checksums/counts and schema/FK/trigger manifests; these protect system architecture, not disposable application data.

## K. Verification plan

After prerequisites: compare definitions/signatures and allowed EXECUTE, owners and search paths against the manifest; exercise new reorder RPC in a disposable fixture including wrong owner, wrong multiset, stale prior images, deleted state and concurrent reorder/upload exclusion.

After ACL closure: effective I/U/D/T and column INSERT/UPDATE must be false for API roles on listings and memberships; all eight S9 T pairs false, plus intended service-role T denials. Check PUBLIC/inherited/owner paths and exposed old RPC denial. Use catalog privilege checks for TRUNCATE, never destructive execution. Prove allowed customer and service RPCs still execute under their intended roles, rather than testing only as owner.

After purge: approved application tables empty, no orphan FK evidence, protected ontology/DTA/rules/packages/entitlements/control rows unchanged, auth.users unchanged, guard definitions/enabled states and FK definitions unchanged. Validate actual dependency order and no implicit cascade into reference tables.

Before reopen: narrowly exercise fresh canonical create/edit, exact measurement/classification and money, customer publish/renew/lifecycle, duplicate/token/media, reordered images, CSV positive ingestion/replay and entitlement-gated analytical read. Preserve EN/ES caller parity and Crown Jewel server-only boundary. Verify source completion denial for arbitrary browser claims, unverified completion neutrality, trusted completion replay, two misses and same-ID 90-day republication using controlled fixtures—not the scraper. These are cutover regression targets, not a plan to rerun all S9/S10 suites.

S11 passes only when both prohibited direct writes are denied and intended canonical operations succeed. Empty tables or a functioning admin connection alone do not prove closure.

## L. Rollback/failure strategy

| Group / failure | Detection | Rollback meaning / safest response |
|---|---|---|
| Prerequisite collision/drift/missing dependency | Catalog comparison or migration failure | Abort transaction; keep maintenance. Do not drop/rebuild closed objects or blindly replay. Forward-fix reviewed drift |
| New reorder boundary/caller mismatch | Targeted RPC/route smoke or stale-update checks | Roll back route before closure only if pre-cutover maintenance remains; after closure keep endpoint unavailable until forward-fixed. Never restore broad UPDATE to make reorder work |
| Grant closure incomplete or over-revokes needed RPC | Effective privilege and intended-role smoke checks | Before commit abort; after commit retain restrictive state and restore only exact required EXECUTE/SELECT. Do not restore broad table grants. Transaction rollback of closure reopens old authority, so no traffic until closed again |
| Purge dependency/guard/reference failure | FK error, row counts, reference or guard manifest mismatch | Before commit rollback restores deleted rows/guard DDL; this is transactional safety, not a data-preservation migration. After commit discarded test rows are intentionally gone; do not promise recovery. Reference damage is unacceptable: remain offline and restore reference architecture from approved authoritative artifacts |
| App/DB release mismatch | Startup/RPC smoke failure | Keep writes paused; forward deploy compatible code. An old release that requires table DML is not a safe rollback after closure |
| Retained auth cannot initialize canonical operations | Fresh-user/publisher/entitlement smoke | Keep affected actions fail-closed; use existing administrative initialization or stop for missing policy, never recreate paid test authority |

## M. Concrete risks

- The latest target ACL/FK/owner graph is absent; local migration text cannot prove live authority. Execution is evidence-gated.
- Image reorder will fail after UPDATE revocation unless the narrow replacement lands first.
- Column grants or inherited roles can survive table-only revocation; SD wrappers with excess EXECUTE can bypass a closed table.
- Immutable DELETE guards and multiple RESTRICT dependencies block a naive listing purge; disabling all triggers would remove the protections needed for a safe purge.
- Removing package/entitlement/DTA/rule/control rows as “test data” would destroy canonical authority.
- Purging subscriptions/publisher rows while retaining auth identities can break account initialization unless the existing initialization path is confirmed.
- Mixed app/database releases or in-flight writes can create partial operational failure; maintenance and staged compatibility gates are required.
- Upstream completion is still absent. That deliberately leaves negative source observation dormant; it is not a reason to fabricate completion or delay positive ingestion.

## N. Decisions required from user

1. **Administrative identity-bound configuration:** confirm whether existing `twuanis_canonical_private.import_operator_grants` contains legitimate operator configuration to retain or disposable test grants to remove. Keep it out of the purge until classified. Apply the same explicit classification to the actual backing records of `require_payment_reviewer()` once catalog evidence identifies that object; do not guess its table name or purge authorization records as user activity.
2. **Managed storage purge scope:** database cutover does not require deleting stored file bytes. Confirm only if storage cleanup is intended in this cutover; otherwise leave it explicitly outside S11. No external-source media operations are proposed.

Fresh catalog exports, deployed version matching and complete FK evidence are execution prerequisites, not new product-policy choices. No new geography, money, classification, publication-duration, source identity or disappearance policy is requested.

## O. Proposed numbered S11 execution sequence

1. Review this plan and resolve N; explicitly authorize the chosen implementation groups. Do not treat this report as execution approval.
2. Confirm the target environment and collect the bounded read-only catalog evidence in J using separately authorized access or supplied exports.
3. Freeze exact protected-object/role/function and purge allowlists, full FK order and guard-handling list. Stop on unexplained dependencies/authority paths.
4. Compare deployed migration/function definitions to the verified worktree; prepare only required prerequisite deployment actions and the new reorder boundary/caller changes.
5. Implement and verify the reorder RPC/caller in an isolated fixture under the already-established behavior. Prepare the authority-closure migration and target-specific administrative purge procedure for review; do not create a public purge capability.
6. Rehearse the targeted closure/purge ordering on a disposable schema-equivalent fixture, preserving reference data and checking intended-role allowed/denied paths. Do not use current application rows as canonical input.
7. Obtain explicit deployment/purge authorization for the exact target and reviewed artifacts. Enter maintenance; stop relevant jobs, ingestion, signup and writes; drain in-flight work.
8. Install missing canonical prerequisites and the narrow reorder function while traffic remains paused. Confirm required reference/configuration and narrow EXECUTE authority.
9. Deploy the compatible post-S10 application plus reorder caller; confirm all surviving writer surfaces use their canonical/media boundary. Keep writes paused.
10. Begin the reviewed owner transaction/lock protocol. Close effective protected table/column DML, obsolete wrapper execution and designated TRUNCATE/auxiliary grants; preserve intended SELECT and EXECUTE.
11. In the coordinated purge transaction, disable only reviewed disposable immutable DELETE guards, delete the explicit child-first disposable set, restore exact guard states and verify reference/FK/auth invariants. Abort on any mismatch. Commit only the complete successful authority/purge group.
12. Re-check effective ACLs and guards after commit under real role identities; confirm the eight S9 pairs are closed without executing TRUNCATE.
13. Perform K's focused fresh-data smoke checks, including retained-auth initialization, entitlement reads, canonical media and source update/replay. Do not invoke the scraper or assert completion from a batch.
14. Reopen only after all gates pass; record deployed artifact IDs, ACL/guard evidence and purge counts in the future S11 execution report. Leave S12/S13/Phase14 and upstream completeness production unstarted unless separately authorized.

## P. Explicit stop

Only this plan was created. No code, SQL, migration, function, schema, grant, RLS, role, FK or database data changed. No tests, database startup/connection, purge, deployment, staging, commit or push occurred during this planning pass.

**S11 IMPLEMENTATION HAS NOT STARTED.**

**NO CUTOVER ACTION HAS BEEN EXECUTED.**


---

# S11-A final read-only preflight record — 2026-09-19

This checkpoint consolidates the completed S11-A inspection, supplied current-target catalog exports, and final user decisions. It supersedes earlier unresolved baseline questions in this plan; it does not recreate the plan or authorize implementation. In particular, the earlier missing-catalog risk and pending storage/identity-assignment decisions are resolved as recorded below. No completed S1–S10 or S11-A checks were repeated to assemble this record.

## A. Verdict

**S11-A COMPLETE — READ-ONLY CUTOVER PREFLIGHT VERIFIED**

The existing evidence is sufficient for subsequent S11-B preparation. Completion of preflight is not proof that canonical cutover has occurred, that the target already enforces canonical authority, or that S11-B/C is authorized. Known preparation obligations below remain mandatory.

Evidence basis: previously completed local S11-A inspection; supplied pre-cutover baseline; catalog exports query-70 through query-74 covering functions, FK closure, triggers, scoped ACL/role provenance, and storage aggregates; and the user's final continuation decisions. The final prompt states that complete object-name metadata was supplied and explicitly classifies all 300 objects as disposable. That user determination resolves ownership/preservation classification; this report does not claim a new independent object-by-object inspection or reproduce an executable key manifest.

## B. Confirmed target

- Supabase project: `szhpqemhjyvvqgjgsmsw`.
- Database: `postgres`.
- Target: the confirmed Twuanis development application's existing pre-cutover database. Its status as cutover target does not make it a production database.
- Canonical migrations 004–023 and `twuanis_canonical_private` are intentionally not installed. Their installation belongs to coordinated S11 cutover. Their absence is not drift, a defect, or missing deployment evidence.
- Supabase subsystem migration histories are not Twuanis canonical deployment evidence and remain outside the change scope.
- Current deployed Vercel production artifact identity is not conclusively established. This is an accepted baseline limitation, not an outstanding S11-A evidence request.

## C. Current authority baseline

Current exports establish broad pre-cutover authority requiring closure. `listings` grants INSERT/UPDATE/DELETE and TRUNCATE to anon, authenticated, and service_role. On `listings_ontology_terms`, anon has INSERT/UPDATE/DELETE; authenticated has INSERT/DELETE but not UPDATE; service_role has SELECT but not INSERT/UPDATE/DELETE. All three have TRUNCATE on that membership table.

The historical eight S9 TRUNCATE role/table pairs remain confirmed: anon and authenticated on entitlements, package_entitlements, user_subscriptions, and saved_analyses. The current export also gives service_role TRUNCATE on those four tables. Relevant auxiliary REFERENCES/TRIGGER authority must be included in exact target closure rather than ignored by a DML-only review.

The scoped evidence shows no additional inherited-role paths and no explicit column ACL rows. These conclusions apply to the supplied scope; table-level privileges can still authorize column operations. All 11 scoped relations are owned by postgres with RLS enabled and not forced. service_role has BYPASSRLS; that attribute does not confer missing table privileges.

Function ownership, execution permissions, and security mode must remain part of closure. In particular, the public-executable invoker measurement function in section I is a concrete legacy mutation surface. Its existence does not by itself prove a browser-exploitable route. Trigger-function EXECUTE metadata likewise is not by itself proof of an ordinarily callable mutation endpoint. No destructive privilege was exercised.

## D. Required S11-B artifacts

If separately authorized, S11-B must prepare the following reviewable artifacts, not execute them against the target:

1. An exact canonical installation manifest/order for the verified repository architecture through Migration 023, including current-signature compatibility, owners, function security/search paths, required reference/configuration, and intended EXECUTE authority.
2. The approved narrow image-reorder RPC and application caller adaptation, with focused disposable/offline verification of the frozen contract in section I.
3. An exact authority-closure artifact covering protected listing/membership table and column privileges, PUBLIC/role execution paths, designated TRUNCATE and auxiliary privileges, and obsolete mutation functions. Preserve required read access and approved narrow operations.
4. A target-specific administrative purge allowlist and child-before-parent order derived from supplied FK evidence, with exact preservation lists, transaction/lock boundaries, only the necessary reviewed guard handling, and invariant/count checks. No generic public purge capability.
5. A bounded object-key manifest and storage-deletion procedure for the reviewed current 300-object set, with durable per-object completion/failure accounting and conservative retry handling. Capture keys before database purge removes useful linkage. Do not expand automatically to newly appearing objects.
6. A retained-auth initialization procedure grounded in approved account/package semantics, with a precise decision stop if those semantics are insufficient.
7. A coordinated maintenance/deployment runbook identifying the future reviewed application artifact and compatible database installation, pausing relevant writes/jobs and handling in-flight activity before execution.
8. Focused verification and rollback/failure gates proving both denied legacy authority and successful intended canonical operations, preserving auth/reference architecture and restoring exact guard state. Storage deletion must not be represented as transactionally reversible with PostgreSQL.

These are required deliverables for the next stage, not artifacts implemented during S11-A.

## E. Purge graph and guards

The supplied FK/partition export provides current dependency evidence. Important ordering constraints include promotion_events and promotion_intelligence_evidence before listing_entitlements/listings; listing_entitlements, bank_transfer_payments, purchase_request_events, sinpe_payments, and user_subscriptions before their referenced purchase_requests; sinpe_payments before user_subscriptions; and purchase_requests before listings. Dependent favorite, saved-search delivery, measurement-provenance, membership, note, event, and token relationships must be handled explicitly in the reviewed allowlist/order. This summary is not an executable purge sequence.

Reference parents such as ontology_terms, packages, and add_on_products remain preserved. Auth users and Supabase auth subsystem children remain preserved; their appearance in the FK export does not place them in the purge scope. Scoped relations reported no partitioning requiring a separate partition purge branch.

The enabled `promotion_events` BEFORE DELETE guard calls `prevent_promotion_event_mutation()` and unconditionally rejects deletion. Ordering cannot solve that blocker. S11-B must specify the narrow reviewed administrative handling and exact restoration/check of this guard; broad trigger disabling is not authorized. Current purchase auditing is triggered on INSERT/UPDATE, not DELETE. Target canonical guards must be distinguished from currently installed pre-cutover guards.

## F. Identity-bound test authorization

The established reviewer authority chain is:

`require_payment_reviewer()` → `is_payment_reviewer(auth.uid())` → `public.payment_reviewers`, requiring matching user_id and active = true.

Preserve the functions, table/schema machinery, and reviewer capability semantics. Delete current identity-bound test reviewer assignments only during the later authorized purge. Create no replacement reviewers.

Preserve target `twuanis_canonical_private.import_operator_grants` architecture. Identity-bound test operator assignments are disposable; create no replacement operators. The canonical private schema is intentionally undeployed, so this disposition does not assert that its target table currently exists or contains rows.

## G. Retained-auth initialization obligation

The current default-package mechanism is an AFTER INSERT trigger on auth.users. It finds the active market-explorer package and inserts an active free subscription. Purging existing test subscriptions while retaining auth identities does not retrigger signup.

Retained-user initialization is therefore an explicit S11-B/C obligation. Do not retain fake paid/test subscriptions or delete auth identities to evade it. Existing canonical publisher initialization does not by itself establish a replacement subscription. S11-B must use approved account/package semantics for the smallest legitimate post-purge initialization path; if they do not determine the answer, stop for that exact decision rather than inventing authority. No initialization was performed in S11-A.

## H. Storage purge scope

**300/300 current `listings-images` objects disposable.**

This is the user's explicit determination of the reviewed current set. The earlier aggregate split of one path candidate and 299 unclassified objects is no longer a preservation blocker. No further per-object value/ownership investigation is required for this set.

During subsequently authorized S11-C, delete only the reviewed current object set. Preserve the bucket and required configuration, policies, and target storage architecture. Fresh canonical application media starts clean afterward. The exported current bucket is public, with null file-size and MIME restrictions; that metadata does not authorize changing its configuration during preflight.

Capture the exact object-key manifest before database purge and retain durable completion/accounting evidence because storage deletion and database row deletion are not one atomic transaction. External source URLs are excluded: no external contact, download, mirroring, or deletion. No storage object was deleted or inspected for image contents during finalization.

## I. Authority-closure dependencies

### Approved image reorder

Preserve authentication, owner verification, nondeleted state, maximum 25 images, exact image multiset including duplicate counts, comparison against previously stored images, and updates limited to images and updated_at. Preserve existing response semantics, including the current 500 response for conditional-update failure. Prepare the narrow server-controlled boundary and caller before removing the direct UPDATE dependency. No generic listing patch authority is approved.

### Existing measurement recovery function

`recover_listing_measurement(uuid,text,numeric,text,text,text,text)` inserts measurement provenance and directly updates property_area or construction_area. It is SECURITY INVOKER with PUBLIC EXECUTE. S11-B must establish its exact target disposition, denying/removing obsolete execution if superseded and leaving no unintended direct mutation path. Do not treat it as an approved canonical shortcut. Supplied evidence alone does not establish a browser-exploitable bypass.

### Required ontology reads

The current ontology_terms ACL lacks a service_role SELECT grant. The scoped export supplies no alternative inherited-role or explicit column grant path. BYPASSRLS does not supply SQL read permission. S11-B must prepare the minimum required target read authority for reviewed canonical server paths while closing mutation authority. No broad access grant was made.

## J. Deployment limitation

**Current deployed Vercel production artifact identity not conclusively established.**

No deployment was performed to resolve it. GitHub branch state or a Preview deployment must not be substituted for that identity. The currently served application is treated as pre-cutover/version not relied upon for canonical authority. S11-C must not assume it already includes S8/S9/S10.

Before actual deployment, identify the exact reviewed future artifact and its source commit/build, verify it includes approved post-S10 plus S11-B changes, and coordinate it with canonical database installation. Independently deploying the current worktree against the pre-cutover database is not authorized. Historical reconstruction of the old deployment is not required for S11-A closure.

## K. Exact S11-B boundary

S11-B may begin only after separate authorization. It may then prepare the reviewed implementation, authority, purge, storage, initialization, maintenance, and verification artifacts described above within its own approved local/disposable scope. It does not inherit authorization to install target migrations, change target grants, disable target triggers, delete target rows/media, or deploy. Actual cutover belongs to separately authorized S11-C.

No indispensable S11-B preparation evidence remains outstanding under the user's accepted baseline decisions. That does not pre-approve an undetermined retained-user policy or authorize an expansion of the frozen canonical architecture.

## L. Explicit stop

Finalization changed only this existing planning/preflight document by appending this checkpoint. No application code, SQL, migration, schema, grant, RLS, role, trigger, function, database row, or storage object was changed. No tests, database startup/connection, deployment, staging, commit, or push occurred in this finalization. Completed work was not reopened.

**S11-B HAS NOT STARTED.**

**S11-C HAS NOT STARTED.**

**NO CUTOVER ACTION HAS BEEN EXECUTED.**
