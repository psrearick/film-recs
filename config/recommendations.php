<?php

return [
    'shrinkage_k' => 5.0,
    'minimum_sample_size' => 2,

    /*
     * The taste profile page asks for at least this many ratings before showing
     * a profile, and by default hides affinities whose confidence (see
     * AttributeAffinity::confidence) is below the minimum. At a shrinkage_k of
     * 5, a minimum confidence of 0.5 means at least 5 rated titles.
     */
    'minimum_profile_ratings' => 5,
    'minimum_confidence' => 0.5,

    /*
     * Only cast members billed within this many positions count toward person
     * affinities. Series cast must also appear in at least the given share of
     * the series' episodes, so recurring guest stars are left out.
     */
    'top_billed_cast' => 10,
    'minimum_series_episode_share' => 0.25,
];
