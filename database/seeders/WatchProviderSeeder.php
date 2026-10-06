<?php

namespace Database\Seeders;

use App\Jobs\UpdateWatchProviders;
use Illuminate\Database\Seeder;

class WatchProviderSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        UpdateWatchProviders::dispatch();
    }
}
