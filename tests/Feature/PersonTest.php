<?php

use App\Enums\CreditType;
use App\Jobs\SyncPersonCredits;
use App\Models\Person;
use App\Models\Title;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use PHPUnit\Framework\Assert;

function fakeTmdbPerson(int $id, array $overrides = []): void
{
    Http::fake([
        config('services.tmdb.base_url')."/person/{$id}?append_to_response=movie_credits,tv_credits" => Http::response(array_merge([
            'id' => $id,
            'name' => 'Keanu Reeves',
            'biography' => 'Canadian actor.',
            'profile_path' => '/keanu.jpg',
            'movie_credits' => [
                'cast' => [
                    [
                        'id' => 603,
                        'title' => 'The Matrix',
                        'character' => 'Neo',
                        'poster_path' => '/matrix.jpg',
                        'release_date' => '1999-03-30',
                        'vote_average' => 8.2,
                    ],
                ],
                'crew' => [],
            ],
            'tv_credits' => [
                'cast' => [],
                'crew' => [],
            ],
        ], $overrides)),
    ]);
}

test('a new person is fetched from tmdb, persisted, and queued for credit sync', function () {
    Queue::fake([SyncPersonCredits::class]);
    fakeTmdbPerson(287);

    $response = $this->get(route('person', 287));

    $response->assertOk();

    $person = Person::query()->where('tmdb_id', 287)->firstOrFail();

    expect($person->name)->toBe('Keanu Reeves');
    expect($person->biography)->toBe('Canadian actor.');

    $response->assertInertia(fn ($page) => $page
        ->where('person.name', 'Keanu Reeves')
        ->where('person.vote_averages', fn ($voteAverages) => $voteAverages
            ->firstWhere('job', 'Average')['vote_average'] === 8.2)
        ->where('credits.0.title', 'The Matrix')
        ->where('credits.0.character', 'Neo')
    );

    Queue::assertPushed(SyncPersonCredits::class, function (SyncPersonCredits $job) use ($person) {
        $personId = (fn () => $this->personId)->call($job);
        $movieIds = (fn () => $this->movieIds)->call($job);
        $tvIds = (fn () => $this->tvIds)->call($job);

        return $personId === $person->id && $movieIds === [603] && $tvIds === [];
    });
});

test('a fresh person is served from a warm cache without calling tmdb again', function () {
    $person = Person::factory()->create([
        'tmdb_id' => 287,
        'name' => 'Keanu Reeves',
        'credits_fetched_at' => now(),
    ]);

    Cache::put('tmdb-person-287', [
        'id' => 287,
        'name' => 'Keanu Reeves',
        'biography' => 'Canadian actor.',
        'profile_path' => '/keanu.jpg',
        'movie_credits' => ['cast' => [], 'crew' => []],
        'tv_credits' => ['cast' => [], 'crew' => []],
    ], now()->addDay());

    Http::fake([
        config('services.tmdb.base_url').'/*' => function () {
            Assert::fail('Unexpected TMDB request.');
        },
    ]);

    $response = $this->get(route('person', 287));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->where('person.id', $person->id));
});

test('a stale person is refreshed from tmdb and re-queues their credit sync', function () {
    $person = Person::factory()->create([
        'tmdb_id' => 287,
        'name' => 'Old Name',
        'credits_fetched_at' => now()->subDays(60),
    ]);

    Queue::fake([SyncPersonCredits::class]);
    fakeTmdbPerson(287);

    $response = $this->get(route('person', 287));

    $response->assertOk();

    Http::assertSent(fn ($request) => str_contains((string) $request->url(), '/person/287?append_to_response=movie_credits,tv_credits'));

    $person->refresh();
    expect($person->name)->toBe('Keanu Reeves');

    Queue::assertPushed(SyncPersonCredits::class);
});

test('a 404 from tmdb falls back to locally known credits for an existing person', function () {
    $person = Person::factory()->create([
        'tmdb_id' => 287,
        'name' => 'Keanu Reeves',
        'credits_fetched_at' => now()->subDays(60),
    ]);

    $movie = Title::factory()->movie()->create([
        'tmdb_id' => 603,
        'name' => 'The Matrix',
        'vote_average' => 8.2,
    ]);

    $movie->people()->attach($person->id, [
        'credit_type' => CreditType::Cast,
        'character' => 'Neo',
    ]);

    Http::fake([
        config('services.tmdb.base_url').'/person/287?append_to_response=movie_credits,tv_credits' => Http::response([
            'success' => false,
            'status_code' => 34,
            'status_message' => 'The resource you requested could not be found.',
        ], 404),
    ]);

    $response = $this->get(route('person', 287));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('person.name', 'Keanu Reeves')
        ->where('person.vote_averages', fn ($voteAverages) => $voteAverages
            ->firstWhere('job', 'Average')['vote_average'] === 8.2)
        ->where('credits.0.title', 'The Matrix')
        ->where('credits.0.character', 'Neo')
    );
});

test('malformed and incomplete tmdb credits are dropped while valid ones are kept', function () {
    fakeTmdbPerson(287, [
        'movie_credits' => [
            'cast' => [
                [
                    'id' => 603,
                    'title' => 'The Matrix',
                    'character' => 'Neo',
                    'release_date' => '1999-03-30',
                    'vote_average' => 8.2,
                ],
                ['title' => 'Missing Id'],
                ['id' => 999],
            ],
            'crew' => [
                ['id' => 111, 'title' => 'Untitled Project', 'job' => 'Director'],
            ],
        ],
        'tv_credits' => ['cast' => [], 'crew' => []],
    ]);

    $response = $this->get(route('person', 287));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->has('credits', 2)
        ->where('credits.0.title', 'The Matrix')
        ->where('credits.1.title', 'Untitled Project')
        ->where('credits.1.release_year', null)
    );
});

test('a tmdb server error propagates when refreshing a person', function () {
    Http::fake([
        config('services.tmdb.base_url').'/person/287?append_to_response=movie_credits,tv_credits' => Http::response(
            ['status_message' => 'Internal Server Error'],
            500,
        ),
    ]);

    $response = $this->get(route('person', 287));

    $response->assertStatus(500);
});

test('an empty tmdb payload falls back to locally known credits for an existing person', function () {
    Person::factory()->create([
        'tmdb_id' => 287,
        'name' => 'Keanu Reeves',
        'credits_fetched_at' => now()->subDays(60),
    ]);

    Http::fake([
        config('services.tmdb.base_url').'/person/287?append_to_response=movie_credits,tv_credits' => Http::response([]),
    ]);

    $response = $this->get(route('person', 287));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->where('person.name', 'Keanu Reeves'));
});

test('an unknown person returns a 404', function () {
    Http::fake([
        config('services.tmdb.base_url').'/person/*' => Http::response([
            'success' => false,
            'status_code' => 34,
            'status_message' => 'The resource you requested could not be found.',
        ], 404),
    ]);

    $response = $this->get(route('person', 999999));

    $response->assertNotFound();
});
