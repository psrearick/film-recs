import { createColumnHelper } from '@tanstack/react-table';
import { type RatingsTableFeatures } from '@/components/ratings/table-features';
import { Link } from '@inertiajs/react';
import { movie, series } from '@/routes';
import RatingsTableRatingCell from '@/components/ratings/table-rating-cell';
import RatingsTableRowActions from '@/components/ratings/table-row-actions';
import RatingsTableSortableHeader from '@/components/ratings/table-sortable-header';

export type Rating = {
    id: number;
    titleId: number;
    tmdb_id: number;
    updated_at: string;
    score: number;
    title: string;
    release_year: number | null;
    poster_path: string | null;
    vote_average: number | null;
    type: string;
};

const columnHelper = createColumnHelper<RatingsTableFeatures, Rating>();

export const columns = columnHelper.columns([
    columnHelper.accessor('title', {
        meta: { className: 'lg:w-[28%]' },
        header: ({ column }) => (
            <RatingsTableSortableHeader
                column={column}
                label="Title"
                align="left"
            />
        ),
        cell: ({ row }) => {
            const route = row.getValue('type') === 'Movie' ? movie : series;

            return (
                <Link
                    href={route(row.original.tmdb_id)}
                    className="block truncate"
                >
                    {row.getValue('title')}
                </Link>
            );
        },
    }),
    columnHelper.accessor('type', {
        meta: { className: 'lg:w-[10%]' },
        header: ({ column }) => (
            <RatingsTableSortableHeader column={column} label="Type" />
        ),
        cell: ({ row }) => (
            <div className="text-center font-medium">
                {row.getValue('type')}
            </div>
        ),
    }),
    columnHelper.accessor('release_year', {
        meta: { className: 'lg:w-[12%]' },
        header: ({ column }) => (
            <RatingsTableSortableHeader column={column} label="Release Year" />
        ),
        cell: ({ row }) => (
            <div className="text-center font-medium">
                {row.getValue('release_year')}
            </div>
        ),
    }),
    columnHelper.accessor('score', {
        meta: { className: 'lg:w-[14%]' },
        header: ({ column }) => (
            <RatingsTableSortableHeader column={column} label="Your Rating" />
        ),
        cell: ({ row }) => (
            <div className="text-center">
                <RatingsTableRatingCell
                    titleId={row.original.titleId}
                    score={row.getValue('score')}
                />
            </div>
        ),
    }),
    columnHelper.accessor('vote_average', {
        meta: { className: 'lg:w-[14%]' },
        header: ({ column }) => (
            <RatingsTableSortableHeader
                column={column}
                label="Average Rating"
                align="center"
            />
        ),
        cell: ({ row }) => (
            <div className="text-center font-medium">
                {row.getValue('vote_average')}
            </div>
        ),
    }),
    columnHelper.accessor('updated_at', {
        meta: { className: 'lg:w-[16%]' },
        header: ({ column }) => (
            <RatingsTableSortableHeader
                column={column}
                label="Date Rated"
                align="right"
            />
        ),
        cell: ({ row }) => {
            const iso_date = new Date(row.getValue('updated_at'));
            const formatted = new Intl.DateTimeFormat('en-US', {
                dateStyle: 'long',
                timeZone: 'UTC',
            }).format(iso_date);

            return <div className="text-right font-medium">{formatted}</div>;
        },
    }),
    columnHelper.display({
        id: 'actions',
        meta: { className: 'lg:w-[6%]' },
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
            <div className="flex justify-end">
                <RatingsTableRowActions titleId={row.original.titleId} />
            </div>
        ),
    }),
]);
