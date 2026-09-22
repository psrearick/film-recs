import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { Clapperboard } from 'lucide-react';
import type { Title } from '@/components/title/types';

const { setLayoutProps } = vi.hoisted(() => ({
    setLayoutProps: vi.fn(),
}));

vi.mock('@inertiajs/react', () => ({
    setLayoutProps,
}));

const { titleDetailCalls } = vi.hoisted(() => ({
    titleDetailCalls: [] as { title: Title; posterIcon: unknown }[],
}));

vi.mock('@/components/title/title-detail', () => ({
    default: (props: { title: Title; posterIcon: unknown }) => {
        titleDetailCalls.push(props);
        return <div data-testid="title-detail" />;
    },
}));

import Movie from './movie';

const movie: Title = {
    id: 1,
    name: 'The Matrix',
    tmdb_id: 603,
    release_year: 1999,
    overview: 'A hacker learns the truth.',
    poster_path: '/matrix.jpg',
    runtime: 136,
    popularity: 80,
    vote_average: 8.2,
    genres: [],
    keywords: [],
    actors: [],
    directors: [],
    producers: [],
    composers: [],
    watch_providers: [],
};

describe('Movie page', () => {
    beforeEach(() => {
        titleDetailCalls.length = 0;
    });

    it('sets the page title to the movie name', () => {
        render(<Movie movie={movie} />);

        expect(setLayoutProps).toHaveBeenCalledWith({ title: 'The Matrix' });
    });

    it('renders the title detail with the movie and the clapperboard icon', () => {
        render(<Movie movie={movie} />);

        expect(screen.getByTestId('title-detail')).toBeInTheDocument();
        expect(titleDetailCalls[0]?.title).toBe(movie);
        expect(titleDetailCalls[0]?.posterIcon).toBe(Clapperboard);
    });
});
