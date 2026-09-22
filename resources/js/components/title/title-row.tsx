import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import TitlePoster from '@/components/title/title-poster';
import { PopularTitle } from '@/components/title/types';
import { useMediaQuery } from '@/hooks/use-media-query';
import { movie, series } from '@/routes';

const VISIBLE_COUNT_MOBILE = 3;
const VISIBLE_COUNT_DESKTOP = 5;

export default function TitleRow({
    title,
    titles,
    type,
}: {
    title: string;
    titles: PopularTitle[];
    type: 'movie' | 'series';
}) {
    const [page, setPage] = useState(0);
    const isDesktop = useMediaQuery('(min-width: 768px)');
    const visibleCount = isDesktop
        ? VISIBLE_COUNT_DESKTOP
        : VISIBLE_COUNT_MOBILE;

    useEffect(() => {
        setPage(0);
    }, [visibleCount]);

    if (titles.length === 0) {
        return null;
    }

    const pageCount = Math.ceil(titles.length / visibleCount);
    const hasNext = page < pageCount - 1;
    const hasPrevious = page > 0;
    const route = type === 'movie' ? movie : series;

    return (
        <section className="px-6 py-6 md:px-10 lg:px-16">
            <div className="mb-6">
                <h2 className="text-xl">{title}</h2>
            </div>
            <div className="flex w-full flex-row">
                <div>
                    <Button
                        variant="outline"
                        size="full"
                        disabled={!hasPrevious}
                        onClick={() =>
                            setPage((current) => Math.max(current - 1, 0))
                        }
                        aria-label={`Show previous ${title}`}
                    >
                        <ChevronLeft />
                    </Button>
                </div>
                <div className="@container grow overflow-hidden">
                    <div
                        className="flex transition-transform duration-700 ease-in-out"
                        style={{ transform: `translateX(-${page * 100}cqw)` }}
                    >
                        {titles.map((item) => (
                            <div
                                key={item.tmdb_id}
                                className="shrink-0 px-2"
                                style={{ width: `${100 / visibleCount}cqw` }}
                            >
                                <Card size="sm">
                                    <div className="mx-auto flex items-center gap-2">
                                        <Star className="fill-foreground size-4" />
                                        {item.vote_average?.toFixed(1) ?? '—'}
                                    </div>
                                    <Link href={route(item.tmdb_id)}>
                                        <TitlePoster
                                            path={item.poster_path}
                                            name={item.name}
                                        />
                                    </Link>
                                    <CardContent>
                                        <p className="hidden truncate text-center text-sm md:block">
                                            {item.name}
                                        </p>
                                        <p className="text-accent-foreground text-center text-xs">
                                            {item.release_year ?? '—'}
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>
                        ))}
                    </div>
                </div>
                <div>
                    <Button
                        variant="outline"
                        size="full"
                        disabled={!hasNext}
                        onClick={() =>
                            setPage((current) =>
                                Math.min(current + 1, pageCount - 1),
                            )
                        }
                        aria-label={`Show more ${title}`}
                    >
                        <ChevronRight />
                    </Button>
                </div>
            </div>
        </section>
    );
}
