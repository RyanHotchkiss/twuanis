# S11-B reorder and accessibility checks

- 17 PostgreSQL checks passed: two accessibility seed/replay/drift checks; reorder owner, eligibility, maximum count, missing/added/multiplicity and stale-state denials; successful service invocation; changed-column comparison; anon/authenticated EXECUTE denial; and three independently connected row-lock interleavings (reorder/reorder, actual ordinary upload/reorder, actual detach/reorder).
- The upload harness initially could not parse psql's SET status line. Quiet output corrected the harness; only the interrupted upload/detach cases were resumed. This was not an application defect.
- 19 additional final-normalization checks passed, including primitive/array JavaScript coercion, Unicode trimming, scalar JSON and pipe formats, numeric exponent/underflow behavior, and real RPC calls for those stored formats. Private helpers preserve the existing route normalization; they expose no API execution.
- Unicode checks initially exposed SQL_ASCII in the disposable fixture created with --no-locale. A local schema/data copy into a template0 UTF8 fixture resolved the fixture mismatch. Target configuration was not changed. Future installation requires UTF8, and new disposable fixtures should use it.
- 11 offline cases executed the actual route: success, missing auth, wrong owner, deleted listing, missing/added/multiplicity, over-limit, stale response, RPC error, empty images. Authenticated server identity and prior raw snapshot are passed to the RPC; direct mutation is unavailable in the mock. Expected 401/403/409/500/200 behavior preserved.
- Directly affected existing image-detach.cjs suite: 9 cases passed with only its two reorder mocks adapted to RPC transport.
- TypeScript: `tsc --noEmit --incremental false` passed.

Only the actual route's write transport changed; shared EN/ES callers continue to use the same API. No new client analytical imports. No target, real storage, or external source access occurred. Original 004–023 migrations were not modified. Final installation/authority/purge rehearsal and the S11-C verification package are recorded in the cumulative S11-B report.
