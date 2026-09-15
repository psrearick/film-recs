import { Head } from '@inertiajs/react';
import { LucideIcon } from 'lucide-react';
import PersonList from '@/components/title/person-list';
import { Title, tmdbImage } from '@/components/title/types';
import WatchProviders from '@/components/title/watch-providers';
import Navbar from '@/components/navbar';

export default function TitleDetail({
    title,
    posterIcon: PosterIcon,
}: {
    title: Title;
    posterIcon: LucideIcon;
}) {
    const cast = title.actors.map((person) => ({
        ...person,
        role: person.pivot?.character ?? undefined,
    }));

    const crew = [
        ...title.directors.map((person) => ({ ...person, role: 'Director' })),
        ...title.producers.map((person) => ({ ...person, role: 'Producer' })),
        ...title.composers.map((person) => ({ ...person, role: 'Composer' })),
    ];

    const posterSrc = tmdbImage(title.poster_path, 'w500');

    return (
        <>
            <Head title={title.name} />
            <div className="flex min-h-screen flex-col items-center lg:justify-center">
                <div className="flex w-full flex-col opacity-100 transition-opacity duration-750 lg:grow starting:opacity-0">
                    <Navbar />
                    <main className="flex h-full w-full flex-col">
                        <div className="bg-primary/20 flex flex-col gap-6 px-6 py-6 md:flex-row md:justify-between md:px-10 lg:px-16">
                            <h1 className="text-center text-4xl">
                                {title.name}{' '}
                                <span className="text-gray-400">
                                    ({title.release_year})
                                </span>
                            </h1>
                            <div className="flex gap-6 md:w-xs">
                                <div className="flex w-1/2 flex-col items-center text-center">
                                    <p className="text-xs text-gray-400 uppercase">
                                        Average Rating
                                    </p>
                                    <p>
                                        {title.vote_average !== null
                                            ? title.vote_average.toFixed(1)
                                            : '—'}
                                    </p>
                                </div>
                                {title.runtime && (
                                    <div className="flex w-1/2 flex-col items-center">
                                        <p className="text-xs text-gray-400 uppercase">
                                            Runtime
                                        </p>
                                        <p>{title.runtime} minutes</p>
                                    </div>
                                )}
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
                                        <PosterIcon
                                            className="text-gray-500"
                                            size={48}
                                        />
                                    </div>
                                )}
                            </div>
                            <div className="w-full max-w-md">
                                {title.overview}

                                {title.genres.length > 0 && (
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {title.genres.map((genre) => (
                                            <span
                                                key={genre.id}
                                                className="rounded-full border border-gray-600 px-3 py-1 text-xs text-gray-400 uppercase"
                                            >
                                                {genre.name}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {title.keywords.length > 0 && (
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {title.keywords.map((keyword) => (
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

                        <WatchProviders providers={title.watch_providers} />

                        <PersonList title="Crew" people={crew} />
                        <PersonList title="Cast" people={cast} />
                    </main>
                </div>
            </div>
        </>
    );
}
