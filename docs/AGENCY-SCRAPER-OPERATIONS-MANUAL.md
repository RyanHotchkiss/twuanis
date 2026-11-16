# Agency Scraper Creation and Administration Manual

This manual documents the current Twuanis agency-scraper system. It is for compatible public WASI sites only. It does **not** authorize a scrape, ingestion, publication, or deployment.

## 1. Architecture and file-location map

| Responsibility | Repository path | Runs where |
|---|---|---|
| Shared WASI extraction | `scripts/scrapers/wasi-sales-scraper.js` | iMac listener process |
| WASI selection-to-config map and execution | `scripts/scrapers/wasi-command-runner.cjs` | iMac listener child process |
| Canonical bridge and qualification | `scripts/scrapers/wasi-canonical-ingestion-adapter.cjs` | iMac listener child process; calls Supabase RPCs |
| Attribution projection | `scripts/scrapers/refresh-wasi-listing-attribution.js` | iMac listener child process |
| Manual command listener | `scripts/scrapers/local-scraper-command-listener.cjs` | iMac/launchd only |
| Agency site configurations | `scripts/scrapers/wasi-sites/*.json` | Read by iMac extractor |
| Admin scraper controls | `app/admin/AdminScrapers.tsx`, `app/admin/scraper-actions.ts` | Vercel serves UI/actions; iMac executes scrape |
| Shared registry / Admin and Listings identities | `lib/scraper-registry.ts` | Vercel and iMac source copy |
| Admin Listings agency dropdown | `app/admin/AdminListings.tsx` | Vercel UI |
| Admin Listings query authority | `app/admin/actions.ts`, migrations `127` and `131` | Supabase |
| Scraper-command and reconciliation SQL | migrations `124`, `125`, `126`, `129`, `130` | Supabase |

**Do not put scraper execution into Vercel.** Vercel serves Admin and accepts authenticated commands; the iMac launchd listener polls Supabase, runs Node processes, writes artifacts under `var/`, and reports progress and terminal state back to Supabase. Vercel Functions do not crawl agency websites.

The authoritative editable source is `/Users/cassidydaddy/twuanis`. Commit scraper code/configuration to `production-baseline/2026-11-11-mobile-topbar`, deploy the exact commit, then keep iMac, GitHub, and Vercel on the same commit. `var/` is runtime output and must not be committed.

## 2. Existing WASI agency templates

Use Montero as the current bounded template because it has separate Sale/Rent configs and explicit finite limits:

- `scripts/scrapers/wasi-sites/montero-realty-group-sales.json`
- `scripts/scrapers/wasi-sites/montero-realty-group-rent.json`

Other live examples are HELCOR, RE/MAX Central, Inmobiliaria CDJ, and Devop in the same directory. Keep `wasi-sales-scraper.js`, `wasi-command-runner.cjs`, the canonical adapter, and listener unchanged unless a shared, demonstrated defect requires a bounded fix.

### Configuration contract

Copy the two Montero files to, for example:

```
scripts/scrapers/wasi-sites/example-realty-sales.json
scripts/scrapers/wasi-sites/example-realty-rent.json
```

Example Sale configuration:

```json
{
  "source_name": "Example Realty",
  "source_website": "https://example.com",
  "start_url": "https://example.com/s/ventas?for_sale=1&for_rent=0",
  "inventory_query": {"for_sale": "1", "for_rent": "0"},
  "allowed_host": "example.com",
  "transaction": "sale",
  "max_runtime_ms": 2700000,
  "max_listing_pages": 150,
  "max_detail_pages": 1800,
  "network_timeout_ms": 20000,
  "geography_timeout_ms": 20000,
  "property_area_labels": ["Área Terreno", "Área de Terreno"],
  "construction_area_labels": ["Área Construida", "Área de Construcción"],
  "geography": {
    "resolution_mode": "city_exact_district",
    "source_field_map": {"province": "Provincia", "city": "Ciudad"}
  }
}
```

For Rent: use the genuine rental index, `transaction: "rent"`, and rental-only query filters. The extractor verifies each detail page’s observed transaction; a Sale page must not enter a Rent result and vice versa.

### What the extractor does

`wasi-sales-scraper.js` fetches the configured index, discovers detail URLs, follows pagination, fetches each detail page, and emits:

- `devop-wasi-sales.json` — source observations;
- `extraction-report.json` / `.md` — counts, completeness, failures, and `extraction_complete`;
- agency name/logo and listing-agent name/photo where actually observed.

It uses configured labels for property and construction area, original price/currency evidence, source IDs/URLs, WhatsApp, images, raw attributes, and source geography. Adapt selectors or config only after inspecting actual index and detail HTML. Never invent geography, an agent, a price, or a measurement.

### Limits and local discovery test

Before registration, prove that **both** indexes discover real detail URLs and extract representative details:

```bash
cd /Users/cassidydaddy/twuanis
node scripts/scrapers/wasi-sales-scraper.js \
  scripts/scrapers/wasi-sites/example-realty-sales.json \
  /private/tmp/example-realty-sale-check
node scripts/scrapers/wasi-sales-scraper.js \
  scripts/scrapers/wasi-sites/example-realty-rent.json \
  /private/tmp/example-realty-rent-check
```

