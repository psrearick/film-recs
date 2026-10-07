<?php

use App\Enums\TitleType;
use App\Jobs\UpdateAttributeAffinities;
use App\Models\Rating;
use App\Models\Title;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use PHPUnit\Framework\Assert;

beforeEach(function () {
    Queue::fake([UpdateAttributeAffinities::class]);
});

function fakeTmdbSeries(int $id, array $overrides = []): void
{
    Http::fake([
        config('services.tmdb.base_url')."/tv/{$id}?append_to_response=aggregate_credits,keywords" => Http::response(array_merge([
            'id' => $id,
            'name' => 'Lost',
            'first_air_date' => '2004-09-22',
            'overview' => 'The survivors of a plane crash must work together to stay alive.',
            'poster_path' => '/lost.jpg',
            'popularity' => 45.3,
            'vote_average' => 8.0,
            'number_of_episodes' => 121,
            'genres' => [
                ['id' => 9648, 'name' => 'Mystery'],
                ['id' => 18, 'name' => 'Drama'],
            ],
            'aggregate_credits' => [
                'cast' => [
                    [
                        'id' => 6384,
                        'name' => 'Matthew Fox',
                        'profile_path' => '/matthew.jpg',
                        'order' => 0,
                        'total_episode_count' => 121,
                        'roles' => [
                            ['character' => 'Jack Shephard', 'episode_count' => 121],
                        ],
                    ],
                    [
                        'id' => 2,
                        'name' => 'Evangeline Lilly',
                        'profile_path' => '/evangeline.jpg',
                        'order' => 1,
                        'total_episode_count' => 118,
                        'roles' => [
                            ['character' => 'Kate Austen', 'episode_count' => 118],
                        ],
                    ],
                ],
                'crew' => [
                    [
                        'id' => 10,
                        'name' => 'J.J. Abrams',
                        'profile_path' => null,
                        'department' => 'Directing',
                        'jobs' => [
                            ['job' => 'Director', 'episode_count' => 1],
                            ['job' => 'Executive Producer', 'episode_count' => 121],
                        ],
                    ],
                    [
                        'id' => 12,
                        'name' => 'Carlton Cuse',
                        'profile_path' => null,
                        'department' => 'Production',
                        'jobs' => [
                            ['job' => 'Producer', 'episode_count' => 100],
                        ],
                    ],
                    [
                        'id' => 13,
                        'name' => 'Michael Giacchino',
                        'profile_path' => null,
                        'department' => 'Sound',
                        'jobs' => [
                            ['job' => 'Original Music Composer', 'episode_count' => 121],
                        ],
                    ],
                ],
            ],
            'keywords' => [
                'results' => [
                    ['id' => 83, 'name' => 'island'],
                    ['id' => 1612, 'name' => 'plane crash'],
                ],
            ],
        ], $overrides)),

        config('services.tmdb.base_url')."/tv/{$id}/watch/providers" => Http::response([
            'id' => $id,
            'results' => [
                'US' => [
                    'link' => 'https://www.themoviedb.org/tv/4607-lost/watch',
                    'flatrate' => [
                        ['provider_id' => 15, 'provider_name' => 'Hulu', 'logo_path' => '/hulu.jpg'],
                    ],
                ],
            ],
        ]),
    ]);
}

