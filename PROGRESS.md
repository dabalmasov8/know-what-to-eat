# Progress

## Stage 0: Scaffold
Vite + Preact PWA shell, manifest (light colours), Workbox service worker, EN/UK switch, install banner (Chromium prompt + iOS hint), offline banner, hash routing. Verified in headless Chromium at 390x844 (`tests/e2e/stage0.mjs`): UI switch persists, manifest correct, shell reloads offline, no console errors. Deploy: not done (needs account login); see README.

## Stage 1: Setup screen
Names, country (PL default, configurable), postcode validation + auto-format, radius 1-5 km, dine-in/delivery, rating delay. Saved to Dexie, `navigator.storage.persist()` requested. Verified with `tests/e2e/stage1.mjs` (validation, IndexedDB contents, reload, prefill) and `tests/postcode.test.ts`.

## Stage 1.5: Area discovery
Proxy (auth, rate limit, daily cap, cache), Google client (Geocoding + Text Search paging up to 3), cuisine derivation, filters, Discover screen (per-cuisine counts, unknown count, sparse-area hint, targeted search). Verified: `tests/proxy.test.ts`, `cuisine.test.ts`, `discovery.test.ts`, `hours.test.ts`, and `tests/e2e/stage15.mjs` against the mock proxy in Chromium. With fixtures (r=5 km): 46 found, 40 qualified, 36 known cuisine / 4 unknown, 4-5 API calls. Real-key numbers: NOT verified (no key).
