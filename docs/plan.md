# Implementation Plan

See `docs/concept.md` for the product idea. This document breaks it into buildable phases.

## Stack recap

- Laravel 13, Fortify (auth, 2FA, passkeys already scaffolded), MySQL, database queue/cache/session.
- Inertia v3 + React 19, shadcn/ui, Tailwind v4, Wayfinder for typed routes.
- Pest for tests.

## External data source: TMDb

The Movie Database (TMDb) API covers everything the concept doc needs from a single provider:

- Movie/TV metadata: genres, cast, crew (director, producer, composer via crew job titles), keywords (proxy for "themes"), release date.
- `/movie/{id}/watch/providers` and `/tv/{id}/watch/providers`: streaming availability by region (JustWatch-sourced), split into subscription/rent/buy.
- Search and discover endpoints for adding titles and for sourcing recommendation candidates.

Implications for the plan:

- Requires a TMDb API key (v3 auth) stored in `.env` / `config/services.php`.
- TMDb's terms require attribution ("This product uses the TMDb API but is not endorsed or certified by TMDb") — add it to the footer.
- We cache TMDb responses locally (titles, credits, keywords, providers) rather than re-fetching on every request, both for speed and to stay within rate limits.
- Watch providers need a much shorter refresh cadence than the rest of a title's metadata: genres/cast/crew are effectively fixed once a title is released, but streaming licensing changes monthly. These are cached with separate freshness tracking (see Data model) rather than being treated as fetch-once-and-done.

## Rating scale

Users rate watched titles 1–10, matching TMDb's own scale. Stored as an integer on the pivot between user and title.

## Data model

New Eloquent models/tables (names indicative, refine during implementation):

