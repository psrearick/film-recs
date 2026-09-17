import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import type { PopularTitle } from '@/components/title/types';

vi.mock('@inertiajs/react', () => ({
    Link: ({ href, children }: { href: string; children: ReactNode }) => (
        <a href={href}>{children}</a>
    ),
}));

vi.mock('@/routes', () => ({
    movie: (id: number) => `/movies/${id}`,
    series: (id: number) => `/series/${id}`,
}));

import TitleRow from './title-row';

function makeTitles(count: number): PopularTitle[] {
    return Array.from({ length: count }, (_, index) => ({
        tmdb_id: index + 1,
        name: `Title ${index + 1}`,
        release_year: 2000 + index,
        overview: null,
        poster_path: null,
        popularity: 1,
        vote_average: 7.5,
    }));
}

function matchMediaMock(matches: boolean) {
    return vi.fn().mockImplementation((query: string) => ({
        matches,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
    }));
}

describe('TitleRow', () => {
    beforeEach(() => {
        window.matchMedia = matchMediaMock(true);
    });

    it('renders nothing when there are no titles', () => {
        const { container } = render(
            <TitleRow title="Popular Movies" titles={[]} type="movie" />,
        );

        expect(container).toBeEmptyDOMElement();
    });

    it('links each title to its movie page when type is movie', () => {
        render(
            <TitleRow
                title="Popular Movies"
                titles={makeTitles(2)}
                type="movie"
            />,
        );

        expect(screen.getByText('Title 1')).toBeInTheDocument();
        expect(screen.getAllByRole('link')[0]).toHaveAttribute(
            'href',
            '/movies/1',
        );
    });

    it('links each title to its series page when type is series', () => {
        render(
            <TitleRow
                title="Popular Series"
                titles={makeTitles(1)}
                type="series"
            />,
        );

        expect(screen.getAllByRole('link')[0]).toHaveAttribute(
            'href',
            '/series/1',
        );
    });

    it('disables the next button when all titles fit on one page', () => {
        render(
            <TitleRow
                title="Popular Movies"
                titles={makeTitles(5)}
                type="movie"
            />,
        );

        expect(
            screen.getByRole('button', { name: 'Show more Popular Movies' }),
        ).toBeDisabled();
    });

    it('slides to the next batch when the button is clicked, then disables at the end', () => {
        render(
            <TitleRow
                title="Popular Movies"
                titles={makeTitles(6)}
                type="movie"
            />,
        );

        const button = screen.getByRole('button', {
            name: 'Show more Popular Movies',
        });

        expect(button).not.toBeDisabled();

        fireEvent.click(button);

        expect(button).toBeDisabled();
    });

    it('disables the previous button until the next button has been clicked', () => {
        render(
            <TitleRow
                title="Popular Movies"
                titles={makeTitles(6)}
                type="movie"
            />,
        );

        const previous = screen.getByRole('button', {
            name: 'Show previous Popular Movies',
        });

        expect(previous).toBeDisabled();

        fireEvent.click(
            screen.getByRole('button', { name: 'Show more Popular Movies' }),
        );

        expect(previous).not.toBeDisabled();

        fireEvent.click(previous);

        expect(previous).toBeDisabled();
    });

    it('shows fewer titles per page on mobile screens', () => {
        window.matchMedia = matchMediaMock(false);

        render(
            <TitleRow
                title="Popular Movies"
                titles={makeTitles(3)}
                type="movie"
            />,
        );

        expect(
            screen.getByRole('button', { name: 'Show more Popular Movies' }),
        ).toBeDisabled();
    });

    it('does not disable the next button on mobile until the smaller page size is exhausted', () => {
        window.matchMedia = matchMediaMock(false);

        render(
            <TitleRow
                title="Popular Movies"
                titles={makeTitles(4)}
                type="movie"
            />,
        );

        expect(
            screen.getByRole('button', { name: 'Show more Popular Movies' }),
        ).not.toBeDisabled();
    });
});