This writes local artifacts only; do **not** run `wasi-command-runner.cjs` for a local source check because that admits records. Inspect `extraction-report.json`: pages, `listings_discovered`, `details_processed`, source-transaction confirmation, failures, and `extraction_complete`. Raise a cap only after source evidence proves more valid pages exist. A cap hit is a failure, not normal exhaustion; incomplete extraction cannot reconcile/archival existing inventory.

## 3. Registering an agency in Administration → Scrapers

There are two mandatory registrations plus SQL command validation:

1. Add the selection/config map in `scripts/scrapers/wasi-command-runner.cjs`:

```js
'example-realty-sale':'scripts/scrapers/wasi-sites/example-realty-sales.json',
'example-realty-rent':'scripts/scrapers/wasi-sites/example-realty-rent.json',
```

2. Add an entry to `lib/scraper-registry.ts`:

```ts
{
  id: 'example-realty',
  label: {en: 'Example Realty', es: 'Example Realty'},
  agency: {label: 'Example Realty', sourceName: 'Example Realty', aliases: []},
  selections: [
    {id: 'example-realty-sale', label: {en: 'Sale', es: 'Venta'}},
    {id: 'example-realty-rent', label: {en: 'Rent', es: 'Alquiler'}}
  ],
  operational: true
}
```

3. Add the two IDs to the allowlist in a new forward migration recreating `public.scraper_admin_request(uuid,text[])`, following `supabase/migrations/130_montero_realty_group_scraper_command_selections.sql`. This is required because the UI registry alone cannot authorize database command insertion. Never edit an applied migration.

`AdminScrapers.tsx` maps `scraperSources` to bilingual checkboxes. `scraper-actions.ts` calls `scraper_admin_request`; the listener’s `supported` set derives from its runner configurations. The listener uses `scraper_worker_command` for polling, status, logs, heartbeat, and stop requests. No separate UI, API route, or database table is needed for a compatible WASI agency.

Selection IDs are lowercase, hyphenated, and end in `-sale` or `-rent`. The UI permits at most two IDs per command; do not mix Encuentra24 and WASI selections in one command.

## 4. Administration → Listings integration

The agency dropdown is in `app/admin/AdminListings.tsx`. It combines database options with `scraperSources` from `lib/scraper-registry.ts`; therefore the same `agency` registry entry supplies the canonical visible agency option without another UI edit.

- `agency.label` is the display label.
- `agency.sourceName` must exactly equal the scraper observation `source_name`.
- `aliases` normalizes verified alternate stored attribution names into the same option.
- Sale and Rent use one agency identity; transaction is a separate AND filter.
- Source Website remains independent from Agency; Origin remains independent from both.

The server-side `admin_listing_read` query receives the filter before pagination. Current filter SQL is in `supabase/migrations/131_admin_listing_agency_filters.sql`. Published source listings match by stored agency/source identity—not title text.

## 5. Canonical admission and publication

Workflow:

```
Agency index/detail pages
  → local JSON artifact
  → wasi-command-runner qualification
  → retain_csv_source_evidence (immutable source record)
  → ontology resolution
  → ingest_canonical_source_observation_in_run
  → accepted publication OR duplicate-review draft OR rejection
  → attribution projection
  → complete_canonical_source_run_scoped (only verified complete run)
  → Admin Listings / public surfaces
```

The observation bridge is `scripts/scrapers/wasi-canonical-ingestion-adapter.cjs`. It emits source name/ID/URL, captured timestamp, Sale/Rent transaction, original title/description as evidence, original price/currency evidence, canonical geography input, areas, WhatsApp, images, attributes, agency attribution, and agent attribution.

Current local qualification requires:

- a supported mapped property type;
- observed transaction equals configured transaction;
- exact canonical province/canton/district;
- eligible authorized-scraper collection evidence;
- exact amount and currency;
- a WhatsApp value;
- House/Cabin: property **and** construction area; Condo/Commercial: construction area; Land/Farm: property area.

Prices are passed as original `current_price` (Sale) or `monthly_price` (Rent), with original currency (CRC/USD) and raw price evidence—no invented conversion. Duplicate/case decisions and final publication remain database authority decisions. Source title/description stay evidence; the shared deterministic generators in `app/utils/listing-content-generator.cjs` create publication content from validated fields.

Agency and agent values are projected only when observed. `refresh-wasi-listing-attribution.js` finds imported records by `source_name + source_listing_id`; it preserves absent fields instead of replacing valid values with null.

Reconciliation runs only if extraction is verified complete and has no execution error. Migration 126’s `complete_canonical_source_run_scoped` scopes source plus transaction and archives missing source-managed listings while preserving canonical IDs, evidence, and historical statuses. An incomplete page cap, detail failure, cancellation, or missing result must never cause absence archival.

Saved artifacts can be locally examined, but the supported manual admission route is the runner with the actual command ID/start time. Do not submit a saved artifact with a fabricated run ID or timestamp; canonical authority requires the real run identity.

