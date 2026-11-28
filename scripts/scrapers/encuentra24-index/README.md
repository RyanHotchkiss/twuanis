# Encuentra24 index-only collector

`sale.cjs` and `rent.cjs` collect only their configured index and pagination URLs.
They bind embedded `ad` data to the rendered card ID, preserve each observation
immediately in NDJSON and CSV, and use the card-level contact popup only for
WhatsApp evidence. They block detail/profile navigation and external WhatsApp
navigation. `--resume <run-directory>` reuses the run's NDJSON checkpoint.

This isolated collector intentionally does not alter the legacy detail-page
scrapers. Downstream publication wiring remains a separate controlled step.