test('a new series is fetched from tmdb and persisted with its related data', function () {
    fakeTmdbSeries(4607);

    $response = $this->get(route('series', 4607));

    $response->assertOk();

    $series = Title::query()->where('tmdb_id', 4607)->where('type', TitleType::Tv)->firstOrFail();

    expect($series->name)->toBe('Lost');
    expect($series->release_year)->toBe(2004);
    expect($series->episode_count)->toBe(121);
    expect($series->metadata_fetched_at)->not->toBeNull();

    expect($series->genres()->pluck('name')->sort()->values()->all())
        ->toBe(['Drama', 'Mystery']);

    expect($series->keywords()->pluck('name')->sort()->values()->all())
        ->toBe(['island', 'plane crash']);

    expect($series->actors()->pluck('name')->sort()->values()->all())
        ->toBe(['Evangeline Lilly', 'Matthew Fox']);

    expect(
        $series->actors()->orderBy('name')->get()->pluck('pivot.character')->all()
    )->toBe(['Kate Austen', 'Jack Shephard']);

    expect(DB::table('person_title')
        ->where(['title_id' => $series->id, 'credit_type' => 'cast'])
        ->orderBy('billing_order')
        ->get(['billing_order', 'episode_count'])
        ->map(fn (stdClass $credit) => [$credit->billing_order, $credit->episode_count])
        ->all())->toBe([[0, 121], [1, 118]]);

    expect($series->directors()->pluck('name')->all())->toBe(['J.J. Abrams']);
    expect($series->producers()->pluck('name')->all())->toBe(['Carlton Cuse']);
    expect($series->composers()->pluck('name')->all())->toBe(['Michael Giacchino']);

    expect($series->watchProviders()->pluck('name')->all())->toBe(['Hulu']);
});

test('an up to date series is served from the database without calling tmdb', function () {
    $series = Title::factory()->tv()->create([
        'tmdb_id' => 4607,
        'metadata_fetched_at' => now(),
    ]);

    Http::fake([
        config('services.tmdb.base_url').'/*' => function () {
            Assert::fail('Unexpected TMDB request.');
        },
    ]);

    $response = $this->get(route('series', 4607));

    $response->assertOk();

    $response->assertInertia(fn ($page) => $page->where('series.id', $series->id));
});

test('the authenticated user\'s rating is included on the series page', function () {
    $series = Title::factory()->tv()->create([
        'tmdb_id' => 4607,
        'metadata_fetched_at' => now(),
    ]);
    $user = User::factory()->create();
    Rating::factory()->for($series)->for($user)->create(['score' => 9]);

    $response = $this->actingAs($user)->get(route('series', 4607));

    $response->assertInertia(fn ($page) => $page->where('series.user_rating', 9));
});

test('a stale series is refreshed from tmdb', function () {
    $series = Title::factory()->tv()->create([
        'tmdb_id' => 4607,
        'name' => 'Old Name',
        'metadata_fetched_at' => now()->subDays(60),
    ]);

    fakeTmdbSeries(4607);

    $response = $this->get(route('series', 4607));

    $response->assertOk();

    Http::assertSent(fn ($request) => str_contains((string) $request->url(), '/tv/4607?append_to_response=aggregate_credits,keywords'));

    $series->refresh();

    expect($series->name)->toBe('Lost');
    expect($series->genres()->count())->toBe(2);
});

test('a failed watch provider refresh rolls back the whole series sync', function () {
    $series = Title::factory()->tv()->create([
        'tmdb_id' => 4607,
        'name' => 'Old Name',
        'metadata_fetched_at' => now()->subDays(60),
    ]);

    $originalFetchedAt = $series->metadata_fetched_at;

    Http::fake([
        config('services.tmdb.base_url').'/tv/4607?append_to_response=aggregate_credits,keywords' => Http::response([
            'id' => 4607,
            'name' => 'Lost',
            'first_air_date' => '2004-09-22',
            'genres' => [],
            'aggregate_credits' => ['cast' => [], 'crew' => []],
            'keywords' => ['results' => []],
        ]),
        config('services.tmdb.base_url').'/tv/4607/watch/providers' => Http::response(
            ['status_message' => 'Internal Server Error'],
            500,
        ),
    ]);

    $response = $this->get(route('series', 4607));

    $response->assertStatus(500);

    $series->refresh();

    expect($series->name)->toBe('Old Name');
    expect($series->metadata_fetched_at)->toEqual($originalFetchedAt);
});

test('an unknown series returns a 404', function () {
    Http::fake([
        config('services.tmdb.base_url').'/tv/*' => Http::response([
            'success' => false,
            'status_code' => 34,
            'status_message' => 'The resource you requested could not be found.',
        ], 404),
    ]);

    $response = $this->get(route('series', 999999));

    $response->assertNotFound();
});
