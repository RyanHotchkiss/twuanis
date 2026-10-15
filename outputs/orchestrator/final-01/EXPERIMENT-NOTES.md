# Qualification notes

The original eight-second and 32MiB failures are retained. No incomplete execution is counted as complete. The two saved optimization migrations retain those limits; larger settings exist only in capacity fixture databases.

Harness corrections made during verification:
- Initial migration110 draft omitted a statement terminator and rolled back. It was corrected before the accepted `corrected-verified` pair. The earlier `corrected` pair is not treated as a corrected-performance result.
- Initial capacity timeout preparation incorrectly assumed public regprocedure names contained `public.`; the actual names were unqualified. Those timed-out runs are retained. The accepted60s runs explicitly configure the actual signatures and reload PostgREST schema.
- Initial temporary build omitted unchanged `data/` and `scripts/` dependencies. Restoring those exact existing files produced passing TypeScript and production build; no source fix was needed.
- The first adversarial probe used old Bank-scope evidence and correctly rejected its stale revision. Accepted validation uses newly captured authoritative evidence and coherent mutations.
- Function definition comparison initially used different SQL roles/search paths, rendering `uid()` versus `auth.uid()`. The final comparison uses the original role/search path. There was no behavioral payment-reviewer difference.
- A busy128-observation reference database was copied without interrupting its sessions. Provider extension-management event triggers were excluded from that local dump restore because of mixed-owner restrictions. All391 application function contracts were restored to the approved baseline before migrations110/111. Other qualification databases were cloned directly.
- The first fault script referenced an incorrect finalizer signature; it stopped without changing the function. Subsequent timeout/connection-loss probes used the actual installed signature.
- A live SQL expiry defect was discovered, preserved as evidence, and corrected through the existing maintenance function in migration112. It was not dismissed as a harness error.

The guarded cancellation at5,000 is the authoritative local safety boundary used to stop larger tests. It is not a measured maximum of a dedicated larger server. The actual5,000 graph and full population were retained locally; no report/witness was committed.

Capacity runs preceded migration112's expired-claim branch correction. Its successful-path body is unchanged, and a fresh concurrent paidCOMBINED pair plus expired/duplicate retries verify that correction. TypeScript/build inputs are byte-identical after the SQL-only addition.
