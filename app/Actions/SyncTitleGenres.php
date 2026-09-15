<?php

namespace App\Actions;

use App\Models\Genre;
use App\Models\Title;

class SyncTitleGenres
{
    public function sync(Title $title, mixed $genres): void
    {
        $genreIds = collect(is_array($genres) ? $genres : [])
            ->filter(fn (mixed $genre) => is_array($genre) && isset($genre['id'], $genre['name']))
            ->map(fn (array $genre) => Genre::query()->firstOrCreate(
                ['tmdb_id' => $genre['id']],
                ['name' => $genre['name']],
            )->id);

        $title->genres()->sync($genreIds);
    }
}
