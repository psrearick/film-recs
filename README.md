# FilmRecs

A movie and TV recommendation app. You rate what you've watched, and the app
works out which characteristics you actually value — genres, keywords/themes,
actors, directors, producers, composers, release decade — then uses those
correlations to recommend titles you haven't seen, optionally limited to the
streaming services you subscribe to.

Title metadata comes from [TMDb](https://www.themoviedb.org/) and is cached
locally, so the correlation engine can join ratings against attributes in SQL
instead of hitting the API repeatedly.

See [`docs/concept.md`](docs/concept.md) for the product idea and
[`docs/plan.md`](docs/plan.md) for the phased implementation plan, including
the taste-profile and match-scoring algorithms.

## Status

In progress. What works today:

- **Home page** — popular and trending movies and series.
- **Search** — multi-search against TMDb.
- **Movie / series pages** — metadata, cast and crew by role, keywords,
  streaming availability.
- **Person pages** — biography plus credits, broken down by role.
- **Ratings** — rate a title 1–10, and a sortable table of your rated titles.
- **Auth** — registration, login, password reset, profile and password updates
  (via Fortify; two-factor and passkeys are scaffolded but disabled in
  `config/fortify.php`).

Not built yet: streaming-service selection, the taste-profile engine
(`user_attribute_affinities`), and recommendation generation — phases 2 through
5 of the plan.

## Stack

| Layer    | Choice                                                           |
| -------- | ---------------------------------------------------------------- |
| Backend  | PHP 8.5, Laravel 13, Fortify                                     |
| Frontend | Inertia v3, React 19, Tailwind v4, shadcn/ui, TanStack Table     |
| Routing  | Wayfinder (typed route functions generated into `resources/js`)  |
| Data     | MySQL 8.4; database-backed queue, cache, and sessions            |
| Tooling  | Laravel Sail, Vite 8 / vite-plus, Pest, PHPStan (larastan), Pint |
| E2E      | Playwright                                                       |

## Requirements

- Docker (for Sail)
- Node 22+ and npm, installed on the host
- A TMDb API read access token

## Setup

```bash
git clone <repo-url> film-recs
cd film-recs

cp .env.example .env
# Set TMDB_READ_ACCESS_TOKEN, and switch the DB block to MySQL for Sail:
#   DB_CONNECTION=mysql
#   DB_HOST=mysql
#   DB_DATABASE=laravel
#   DB_USERNAME=sail
#   DB_PASSWORD=password

# Composer runs inside Sail, but the initial install needs PHP on the host
# (or use the containerized installer from the Sail docs).
composer install
npm install          # host install — see the note below

vendor/bin/sail up -d
vendor/bin/sail artisan key:generate
vendor/bin/sail artisan migrate
```

Then run the dev server and open the app:

```bash
npm run dev          # Vite, on the host
vendor/bin/sail open
```

`APP_PORT` and `VITE_PORT` in `.env` control which host ports Sail publishes.

## Two command environments

This is the one thing to get right about this repo:

- **PHP commands go through Sail** — `vendor/bin/sail artisan ...`,
  `vendor/bin/sail composer ...`. The `mysql` hostname only resolves inside the
  Sail network.
- **Node commands run on the host** — `npm run ...`. `node_modules` holds macOS
  (`darwin-arm64`) native bindings. Never run `vendor/bin/sail npm install`: it
  reinstalls `node_modules` and rewrites `package-lock.json` with Linux
  bindings, which breaks every native frontend command until you reinstall on
  the host.

If a frontend command fails with a "Cannot find native binding" error, check
`ls node_modules/@voidzero-dev` — it should contain a `darwin-arm64` package,
not `linux-arm64-gnu` — and fix it with a plain host `npm install`.

## Checks

Run the full suite before considering a change done:

```bash
./check
```

That wraps `composer audit`, `npm run audit`, `npm run check`,
`npm run types:check`, `npm run test`, and `vendor/bin/sail composer run test`
(Pint, PHPStan, Pest) — the same set CI runs via `composer ci:check`.

Narrower commands while iterating:

```bash
vendor/bin/sail artisan test --compact                    # PHP tests
vendor/bin/sail artisan test --filter=TitleRating         # one PHP test
vendor/bin/sail bin pint --dirty --format agent           # format changed PHP
vendor/bin/sail composer types:check                      # PHPStan

npm run test                                              # React tests (Vitest)
npm run check                                             # lint + format
npm run check:fix
npm run types:check                                       # tsc --noEmit
npm run test:e2e                                          # Playwright
```

A Husky pre-commit hook runs `lint-staged`: `vp check --fix` on changed
JS/TS/CSS, and Pint on changed PHP.

## Architecture

```
app/
├── Actions/
│   ├── Tmdb/            Fetch-and-sync entry points: GetMovie, GetSeries,
│   │                    GetPerson, Search, GetPopular*/GetTrending*
│   └── Sync*            Reconcile one relation from a TMDb payload
│                        (credits, genres, keywords, watch providers)
├── Integrations/
│   └── TmdbClient.php   Thin HTTP wrapper over the TMDb endpoints
├── Http/Controllers/    Thin — they inject Actions and Inertia::render
├── Jobs/                SyncPersonCredits (queued backfill)
├── Models/              Title, Person, Genre, Keyword, WatchProvider, Rating
└── Enums/               TitleType, CreditType, AccessType

resources/js/
├── pages/               Inertia pages, one per route
├── components/          title/, ratings/, ui/ (shadcn) and shared chrome
├── actions/ routes/     Wayfinder-generated — do not edit
└── types/
```

The read path is cache-first: a `Get*` action looks for a local `Title`, and
only calls TMDb when the record is missing or `is_stale`. A fetch upserts the
title and its relations inside one transaction. Watch providers carry their own
`fetched_at` and refresh on a much shorter TTL than the rest of a title's
metadata, since streaming licensing changes far more often than cast and crew.

Every React component and page has a colocated `*.test.tsx`.

## Attribution

This product uses the TMDb API but is not endorsed or certified by TMDb.
