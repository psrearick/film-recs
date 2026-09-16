<?php

use App\Models\Genre;
use App\Models\Title;

test('titles returns the titles tagged with the genre', function () {
    $genre = Genre::factory()->create();
    $title = Title::factory()->create();
    $title->genres()->attach($genre);

    expect($genre->titles()->pluck('id')->all())->toBe([$title->id]);
});
