# Progress

## Stage 0: Scaffold
Vite + Preact PWA shell, manifest (light colours), Workbox service worker, EN/UK switch, install banner (Chromium prompt + iOS hint), offline banner, hash routing. Verified in headless Chromium at 390x844 (`tests/e2e/stage0.mjs`): UI switch persists, manifest correct, shell reloads offline, no console errors. Deploy: not done (needs account login); see README.

## Stage 1: Setup screen
Names, country (PL default, configurable), postcode validation + auto-format, radius 1-5 km, dine-in/delivery, rating delay. Saved to Dexie, `navigator.storage.persist()` requested. Verified with `tests/e2e/stage1.mjs` (validation, IndexedDB contents, reload, prefill) and `tests/postcode.test.ts`.
