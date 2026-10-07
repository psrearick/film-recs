<?php

use App\Enums\CreditType;
use App\Enums\TitleType;
use App\Jobs\UpdateAttributeAffinities;
use App\Models\Person;
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

function fakeTmdbMovie(int $id, array $overrides = []): void
{
    Http::fake([
        config('services.tmdb.base_url')."/movie/{$id}?append_to_response=credits,keywords" => Http::response(array_merge([
            'id' => $id,
            'title' => 'The Matrix',
            'release_date' => '1999-03-30',
            'overview' => 'A computer hacker learns about the true nature of reality.',
            'poster_path' => '/matrix.jpg',
            'runtime' => 136,
            'popularity' => 82.5,
            'vote_average' => 8.2,
            'genres' => [
                ['id' => 28, 'name' => 'Action'],
                ['id' => 878, 'name' => 'Science Fiction'],
            ],
            'credits' => [
                'cast' => [
                    ['id' => 6384, 'name' => 'Keanu Reeves', 'character' => 'Neo', 'profile_path' => '/keanu.jpg', 'order' => 0],
                    ['id' => 2, 'name' => 'Laurence Fishburne', 'character' => 'Morpheus', 'profile_path' => '/laurence.jpg', 'order' => 1],
                ],
                'crew' => [
                    ['id' => 10, 'name' => 'Lana Wachowski', 'job' => 'Director', 'profile_path' => null],
                    ['id' => 11, 'name' => 'Lilly Wachowski', 'job' => 'Director', 'profile_path' => null],
                    ['id' => 12, 'name' => 'Joel Silver', 'job' => 'Producer', 'profile_path' => null],
                    ['id' => 13, 'name' => 'Don Davis', 'job' => 'Original Music Composer', 'profile_path' => null],
                    ['id' => 14, 'name' => 'An Editor', 'job' => 'Editor', 'profile_path' => null],
                ],
            ],
            'keywords' => [
                'keywords' => [
                    ['id' => 83, 'name' => 'saving the world'],
                    ['id' => 1612, 'name' => 'artificial intelligence'],
                ],
            ],
        ], $overrides)),

        config('services.tmdb.base_url')."/movie/{$id}/watch/providers" => Http::response([
            'id' => $id,
            'results' => [
                'US' => [
                    'link' => 'https://www.themoviedb.org/movie/603-the-matrix/watch',
                    'flatrate' => [
                        ['provider_id' => 8, 'provider_name' => 'Netflix', 'logo_path' => '/netflix.jpg'],
                    ],
                    'rent' => [
                        ['provider_id' => 2, 'provider_name' => 'Apple TV', 'logo_path' => '/appletv.jpg'],
                    ],
                ],
            ],
        ]),
    ]);
}

test('a new movie is fetched from tmdb and persisted with its related data', function () {
    fakeTmdbMovie(603);

    $response = $this->get(route('movie', 603));

    $response->assertOk();

    $movie = Title::query()->where('tmdb_id', 603)->where('type', TitleType::Movie)->firstOrFail();

    expect($movie->name)->toBe('The Matrix');
    expect($movie->release_year)->toBe(1999);
    expect($movie->metadata_fetched_at)->not->toBeNull();

    expect($movie->genres()->pluck('name')->sort()->values()->all())
        ->toBe(['Action', 'Science Fiction']);

    expect($movie->keywords()->pluck('name')->sort()->values()->all())
        ->toBe(['artificial intelligence', 'saving the world']);

    expect($movie->actors()->pluck('name')->sort()->values()->all())
        ->toBe(['Keanu Reeves', 'Laurence Fishburne']);

    expect(
        $movie->actors()->orderBy('name')->get()->pluck('pivot.character')->all()
    )->toBe(['Neo', 'Morpheus']);

    expect(DB::table('person_title')
        ->where(['title_id' => $movie->id, 'credit_type' => 'cast'])
        ->orderBy('billing_order')
        ->get(['billing_order', 'episode_count'])
        ->map(fn (stdClass $credit) => [$credit->billing_order, $credit->episode_count])
        ->all())->toBe([[0, null], [1, null]]);

    expect($movie->directors()->pluck('name')->sort()->values()->all())
        ->toBe(['Lana Wachowski', 'Lilly Wachowski']);

    expect($movie->producers()->pluck('name')->all())->toBe(['Joel Silver']);
    expect($movie->composers()->pluck('name')->all())->toBe(['Don Davis']);

    expect($movie->watchProviders()->pluck('name')->sort()->values()->all())
        ->toBe(['Apple TV', 'Netflix']);
});

