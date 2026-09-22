import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import type { Rating } from '@/components/title/types';

const { setLayoutProps } = vi.hoisted(() => ({
    setLayoutProps: vi.fn(),
}));

vi.mock('@inertiajs/react', () => ({
    setLayoutProps,
}));

const { dataTableCalls } = vi.hoisted(() => ({
    dataTableCalls: [] as { data: unknown[] }[],
}));

vi.mock('@/components/ratings/data-table', () => ({
    RatingsDataTable: (props: { data: unknown[] }) => {
        dataTableCalls.push(props);
        return <div data-testid="ratings-data-table" />;
    },
}));

import Ratings from './ratings';

function makeRating(overrides: Partial<Rating> = {}): Rating {
    return {
        id: 1,
        updated_at: '2026-09-21T00:00:00.000000Z',
        score: 8,
        title: {
            id: 10,
            name: 'The Matrix',
            tmdb_id: 603,
            release_year: 1999,
            overview: null,
            poster_path: '/matrix.jpg',
            runtime: 136,
            popularity: 80,
            vote_average: 8.2,
            type: 'movie',
            genres: [],
            keywords: [],
            actors: [],
            directors: [],
            producers: [],
            composers: [],
            watch_providers: [],
        },
        ...overrides,
    };
}

describe('Ratings page', () => {
    beforeEach(() => {
        dataTableCalls.length = 0;
        setLayoutProps.mockClear();
    });

    it('sets the page title to Ratings', () => {
        render(<Ratings ratings={[]} />);

        expect(setLayoutProps).toHaveBeenCalledWith({ title: 'Ratings' });
    });

    it('renders the page heading', () => {
        render(<Ratings ratings={[]} />);

        expect(screen.getByText('Your Ratings')).toBeInTheDocument();
    });

    it('flattens each rating and its title into a single row', () => {
        const rating = makeRating();

        render(<Ratings ratings={[rating]} />);

        expect(dataTableCalls[0]?.data).toEqual([
            {
                id: 1,
                titleId: 10,
                updated_at: '2026-09-21T00:00:00.000000Z',
                score: 8,
                title: 'The Matrix',
                release_year: 1999,
                poster_path: '/matrix.jpg',
                vote_average: 8.2,
                tmdb_id: 603,
                type: 'Movie',
            },
        ]);
    });

    it('labels a tv title as Series', () => {
        const rating = makeRating({
            title: { ...makeRating().title, type: 'tv' },
        });

        render(<Ratings ratings={[rating]} />);

        expect(dataTableCalls[0]?.data[0]).toMatchObject({ type: 'Series' });
    });
});
