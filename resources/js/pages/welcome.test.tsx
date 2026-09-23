import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vite-plus/test';
import type { PopularTitle } from '@/components/title/types';

const { setLayoutProps } = vi.hoisted(() => ({
    setLayoutProps: vi.fn(),
}));

vi.mock('@inertiajs/react', () => ({
    setLayoutProps,
    usePage: () => ({
        props: {
            auth: {
                user: true,
            },
        },
        url: '/',
        version: null,
    }),
}));

import Welcome from './welcome';

const popularMovies: PopularTitle[] = [];
const popularSeries: PopularTitle[] = [];
const trendingMovies: PopularTitle[] = [];
const trendingSeries: PopularTitle[] = [];

function renderWelcome() {
    return render(
        <Welcome
            popular_movies={popularMovies}
            popular_series={popularSeries}
            trending_movies={trendingMovies}
            trending_series={trendingSeries}
        />,
    );
}

describe('Welcome page', () => {
    it('renders a welcome message', () => {
        renderWelcome();

        expect(
            screen.getByText("Let's discover your next watch."),
        ).toBeInTheDocument();
    });

    it('sets the page title via layout props', () => {
        renderWelcome();

        expect(setLayoutProps).toHaveBeenCalledWith({ title: 'Welcome' });
    });
});
