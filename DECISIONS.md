# Decisions

## Stack
- **Preact + @preact/signals** (instead of Svelte/React): React-style hooks, ~4 KB, signals give a tiny global store for language/settings/route. Dependencies: `preact`, `@preact/signals` (state), `dexie` (IndexedDB, required by plan).
- **vite-plugin-pwa**: manifest + Workbox service worker, required by plan.
- Dev deps: `vite`, `@preact/preset-vite`, `typescript`, `vitest` (tests), `tsx` (run the Node proxy/server TS directly), `eslint` + `typescript-eslint` (lint), `fake-indexeddb` (Dexie tests in Node), `playwright-core` (real-browser checks and icon rendering using the preinstalled Chromium, no browser download), `@types/node`.
- **Hash routing** (`#/path`), own 20-line router: no dependency, works with static hosting and the service worker without rewrite rules.
- Light-only palette; no `prefers-color-scheme` anywhere (a test greps for it).

## Docs access
- developers.google.com is blocked in this build environment, so Google docs could not be read directly. Facts below come from web-search summaries of the official reference and must be re-verified against the live docs: `minRating` exists on `places:searchText`; `pageSize` max 20; `locationRestriction` for Text Search is a **rectangle** (circle only for `locationBias`); `nextPageToken` pagination.

## Stage 1.5 (discovery and proxy)
- **Text Search with a rectangle** (bounding box of the circle) + client-side distance filter, because `locationRestriction` on Text Search accepts only a rectangle. `minRating: 4.5` is sent to Google *and* re-checked client-side (authoritative), with the 30-review floor client-side only.
- **Proxy endpoints `/api/geocode` and `/api/places`** (client orchestrates: geocode, then places with up to 3 pages server-side). Each Google call counts against `DAILY_CAP`; identical requests are cached 10 min in the store and do not count.
- **Limits**: per-IP per-minute limit before auth; shared passcode via `x-passcode` (constant-time compare, fails closed when unset); 10 wrong passcodes lock an IP for 15 min. Store = in-memory (Node/tests) or Cloudflare KV (Worker; non-atomic, fine for personal use).
- **Mock Google is dev-only** (`server/dev/mock.ts`, loaded by `server/node.ts` only when `MOCK_GOOGLE=1`). It replaces the outbound `fetch`, so the real parsing/limit code still runs. The Worker never imports it. Switching to the real key = unset `MOCK_GOOGLE`, set `GOOGLE_API_KEY` and `APP_PASSCODE`.
- **Cuisine derivation**: primaryType, then other types, then keyword fallback on name + editorial summary (accent-insensitive, `!` = whole word). Cuisine ids are ours (e.g. `kebab`, `polish`, `georgian` have no Google type). One cuisine per place.
- **Opening hours** are stored as weekly periods + UTC offset and "open now" is computed on the client, because a cached `openNow` snapshot would be stale.
- **Cache lifetime 7 days** (`PLACE_CACHE_DAYS`). Google's terms (per search summaries; not verifiable here) allow indefinite storage only of place IDs and ~30 days for coordinates; other content should only be cached temporarily. Visits therefore store only a name snapshot for history; the places cache is rebuilt after 7 days and is **not** included in JSON export.
- A "specific cuisine" search makes one extra 1-page call (`"<cuisine> restaurant"`), merges new qualifying places, and fills `unknown` cuisines of matching existing places.

## Stages 4-5
- **Delivery buttons are web-search fallbacks** for Wolt, Pyszne.pl, Glovo and Uber Eats (`Google search: "<name> <service> <postcode>"`). Searches could not confirm a public by-name search URL for any of them (Pyszne.pl and Glovo: none found; Wolt: only an undocumented, city-slug-specific `/search?q=`; Uber Eats: unconfirmed), and the brief says to fall back when unsure. One function (`src/lib/delivery.ts`) to change once formats are verified in a real browser.
- Maps button uses the documented Maps URLs format `search/?api=1&query=<name>&query_place_id=<id>`.
- Places list reads only IndexedDB (`places` by `cuisine`); the stale banner (7 days) sends the user to Discover to refresh. Visits snapshot the place name and cuisine.
- "Open now" filter hides only places known to be closed; unknown hours are kept.
