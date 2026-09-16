<?php

use App\Jobs\SyncPersonCredits;
use App\Models\Person;
use Illuminate\Support\Facades\Http;

function fakeSyncedMovie(int $id): void
{
    Http::fake([
        config('services.tmdb.base_url')."/movie/{$id}?append_to_response=credits,keywords" => Http::response([
            'id' => $id,
            'title' => "Movie {$id}",
            'release_date' => '2000-01-01',
            'genres' => [],
            'credits' => ['cast' => [], 'crew' => []],
            'keywords' => ['keywords' => []],
        ]),
        config('services.tmdb.base_url')."/movie/{$id}/watch/providers" => Http::response([
            'id' => $id,
            'results' => [],
        ]),
    ]);
}

function fakeSyncedSeries(int $id): void
{
    Http::fake([
        config('services.tmdb.base_url')."/tv/{$id}?append_to_response=aggregate_credits,keywords" => Http::response([
            'id' => $id,
            'name' => "Series {$id}",
            'first_air_date' => '2000-01-01',
            'genres' => [],
            'aggregate_credits' => ['cast' => [], 'crew' => []],
            'keywords' => ['results' => []],
        ]),
        config('services.tmdb.base_url')."/tv/{$id}/watch/providers" => Http::response([
            'id' => $id,
            'results' => [],
        ]),
    ]);
}

test('marks the person as synced once every credit fetch succeeds', function () {
    $person = Person::factory()->create(['credits_fetched_at' => null]);

    fakeSyncedMovie(603);
    fakeSyncedSeries(4607);

    $this->freezeTime();

    SyncPersonCredits::dispatch($person->id, [603], [4607]);

    expect($person->fresh()->credits_fetched_at->toDateTimeString())->toBe(now()->toDateTimeString());
});

test('leaves the person unsynced when a movie credit fetch fails', function () {
    $person = Person::factory()->create(['credits_fetched_at' => null]);

    Http::fake([
        config('services.tmdb.base_url').'/movie/603?append_to_response=credits,keywords' => Http::response(
            ['status_message' => 'Internal Server Error'],
            500,
        ),
    ]);

    fakeSyncedSeries(4607);

    SyncPersonCredits::dispatch($person->id, [603], [4607]);

    expect($person->fresh()->credits_fetched_at)->toBeNull();
});

test('leaves the person unsynced when a tv credit fetch fails', function () {
    $person = Person::factory()->create(['credits_fetched_at' => null]);

    fakeSyncedMovie(603);

    Http::fake([
        config('services.tmdb.base_url').'/tv/4607?append_to_response=aggregate_credits,keywords' => Http::response(
            ['status_message' => 'Internal Server Error'],
            500,
        ),
    ]);

    SyncPersonCredits::dispatch($person->id, [603], [4607]);

    expect($person->fresh()->credits_fetched_at)->toBeNull();
});
