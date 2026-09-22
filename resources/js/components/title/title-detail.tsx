import { useState } from 'react';
import { LucideIcon, Star } from 'lucide-react';
import { Form, Link, router, usePage } from '@inertiajs/react';
import { login, register, rating } from '@/routes';
import { destroy as destroyRating } from '@/routes/rating';
import PersonList from '@/components/title/person-list';
import TitlePoster from '@/components/title/title-poster';
import { Title } from '@/components/title/types';
import WatchProviders from '@/components/title/watch-providers';
import StarRatingPicker from '@/components/star-rating-picker';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export default function TitleDetail({
    title,
    posterIcon: PosterIcon,
}: {
    title: Title;
    posterIcon: LucideIcon;
}) {
    const { auth } = usePage().props;
    const initialRating = title.user_rating ?? 0;
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedRating, setSelectedRating] = useState(initialRating);
    const [hoverRating, setHoverRating] = useState(0);
    const [clearing, setClearing] = useState(false);

    function handleOpenChange(open: boolean) {
        if (!open) {
            setSelectedRating(initialRating);
            setHoverRating(0);
        }
        setDialogOpen(open);
    }

    function handleClear() {
        setClearing(true);
        router.delete(destroyRating.url(title.id), {
            preserveScroll: true,
            onSuccess: () => {
                setDialogOpen(false);
                setSelectedRating(0);
            },
            onFinish: () => setClearing(false),
        });
    }

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
                <div>
                    <h1 className="mb-1 text-center text-4xl">{title.name} </h1>
                    <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-xs">
                            {title.release_year}
                        </span>
                        {title.runtime && (
                            <>
                                <p className="text-muted-foreground text-xs">
                                    |
                                </p>
                                <div>
                                    <p className="text-muted-foreground text-xs uppercase">
                                        {title.runtime} minutes
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
                <div className="flex gap-6 md:w-xs">
                    <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
                        <DialogTrigger asChild>
                            <div className="flex flex-col items-center text-center hover:cursor-pointer">
                                <p className="text-muted-foreground text-xs uppercase">
                                    Your Rating
                                </p>
                                {initialRating > 0 ? (
                                    <div className="flex h-6 items-center gap-2">
                                        <Star className="h-5 fill-amber-400 text-amber-400" />
                                        <p className="text-xl">
                                            {initialRating}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="hover:text-muted-foreground flex h-6 items-center gap-2">
                                        <Star className="h-5" />
                                        <p className="">Rate</p>
                                    </div>
                                )}
                            </div>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Rate Title</DialogTitle>
                            </DialogHeader>
                            {auth.user ? (
                                <Form
                                    {...rating.form(title.id)}
                                    onSuccess={() => setDialogOpen(false)}
                                >
                                    {({ processing }) => (
                                        <>
                                            <StarRatingPicker
                                                value={selectedRating}
                                                hoverValue={hoverRating}
                                                onHover={setHoverRating}
                                                onSelect={setSelectedRating}
                                                className="mb-4 py-6"
                                            />
                                            <input
                                                type="hidden"
                                                name="score"
                                                value={selectedRating}
                                            />
                                            <DialogFooter>
                                                {initialRating > 0 && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        className="text-muted-foreground sm:mr-auto"
                                                        disabled={
                                                            processing ||
                                                            clearing
                                                        }
                                                        onClick={handleClear}
                                                    >
                                                        Clear Rating
                                                    </Button>
                                                )}
                                                <DialogClose asChild>
                                                    <Button variant="outline">
                                                        Cancel
                                                    </Button>
                                                </DialogClose>
                                                <Button
                                                    type="submit"
                                                    disabled={
                                                        processing ||
                                                        clearing ||
                                                        selectedRating === 0
                                                    }
                                                >
                                                    Save
                                                </Button>
                                            </DialogFooter>
                                        </>
                                    )}
                                </Form>
                            ) : (
                                <>
                                    <p className="text-muted-foreground text-sm">
                                        Sign in to rate this title.
                                    </p>
                                    <DialogFooter>
                                        <DialogClose asChild>
                                            <Button variant="outline">
                                                Cancel
                                            </Button>
                                        </DialogClose>
                                        <Button variant="outline" asChild>
                                            <Link href={register()}>
                                                Register
                                            </Link>
                                        </Button>
                                        <Button asChild>
                                            <Link href={login()}>Log In</Link>
                                        </Button>
                                    </DialogFooter>
                                </>
                            )}
                        </DialogContent>
                    </Dialog>
                    <div className="flex w-1/2 flex-col items-center text-center">
                        <p className="text-muted-foreground text-xs uppercase">
                            Average Rating
                        </p>
                        {title.vote_average !== null ? (
                            <div className="flex h-6 items-center gap-2">
                                <Star className="fill-foreground h-5" />
                                <p className="text-xl">
                                    {title.vote_average.toFixed(1)}
                                </p>
                            </div>
                        ) : (
                            <p>—</p>
                        )}
                    </div>
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
                                    className="text-muted-foreground rounded-full border border-gray-600 px-3 py-1 text-xs uppercase"
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
                                    className="text-muted-foreground rounded-full bg-gray-800 px-3 py-1 text-xs"
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
