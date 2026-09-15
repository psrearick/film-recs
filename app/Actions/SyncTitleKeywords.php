<?php

namespace App\Actions;

use App\Models\Keyword;
use App\Models\Title;

class SyncTitleKeywords
{
    public function sync(Title $title, mixed $keywordsResponse): void
    {
        // TMDB nests movie keywords under `keywords` but TV keywords under `results`.
        $keywords = is_array($keywordsResponse)
            ? ($keywordsResponse['keywords'] ?? $keywordsResponse['results'] ?? [])
            : [];

        $keywordIds = collect(is_array($keywords) ? $keywords : [])
            ->filter(fn (mixed $keyword) => is_array($keyword) && isset($keyword['id'], $keyword['name']))
            ->map(fn (array $keyword) => Keyword::query()->firstOrCreate(
                ['tmdb_id' => $keyword['id']],
                ['name' => $keyword['name']],
            )->id);

        $title->keywords()->sync($keywordIds);
    }
}
