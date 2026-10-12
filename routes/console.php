<?php

use App\Jobs\FetchGenericCandidatePool;
use App\Jobs\UpdateWatchProviders;

Schedule::job(new UpdateWatchProviders)->daily();
Schedule::job(new FetchGenericCandidatePool)->daily();
