import { LucideIcon, Star } from 'lucide-react';
import PersonList from '@/components/title/person-list';
import TitlePoster from '@/components/title/title-poster';
import { Title } from '@/components/title/types';
import WatchProviders from '@/components/title/watch-providers';

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

    return (
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
                        {title.vote_average !== null ? (
                            <div className="flex items-center gap-2">
                                <Star className="fill-foreground h-5" />
                                <p className="text-xl">
                                    {title.vote_average.toFixed(1)}
                                </p>
                            </div>
                        ) : (
                            <p>—</p>
                        )}
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
            <div className="bg-primary/20 flex flex-col gap-8 px-6 py-6 md:flex-row md:justify-between md:px-10 lg:px-16">
                <div className="mx-auto w-64 md:mx-0">
                    <TitlePoster
                        path={title.poster_path}
                        name={title.name}
                        icon={PosterIcon}
                        iconSize={48}
                        imageSize="w500"
                    />
                </div>
                <div className="w-full max-w-md md:max-w-2/3">
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
    );
}
