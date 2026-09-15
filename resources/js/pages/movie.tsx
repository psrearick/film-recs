import { Head } from '@inertiajs/react';
import { Clapperboard, UserRound } from 'lucide-react';
import Navbar from '@/components/navbar';
import { Card, CardContent } from '@/components/ui/card';

interface Genre {
    id: number;
    name: string;
}

interface Keyword {
    id: number;
    name: string;
}

interface Person {
    id: number;
    name: string;
    profile_path: string | null;
    pivot?: {
        character?: string | null;
    };
}

interface WatchProvider {
    id: number;
    name: string;
    logo_path: string | null;
    pivot: {
        access_type: 'subscription' | 'rent' | 'buy';
    };
}

interface Movie {
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

const ACCESS_TYPE_LABELS: Record<
    WatchProvider['pivot']['access_type'],
    string
> = {
    subscription: 'Stream',
    rent: 'Rent',
    buy: 'Buy',
};

function tmdbImage(path: string | null, size: string): string | null {
    return path ? `https://image.tmdb.org/t/p/${size}${path}` : null;
}

function PersonAvatar({ path, name }: { path: string | null; name: string }) {
    const src = tmdbImage(path, 'w185');

    if (!src) {
        return (
            <div className="flex aspect-2/3 w-full items-center justify-center bg-gray-800">
                <UserRound className="text-gray-500" size={32} />
            </div>
        );
    }

    return (
        <img className="aspect-2/3 w-full object-cover" src={src} alt={name} />
    );
}

function PersonList({
    title,
    people,
}: {
    title: string;
    people: (Person & { role?: string })[];
}) {
    if (people.length === 0) {
        return null;
    }

    return (
        <div className="px-6 py-6 md:px-10 lg:px-16">
            <h2 className="mb-4 text-lg">{title}</h2>
            <div className="flex flex-wrap gap-4">
                {people.map((person, index) => (
                    <Card
                        key={`${person.id}-${person.role ?? index}`}
                        size="sm"
                        className="w-32"
                    >
                        <PersonAvatar
                            path={person.profile_path}
                            name={person.name}
                        />
                        <CardContent>
                            <p className="text-sm">{person.name}</p>
                            {person.role && (
                                <p className="text-xs text-gray-400">
                                    {person.role}
                                </p>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

export default function Movie({ movie }: { movie: Movie }) {
    const cast = movie.actors.map((person) => ({
        ...person,
        role: person.pivot?.character ?? undefined,
    }));

    const crew = [
        ...movie.directors.map((person) => ({ ...person, role: 'Director' })),
        ...movie.producers.map((person) => ({ ...person, role: 'Producer' })),
        ...movie.composers.map((person) => ({ ...person, role: 'Composer' })),
    ];

    const providersByAccessType = movie.watch_providers.reduce<
        Record<string, WatchProvider[]>
    >((groups, provider) => {
        const accessType = provider.pivot.access_type;
        groups[accessType] = [...(groups[accessType] ?? []), provider];

        return groups;
    }, {});

    const posterSrc = tmdbImage(movie.poster_path, 'w500');

    return (
        <>
            <Head title={movie.name} />
            <div className="flex min-h-screen flex-col items-center lg:justify-center">
                <div className="flex w-full flex-col opacity-100 transition-opacity duration-750 lg:grow starting:opacity-0">
                    <Navbar />
                    <main className="flex h-full w-full flex-col">
                        <div className="bg-primary/20 flex flex-col gap-6 px-6 py-6 md:flex-row md:justify-between md:px-10 lg:px-16">
                            <h1 className="text-center text-4xl">
                                {movie.name}{' '}
                                <span className="text-gray-400">
                                    ({movie.release_year})
                                </span>
                            </h1>
                            <div className="flex gap-6 md:w-xs">
                                <div className="flex w-1/2 flex-col items-center text-center">
                                    <p className="text-xs text-gray-400 uppercase">
                                        Average Rating
                                    </p>
                                    <p>
                                        {movie.vote_average !== null
                                            ? movie.vote_average.toFixed(1)
                                            : '—'}
                                    </p>
                                </div>
                                <div className="flex w-1/2 flex-col items-center">
                                    <p className="text-xs text-gray-400 uppercase">
                                        Runtime
                                    </p>
                                    <p>{movie.runtime} minutes</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-primary/20 flex flex-col gap-8 px-6 py-6 md:flex-row md:px-10 lg:px-16">
                            <div>
                                {posterSrc ? (
                                    <img
                                        className="mx-auto w-64"
                                        src={posterSrc}
                                        alt=""
                                    />
                                ) : (
                                    <div className="flex aspect-2/3 w-64 items-center justify-center bg-gray-800">
                                        <Clapperboard
                                            className="text-gray-500"
                                            size={48}
                                        />
                                    </div>
                                )}
                            </div>
                            <div className="w-full max-w-md">
                                {movie.overview}

                                {movie.genres.length > 0 && (
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {movie.genres.map((genre) => (
                                            <span
                                                key={genre.id}
                                                className="rounded-full border border-gray-600 px-3 py-1 text-xs text-gray-400 uppercase"
                                            >
                                                {genre.name}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {movie.keywords.length > 0 && (
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {movie.keywords.map((keyword) => (
                                            <span
                                                key={keyword.id}
                                                className="rounded-full bg-gray-800 px-3 py-1 text-xs text-gray-400"
                                            >
                                                {keyword.name}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {Object.keys(providersByAccessType).length > 0 && (
                            <div className="flex flex-col gap-6 bg-gray-900/60 px-6 py-6 md:flex-row md:gap-20 md:px-10 lg:px-16">
                                {Object.entries(providersByAccessType).map(
                                    ([accessType, providers]) => (
                                        <div
                                            key={accessType}
                                            className="mb-4 last:mb-0"
                                        >
                                            <h2 className="mb-2 text-lg">
                                                {ACCESS_TYPE_LABELS[
                                                    accessType as WatchProvider['pivot']['access_type']
                                                ] ?? accessType}
                                            </h2>
                                            <div className="flex flex-wrap gap-3">
                                                {providers.map((provider) => (
                                                    <img
                                                        key={provider.id}
                                                        className="h-12 w-12 rounded-lg"
                                                        src={
                                                            tmdbImage(
                                                                provider.logo_path,
                                                                'w92',
                                                            ) ?? undefined
                                                        }
                                                        alt={provider.name}
                                                        title={provider.name}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    ),
                                )}
                            </div>
                        )}

                        <PersonList title="Crew" people={crew} />
                        <PersonList title="Cast" people={cast} />
                    </main>
                </div>
            </div>
        </>
    );
}
