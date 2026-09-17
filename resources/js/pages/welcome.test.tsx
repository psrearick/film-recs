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

const movies: PopularTitle[] = [];
const series: PopularTitle[] = [];

describe('Welcome page', () => {
    it('renders a welcome message', () => {
        render(<Welcome movies={movies} series={series} />);

        expect(
            screen.getByText("Let's discover your next watch."),
        ).toBeInTheDocument();
    });

    it('sets the page title via layout props', () => {
        render(<Welcome movies={movies} series={series} />);

        expect(setLayoutProps).toHaveBeenCalledWith({ title: 'Welcome' });
    });
});
