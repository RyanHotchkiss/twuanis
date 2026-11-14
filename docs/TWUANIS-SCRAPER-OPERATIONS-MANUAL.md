# Twuanis Scraper Operations Manual

This manual describes the current production scraper system as implemented in
the Twuanis source tree. It is for adding a compatible real-estate website to
the existing **manual** Admin Scraper workflow. It does not authorize a live
scrape, a database migration, or a production deployment by itself.

## Operating model

The execution path is:

```text
Owner Admin → scraper command queue → iMac listener → source runner
→ source evidence → canonical admission / duplicate review / publication
→ scoped source reconciliation → terminal command report + email
```

The listener is local to the iMac. It polls the production command queue; the
website never opens a local port. The weekly scheduler is deliberately kept
disabled. Every acquisition begins with an Owner's explicit **Run Scraper**
action in Admin.

The source of truth for the supported controls is
`lib/scraper-registry.ts`. The runner's selectable WASI configurations are in
`scripts/scrapers/wasi-command-runner.cjs`.

## 1. Decide whether a new website is compatible with the shared WASI scraper

The shared extractor is `scripts/scrapers/wasi-sales-scraper.js`. Before adding
a website, inspect the public inventory in a browser and answer these questions:

1. Is it a Wasi/Inmo website with a public, paginated inventory route?
2. Are Sale and Rent reachable through distinct URLs or query filters?
3. Do listing detail pages expose a stable source listing ID, original URL,
   source transaction, asking price and currency, images, and contact evidence?
4. Can the actual source transaction be established from source evidence? A
   configured transaction is not enough—Sale pages must not become Rent records
   and vice versa.
5. Are explicit property-area and construction-area labels available where the
   property type requires them?
6. Is the source geography resolvable through exactly one Twuanis
   Province → Canton → District chain? Preserve raw labels; do not convert a
   neighborhood, project, beach, or tower into a district.

Do this with read-only browsing and a local, non-ingesting extraction first.
If inventory markup, pagination, detail pages, or transaction evidence differ
materially from the existing Wasi pattern, stop and document the incompatibility
before writing a second scraper.

### Existing examples

| Agency | Sale route | Rent route | Source configuration |
| --- | --- | --- | --- |
| HELCOR | `https://helcor.inmo.co/s/ventas` | `https://helcor.inmo.co/s/arriendos?business_type%5B0%5D=for_rent` | `helcor-sales.json`, `helcor-rent.json` |
| RE/MAX Central | `https://remaxcentralcr.com/s/ventas` | `https://remaxcentralcr.com/s/alquiler` | `remax-central-sales.json`, `remax-central-rent.json` |
| Inmobiliaria CDJ | `https://inmobiliariacdj.com/s/ventas` | `https://inmobiliariacdj.com/s/en-alquiler` | `inmobiliaria-cdj-sales.json`, `inmobiliaria-cdj-rent.json` |
| Devop | `https://devop.inmo.co/s/ventas` | — | `devop-sales.json` |

HELCOR demonstrates a source whose `Cantón / Distrito`, `Ciudad`, and `Zona`
labels must be retained as raw source evidence and resolved conservatively.
RE/MAX Central demonstrates explicit Sale/Rent URL and query separation plus
`Provincia`/`Ciudad` geography mapping.
Inmobiliaria CDJ uses the same Wasi list/detail structure, with source codes,
`Tipo de negocio`, `área Terreno` / `área Construida`, `Provincia` / `Ciudad`,
agency branding, and listing-advisor evidence on its public detail pages.

## 2. Add the configuration—not a new execution architecture

Create one JSON configuration per source transaction in:

```text
scripts/scrapers/wasi-sites/<agency>-sales.json
scripts/scrapers/wasi-sites/<agency>-rent.json
```

Each configuration must include, at minimum:

```json
{
  "source_name": "Agency name",
  "source_website": "https://agency.example",
  "start_url": "https://agency.example/s/ventas",
  "inventory_query": { "business_type[0]": "for_sale" },
  "allowed_host": "agency.example",
  "transaction": "sale",
  "property_area_labels": ["Área Terreno"],
  "construction_area_labels": ["Área Construida"],
  "geography": { "source_field_map": { "province": "Provincia" } }
}
```