- `titles` — local cache of a TMDb movie or show. `tmdb_id`, `type` (movie/tv), `name`, `release_year`, `overview`, `poster_path`, `runtime`, TMDb `popularity`/`vote_average` (useful as a fallback signal and for candidate ranking), `metadata_fetched_at`.
- `genres`, `people` (actors/directors/producers/composers — one table with a `role` on the pivot, since TMDb's `credits` endpoint returns both cast and crew against the same person id), `keywords` — reference tables synced from TMDb, keyed by `tmdb_id`.
- `title_genre`, `title_person` (with `credit_type`: cast/director/producer/composer), `title_keyword` — pivots linking a title to its attributes.
- `watch_providers`
- `title_watch_providers` — `title_id`, `provider_id`, `provider_name`, `region`, `access_type` (subscription/rent/buy), `fetched_at`. Tracked separately from `titles.metadata_fetched_at` and refreshed on a much shorter TTL (e.g. 24–48 hours vs. effectively-permanent for genres/cast/crew), since streaming availability changes far more often than the rest of a title's metadata.
- `ratings` — `user_id`, `title_id`, `score` (1–10), timestamps. Unique on (`user_id`, `title_id`).
- `user_watch_providers` — `user_id`, `provider_id`, `provider_name`.
- `user_attribute_affinities` — the computed taste profile: `user_id`, `attribute_type` (genre/person/keyword/decade), `attribute_id` (nullable for decade, which is just a value), `attribute_value` (for decade), `affinity_score` (signed, how much the user over/under-rates this attribute vs. their own average), `confidence`, `sample_size`, `computed_at`. Recomputed whenever ratings change (see below).

Rationale for caching TMDb data locally instead of querying live: the correlation engine needs to join ratings against attributes repeatedly (recomputing profiles, scoring every candidate title), which is impractical against a remote API. It also lets recommendation candidates be pulled from the local cache with plain Eloquent/SQL rather than one TMDb call per candidate.

## Correlation / taste profile algorithm

For each attribute a user has enough exposure to (e.g. rated ≥ 2 titles carrying that genre/person/keyword/decade):

1. Compute the user's mean rating across all their rated titles (`user_mean`).
2. Compute the user's mean rating specifically for titles carrying that attribute (`attribute_mean`).
3. `affinity_score = attribute_mean - user_mean` — positive means they rate this attribute's titles above their own average, negative means below.
4. `confidence` uses a shrinkage/Bayesian approach so small samples don't produce extreme scores: weight the raw affinity by `sample_size / (sample_size + k)` for a tunable constant `k` (e.g. 5), and additionally track sample size directly so the UI can show "low confidence" for anything under some threshold (e.g. 3 ratings).

This keeps the math simple (no ML dependency, explainable to the user — "you rate sci-fi 1.8 points above your average across 6 titles") while still giving a defensible confidence measure. It can be swapped for a heavier statistical approach (e.g. proper Bayesian regression, or a matrix-factorization-style model) later without changing the surrounding architecture — the affinities table is the only surface other parts of the app depend on.

Recomputation trigger: dispatch a queued job to recompute the affected user's profile whenever they add/change a rating, debounced (e.g. only run if no rating event has fired in the last N seconds) so bulk-adding ratings doesn't trigger a recompute per row.

## Recommendation generation

Scoring every title TMDb knows about against every user isn't practical — the catalog is huge and most of it shares nothing with a given user's taste. This is the classic recommender-system split into two stages: cheaply **retrieve** a small candidate pool, then only **rank** (score) that pool.

### Candidate generation (retrieval)

Push the narrowing work onto TMDb's own `/discover/movie` and `/discover/tv` endpoints, which accept filters (`with_genres`, `with_cast`, `with_crew`, `with_keywords`, sorted by popularity/vote average) — rather than pulling the whole catalog into our DB and filtering locally.

Per user, build the candidate pool from two sources:

1. **Personalized queries** — take the user's top N strongest affinities from `user_attribute_affinities` (e.g. top 5 genres, top 10 people, top 10 keywords) and fire a handful of targeted discover calls, one filter (or small combination) per call. Union and dedupe the results.
2. **Generic pool** — a smaller, non-personalized set from TMDb's popular/top-rated endpoints, refreshed periodically (see Phase 4). This exists for cold-start users with too few ratings to have strong affinities yet, and to avoid the personalized queries turning into a filter bubble that only ever resurfaces attributes the user is already known to like.

From the combined pool: drop anything the user has already rated, then lazily sync each remaining title into the local cache (Phase 0's sync path) if it isn't already there — we only ever pull full metadata for titles that actually made it into a candidate pool, never the whole catalog.

Cache the resulting per-user candidate pool (e.g. in the database or cache store) with a TTL — regenerate daily or when the user's profile recomputes (Phase 3), not on every page view.

### Scoring (ranking)

Only now, against the bounded candidate pool (expect low hundreds of titles, not millions):

1. Sum the user's `affinity_score * confidence` across every attribute the candidate carries.
2. Normalize into a 0–100 "match score" (min-max or percentile against the candidate pool) so it reads meaningfully in the UI.
3. Before filtering/badging, check each candidate's `title_watch_providers.fetched_at` and re-sync from TMDb if stale (past the short TTL) — this only touches titles actually in play (a user's library or their candidate pool), not the whole cache. Then filter (or badge) by whether any of the user's selected providers appears for their region.
4. Sort by match score descending; list is filterable by genre, streaming service, and type (movie/tv) in the UI.

## Phased build

**Phase 0 — TMDb integration foundation**

- `TmdbClient` service wrapping the HTTP calls (search, title details, credits, keywords, watch providers), config in `config/services.php`.
- `Title` model + migrations for titles/genres/people/keywords/pivots.
- A sync path that, given a TMDb id, fetches details/credits/keywords/providers and upserts local records. No UI yet — cover with feature tests hitting a faked HTTP client.

**Phase 1 — Library: add & rate titles**

- Search page (Inertia) hitting a backend endpoint that proxies TMDb search, letting the user find a title.
- "Add to library" action syncs the title locally (Phase 0 path) if not already cached, then lets the user set a 1–10 rating.
- Library page listing the user's rated titles, edit/remove rating.

**Phase 2 — Streaming services**

- Settings page where the user picks their subscription streaming services from a fixed list (TMDb exposes a `/watch/providers/movie` and `/tv` list endpoint — sync this as a reference table, don't hardcode).
- Stored per-user in `user_streaming_services`.

**Phase 3 — Taste profile engine**

- `RecomputeUserAffinities` queued job implementing the algorithm above.
- Dispatch on rating create/update/delete, debounced.
- Profile page presenting the affinities in plain language and simple charts (top genres/people/keywords/decades the user favors and disfavors, with confidence indicated).

**Phase 4 — Recommendations**

- Scheduled command refreshing the generic (non-personalized) popular/top-rated pool used as a cold-start/diversity fallback.
- Candidate generation service: per-user, build the personalized-query + generic-pool candidate set described above, deduped and TTL-cached.
- Scoring service implementing the match-score algorithm against that pool, exposed via a Recommendations page: filterable, sorted list with visible match scores, streaming-service filter/badges.

**Phase 5 — Polish**

- TMDb attribution footer.
- Empty/loading states for users with too few ratings for a meaningful profile (e.g. "rate at least 5 titles to see recommendations").
- Background refresh of stale cached title data (poster/metadata can change) via the scheduler, on a much longer cadence than the watch-provider refresh in Phase 4.

## Open items to revisit as we build

- Region for streaming providers: assume a single fixed region (e.g. `US`) initially rather than building region detection/selection.
- Whether "themes" needs anything beyond TMDb keywords, or if that proxy is good enough (it likely is to start).
- Candidate pool composition — how many personalized queries/results vs. generic-pool results, and the TTL on cached candidate pools — tune once real usage data exists.
