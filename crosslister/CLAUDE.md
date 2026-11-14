# Crosslister — Project Spec

Personal tool to list clothing once and post it to Poshmark and Depop, then remove it from the other site when it sells. eBay comes later.

Single user (me). Not a product. Keep it simple.

---

## Goals

1. Enter an item once (photos, title, description, brand, size, condition, price).
2. Post it to Poshmark and Depop.
3. When it sells on one site, remove it from the other as fast as possible.
4. One list showing every item and where it's live.

## Non-goals (for now)

- Multi-user accounts, billing, or selling this to others
- Auto-sharing, auto-offers, follow bots
- eBay, Mercari, Vinted, Facebook, etc. (design so they can be added later — keep platform code separate so adding one is a new folder, not a rewrite)

---

## Hard constraints — read before writing code

- **Poshmark** has no public API. **Depop's** API is partner-only. For both, use a Chrome extension that works inside my own logged-in browser session.
- Automating Poshmark/Depop is against their rules. To keep my account safe:
  - The extension **fills in forms; I click the final "List" button myself**.
  - Delisting can be automatic, but only one action at a time, with random 3–10 second delays.
  - No bulk background requests, no hidden tabs hammering their servers.
- Site layouts change. All Poshmark/Depop page selectors must live in **one config file per site**, so fixing a break is a one-file edit.
- Never store my marketplace passwords. Use the browser's existing login.
- Depop supports CSV bulk upload. Check its format first and prefer generating a CSV over form-filling if it covers all fields.

---

## Architecture

```
[Chrome extension]  <──>  [Backend: Supabase]  <──>  [Gmail API]
   - item entry UI          - items table              - Poshmark/Depop sale emails
   - Poshmark/Depop         - listings table
     form filler            - photo storage
   - delist runner          - job queue
                            - scheduled functions
```

### Stack

- **Language:** TypeScript everywhere
- **Extension:** Chrome Manifest V3, built with WXT
- **Backend:** Supabase (Postgres, Storage for photos, Edge Functions, cron)
- **Sale detection:** read their "you made a sale" emails via the Gmail API. This works even when my browser is closed.

### How a sale flows

1. Sale email arrives (Gmail polled every 2 min).
2. Item marked `sold` in the database. The listing on the other site gets a `delist` job.
3. The extension runs the delist job right away if Chrome is open, otherwise the next time it opens.
4. If a job has been waiting more than 15 min, send me a phone notification ("Delist X on Depop now").

---

## Data model

```sql
items (
  id uuid pk,
  sku text unique,
  title text,
  description text,
  brand text,
  category text,
  size text,
  color text,
  condition text,        -- new_with_tags | new_without_tags | excellent | good | fair
  price_cents int,
  cost_cents int,        -- what I paid, for profit tracking
  status text,           -- draft | active | sold | archived
  created_at timestamptz,
  sold_at timestamptz
)

photos (
  id uuid pk,
  item_id uuid fk,
  storage_path text,
  position int
)

listings (
  id uuid pk,
  item_id uuid fk,
  platform text,         -- poshmark | depop (ebay later)
  external_id text,      -- the platform's listing ID
  url text,
  status text,           -- pending | live | sold | delisted | error
  price_cents int,       -- per-platform price (fees differ)
  last_error text,
  updated_at timestamptz
)

jobs (
  id uuid pk,
  listing_id uuid fk,
  action text,           -- create | delist | update_price
  status text,           -- queued | running | done | failed
  attempts int,
  run_after timestamptz,
  created_at timestamptz
)
```

Category, size, and condition values differ per platform. Keep one mapping file per platform: `mappings/poshmark.ts`, `mappings/depop.ts`.

---

## Folder layout

```
/extension
  /entrypoints
    popup/            -- quick item list + status
    options/          -- full item entry form
    poshmark.content.ts  -- form fill + delist (WXT requires the *.content.ts name)
    depop.content.ts     -- form fill + delist
    background.ts     -- job runner, polls jobs table
  /lib                -- supabase client, db calls, form-fill helpers
  /sites
    poshmark.config.ts   -- ALL selectors for Poshmark
    depop.config.ts      -- ALL selectors for Depop
/supabase
  /migrations
  /functions
    gmail-poll-sales/
    notify-stuck-jobs/
/shared
  types.ts
  categories.ts       -- our category list; mappings translate it per platform
  payload.ts          -- item -> values typed into a site's form
  /mappings
```

---

## Build phases

Do one phase at a time. Each phase must work end to end before starting the next.

### Phase 1 — Inventory + Poshmark/Depop form filling
- Supabase project, tables, photo upload
- Extension options page: create/edit items with photos
- Content scripts open the "new listing" page on each site and fill every field + upload photos
- I click the final submit button
- After submit, capture the listing URL/ID and save it to `listings`
- **Done when:** one item goes live on both sites, and the dashboard shows both links.

### Phase 2 — Sale detection + auto-delist
- Gmail polling for Poshmark/Depop sale emails (parse item title/ID from email)
- Job queue + extension job runner with random delays
- Phone notification for stuck jobs (ntfy.sh or Pushover)
- **Done when:** I sell a test item on one site and it's gone from the other without me touching anything (with Chrome open).

### Phase 3 — Nice to have
- Per-platform price rules (e.g. Poshmark +10% to cover fees)
- Profit report (price − cost − fees)
- Import existing listings from one platform into the database
- Add eBay through its official API (Sell Inventory + Fulfillment APIs) — no scraping eBay

---

## Testing rules

- Poshmark/Depop: test with 1–2 real low-value items. No bulk testing.
- Write unit tests for: mapping files, email parsing, job queue logic.
- Selector configs get a "health check" command that opens each page and reports which selectors are missing.

## Coding rules

- Small files, clear names. No clever abstractions.
- Every external call logs its result to the `listings.last_error` or `jobs` row on failure.
- Secrets in `.env` / Supabase secrets only. Never commit them.
- Ask before adding any new dependency.
