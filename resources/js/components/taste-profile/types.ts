export interface Affinity {
    id: number | null;
    label: string;
    affinity_score: number;
    confidence: number;
    weighted_score: number;
    sample_size: number;
    is_low_confidence: boolean;
}

export interface PersonAffinity extends Affinity {
    tmdb_id: number;
    profile_path: string | null;
}

export type CreditRole = 'cast' | 'director' | 'producer' | 'composer';

export interface RoleAffinities {
    role: CreditRole;
    favored: PersonAffinity[];
    disfavored: PersonAffinity[];
}

export interface ScoreCount {
    score: number;
    count: number;
}

export interface TypeBreakdown {
    type: 'movie' | 'tv';
    count: number;
    average_score: number;
}

export interface TasteProfileProps {
    includeLowConfidence: boolean;
    minimumConfidentSampleSize: number;
    hiddenCounts: { genres: number; decades: number };
    ratingCount: number;
    minimumRatingCount: number;
    averageScore: number | null;
    scoreDistribution: ScoreCount[];
    typeBreakdown: TypeBreakdown[];
    updatedAt: string | null;
    genres: Affinity[];
    decades: Affinity[];
    keywords: { favored: Affinity[]; disfavored: Affinity[] };
    people: RoleAffinities[];
}

export interface RatedTitle {
    id: number;
    tmdb_id: number;
    type: 'movie' | 'tv';
    name: string;
    release_year: number | null;
    poster_path: string | null;
    score: number;
}

export interface TitlesQuery {
    type: 'genre' | 'keyword' | 'person' | 'decade' | 'score';
    id?: number;
    value?: string;
}

/**
 * Whatever the user clicked to see the titles behind it: the query that fetches
 * those titles, plus what to show at the top of the dialog.
 */
export interface TitleSelection {
    query: TitlesQuery;
    eyebrow: string;
    heading: string;
    description: string;
    person?: { tmdbId: number; profilePath: string | null };
}
