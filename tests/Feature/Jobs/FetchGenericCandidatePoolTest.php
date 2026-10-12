<?php

use App\Enums\TitleType;
use App\Jobs\FetchGenericCandidatePool;
use App\Models\GenericPoolTitle;
use App\Models\Title;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Sleep;

/**
 * Fake the five popular pages of each type, listing the given TMDB ids on their page
 * and leaving every other page empty.
 *
 * @param  array<int, list<int>>  $moviePages
 * @param  array<int, list<int>>  $seriesPages
 */
function fakePopularPages(array $moviePages = [], array $seriesPages = []): void
{
    foreach (range(1, 5) as $page) {
        Http::fake([
            config('services.tmdb.base_url')."/discover/movie?page={$page}&sort_by=popularity.desc&vote_count.gte=500" => Http::response([
                'page' => $page,
                'results' => array_map(fn (int $id): array => [
                    'id' => $id,
                    'title' => "Movie {$id}",
                    'release_date' => '2000-01-01',
                    'overview' => 'Overview',
                    'poster_path' => '/poster.jpg',
                    'popularity' => 10.0,
                    'vote_average' => 7.0,
                ], $moviePages[$page] ?? []),
            ]),
            config('services.tmdb.base_url')."/discover/tv?page={$page}&sort_by=popularity.desc&vote_count.gte=500" => Http::response([
                'page' => $page,
                'results' => array_map(fn (int $id): array => [
                    'id' => $id,
                    'name' => "Series {$id}",
                    'first_air_date' => '2000-01-01',
                    'overview' => 'Overview',
                    'poster_path' => '/poster.jpg',
                    'popularity' => 10.0,
                    'vote_average' => 7.0,
                ], $seriesPages[$page] ?? []),
            ]),
        ]);
    }
}

function fakePoolMovie(int $id): void
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

function fakePoolSeries(int $id): void
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

function fakeFailingPoolMovie(int $id, int $status): void
{
    Http::fake([
        config('services.tmdb.base_url')."/movie/{$id}?append_to_response=credits,keywords" => Http::response(
            ['status_message' => 'Error'],
            $status,
        ),
    ]);
}

beforeEach(function () {
    Http::preventStrayRequests();
});

test('replaces the pool with the popular movies and series from every page', function () {
    $previousPoolTitle = GenericPoolTitle::create(['title_id' => Title::factory()->create()->id]);

    fakePopularPages(moviePages: [1 => [603], 5 => [604]], seriesPages: [1 => [1396]]);
    fakePoolMovie(603);
    fakePoolMovie(604);
    fakePoolSeries(1396);

    FetchGenericCandidatePool::dispatch();

    $pool = GenericPoolTitle::query()->with('title')->get()
        ->map(fn (GenericPoolTitle $poolTitle): array => [$poolTitle->title->type, $poolTitle->title->tmdb_id])
        ->all();

    expect($pool)->toEqualCanonicalizing([
        [TitleType::Movie, 603],
        [TitleType::Movie, 604],
        [TitleType::Tv, 1396],
    ]);
    $this->assertModelMissing($previousPoolTitle);
});

test('adds a title to the pool once when it appears on two pages', function () {
    fakePopularPages(moviePages: [1 => [603], 2 => [603]]);
    fakePoolMovie(603);

    FetchGenericCandidatePool::dispatch();

    $this->assertDatabaseCount('generic_pool_titles', 1);
});

test('leaves out a popular title that tmdb no longer has', function () {
    Sleep::fake();

    fakePopularPages(moviePages: [1 => [603, 604]]);
    fakePoolMovie(603);
    fakeFailingPoolMovie(604, 404);

    FetchGenericCandidatePool::dispatch();

    expect(GenericPoolTitle::query()->with('title')->get()->pluck('title.tmdb_id')->all())->toBe([603]);
});

test('keeps the existing pool when syncing a popular title fails', function () {
    Sleep::fake();

    $previousPoolTitle = GenericPoolTitle::create(['title_id' => Title::factory()->create()->id]);

    fakePopularPages(moviePages: [1 => [603, 604]]);
    fakePoolMovie(603);
    fakeFailingPoolMovie(604, 500);

    expect(fn () => FetchGenericCandidatePool::dispatch())->toThrow(RequestException::class);

    $this->assertModelExists($previousPoolTitle);
    $this->assertDatabaseCount('generic_pool_titles', 1);
});
