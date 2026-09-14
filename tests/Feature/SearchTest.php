<?php

use Illuminate\Support\Facades\Http;

function fakeTmdbSearch(array $results): void
{
    Http::preventStrayRequests();

    Http::fake([
        config('services.tmdb.base_url').'/search/multi*' => Http::response([
            'page' => 1,
            'results' => $results,
            'total_pages' => 1,
            'total_results' => count($results),
        ]),
    ]);
}

test('an empty query returns no results without calling tmdb', function () {
    Http::preventStrayRequests();

    $response = $this->getJson(route('search'));

    $response->assertOk();
    $response->assertExactJson(['results' => []]);
    Http::assertNothingSent();
});

test('a search returns normalized movie, tv, and person results', function () {
    fakeTmdbSearch([
        ['id' => 603, 'media_type' => 'movie', 'title' => 'The Matrix', 'poster_path' => '/matrix.jpg'],
        ['id' => 1396, 'media_type' => 'tv', 'name' => 'Breaking Bad', 'poster_path' => '/bb.jpg'],
        ['id' => 287, 'media_type' => 'person', 'name' => 'Brad Pitt', 'profile_path' => '/pitt.jpg'],
    ]);

    $response = $this->getJson(route('search', ['search' => 'matrix']));

    $response->assertOk();
    $response->assertExactJson([
        'results' => [
            [
                'id' => 603,
                'type' => 'movie',
                'label' => 'The Matrix',
                'posterPath' => '/matrix.jpg',
                'url' => '/movies/603',
            ],
            [
                'id' => 1396,
                'type' => 'tv',
                'label' => 'Breaking Bad',
                'posterPath' => '/bb.jpg',
                'url' => '/tv/1396',
            ],
            [
                'id' => 287,
                'type' => 'person',
                'label' => 'Brad Pitt',
                'posterPath' => '/pitt.jpg',
                'url' => '/people/287',
            ],
        ],
    ]);
});

test('a search sends the query to tmdb', function () {
    fakeTmdbSearch([]);

    $this->getJson(route('search', ['search' => 'matrix']))->assertOk();

    Http::assertSent(fn ($request) => $request['query'] === 'matrix');
});

test('results with an unrecognized media type are dropped', function () {
    fakeTmdbSearch([
        ['id' => 999, 'media_type' => 'collection', 'name' => 'Ignore Me'],
        ['id' => 603, 'media_type' => 'movie', 'title' => 'The Matrix', 'poster_path' => '/matrix.jpg'],
    ]);

    $response = $this->getJson(route('search', ['search' => 'matrix']));

    $response->assertOk();
    $response->assertJsonCount(1, 'results');
    $response->assertJsonPath('results.0.id', 603);
});

test('malformed tmdb results are dropped', function () {
    fakeTmdbSearch([
        'not-an-object',
        ['media_type' => 'movie', 'title' => 'Missing Id'],
        ['id' => 603, 'media_type' => 'movie', 'title' => 'The Matrix', 'poster_path' => '/matrix.jpg'],
    ]);

    $response = $this->getJson(route('search', ['search' => 'matrix']));

    $response->assertOk();
    $response->assertJsonCount(1, 'results');
    $response->assertJsonPath('results.0.id', 603);
});

test('a movie or tv result without a title falls back to a default label', function () {
    fakeTmdbSearch([
        ['id' => 603, 'media_type' => 'movie', 'poster_path' => null],
    ]);

    $response = $this->getJson(route('search', ['search' => 'matrix']));

    $response->assertOk();
    $response->assertJsonPath('results.0.label', 'Untitled');
    $response->assertJsonPath('results.0.posterPath', null);
});

test('results are capped at ten', function () {
    $results = collect(range(1, 12))
        ->map(fn (int $id) => ['id' => $id, 'media_type' => 'movie', 'title' => "Movie {$id}"])
        ->all();

    fakeTmdbSearch($results);

    $response = $this->getJson(route('search', ['search' => 'movie']));

    $response->assertOk();
    $response->assertJsonCount(10, 'results');
    $response->assertJsonPath('results.0.id', 1);
    $response->assertJsonPath('results.9.id', 10);
});

test('a search query over the max length fails validation', function () {
    Http::preventStrayRequests();

    $response = $this->getJson(route('search', ['search' => str_repeat('a', 101)]));

    $response->assertStatus(422);
    $response->assertJsonValidationErrors('search');
});
