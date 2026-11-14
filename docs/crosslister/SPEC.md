# Crosslister — Project Spec

> Status: draft. The source text was truncated partway through "Folder layout"; sections after that point are missing.

Personal tool to list clothing once and post it to Poshmark and Depop, then remove it from the other site when it sells. eBay comes later.

Single user. Not a product. Keep it simple.

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

## Hard constraints

- **Poshmark** has no public API. **Depop's** API is partner-only. For both, use a Chrome extension that works inside the user's own logged-in browser session.
- Automating Poshmark/Depop is against their rules. To limit account risk:
  - The extension **fills in forms; the user clicks the final "List" button**.
  - Delisting can be automatic, but only one action at a time, with random 3–10 second delays.
  - No bulk background requests, no hidden tabs hammering their servers.
- Site layouts change. All Poshmark/Depop page selectors live in **one config file per site**, so fixing a break is a one-file edit.
- Never store marketplace passwords. Use the browser's existing login.

---

## Architecture

    [Chrome extension]  <──>  [Backend: Supabase]  <──>  [Gmail API]
       - item entry UI          - items table              - Poshmark/Depop sale emails
       - Poshmark/Depop         - listings table
         form filler            - photo storage
       - delist runner          - job queue
                                - scheduled functions

### Stack

- **Language:** TypeScript everywhere
- **Extension:** Chrome Manifest V3, built with WXT
- **Backend:** Supabase (Postgres, Storage for photos, Edge Functions, cron)
- **Sale detection:** read "you made a sale" emails via the Gmail API. Works when the browser is closed.

### Sale flow

1. Sale email arrives (Gmail polled every 2 min).
2. Item marked `sold`. The listing on the other site gets a `delist` job.
3. The extension runs the delist job immediately if Chrome is open, otherwise on next open.
4. If a job has waited more than 15 min, send a phone notification ("Delist X on Depop now").

---

## Data model

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
      cost_cents int,        -- purchase cost, for profit tracking
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

Category, size, and condition values differ per platform. One mapping file per platform: `mappings/poshmark.ts`, `mappings/depop.ts`.

---

## Folder layout (incomplete — source truncated)

    /extension
      /entrypoints
        popup/            -- quick item list + status
        options/          -- full item entry form
        content/
          poshmark.ts     -- form fill + delist
          dep…            -- (truncated)
