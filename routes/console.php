<?php

use App\Jobs\UpdateWatchProviders;

Schedule::job(new UpdateWatchProviders)->daily();
