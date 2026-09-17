<?php

use Illuminate\Support\Facades\Http;

function fakeTmdbPopular(array $movies = [], array $series = []): void
{
    Http::fake([
        config('services.tmdb.base_url').'/discover/movie*' => Http::response([
            'page' => 1,
            'results' => $movies,
            'total_pages' => 1,
            'total_results' => count($movies),
        ]),
        config('services.tmdb.base_url').'/discover/tv*' => Http::response([
            'page' => 1,
            'results' => $series,
            'total_pages' => 1,
            'total_results' => count($series),
        ]),
    ]);
}

test('the homepage renders popular movies and tv shows from tmdb', function () {
    fakeTmdbPopular(
        movies: [
            [
                'id' => 603,
                'title' => 'The Matrix',
                'release_date' => '1999-03-30',
                'overview' => 'A computer hacker learns about the true nature of reality.',
                'poster_path' => '/matrix.jpg',
                'popularity' => 82.5,
                'vote_average' => 8.2,
            ],
        ],
        series: [
            [
                'id' => 1396,
                'name' => 'Breaking Bad',
                'first_air_date' => '2008-01-20',
                'overview' => 'A chemistry teacher turns to making meth.',
                'poster_path' => '/bb.jpg',
                'popularity' => 55.1,
                'vote_average' => 8.9,
            ],
        ],
    );

    $response = $this->get(route('home'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('movies.0.tmdb_id', 603)
        ->where('movies.0.type', 'movie')
        ->where('movies.0.name', 'The Matrix')
        ->where('movies.0.release_year', 1999)
        ->where('movies.0.overview', 'A computer hacker learns about the true nature of reality.')
        ->where('movies.0.poster_path', '/matrix.jpg')
        ->where('movies.0.popularity', 82.5)
        ->where('movies.0.vote_average', 8.2)
        ->where('series.0.tmdb_id', 1396)
        ->where('series.0.type', 'tv')
        ->where('series.0.name', 'Breaking Bad')
        ->where('series.0.release_year', 2008)
        ->where('series.0.overview', 'A chemistry teacher turns to making meth.')
        ->where('series.0.poster_path', '/bb.jpg')
        ->where('series.0.popularity', 55.1)
        ->where('series.0.vote_average', 8.9)
    );
});

test('the homepage requests popular movies and tv shows from the correct tmdb endpoints', function () {
    fakeTmdbPopular();

    $this->get(route('home'))->assertOk();

    Http::assertSent(fn ($request) => str_contains(
        (string) $request->url(),
        '/discover/movie?page=1&sort_by=popularity.desc&vote_count.gte=500'
    ));

    Http::assertSent(fn ($request) => str_contains(
        (string) $request->url(),
        '/discover/tv?page=1&sort_by=popularity.desc&vote_count.gte=500'
    ));
});

test('the homepage renders no movies or tv shows when tmdb returns no results', function () {
    fakeTmdbPopular();

    $response = $this->get(route('home'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('movies', [])
        ->where('series', [])
    );
});

test('a movie or series without a release date has a null release year', function () {
    fakeTmdbPopular(
        movies: [
            [
                'id' => 603,
                'title' => 'The Matrix',
                'release_date' => '',
                'overview' => null,
                'poster_path' => null,
                'popularity' => 1,
                'vote_average' => null,
            ],
        ],
        series: [
            [
                'id' => 1396,
                'name' => 'Breaking Bad',
                'first_air_date' => '',
                'overview' => null,
                'poster_path' => null,
                'popularity' => 1,
                'vote_average' => null,
            ],
        ],
    );

    $response = $this->get(route('home'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('movies.0.release_year', null)
        ->where('series.0.release_year', null)
    );
});

test('a malformed tmdb result is dropped while valid ones are kept', function () {
    fakeTmdbPopular(
        movies: [
            'not-an-object',
            [
                'id' => 603,
                'title' => 'The Matrix',
                'release_date' => '1999-03-30',
                'overview' => null,
                'poster_path' => null,
                'popularity' => 1,
                'vote_average' => null,
            ],
        ],
    );

    $response = $this->get(route('home'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->has('movies', 1)
        ->where('movies.0.tmdb_id', 603)
    );
});
