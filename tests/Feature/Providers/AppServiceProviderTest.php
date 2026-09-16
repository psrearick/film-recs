<?php

use Carbon\CarbonImmutable;

test('the application uses immutable dates by default', function () {
    expect(now())->toBeInstanceOf(CarbonImmutable::class);
});
