import { PersonCredit, PersonProfile } from '@/components/title/types';
import { Link, setLayoutProps } from '@inertiajs/react';
import { Star, UserRound } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import TitlePoster from '@/components/title/title-poster';
import { movie, series } from '@/routes';

const Person = ({
    person,
    credits,
}: {
    person: PersonProfile;
    credits: PersonCredit[];
}) => {
    setLayoutProps({ title: person.name });

    const castCredits = credits.filter((credit) => credit.character);
    const crewCredits = credits.filter((credit) => credit.job);

    return (
        <main className="flex h-full w-full flex-col">
            <div className="bg-primary/20 flex flex-col items-center gap-6 px-6 py-6 md:flex-row md:justify-between md:px-10 lg:px-16">
                <h1 className="text-4xl">{person.name}</h1>
                <div className="flex flex-col items-center gap-1">
                    <p className="text-accent-foreground text-xs uppercase">
                        Average Rating
                    </p>

                    {person.average_vote_average !== null ? (
                        <div className="flex items-center gap-2">
                            <Star className="fill-foreground size-5" />
                            <p className="text-xl">
                                {person.average_vote_average.toFixed(1)}
                            </p>
                        </div>
                    ) : (
                        <p>—</p>
                    )}
                </div>
            </div>
            <div className="bg-primary/20 flex flex-col gap-8 px-6 py-6 md:flex-row md:px-10 lg:px-16">
                <div className="md:w-1/3">
                    <div className="mx-auto w-64 md:mx-0">
                        <TitlePoster
                            path={person.profile_path}
                            name={person.name}
                            icon={UserRound}
                            iconSize={124}
                            imageSize="w500"
                        />
                    </div>
                </div>
                <div className="md:w-2/3">{person.biography}</div>
            </div>
            <div className="px-6 py-6 md:px-10 lg:px-16">
                {castCredits.length > 0 && (
                    <>
                        <h2 className="mb-6 text-xl">Acting Credits</h2>
                        <div className="flex flex-wrap gap-4">
                            {castCredits.map((credit) => (
                                <Card
                                    key={`${credit.media_type}-${credit.tmdb_id}`}
                                    size="sm"
                                    className="w-32"
                                >
                                    <div className="mx-auto flex items-center gap-2">
                                        <Star className="fill-foreground size-4" />
                                        {credit.vote_average?.toFixed(1)}
                                    </div>
                                    <Link
                                        href={
                                            credit.media_type == 'movie'
                                                ? movie(credit.tmdb_id)
                                                : series(credit.tmdb_id)
                                        }
                                    >
                                        <TitlePoster
                                            path={credit.poster_path}
                                            name={credit.title}
                                        />
                                    </Link>
                                    <CardContent>
                                        <p className="text-sm">
                                            {credit.title}
                                        </p>
                                        <p className="text-accent-foreground text-xs">
                                            {credit.character}
                                        </p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </>
                )}
                {crewCredits.length > 0 && (
                    <>
                        <h2 className="my-6 text-xl">Crew Credits</h2>
                        <div className="flex flex-wrap gap-4">
                            {crewCredits.map((credit) => (
                                <Card
                                    key={`${credit.media_type}-${credit.tmdb_id}`}
                                    size="sm"
                                    className="w-32"
                                >
                                    <div className="mx-auto flex items-center gap-2">
                                        <Star className="fill-foreground size-4" />
                                        {credit.vote_average?.toFixed(1)}
                                    </div>
                                    <Link
                                        href={
                                            credit.media_type == 'movie'
                                                ? movie(credit.tmdb_id)
                                                : series(credit.tmdb_id)
                                        }
                                    >
                                        <TitlePoster
                                            path={credit.poster_path}
                                            name={credit.title}
                                        />
                                    </Link>
                                    <CardContent>
                                        <p className="text-sm">
                                            {credit.title}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            {credit.job}
                                        </p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </main>
    );
};

export default Person;
