# Decisions

## Stack
- **Preact + @preact/signals** (instead of Svelte/React): React-style hooks, ~4 KB, signals give a tiny global store for language/settings/route. Dependencies: `preact`, `@preact/signals` (state), `dexie` (IndexedDB, required by plan).
- **vite-plugin-pwa**: manifest + Workbox service worker, required by plan.
- Dev deps: `vite`, `@preact/preset-vite`, `typescript`, `vitest` (tests), `tsx` (run the Node proxy/server TS directly), `eslint` + `typescript-eslint` (lint), `fake-indexeddb` (Dexie tests in Node), `playwright-core` (real-browser checks and icon rendering using the preinstalled Chromium, no browser download), `@types/node`.
- **Hash routing** (`#/path`), own 20-line router: no dependency, works with static hosting and the service worker without rewrite rules.
- Light-only palette; no `prefers-color-scheme` anywhere (a test greps for it).

## Docs access
- developers.google.com is blocked in this build environment, so Google docs could not be read directly. Facts below come from web-search summaries of the official reference and must be re-verified against the live docs: `minRating` exists on `places:searchText`; `pageSize` max 20; `locationRestriction` for Text Search is a **rectangle** (circle only for `locationBias`); `nextPageToken` pagination.
