import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vite-plus/test';

const { routerDelete } = vi.hoisted(() => ({
    routerDelete: vi.fn(),
}));

vi.mock('@inertiajs/react', () => ({
    router: { delete: routerDelete },
    Link: ({
        href,
        children,
        ...rest
    }: {
        href: string;
        children: ReactNode;
    }) => (
        <a href={href} {...rest}>
            {children}
        </a>
    ),
    Form: ({
        action,
        onSuccess,
        children,
    }: {
        action: string;
        onSuccess?: () => void;
        children: (bag: { processing: boolean }) => ReactNode;
    }) => (
        <form
            action={action}
            onSubmit={(event) => {
                event.preventDefault();
                onSuccess?.();
            }}
        >
            {children({ processing: false })}
        </form>
    ),
}));

vi.mock('@/routes', () => ({
    movie: (id: number) => `/movies/${id}`,
    series: (id: number) => `/series/${id}`,
    rating: {
        form: (titleId: number) => ({
            action: `/titles/${titleId}/rating`,
            method: 'post',
        }),
    },
}));

vi.mock('@/routes/rating', () => ({
    destroy: {
        url: (titleId: number) => `/titles/${titleId}/rating`,
    },
}));

import { RatingsDataTable } from './data-table';
import { columns, type Rating } from './table-columns';

function makeRating(overrides: Partial<Rating> = {}): Rating {
    return {
        id: 1,
        titleId: 10,
        tmdb_id: 603,
        updated_at: '2026-09-21T23:30:00.000000Z',
        score: 8,
        title: 'The Matrix',
        release_year: 1999,
        poster_path: null,
        vote_average: 8.2,
        type: 'Movie',
        ...overrides,
    };
}

describe('ratings table columns', () => {
    it('links a movie title to its movie page', () => {
        render(
            <RatingsDataTable
                columns={columns}
                data={[makeRating({ type: 'Movie', tmdb_id: 603 })]}
            />,
        );

        expect(
            screen.getByRole('link', { name: 'The Matrix' }),
        ).toHaveAttribute('href', '/movies/603');
    });

    it('links a series title to its series page', () => {
        render(
            <RatingsDataTable
                columns={columns}
                data={[
                    makeRating({
                        type: 'Series',
                        tmdb_id: 1403,
                        title: 'Lost',
                    }),
                ]}
            />,
        );

        expect(screen.getByRole('link', { name: 'Lost' })).toHaveAttribute(
            'href',
            '/series/1403',
        );
    });

    it('shows the release year, type, and average rating', () => {
        render(
            <RatingsDataTable
                columns={columns}
                data={[
                    makeRating({
                        release_year: 1999,
                        type: 'Movie',
                        vote_average: 8.2,
                    }),
                ]}
            />,
        );

        expect(screen.getByText('1999')).toBeInTheDocument();
        expect(screen.getByText('Movie')).toBeInTheDocument();
        expect(screen.getByText('8.2')).toBeInTheDocument();
    });

    it('formats the date rated as a long UTC date', () => {
        render(
            <RatingsDataTable
                columns={columns}
                data={[
                    makeRating({ updated_at: '2026-09-21T23:30:00.000000Z' }),
                ]}
            />,
        );

        expect(screen.getByText('September 21, 2026')).toBeInTheDocument();
    });

    it("wires the score cell to the title's rating endpoint", () => {
        render(
            <RatingsDataTable
                columns={columns}
                data={[makeRating({ titleId: 42, score: 7 })]}
            />,
        );

        fireEvent.click(screen.getByRole('button', { name: '7' }));

        const form = screen
            .getByRole('button', { name: 'Save' })
            .closest('form')!;
        expect(form).toHaveAttribute('action', '/titles/42/rating');
    });

    it('wires the clear-rating action to the title', () => {
        render(
            <RatingsDataTable
                columns={columns}
                data={[makeRating({ titleId: 42 })]}
            />,
        );

        fireEvent.click(screen.getByRole('button', { name: 'Clear rating' }));

        expect(routerDelete).toHaveBeenCalledWith(
            '/titles/42/rating',
            expect.objectContaining({ preserveScroll: true }),
        );
    });

    it('cycles a column through ascending, descending, and unsorted on repeated clicks', () => {
        render(
            <RatingsDataTable
                columns={columns}
                data={[
                    makeRating({ id: 1, title: 'Zebra' }),
                    makeRating({ id: 2, title: 'Apple' }),
                ]}
            />,
        );

        const header = screen.getByRole('button', { name: 'Title' });
        const titleCell = () =>
            screen.getAllByRole('link').map((link) => link.textContent);

        expect(titleCell()).toEqual(['Zebra', 'Apple']);

        fireEvent.click(header);
        expect(header.querySelector('svg')).toHaveClass('lucide-arrow-up');
        expect(titleCell()).toEqual(['Apple', 'Zebra']);

        fireEvent.click(header);
        expect(header.querySelector('svg')).toHaveClass('lucide-arrow-down');
        expect(titleCell()).toEqual(['Zebra', 'Apple']);

        fireEvent.click(header);
        expect(header.querySelector('svg')).toHaveClass('lucide-arrow-up-down');
        expect(titleCell()).toEqual(['Zebra', 'Apple']);
    });
});
