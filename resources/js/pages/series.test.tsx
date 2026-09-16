import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { Tv } from 'lucide-react';
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

import Series from './series';

const series: Title = {
    id: 1,
    name: 'Lost',
    release_year: 2004,
    overview: 'Survivors of a plane crash.',
    poster_path: '/lost.jpg',
    runtime: null,
    popularity: 45,
    vote_average: 8.0,
    genres: [],
    keywords: [],
    actors: [],
    directors: [],
    producers: [],
    composers: [],
    watch_providers: [],
};

describe('Series page', () => {
    beforeEach(() => {
        titleDetailCalls.length = 0;
    });

    it('sets the page title to the series name', () => {
        render(<Series series={series} />);

        expect(setLayoutProps).toHaveBeenCalledWith({ title: 'Lost' });
    });

    it('renders the title detail with the series and the tv icon', () => {
        render(<Series series={series} />);

        expect(screen.getByTestId('title-detail')).toBeInTheDocument();
        expect(titleDetailCalls[0]?.title).toBe(series);
        expect(titleDetailCalls[0]?.posterIcon).toBe(Tv);
    });
});
