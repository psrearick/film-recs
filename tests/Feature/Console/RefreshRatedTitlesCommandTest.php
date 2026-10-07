<?php

use App\Enums\TitleType;
use App\Jobs\UpdateAttributeAffinities;
use App\Models\Rating;
use App\Models\Title;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;

beforeEach(function () {
    Queue::fake([UpdateAttributeAffinities::class]);
});

/**
 * @return array<string, mixed>
 */
function tmdbRefreshResponses(Title $title, string $name): array
{
    $baseUrl = config('services.tmdb.base_url');
    $castMember = ['id' => 6384, 'name' => 'Keanu Reeves', 'character' => 'Neo', 'profile_path' => null, 'order' => 0];

    return $title->type === TitleType::Movie
        ? [
            "{$baseUrl}/movie/{$title->tmdb_id}?append_to_response=credits,keywords" => Http::response([
                'id' => $title->tmdb_id,
                'title' => $name,
                'credits' => ['cast' => [$castMember], 'crew' => []],
            ]),
            "{$baseUrl}/movie/{$title->tmdb_id}/watch/providers" => Http::response(['id' => $title->tmdb_id, 'results' => []]),
        ]
        : [
            "{$baseUrl}/tv/{$title->tmdb_id}?append_to_response=aggregate_credits,keywords" => Http::response([
                'id' => $title->tmdb_id,
                'name' => $name,
                'number_of_episodes' => 62,
                'aggregate_credits' => ['cast' => [[...$castMember, 'total_episode_count' => 62]], 'crew' => []],
            ]),
            "{$baseUrl}/tv/{$title->tmdb_id}/watch/providers" => Http::response(['id' => $title->tmdb_id, 'results' => []]),
        ];
}

test('every rated title is re-synced from tmdb even when it is not stale', function () {
    Http::preventStrayRequests();
    $movie = Title::factory()->movie()->create(['name' => 'Old Movie Name', 'metadata_fetched_at' => now()]);
    $series = Title::factory()->tv()->create(['name' => 'Old Series Name', 'metadata_fetched_at' => now()]);
    Rating::factory()->for($movie)->create();
    Rating::factory()->for($series)->create();
    Title::factory()->create();
    Http::fake([
        ...tmdbRefreshResponses($movie, 'The Matrix'),
        ...tmdbRefreshResponses($series, 'Breaking Bad'),
    ]);

    $this->artisan('titles:refresh-rated')->assertSuccessful();

    expect($movie->refresh()->name)->toBe('The Matrix');
    expect($series->refresh()->name)->toBe('Breaking Bad');
    expect($series->episode_count)->toBe(62);
});

test('an affinity recompute is queued for every user with ratings', function () {
    Http::preventStrayRequests();
    $title = Title::factory()->movie()->create();
    $user = User::factory()->create();
    $otherUser = User::factory()->create();
    $userWithoutRatings = User::factory()->create();
    Rating::factory()->for($title)->for($user)->create();
    Rating::factory()->for($title)->for($otherUser)->create();
    Http::fake(tmdbRefreshResponses($title, 'The Matrix'));
    Queue::fake([UpdateAttributeAffinities::class]);

    $this->artisan('titles:refresh-rated')->assertSuccessful();

    Queue::assertPushedTimes(UpdateAttributeAffinities::class, 2);
    Queue::assertNotPushed(
        UpdateAttributeAffinities::class,
        fn (UpdateAttributeAffinities $job) => $job->userId === $userWithoutRatings->id,
    );
});

test('a title that fails to refresh fails the command without stopping the others', function () {
    Http::preventStrayRequests();
    $failingMovie = Title::factory()->movie()->create(['name' => 'Failing Movie']);
    $movie = Title::factory()->movie()->create(['name' => 'Old Movie Name']);
    Rating::factory()->for($failingMovie)->create();
    Rating::factory()->for($movie)->create();
    $baseUrl = config('services.tmdb.base_url');
    Http::fake([
        "{$baseUrl}/movie/{$failingMovie->tmdb_id}?append_to_response=credits,keywords" => Http::response(status: 500),
        ...tmdbRefreshResponses($movie, 'The Matrix'),
    ]);

    $this->artisan('titles:refresh-rated')
        ->expectsOutputToContain('Failed to refresh 1 of 2 titles.')
        ->assertFailed();

    expect($failingMovie->refresh()->name)->toBe('Failing Movie');
    expect($movie->refresh()->name)->toBe('The Matrix');
});