Use `transaction: "rent"` and a Rent-only inventory filter for rentals. The
filters must explicitly exclude the opposite transaction where the source
supports it. The runner validates each detail record's `source_transaction`
against this configuration before it can be admitted.

Then make two small registration changes:

1. Add the selection IDs and JSON paths to `configurations` in
   `scripts/scrapers/wasi-command-runner.cjs`.
2. Add the agency and matching selections to `scraperSources` in
   `lib/scraper-registry.ts`.

The IDs must match exactly, for example `remax-central-sale`. The Admin UI reads
the registry; `app/admin/scraper-actions.ts` independently limits requests to
the registry's operational IDs. Do not mark a source operational until its
configuration and runner registration both exist.

No Admin component change is required for a normal new Wasi agency.

## 3. Local extraction and qualification without publishing

Run the shared extractor directly, never the command listener, for a local
non-publishing check:

```bash
cd /Users/cassidydaddy/twuanis
node scripts/scrapers/wasi-sales-scraper.js \
  scripts/scrapers/wasi-sites/remax-central-sales.json \
  /private/tmp/remax-central-sale-check
```

This produces a run directory and the retained source dataset
`devop-wasi-sales.json`; the historic file name is shared by the reusable Wasi
extractor and does not classify every record as a sale. Inspect the actual
`transaction`, `source_transaction`, source IDs, URLs, price/currency,
measurements, raw geography, image URLs, contacts, and extraction failures.

Do **not** run `wasi-command-runner.cjs` for a local discovery check: it calls
canonical ingestion and reconciliation. Do not call the Admin button for this
stage.

Qualification in `wasi-canonical-ingestion-adapter.cjs` requires:

- a supported canonical property type;
- exact source/configured transaction agreement;
- an exact published canonical geography chain;
- an eligible retained source observation;
- explicit original amount and currency;
- a WhatsApp number;
- property-type measurements: House/Cabin require property and construction
  area; Condo/Commercial require construction area; Land/Farm require property
  area.

Missing information is a reason to exclude the record, not a reason to invent
or remediate it individually.

## 4. Register the Admin Run Scraper controls

After registering the configuration and source registry entries, deploy the
application and listener source together. In Admin → Scraper Management, the
agency will render the Sale/Rent checkboxes from `scraperSources` automatically.

Only an Owner can read, request, or stop commands. `scraperRequest` validates
the selection ID and calls `scraper_admin_request`; it is not a browser-side
scraper. The Run button creates a command only after the Owner clicks it.

The listener accepts either a selected Encuentra24 Sale/Rent set or one Wasi
selection per command. It deliberately rejects a mixed Encuentra24/Wasi command.
The Stop button writes a stop request; the listener polls it and sends SIGTERM
to the active controller/runner.

## 5. How the listener reaches canonical ingestion

The launchd definition is:

```text
ops/encuentra24-weekly/com.twuanis.scraper.command-listener.plist
```

It runs `scripts/scrapers/local-scraper-command-listener.cjs` from the primary
project and loads credentials from the local `.env.local`. Never commit or copy
those credentials into a configuration, log, or deployment artifact.

For a Wasi command the listener starts `wasi-command-runner.cjs`, which:

1. loads the selected JSON configuration;
2. starts the shared extractor;
3. reads its retained original observations;
4. filters them with `qualifying`;
5. retains immutable raw evidence with `retain_csv_source_evidence`;
6. resolves canonical geography and calls
   `ingest_canonical_source_observation_in_run`;
7. lets the existing canonical authority admit, reject, hold for duplicate
   review, or publish; and
8. completes scoped reconciliation for that source and transaction.

Encuentra24 remains on its established controller,
`weekly-encuentra24-controller.js`. Manual commands set its operator-run flag
and selected Sale/Rent values while keeping the weekly scheduler disabled. It
parses the extracted CSV, uses the existing Encuentra24 canonical adapter, then
calls the same scoped reconciliation authority.

## 6. Source reconciliation and archival (Migration 126)

Migration:

```text
supabase/migrations/126_scoped_source_run_reconciliation.sql
```

Function:

```text
public.complete_canonical_source_run_scoped(
  source, transaction, run_id, started_at, completion, observed_ids
)
```

