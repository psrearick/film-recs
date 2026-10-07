import { Link, useHttp } from '@inertiajs/react';
import { Film } from 'lucide-react';
import { useEffect, useState } from 'react';
import type {
    RatedTitle,
    TitleSelection,
} from '@/components/taste-profile/types';
import { tmdbImage } from '@/components/title/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Item,
    ItemActions,
    ItemContent,
    ItemDescription,
    ItemGroup,
    ItemMedia,
    ItemTitle,
} from '@/components/ui/item';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { movie, person as personRoute, series } from '@/routes';
import { titles as titlesRoute } from '@/routes/taste-profile';

export default function AffinityTitlesDialog({
    selection,
    onClose,
}: {
    selection: TitleSelection | null;
    onClose: () => void;
}) {
    return (
        <Dialog
            open={selection !== null}
            onOpenChange={(isOpen) => {
                if (!isOpen) {
                    onClose();
                }
            }}
        >
            <DialogContent className="sm:max-w-lg">
                {selection && (
                    <>
                        <SelectionHeader selection={selection} />
                        <RatedTitles
                            key={JSON.stringify(selection.query)}
                            selection={selection}
                        />
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}

function SelectionHeader({ selection }: { selection: TitleSelection }) {
    const { person } = selection;

    return (
        <DialogHeader>
            <div className="flex items-center gap-3">
                {person && (
                    <Link href={personRoute(person.tmdbId)} tabIndex={-1}>
                        <Avatar className="size-12">
                            <AvatarImage
                                src={
                                    tmdbImage(person.profilePath, 'w185') ??
                                    undefined
                                }
                                alt=""
                            />
                            <AvatarFallback>
                                {selection.heading.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                    </Link>
                )}
                <div className="flex flex-col gap-1">
                    <Badge variant="secondary">{selection.eyebrow}</Badge>
                    <DialogTitle>
                        {person ? (
                            <Link
                                href={personRoute(person.tmdbId)}
                                className="hover:underline"
                            >
                                {selection.heading}
                            </Link>
                        ) : (
                            selection.heading
                        )}
                    </DialogTitle>
                </div>
            </div>
            <DialogDescription>{selection.description}</DialogDescription>
        </DialogHeader>
    );
}

function RatedTitles({ selection }: { selection: TitleSelection }) {
    const [titles, setTitles] = useState<RatedTitle[] | null>(null);
    const [hasError, setHasError] = useState(false);
    const { get, cancel } = useHttp<
        Record<string, never>,
        { titles: RatedTitle[] }
    >({});

    useEffect(() => {
        const showError = () => setHasError(true);

        get(titlesRoute.url({ query: { ...selection.query } }), {
            onSuccess: (response) => setTitles(response.titles),
            onError: showError,
            onHttpException: showError,
            onNetworkError: showError,
        }).catch(() => {
            // Cancellation and handled errors above already updated state.
        });

        return () => cancel();
    }, [selection.query, get, cancel]);

    if (hasError) {
        return (
            <Alert variant="destructive">
                <AlertTitle>Couldn't load these titles</AlertTitle>
                <AlertDescription>
                    Close this and try again in a moment.
                </AlertDescription>
            </Alert>
        );
    }

    if (titles === null) {
        return (
            <div className="flex flex-col gap-3" aria-label="Loading titles">
                {[0, 1, 2].map((row) => (
                    <div key={row} className="flex items-center gap-3">
                        <Skeleton className="h-15 w-10 rounded-sm" />
                        <div className="flex flex-1 flex-col gap-2">
                            <Skeleton className="h-4 w-2/3" />
                            <Skeleton className="h-3 w-1/3" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <ScrollArea className="-mx-3 max-h-[60vh]">
            <ItemGroup className="px-3">
                {titles.map((title) => (
                    <RatedTitleItem key={title.id} title={title} />
                ))}
            </ItemGroup>
        </ScrollArea>
    );
}

function RatedTitleItem({ title }: { title: RatedTitle }) {
    const poster = tmdbImage(title.poster_path, 'w92');
    const href =
        title.type === 'movie' ? movie(title.tmdb_id) : series(title.tmdb_id);

    return (
        <Item asChild>
            <Link href={href}>
                <ItemMedia variant="image" className="h-15 w-10">
                    {poster ? (
                        <img src={poster} alt="" />
                    ) : (
                        <Film className="text-muted-foreground" />
                    )}
                </ItemMedia>
                <ItemContent>
                    <ItemTitle>{title.name}</ItemTitle>
                    <ItemDescription>
                        {[
                            title.release_year,
                            title.type === 'movie' ? 'Movie' : 'Series',
                        ]
                            .filter(Boolean)
                            .join(' · ')}
                    </ItemDescription>
                </ItemContent>
                <ItemActions>
                    <Badge variant="outline">
                        Your rating: {title.score}/10
                    </Badge>
                </ItemActions>
            </Link>
        </Item>
    );
}
