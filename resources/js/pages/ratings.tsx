import { setLayoutProps } from '@inertiajs/react';
import { Rating } from '@/components/title/types';
import { columns } from '@/components/ratings/table-columns';
import { RatingsDataTable } from '@/components/ratings/data-table';

export default function Ratings({ ratings }: { ratings: Rating[] }) {
    setLayoutProps({ title: 'Ratings' });

    const data = ratings.map((rating) => ({
        id: rating.id,
        titleId: rating.title.id,
        updated_at: rating.updated_at,
        score: rating.score,
        title: rating.title.name,
        release_year: rating.title.release_year,
        poster_path: rating.title.poster_path,
        vote_average: rating.title.vote_average,
        tmdb_id: rating.title.tmdb_id,
        type: rating.title.type === 'movie' ? 'Movie' : 'Series',
    }));

    return (
        <main className="flex h-full w-full flex-col">
            <div className="mx-auto my-8 w-full max-w-7xl">
                <h1 className="font-heading text-4xl">Your Ratings</h1>
            </div>
            <div className="mx-auto w-full max-w-7xl">
                <RatingsDataTable columns={columns} data={data} />
            </div>
        </main>
    );
}
