<?php

use Illuminate\Support\Facades\Http;

function fakeTmdbHome(
    array $popularMovies = [],
    array $popularSeries = [],
    array $trendingMovies = [],
    array $trendingSeries = [],
): void {
    Http::fake([
        config('services.tmdb.base_url').'/discover/movie*' => Http::response([
            'page' => 1,
            'results' => $popularMovies,
            'total_pages' => 1,
            'total_results' => count($popularMovies),
        ]),
        config('services.tmdb.base_url').'/discover/tv*' => Http::response([
            'page' => 1,
            'results' => $popularSeries,
            'total_pages' => 1,
            'total_results' => count($popularSeries),
        ]),
        config('services.tmdb.base_url').'/trending/movie/day*' => Http::response([
            'page' => 1,
            'results' => $trendingMovies,
            'total_pages' => 1,
            'total_results' => count($trendingMovies),
        ]),
        config('services.tmdb.base_url').'/trending/tv/day*' => Http::response([
            'page' => 1,
            'results' => $trendingSeries,
            'total_pages' => 1,
            'total_results' => count($trendingSeries),
        ]),
    ]);
}

test('the homepage renders popular movies and tv shows from tmdb', function () {
    fakeTmdbHome(
        popularMovies: [
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
        popularSeries: [
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
        ->where('popular_movies.0.tmdb_id', 603)
        ->where('popular_movies.0.type', 'movie')
        ->where('popular_movies.0.name', 'The Matrix')
        ->where('popular_movies.0.release_year', 1999)
        ->where('popular_movies.0.overview', 'A computer hacker learns about the true nature of reality.')
        ->where('popular_movies.0.poster_path', '/matrix.jpg')
        ->where('popular_movies.0.popularity', 82.5)
        ->where('popular_movies.0.vote_average', 8.2)
        ->where('popular_series.0.tmdb_id', 1396)
        ->where('popular_series.0.type', 'tv')
        ->where('popular_series.0.name', 'Breaking Bad')
        ->where('popular_series.0.release_year', 2008)
        ->where('popular_series.0.overview', 'A chemistry teacher turns to making meth.')
        ->where('popular_series.0.poster_path', '/bb.jpg')
        ->where('popular_series.0.popularity', 55.1)
        ->where('popular_series.0.vote_average', 8.9)
    );
});

test('the homepage renders trending movies and tv shows from tmdb', function () {
    fakeTmdbHome(
        trendingMovies: [
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
        trendingSeries: [
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
        ->where('trending_movies.0.tmdb_id', 603)
        ->where('trending_movies.0.type', 'movie')
        ->where('trending_movies.0.name', 'The Matrix')
        ->where('trending_movies.0.release_year', 1999)
        ->where('trending_movies.0.overview', 'A computer hacker learns about the true nature of reality.')
        ->where('trending_movies.0.poster_path', '/matrix.jpg')
        ->where('trending_movies.0.popularity', 82.5)
        ->where('trending_movies.0.vote_average', 8.2)
        ->where('trending_series.0.tmdb_id', 1396)
        ->where('trending_series.0.type', 'tv')
        ->where('trending_series.0.name', 'Breaking Bad')
        ->where('trending_series.0.release_year', 2008)
        ->where('trending_series.0.overview', 'A chemistry teacher turns to making meth.')
        ->where('trending_series.0.poster_path', '/bb.jpg')
        ->where('trending_series.0.popularity', 55.1)
        ->where('trending_series.0.vote_average', 8.9)
    );
});

test('the homepage requests popular and trending movies and tv shows from the correct tmdb endpoints', function () {
    fakeTmdbHome();

    $this->get(route('home'))->assertOk();

    Http::assertSent(fn ($request) => str_contains(
        (string) $request->url(),
        '/discover/movie?page=1&sort_by=popularity.desc&vote_count.gte=500'
    ));

    Http::assertSent(fn ($request) => str_contains(
        (string) $request->url(),
        '/discover/tv?page=1&sort_by=popularity.desc&vote_count.gte=500'
    ));

    Http::assertSent(fn ($request) => str_contains(
        (string) $request->url(),
        '/trending/movie/day'
    ));

    Http::assertSent(fn ($request) => str_contains(
        (string) $request->url(),
        '/trending/tv/day'
    ));
});

test('the homepage renders no movies or tv shows when tmdb returns no results', function () {
    fakeTmdbHome();

    $response = $this->get(route('home'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('popular_movies', [])
        ->where('popular_series', [])
        ->where('trending_movies', [])
        ->where('trending_series', [])
    );
});

test('a movie or series without a release date has a null release year', function () {
    fakeTmdbHome(
        popularMovies: [
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
        popularSeries: [
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
        ->where('popular_movies.0.release_year', null)
        ->where('popular_series.0.release_year', null)
    );
});

test('a malformed tmdb result is dropped while valid ones are kept', function () {
    fakeTmdbHome(
        popularMovies: [
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
        ->has('popular_movies', 1)
        ->where('popular_movies.0.tmdb_id', 603)
    );
});

test('adult movies are excluded from trending results', function () {
    fakeTmdbHome(
        trendingMovies: [
            [
                'id' => 1,
                'title' => 'An Adult Movie',
                'release_date' => '2020-01-01',
                'overview' => null,
                'poster_path' => null,
                'popularity' => 100,
                'vote_average' => 5,
                'adult' => true,
            ],
            [
                'id' => 603,
                'title' => 'The Matrix',
                'release_date' => '1999-03-30',
                'overview' => null,
                'poster_path' => null,
                'popularity' => 82.5,
                'vote_average' => 8.2,
                'adult' => false,
            ],
        ],
    );

    $response = $this->get(route('home'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->has('trending_movies', 1)
        ->where('trending_movies.0.tmdb_id', 603)
    );
});
