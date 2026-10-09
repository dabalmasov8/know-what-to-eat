# Progress

## Stage 0: Scaffold
Vite + Preact PWA shell, manifest (light colours), Workbox service worker, EN/UK switch, install banner (Chromium prompt + iOS hint), offline banner, hash routing. Verified in headless Chromium at 390x844 (`tests/e2e/stage0.mjs`): UI switch persists, manifest correct, shell reloads offline, no console errors. Deploy: not done (needs account login); see README.

## Stage 1: Setup screen
Names, country (PL default, configurable), postcode validation + auto-format, radius 1-5 km, dine-in/delivery, rating delay. Saved to Dexie, `navigator.storage.persist()` requested. Verified with `tests/e2e/stage1.mjs` (validation, IndexedDB contents, reload, prefill) and `tests/postcode.test.ts`.

## Stage 1.5: Area discovery
Proxy (auth, rate limit, daily cap, cache), Google client (Geocoding + Text Search paging up to 3), cuisine derivation, filters, Discover screen (per-cuisine counts, unknown count, sparse-area hint, targeted search). Verified: `tests/proxy.test.ts`, `cuisine.test.ts`, `discovery.test.ts`, `hours.test.ts`, and `tests/e2e/stage15.mjs` against the mock proxy in Chromium. With fixtures (r=5 km): 46 found, 40 qualified, 36 known cuisine / 4 unknown, 4-5 API calls. Real-key numbers: NOT verified (no key).

## Stages 2 + 3: Voting and wheel
Pass-the-phone voting (A, hidden hand-over, B), intersection / multiple matches (pick or random) / empty -> wheel. SVG wheel with crypto-random winner decided first, CSS spin (5 s), "Pick for us" instant button, reduced-motion support, union-of-yes or all-cuisines segments. Verified: `tests/voting.test.ts`, `tests/wheel.test.ts` (geometry lands on the chosen segment) and `tests/e2e/stage23.mjs` (single match, several matches, wheel union, no/no wheel, spin timing, reduced motion).

## Stages 4 + 5: Places lookup and place card
Places list from the local cache (verified: zero API calls), open-now toggle, sort by distance / our rating, stale-cache banner. Card: distance, Google rating + count, our rating (or "not rated"), open/closed from cached weekly hours, website, call, Maps, 4 delivery buttons (search fallbacks, see DECISIONS), primary "We're going here / ordering from here" creating an unrated visit. Verified: `tests/e2e/stage45.mjs`, `tests/ratings.test.ts`, `tests/hours.test.ts`.

## Stages 6 + 7: Rating loop, history, leaderboard
Pending-rating banner on Home after the configurable delay (default 2 h), pass-the-phone 1-5 star rating with hidden scores, average saved, skip ("we didn't go"), history (with rate-now for pending), leaderboard (average, visit count, tap to reopen place), our rating on place cards and lists. Verified: `tests/e2e/stage67.mjs` (delay respected via back-dated visits, hidden scores, skip, leaderboard, reopen) and `tests/ratings.test.ts`.

## Stage 8: Polish and test-readiness
Skeleton loading states, error boundary, offline/network error with retry, passcode gate, empty states, JSON export/import (settings, sessions, visits, ratings; no Google content) with validation, `navigator.storage.persist()` status, privacy note, feedback link, accessibility pass. Verified: `tests/e2e/stage8.mjs` (axe WCAG2A/AA on discover, vote, wheel, places, home, settings, history, leaderboard: 0 violations; every button/link/select >= 44 px; export -> wipe -> import round trip; invalid file rejected; offline discovery error), `tests/backup.test.ts`, `tests/policy.test.ts` (light theme only, no key in client source or bundle, mock not reachable from production code). Lighthouse (current version, no PWA category): performance 97, accessibility 100, best practices 100; Chrome installability check reports no manifest/SW errors (only "in-incognito" from the headless context).
