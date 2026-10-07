import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import type { TasteProfileProps } from '@/components/taste-profile/types';

const { setLayoutProps, optimistic, visit } = vi.hoisted(() => {
    const visit = vi.fn();

    return {
        setLayoutProps: vi.fn(),
        visit,
        optimistic: vi.fn(() => ({ get: visit })),
    };
});

vi.mock('@inertiajs/react', () => ({
    setLayoutProps,
    router: { optimistic },
    useHttp: () => ({ get: () => Promise.resolve(), cancel: () => {} }),
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
    home: () => '/',
    tasteProfile: {
        url: ({ query }: { query: Record<string, number> }) =>
            `/taste-profile${Object.keys(query).length > 0 ? `?${new URLSearchParams(Object.entries(query).map(([key, value]) => [key, String(value)]))}` : ''}`,
    },
    movie: (id: number) => `/movies/${id}`,
    series: (id: number) => `/series/${id}`,
    person: (id: number) => `/people/${id}`,
}));

vi.mock('@/routes/taste-profile', () => ({
    titles: { url: () => '/taste-profile/titles' },
}));

import TasteProfile from './taste-profile';

function makeProfile(
    overrides: Partial<TasteProfileProps> = {},
): TasteProfileProps {
    return {
        includeLowConfidence: false,
        minimumConfidentSampleSize: 5,
        hiddenCounts: { genres: 0, decades: 0 },
        ratingCount: 20,
        minimumRatingCount: 5,
        averageScore: 7.2,
        scoreDistribution: [{ score: 8, count: 20 }],
        typeBreakdown: [{ type: 'movie', count: 20, average_score: 7.2 }],
        updatedAt: '2026-10-07T00:00:00+00:00',
        genres: [],
        decades: [],
        keywords: { favored: [], disfavored: [] },
        people: [],
        ...overrides,
    };
}

const sciFi = {
    id: 1,
    label: 'Sci-Fi',
    affinity_score: 1.8,
    confidence: 0.55,
    weighted_score: 0.99,
    sample_size: 6,
    is_low_confidence: false,
};

describe('TasteProfile page', () => {
    beforeEach(() => {
        setLayoutProps.mockClear();
        optimistic.mockClear();
        visit.mockClear();
    });

    it('sets the page title to Taste Profile', () => {
        render(<TasteProfile {...makeProfile()} />);

        expect(setLayoutProps).toHaveBeenCalledWith({ title: 'Taste Profile' });
    });

    it('asks for more ratings when the user has fewer than the minimum', () => {
        render(<TasteProfile {...makeProfile({ ratingCount: 3 })} />);

        expect(
            screen.getByText(
                "Rate at least 5 titles to see your taste profile. You've rated 3 so far.",
            ),
        ).toBeInTheDocument();
        expect(screen.getByRole('progressbar')).toHaveAttribute(
            'aria-valuenow',
            '60',
        );
        expect(
            screen.getByRole('link', { name: 'Find something to rate' }),
        ).toHaveAttribute('href', '/');
        expect(screen.queryByText('At a glance')).not.toBeInTheDocument();
    });

    it('says the profile is still being calculated before affinities exist', () => {
        render(<TasteProfile {...makeProfile({ updatedAt: null })} />);

        expect(
            screen.getByText(
                'Your taste profile is still being calculated. Check back in a minute.',
            ),
        ).toBeInTheDocument();
    });

    it('shows the summary, genre chart, people and themes', () => {
        render(
            <TasteProfile
                {...makeProfile({
                    genres: [sciFi],
                    people: [
                        {
                            role: 'director',
                            favored: [
                                {
                                    ...sciFi,
                                    id: 7,
                                    label: 'Christopher Nolan',
                                    tmdb_id: 525,
                                    profile_path: null,
                                },
                            ],
                            disfavored: [],
                        },
                    ],
                    keywords: {
                        favored: [{ ...sciFi, id: 9, label: 'time travel' }],
                        disfavored: [],
                    },
                })}
            />,
        );

        expect(
            screen.getByText('You gravitate toward Sci-Fi.'),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('table', { name: 'Your genre affinities' }),
        ).toBeInTheDocument();
        fireEvent.click(
            screen.getByRole('button', { name: /Christopher Nolan/ }),
        );
        expect(
            screen.getByRole('link', { name: 'Christopher Nolan' }),
        ).toHaveAttribute('href', '/people/525');
        expect(screen.getByText('Directors')).toBeInTheDocument();
        expect(screen.getByText('time travel')).toBeInTheDocument();
    });

    it('orders the genre chart by points rather than confidence-weighted rank', () => {
        render(
            <TasteProfile
                {...makeProfile({
                    genres: [
                        {
                            ...sciFi,
                            id: 1,
                            label: 'Sci-Fi',
                            affinity_score: 0.8,
                            weighted_score: 0.6,
                        },
                        {
                            ...sciFi,
                            id: 2,
                            label: 'War',
                            affinity_score: 1.6,
                            weighted_score: 0.46,
                        },
                    ],
                })}
            />,
        );

        const rowHeaders = screen
            .getByRole('table', { name: 'Your genre affinities' })
            .querySelectorAll('tbody th');

        expect([...rowHeaders].map((header) => header.textContent)).toEqual([
            'War',
            'Sci-Fi',
        ]);
    });

    it('hides low-confidence results by default and lets the user include them', () => {
        render(<TasteProfile {...makeProfile()} />);

        const toggle = screen.getByRole('switch', {
            name: 'Include low-confidence results',
        });
        expect(toggle).not.toBeChecked();
        expect(
            screen.getByText(
                'Results backed by fewer than 5 titles are hidden.',
            ),
        ).toBeInTheDocument();

        fireEvent.click(toggle);

        expect(visit).toHaveBeenCalledWith(
            '/taste-profile?include_low_confidence=1',
            {},
            { preserveScroll: true, preserveState: true },
        );
    });

    it('drops the query flag when low-confidence results are turned off', () => {
        render(
            <TasteProfile {...makeProfile({ includeLowConfidence: true })} />,
        );

        fireEvent.click(
            screen.getByRole('switch', {
                name: 'Include low-confidence results',
            }),
        );

        expect(visit).toHaveBeenCalledWith(
            '/taste-profile',
            {},
            expect.anything(),
        );
    });

    it('says how many low-confidence genres are hidden', () => {
        render(
            <TasteProfile
                {...makeProfile({
                    genres: [sciFi],
                    hiddenCounts: { genres: 2, decades: 0 },
                })}
            />,
        );

        expect(
            screen.getByText(
                'How you rate each genre compared to your average. 2 low-confidence genres hidden.',
            ),
        ).toBeInTheDocument();
    });

    it('explains faded bars only when low-confidence results are shown', () => {
        const { rerender } = render(
            <TasteProfile {...makeProfile({ genres: [sciFi] })} />,
        );

        expect(screen.queryByText('Low confidence')).not.toBeInTheDocument();

        rerender(
            <TasteProfile
                {...makeProfile({
                    genres: [sciFi],
                    includeLowConfidence: true,
                })}
            />,
        );

        expect(screen.getByText('Low confidence')).toBeInTheDocument();
        expect(
            screen.getByText(/Faded bars are backed by fewer than 5 titles\./),
        ).toBeInTheDocument();
    });

    it('leaves out sections that have no affinities', () => {
        render(<TasteProfile {...makeProfile()} />);

        expect(screen.queryByText('Genres')).not.toBeInTheDocument();
        expect(screen.queryByText('Decades')).not.toBeInTheDocument();
        expect(screen.queryByText('Themes')).not.toBeInTheDocument();
    });
});