test('an up to date movie is served from the database without calling tmdb', function () {
    $movie = Title::factory()->movie()->create([
        'tmdb_id' => 603,
        'metadata_fetched_at' => now(),
    ]);

    Http::fake([
        config('services.tmdb.base_url').'/*' => function () {
            Assert::fail('Unexpected TMDB request.');
        },
    ]);

    $response = $this->get(route('movie', 603));

    $response->assertOk();

    $response->assertInertia(fn ($page) => $page->where('movie.id', $movie->id));
});

test('the authenticated user\'s rating is included on the movie page', function () {
    $movie = Title::factory()->movie()->create([
        'tmdb_id' => 603,
        'metadata_fetched_at' => now(),
    ]);
    $user = User::factory()->create();
    Rating::factory()->for($movie)->for($user)->create(['score' => 6]);

    $response = $this->actingAs($user)->get(route('movie', 603));

    $response->assertInertia(fn ($page) => $page->where('movie.user_rating', 6));
});

test('a stale movie is refreshed from tmdb', function () {
    $movie = Title::factory()->movie()->create([
        'tmdb_id' => 603,
        'name' => 'Old Name',
        'metadata_fetched_at' => now()->subDays(60),
    ]);

    fakeTmdbMovie(603);

    $response = $this->get(route('movie', 603));

    $response->assertOk();

    Http::assertSent(fn ($request) => str_contains((string) $request->url(), '/movie/603?append_to_response=credits,keywords'));

    $movie->refresh();

    expect($movie->name)->toBe('The Matrix');
    expect($movie->genres()->count())->toBe(2);
});

test('refreshing a movie replaces its previous credits', function () {
    $movie = Title::factory()->movie()->create([
        'tmdb_id' => 603,
        'metadata_fetched_at' => now()->subDays(60),
    ]);

    $stalePerson = Person::factory()->create(['tmdb_id' => 999, 'name' => 'Stale Actor']);
    $movie->people()->attach($stalePerson->id, ['credit_type' => CreditType::Cast]);

    fakeTmdbMovie(603);

    $this->get(route('movie', 603))->assertOk();

    expect($movie->actors()->pluck('name')->sort()->values()->all())
        ->toBe(['Keanu Reeves', 'Laurence Fishburne']);
});

test('a failed watch provider refresh rolls back the whole sync', function () {
    $movie = Title::factory()->movie()->create([
        'tmdb_id' => 603,
        'name' => 'Old Name',
        'metadata_fetched_at' => now()->subDays(60),
    ]);

    $stalePerson = Person::factory()->create(['tmdb_id' => 999, 'name' => 'Stale Actor']);
    $movie->people()->attach($stalePerson->id, ['credit_type' => CreditType::Cast]);

    $originalFetchedAt = $movie->metadata_fetched_at;

    Http::fake([
        config('services.tmdb.base_url').'/movie/603?append_to_response=credits,keywords' => Http::response([
            'id' => 603,
            'title' => 'The Matrix',
            'release_date' => '1999-03-30',
            'genres' => [],
            'credits' => ['cast' => [], 'crew' => []],
            'keywords' => ['keywords' => []],
        ]),
        config('services.tmdb.base_url').'/movie/603/watch/providers' => Http::response(
            ['status_message' => 'Internal Server Error'],
            500,
        ),
    ]);

    $response = $this->get(route('movie', 603));

    $response->assertStatus(500);

    $movie->refresh();

    expect($movie->name)->toBe('Old Name');
    expect($movie->metadata_fetched_at)->toEqual($originalFetchedAt);
    expect($movie->actors()->pluck('name')->all())->toBe(['Stale Actor']);
});

test('an unknown movie returns a 404', function () {
    Http::fake([
        config('services.tmdb.base_url').'/movie/*' => Http::response([
            'success' => false,
            'status_code' => 34,
            'status_message' => 'The resource you requested could not be found.',
        ], 404),
    ]);

    $response = $this->get(route('movie', 999999));

    $response->assertNotFound();
});
