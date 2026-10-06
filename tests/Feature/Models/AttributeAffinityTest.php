<?php

use App\Models\AttributeAffinity;

test('confidence shrinks toward zero for small samples', function () {
    config(['recommendations.shrinkage_k' => 5.0]);

    expect(new AttributeAffinity(['sample_size' => 5])->confidence)->toBe(0.5)
        ->and(new AttributeAffinity(['sample_size' => 15])->confidence)->toBe(0.75);
});

test('confidence is a float of zero when there are no samples', function () {
    config(['recommendations.shrinkage_k' => 5.0]);

    expect(new AttributeAffinity(['sample_size' => 0])->confidence)->toBe(0.0);
});

test('confidence supports a fractional shrinkage constant', function () {
    config(['recommendations.shrinkage_k' => 1.5]);

    expect(new AttributeAffinity(['sample_size' => 6])->confidence)->toBe(0.8);
});