## 6. Deployment, listener, and environment

Required iMac environment variables (never place values in Git):

- `.env.local` or `ENCUENTRA24_ENV_FILE`: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`/the adapter’s Supabase credentials, `RESEND_API_KEY`, `EMAIL_FROM`, `SCRAPER_NOTIFICATION_TO`.
- Optional operational controls: `ENCUENTRA24_COMMAND_POLL_MS`, `ENCUENTRA24_RUN_ROOT`, `ENCUENTRA24_WEEKLY_SCHEDULE_ENABLED=0`.

After an authorized code and migration release:

```bash
cd /Users/cassidydaddy/twuanis
git diff --check
git add scripts/scrapers/wasi-sites/example-realty-sales.json \
  scripts/scrapers/wasi-sites/example-realty-rent.json \
  scripts/scrapers/wasi-command-runner.cjs lib/scraper-registry.ts \
  supabase/migrations/NNN_example_real_estate_scraper_command_selections.sql
git commit -m "Register Example Realty WASI scrapers"
git push origin production-baseline/2026-11-11-mobile-topbar
```

Apply the forward migration through the approved production Supabase process. Deploy that exact Git commit through the established Vercel project, wait for Ready and production aliases, then confirm the primary iMac checkout and GitHub branch point to the deployed commit. Restart the listener only when its local source/config has changed and the existing launchd procedure requires it. Keep the weekly scheduler disabled.

## 7. Operating and troubleshooting

1. **Can agencies run simultaneously?** No. The listener has a `busy` guard and processes commands serially.
2. **Can Sale/Rent run independently?** Yes; they have independent selections, configs, transactions, and reconciliation scope.
3. **Sleep/restart/network/crash?** The process stops or fails; the command remains recorded and terminal reporting reflects the failure when possible. Restarting the listener resumes polling; it does not safely assume an interrupted crawl completed.
4. **Interrupted recovery?** Retained source evidence and idempotent run identity prevent duplicate admission; reuse the actual command identity only through the established workflow.
5. **Duplicate admission prevention?** Immutable evidence plus canonical admission/duplicate review and run-aware idempotency.
6. **Update vs archive vs review?** Canonical authority determines admission/update/review; verified complete scoped reconciliation archives only source-managed records missing from that completed source/transaction run.
7. **Completion vs partial?** Require `listing_discovery_verified`, no failures, processed detail count equal discovery count, and `extraction_complete`.
8. **Site structure change?** Perform local index/detail checks, adjust only necessary config/selectors, and do not register/deploy a zero-discovery scraper.
9. **Excessive Supabase requests?** Qualify locally first, use finite runtime/network/geography limits, stop malformed runs, and inspect command logs/terminal email. Do not run a live command merely to diagnose.
10. **Data API use?** Local HTML extraction can run locally; geography lookup, immutable evidence, canonical admission, command polling/reporting, attribution, and reconciliation require Supabase access.
11. **Monitor impact?** Admin Recent Activity, Live Logs, terminal email, listener logs, and Supabase dashboard metrics/logs. No additional monitoring service exists.
12. **Safe stop?** Admin Stop writes the request; listener polls it and signals the detached controller process group. Terminal state is reported after child termination handling.
13. **Schedules?** Manual commands only. The weekly Encuentra24 scheduler remains disabled by `ENCUENTRA24_WEEKLY_SCHEDULE_ENABLED=0`; do not create schedules.
14. **Credentials?** Listed above; keep `.env.local` local and uncommitted.
15. **Best template?** Montero: separate validated Sale/Rent configs, finite caps/timeouts, and current shared-runner compatibility.
16. **Verify registrations?** Confirm IDs in the runner map, registry, migration allowlist, and Admin checkboxes; after an Owner-run, inspect the command’s selected IDs and Listings Agency + Transaction results.
17. **Duplicated registrations?** Yes: config pair, `wasi-command-runner.cjs` map, `lib/scraper-registry.ts`, and `scraper_admin_request` migration allowlist must agree.
18. **Manual vs Carlos work?** A careful operator can create configs, run local checks, add registry/map/allowlist entries, deploy after review, and run Admin commands. Carlos is still needed for a genuinely incompatible HTML structure, shared extractor defect, new canonical requirement, or uncertain database/migration behavior.

## Final onboarding checklist

- [ ] Verify both real index URLs and transaction-only filters.
- [ ] Verify local discovery and representative details for Sale and Rent.
- [ ] Configure bounded page/detail/runtime/network/geography limits.
- [ ] Confirm source IDs, price/currency, WhatsApp, images, areas, geography, agency logo, and agent attribution.
- [ ] Add both configs, runner map entries, registry entry/aliases, and forward SQL allowlist migration.
- [ ] Confirm no zero-discovery or incomplete run can reconcile inventory.
- [ ] Apply migration and deploy the exact synchronized commit.
- [ ] Confirm bilingual Admin checkboxes, listener configuration recognition, Stop/status/log wiring, and Listings Agency option.
- [ ] Obtain Owner authorization before the first live run.