The function scopes every run to **source name + Sale/Rent**. It locks that
scope, makes run completion idempotent, and compares the run's deduplicated
stable source IDs with `source_ingestion_state`.

- A captured ID resets its miss state and remains eligible to stay active.
- An externally imported, source-controlled listing not captured by that run is
  archived immediately through the trusted canonical `s3_command` lifecycle
  command with the reason `not captured during source reconciliation`.
- It operates even when execution or pagination reports failure, as the policy
  intentionally treats not-captured inventory as stale. The completion payload
  preserves the failure evidence; it does not claim an advertiser removed it.
- It never deletes a listing, source observation, canonical identity, status
  history, or attribution.
- It excludes records whose source, transaction, origin, or ownership no longer
  match the imported external-source contract. Customer-owned and independently
  managed Twuanis listings are not archived merely because an ad disappears.

Canonical archival removes the listing from active public discovery surfaces and
prevents its direct page from presenting it as active, while retaining its
historical record.

## 7. Terminal email and Admin evidence

At a terminal state, the listener writes durable command results and sends a
Resend email to `ryan@twuanis.com`. It includes:

- selected website/scraper and Sale/Rent;
- start, finish, final state, and stop status;
- extracted/captured listings and pages retrieved;
- pagination status, blocked/extraction errors, and failures;
- created, updated, published, rejected, archived, and remaining-active counts;
- agency logo and agent-photo metrics where available.

`unavailable` is deliberately different from `0`: it means that the particular
runner did not retain that metric. Email-delivery success/failure and recent
worker logs also remain visible in Admin command history.

## 8. Deployment and synchronization checklist

Run this only after local configuration/source review is complete. It does not
run a scraper.

```bash
cd /Users/cassidydaddy/twuanis
git diff --check
npx tsc --noEmit
npm run build
git status --short
git add scripts/scrapers/wasi-sites/<agency>-*.json \
  scripts/scrapers/wasi-command-runner.cjs lib/scraper-registry.ts \
  docs/TWUANIS-SCRAPER-OPERATIONS-MANUAL.md
git commit -m "Register <Agency> scraper"
git push origin production-baseline/2026-11-11-mobile-topbar
```

Deploy the exact committed source through the established Vercel production
process. Record the Vercel deployment ID and commit SHA together. If runtime
listener files changed, install only those approved files into the primary
project and restart only `com.twuanis.scraper.command-listener`; do not register
or restore the weekly scheduler.

Then verify, without running a scrape:

```bash
git rev-parse HEAD
git ls-remote origin refs/heads/production-baseline/2026-11-11-mobile-topbar
launchctl print gui/$(id -u)/com.twuanis.scraper.command-listener
launchctl print gui/$(id -u)/com.twuanis.encuentra24.weekly
```

Expected: primary source and GitHub resolve to the committed SHA, the command
listener is running, and the weekly service is not registered. In Vercel,
confirm the deployment is **Ready** and both `twuanis.com` and
`www.twuanis.com` are assigned.

Finally, an Owner may open Admin → Scraper Management and confirm the new
Sale/Rent controls render as operational. Do not press **Run Scraper** unless a
separate acquisition authorization has been granted.

## Repeatable agency-addition checklist

- [ ] Confirm public Wasi-compatible inventory and separate Sale/Rent routes.
- [ ] Confirm stable IDs, detail URLs, original price/currency, transaction,
      contacts, images, measurement labels, and raw geography evidence.
- [ ] Create one transaction-specific config under `wasi-sites/`.
- [ ] Use filters that exclude the opposite transaction.
- [ ] Run the extractor locally into `/private/tmp`; inspect output only.
- [ ] Confirm records pass transaction, geography, price, contact, and
      measurement qualification without invented values.
- [ ] Add the selection/path to `wasi-command-runner.cjs`.
- [ ] Add the source/selections to `lib/scraper-registry.ts`.
- [ ] Run type/build checks; commit only intended files.
- [ ] Deploy and synchronize primary iMac source, GitHub, and Vercel to the
      exact same commit.
- [ ] Confirm the listener is running and the weekly scheduler is disabled.
- [ ] Confirm Admin controls appear, without starting a scraper.
- [ ] Obtain separate Owner authorization before the first live run.
