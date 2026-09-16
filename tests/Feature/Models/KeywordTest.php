<?php

use App\Models\Keyword;
use App\Models\Title;

test('titles returns the titles tagged with the keyword', function () {
    $keyword = Keyword::factory()->create();
    $title = Title::factory()->create();
    $title->keywords()->attach($keyword);

    expect($keyword->titles()->pluck('id')->all())->toBe([$title->id]);
});
