export interface Genre {
    id: number;
    name: string;
}

export interface Keyword {
    id: number;
    name: string;
}

export interface Person {
    id: number;
    name: string;
    profile_path: string | null;
    pivot?: {
        character?: string | null;
    };
}

export interface WatchProvider {
    id: number;
    name: string;
    logo_path: string | null;
    pivot: {
        access_type: 'subscription' | 'rent' | 'buy';
    };
}

export interface Title {
    id: number;
    name: string;
    release_year: number | null;
    overview: string | null;
    poster_path: string | null;
    runtime: number | null;
    popularity: number;
    vote_average: number | null;
    genres: Genre[];
    keywords: Keyword[];
    actors: Person[];
    directors: Person[];
    producers: Person[];
    composers: Person[];
    watch_providers: WatchProvider[];
}

export const ACCESS_TYPE_LABELS: Record<
    WatchProvider['pivot']['access_type'],
    string
> = {
    subscription: 'Stream',
    rent: 'Rent',
    buy: 'Buy',
};

export function tmdbImage(path: string | null, size: string): string | null {
    return path ? `https://image.tmdb.org/t/p/${size}${path}` : null;
}
