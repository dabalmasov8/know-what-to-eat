# Food Picker — plan (copied from the project brief)

Two people, ONE shared phone, pass-the-phone yes/no per cuisine -> match or wheel of fortune -> places -> visit -> rating loop -> history/leaderboard.
Hard rules: Google rating >= 4.5 and >= 30 reviews (named constants, no UI); modes dine_in/delivery only; light theme only; EN+UK i18n;
local-first IndexedDB (Dexie); official Google Places API (New) + Geocoding via serverless proxy only; API key only in server env;
proxy protected by passcode + per-IP rate limit + daily cap.

Stages: 0 scaffold/PWA/i18n, 1 setup screen, 1.5 area discovery, 2 cuisine voting, 3 wheel, 4 places lookup,
5 place card + actions, 6 rating loop, 7 history + leaderboard, 8 polish (states, export/import, privacy, a11y).
9 (Telegram Mini App) and 10 (push) are optional and not started.
See the original brief for full details; decisions made while building are in DECISIONS.md.
