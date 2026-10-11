# Documentation publication scope and sensitive-data review

Only this curated documentation bundle is selected for the documentation commit. Raw `outputs/remates/` is not bulk staged. Permanent records retain acceptance outcomes, public deployment/project references, source and migration digests, aggregate test results, limitations, decisions and recovery procedures.

Excluded: credentials/tokens/passwords/private keys; customer personal data and private actor identities; database exports; Storage bytes and object identities; encrypted recovery images; authentication/session evidence; browser profiles; raw provider/build logs; private local destinations and deployment archives. Encryption alone does not make a recovery artifact suitable for GitHub.

Historical local reports and receipts are identified by relative provenance labels and SHA-256 in [provenance](EVIDENCE-PROVENANCE.json), without publishing raw private artifacts. The curated [ledger](ACCEPTANCE-LEDGER.md), [manifest](IMPLEMENTATION-MANIFEST.md) and [phase work trucks](PHASE-WORK-TRUCKS.md) replace repetitive public copies of large append-only local histories. Those local histories remain untouched.

Publication review includes explicit field allowlisting for JSON projections, credential/private-key/session/email/private-path pattern scanning, Markdown local-link validation and a staged-blob review. A passing review is scoped to these selected files; it is not a claim that unrelated repository history or local artifacts are free of secrets. No application/migration SQL/configuration file is part of this commit.

**Selected-document review: PASS.** All 11 staged files matched the documentation allowlist; credential/private-key/session/email/private-path scans, JSON parsing, local Markdown links and whitespace checks passed. Only non-sensitive projections and fingerprints were retained. No claim is made about unselected files or prior Git history.
