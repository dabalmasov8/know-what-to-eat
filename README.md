# Food Picker

A PWA for two people on **one shared phone** who keep arguing about where to eat.

1. Enter a postcode and a radius (1-5 km), pick *dine in* or *delivery / pickup*.
2. The app finds well-rated places nearby (Google rating **4.5+**, **30+ reviews**; fixed, no setting) and works out which cuisines are available.
3. Pass-the-phone: each person answers yes/no per cuisine, answers hidden from the other.
4. Both said yes to a cuisine? You get places for it. No match? A wheel of fortune picks the cuisine.
5. Mark that you went or ordered; later rate 1-5 each (hidden until both are done). The average shows on place cards and in a local leaderboard.

English and Ukrainian UI, light theme only, local-first (IndexedDB, no accounts). See `PLAN.md` for the full plan, `DECISIONS.md` for choices and dependencies, `PROGRESS.md` for what was verified at each stage.

## Architecture

- `src/`: Preact + signals + Dexie PWA (hash routing, `vite-plugin-pwa` service worker).
- `server/core.ts`: a small proxy (`POST /api/geocode`, `POST /api/places`) that holds the Google key, requires a passcode, rate-limits per IP, caps total Google calls per day and caches responses for 10 minutes. It uses web-standard `Request`/`Response`, so it runs as a Cloudflare Worker (`server/worker.ts`) or on Node (`server/node.ts`).
- The browser never sees the Google key. Places data comes only from the official Geocoding and Places API (New).

## Environment variables (server side only)

See `.env.example`. Never commit real values.

| Variable | Meaning |
|---|---|
| `GOOGLE_API_KEY` | Google Cloud key with **Places API (New)** and **Geocoding API** enabled |
| `APP_PASSCODE` | Shared passcode the app asks for on first search (the proxy refuses everything else) |
| `DAILY_CAP` | Max Google calls per UTC day (default 200) |
| `RATE_LIMIT_PER_MIN` | Max requests per IP per minute (default 30) |
| `MOCK_GOOGLE` | `1` = answer from built-in Warsaw-style fixtures (dev/test only, passcode defaults to `dev`) |

## Run locally

```bash
npm install
cp .env.example .env     # optional; the mock mode needs nothing
npm run dev              # mock Google + Vite on http://localhost:5173 (passcode: dev)
```

With a real key: export `GOOGLE_API_KEY` and `APP_PASSCODE` (and leave `MOCK_GOOGLE` unset), then `npm run build && npm start` (serves `dist/` and `/api` on http://localhost:8787), or run `npm run dev:api` next to `npx vite`.
Switching from mock to real is only an environment change; there is no code switch.

Checks: `npm run typecheck`, `npm run lint`, `npm test` (unit tests, proxy tests with Google mocked), and `npm run build && MOCK_GOOGLE=1 DAILY_CAP=100000 RATE_LIMIT_PER_MIN=100000 npm start` in one terminal plus `npm run e2e` in another (headless Chromium at 390x844, uses the preinstalled browser at `/opt/pw-browsers/chromium`, override with `CHROMIUM_PATH`).

## Get and restrict a Google key

1. Google Cloud Console: create a project, **enable billing**, enable *Places API (New)* and *Geocoding API*.
2. Create an API key. Under *API restrictions* allow only those two APIs. (An application restriction by IP is not possible on Cloudflare Workers; the API restriction, the quota below and the proxy's passcode + cap are the protection.)
3. Set a **budget alert** and, under *APIs & Services > Quotas*, a per-day quota on both APIs as a safety net behind `DAILY_CAP`.

## Deploy (Cloudflare, one Worker serves the app and the API)

```bash
npm run build
npx wrangler kv namespace create STATE        # paste the id into wrangler.toml
npx wrangler secret put GOOGLE_API_KEY
npx wrangler secret put APP_PASSCODE
npx wrangler deploy
```

HTTPS (required for the PWA) is provided by Cloudflare. Any Node host also works: `npm run build && npm start` with the env vars above (the in-memory limiter then resets on restart; fine for personal use). This repository was **not** deployed from the build environment (needs your account login).

## Cost notes (verify against the current price list)

- One setup = 1 Geocoding call + up to 3 Text Search pages (20 results each, so max 60 places). A "search a specific cuisine" costs 1 more call. After that voting, wheel, places, ratings and history are 100% local.
- The field mask requests rating, review count, types, website, phone, opening hours and summary, which puts Text Search into the **Enterprise** SKU. That is accepted because discovery runs once per area; places are cached 7 days (`PLACE_CACHE_DAYS`) and the proxy caches identical requests for 10 minutes.
- Google's free monthly usage allowance per SKU (at the time of writing roughly 1,000 Enterprise Text Search calls and 10,000 Geocoding calls) means about 300 setups a month for free. The Google docs were not reachable from the build environment, so confirm these numbers and the `minRating` / rectangle behaviour in the live docs.
- Text Search accepts only a *rectangle* restriction, so the app searches the bounding box of your circle and filters by real distance.

## Privacy

- Names, answers, visits and ratings stay in IndexedDB in your browser. No accounts, no analytics, no ads.
- Searching sends the postcode, country, radius and search text to this app's server, which forwards them to Google (Geocoding + Places). Google applies its own terms.
- Place details from Google are kept locally for up to 7 days, are not included in the JSON backup, and are re-fetched when stale.
- The app asks the browser for persistent storage (`navigator.storage.persist()`). On iOS, installed PWAs are more durable than Safari tabs; use *Settings > Export backup* regularly.

## Known limitations

- Delivery buttons (Wolt, Pyszne.pl, Glovo, Uber Eats) open a web search for the restaurant on that service, because no public by-name URL format could be confirmed. They do not detect delivery availability.
- Cuisine comes from Google types, then keyword matching on name and summary; places without a clear cuisine are counted as "unknown" and are not offered in the voting.
- Stages 9 (Telegram Mini App) and 10 (web push reminders) are not implemented.
