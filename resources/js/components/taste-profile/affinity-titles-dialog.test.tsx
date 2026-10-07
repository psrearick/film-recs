import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import type {
    RatedTitle,
    TitleSelection,
} from '@/components/taste-profile/types';

type GetOptions = {
    onSuccess: (response: { titles: RatedTitle[] }) => void;
    onError: () => void;
};

const { get, cancel } = vi.hoisted(() => ({
    get: vi.fn(),
    cancel: vi.fn(),
}));

vi.mock('@inertiajs/react', () => ({
    useHttp: () => ({ get, cancel }),
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
}));

vi.mock('@/routes', () => ({
    movie: (id: number) => `/movies/${id}`,
    series: (id: number) => `/series/${id}`,
    person: (id: number) => `/people/${id}`,
}));

vi.mock('@/routes/taste-profile', () => ({
    titles: {
        url: ({ query }: { query: Record<string, string | number> }) =>
            `/taste-profile/titles?${new URLSearchParams(
                Object.entries(query).map(([key, value]) => [
                    key,
                    String(value),
                ]),
            )}`,
    },
}));

import AffinityTitlesDialog from './affinity-titles-dialog';

const genre: TitleSelection = {
    query: { type: 'genre', id: 7 },
    eyebrow: 'Genre',
    heading: 'Crime',
    description: '0.9 points below your average across 2 titles',
};

const director: TitleSelection = {
    query: { type: 'person', id: 3, value: 'director' },
    eyebrow: 'Director',
    heading: 'Denis Villeneuve',
    description: '3.1 points above your average across 3 titles',
    person: { tmdbId: 137427, profilePath: null },
};

const titles: RatedTitle[] = [
    {
        id: 1,
        tmdb_id: 807,
        type: 'movie',
        name: 'Se7en',
        release_year: 1995,
        poster_path: null,
        score: 9,
    },
    {
        id: 2,
        tmdb_id: 1405,
        type: 'tv',
        name: 'Dexter',
        release_year: 2006,
        poster_path: null,
        score: 8,
    },
];

describe('AffinityTitlesDialog', () => {
    beforeEach(() => {
        get.mockReset();
        get.mockResolvedValue(undefined);
    });

    it("fetches the titles for the selection and lists them with the user's rating", () => {
        get.mockImplementation((_url: string, options: GetOptions) => {
            options.onSuccess({ titles });

            return Promise.resolve();
        });

        render(<AffinityTitlesDialog selection={genre} onClose={vi.fn()} />);

        expect(get).toHaveBeenCalledWith(
            '/taste-profile/titles?type=genre&id=7',
            expect.anything(),
        );
        expect(
            screen.getByRole('heading', { name: 'Crime' }),
        ).toBeInTheDocument();
        expect(
            screen.getByText('0.9 points below your average across 2 titles'),
        ).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /Se7en/ })).toHaveAttribute(
            'href',
            '/movies/807',
        );
        expect(screen.getByRole('link', { name: /Dexter/ })).toHaveAttribute(
            'href',
            '/series/1405',
        );
        expect(screen.getByText('Your rating: 9/10')).toBeInTheDocument();
        expect(screen.getByText('2006 · Series')).toBeInTheDocument();
    });

    it("links a person's name to their page", () => {
        render(<AffinityTitlesDialog selection={director} onClose={vi.fn()} />);

        expect(
            screen.getByRole('link', { name: 'Denis Villeneuve' }),
        ).toHaveAttribute('href', '/people/137427');
    });

    it('shows loading placeholders until the titles arrive', () => {
        render(<AffinityTitlesDialog selection={genre} onClose={vi.fn()} />);

        expect(screen.getByLabelText('Loading titles')).toBeInTheDocument();
    });

    it('shows an error when the titles fail to load', () => {
        get.mockImplementation((_url: string, options: GetOptions) => {
            options.onError();

            return Promise.resolve();
        });

        render(<AffinityTitlesDialog selection={genre} onClose={vi.fn()} />);

        expect(
            screen.getByText("Couldn't load these titles"),
        ).toBeInTheDocument();
    });

    it('renders nothing when there is no selection', () => {
        render(<AffinityTitlesDialog selection={null} onClose={vi.fn()} />);

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        expect(get).not.toHaveBeenCalled();
    });
});
