# Retained-auth preparation verification

Executed against a fresh PostgreSQL 17 cluster in `/private/tmp/s11b-prep/pgdata`, Unix socket `/private/tmp/s11b-prep/socket`, port 55439, TCP listeners disabled. No target connection or credentials used. Cluster stopped after checks. The first sandboxed initdb attempt could not allocate shared memory and removed its incomplete data directory; the subsequently authorized disposable start succeeded.

Representative focused schema uses auth identity PK/FK, package FK, subscription PK/default UUID, active-subscription uniqueness, and allowed-status constraint. It deliberately permits duplicate package slugs to exercise the initializer's own ambiguity rejection even when a real unique constraint would reject the configuration earlier. This is not a full target-schema integration claim.

15 checks passed:
1. Pre-purge paid/test subscription state rejected atomically.
2. Three retained identities obtain fresh active/free defaults.
3. Independent one-per-identity cardinality.
4. Old subscription IDs not reused.
5. Auth rows unchanged.
6. No publisher rows created.
7. No new packages created.
8. Same-operation replay preserves exact subscription rows.
9. Receipt/state tampering fails without rewriting rows.
10. Ordinary authenticated administrative invocation denied.
11. Existing active uniqueness remains enforced.
12. Inactive Market Explorer fails closed.
13. Missing Market Explorer fails closed.
14. Duplicate active Market Explorer fails closed.
15. Receipt authority denied to API roles.

One two-session concurrent initialization case passed: both invocations succeeded (initialization and replay), with three subscriptions and exactly one receipt.

Executable harness sources accompany this evidence. They require a FRESH dedicated fixture on that exact Unix socket; the sequential harness creates its own roles/tables and is not intended for replay into an already populated fixture. The concurrency harness follows it and resets only this disposable fixture's receipt/subscription rows. Do not retarget these harnesses to Supabase. No test calls the prepared SQL against the target.

The setup artifact is one-shot after Migration 004. Initialization is a separate reviewed owner-only group after purge, within continued maintenance. Receipt creation/insertion and subscriptions use PostgreSQL transactions; a first-initialization failure rolls back both. A replay requires the exact operation UUID, auth set, package ID, and recorded subscription state. Later normal customer activity intentionally invalidates administrative replay; this is not a perpetual access-repair endpoint.
