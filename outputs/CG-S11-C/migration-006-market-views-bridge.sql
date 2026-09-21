\set ON_ERROR_STOP on
-- Reviewed compatibility bridge: original006 is included unchanged.
-- Drops+006 share one transaction;006 commits them. Restoration is a second transaction.
-- A restoration failure leaves both views absent, numeric006 committed: STOP and restore forward.
\ir migration-006-market-views-pre.sql
\ir ../../supabase/migrations/006_canonical_domain_machinery.sql
\ir migration-006-market-views-restore.sql
