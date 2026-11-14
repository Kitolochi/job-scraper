# Crosslister

List clothing once, post it to Poshmark and Depop. The spec is in [CLAUDE.md](CLAUDE.md).

**Status: Phase 1 code written; not yet run against the real sites.** The selectors in
`extension/sites/*.config.ts` are unverified guesses. Run the health check first (step 6).

## Setup

1. **Supabase project.** Create one at supabase.com.
2. **Schema.** Paste `supabase/migrations/20261114000000_init.sql` into the SQL editor and run it
   (or `npx supabase db push` if you use the Supabase CLI).
3. **Your user.** Authentication → Users → *Add user* (email + password).
   Then Authentication → Sign In / Providers → turn **off** "Allow new users to sign up".
   The anon key ships inside the extension, so leaving sign-ups on lets anyone create an account.
   RLS still scopes rows to their owner, but there is no reason to allow it.
4. **Env.** `cp .env.example .env` and fill in the project URL and anon key (Project Settings → API).
5. **Build.** `npm install && npm run build`, then in Chrome open `chrome://extensions`, turn on
   Developer mode, *Load unpacked* → `.output/chrome-mv3`. For development, `npm run dev` rebuilds on save.
6. **Health check.** Log in to Poshmark and Depop in that Chrome profile. Open the extension's options page,
   sign in, click *Check Poshmark* / *Check Depop*. Fix every ✗ in the matching config file, rebuild,
   repeat. When everything is ✓, set `verifiedOn` in the config.
7. **First listing.** Create one low-value item with photos, click *List on poshmark*. A tab opens,
   the form fills, a banner lists anything it couldn't fill. Fix those by hand and click **List** yourself.
   When the site redirects to the new listing, its URL is saved and the item table shows *live ↗*.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Build in watch mode |
| `npm run build` | Production build to `.output/chrome-mv3` |
| `npm test` | Unit tests (Node's built-in runner, no extra deps) |
| `npm run typecheck` | TypeScript check |

## How a fill works

1. Options page → *List on X* → background checks the item (`shared/payload.ts`), creates/resets the
   `listings` row as `pending`, opens the site's new-listing page, and remembers the tab.
2. The content script on that page asks the background for its task, gets the field values plus photos,
   fills each field in `fields` order with short random pauses, and reports which fields failed.
   Failures are saved to `listings.last_error`.
3. You click **List**. The background sees the tab navigate to a URL matching `listingUrlPattern`,
   saves `url` + `external_id`, sets the listing `live` and the item `active`.

The content scripts do nothing on pages the extension didn't open.

## Known gaps

- Selectors, Poshmark condition labels, and the Depop category taxonomy are unverified.
- Poshmark may show a share dialog or go to your closet after listing instead of the listing page.
  If so, `listingUrlPattern` never matches and the listing stays `pending`. Check this on the first test item.
- Depop shipping is not filled. Choose it by hand.
- Size labels are typed exactly as entered. If a site's size picker says "M" and you entered "Medium", it fails
  that field and you pick it by hand.
