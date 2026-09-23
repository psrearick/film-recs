<?php

namespace App\Integrations;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Http;

readonly class TmdbClient
{
    public function __construct(private string $token, private string $baseUrl) {}

    /**
     * @return Collection<string, mixed>
     *
     * @throws ConnectionException
     * @throws RequestException
     */
    public function search(string $query): Collection
    {
        return $this->request()->get('search/multi', ['query' => $query])->collect();
    }

    /**
     * @return Collection<string, mixed>
     *
     * @throws ConnectionException
     * @throws RequestException
     */
    public function person(int $id): Collection
    {
        return $this->request()->get("/person/{$id}?append_to_response=movie_credits,tv_credits")->collect();
    }

    /**
     * @return Collection<string, mixed>
     *
     * @throws ConnectionException
     * @throws RequestException
     */
    public function movie(int $id): Collection
    {
        return $this->request()->get("/movie/{$id}?append_to_response=credits,keywords")->collect();
    }

    /**
     * @return Collection<string, mixed>
     *
     * @throws ConnectionException
     * @throws RequestException
     */
    public function movieProviders(int $id): Collection
    {
        return $this->request()->get("/movie/{$id}/watch/providers")->collect();
    }

    /**
     * @return Collection<string, mixed>
     *
     * @throws ConnectionException
     * @throws RequestException
     */
    public function series(int $id): Collection
    {
        return $this->request()->get("/tv/{$id}?append_to_response=aggregate_credits,keywords")->collect();
    }

    /**
     * @return Collection<string, mixed>
     *
     * @throws ConnectionException
     * @throws RequestException
     */
    public function seriesProviders(int $id): Collection
    {
        return $this->request()->get("/tv/{$id}/watch/providers")->collect();
    }

    /**
     * @return Collection<string, mixed>
     *
     * @throws ConnectionException
     */
    public function popularMovies(): Collection
    {
        return $this->request()->get('/discover/movie?page=1&sort_by=popularity.desc&vote_count.gte=500')->collect();
    }

    /**
     * @return Collection<string, mixed>
     *
     * @throws ConnectionException
     */
    public function popularSeries(): Collection
    {
        return $this->request()->get('/discover/tv?page=1&sort_by=popularity.desc&vote_count.gte=500')->collect();
    }

    /**
     * @return Collection<string, mixed>
     *
     * @throws ConnectionException
     */
    public function trendingMovies(): Collection
    {
        return $this->request()->get('/trending/movie/day')->collect();
    }

    /**
     * @return Collection<string, mixed>
     *
     * @throws ConnectionException
     */
    public function trendingSeries(): Collection
    {
        return $this->request()->get('/trending/tv/day')->collect();
    }

    private function request(): PendingRequest
    {
        return Http::baseUrl($this->baseUrl)
            ->withToken($this->token)
            ->acceptJson()
            ->timeout(10)
            ->retry(3, 200);
    }
}
