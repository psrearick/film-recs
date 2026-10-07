import { describe, expect, it } from 'vite-plus/test';
import {
    describeAffinity,
    formatPoints,
    joinAsSentence,
    summarizeTaste,
} from '@/components/taste-profile/describe';
import type {
    Affinity,
    TasteProfileProps,
} from '@/components/taste-profile/types';

function makeAffinity(overrides: Partial<Affinity> = {}): Affinity {
    return {
        id: 1,
        label: 'Drama',
        affinity_score: 1,
        confidence: 0.5,
        weighted_score: 0.5,
        sample_size: 5,
        is_low_confidence: false,
        ...overrides,
    };
}

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
        scoreDistribution: [],
        typeBreakdown: [],
        updatedAt: '2026-10-07T00:00:00+00:00',
        genres: [],
        decades: [],
        keywords: { favored: [], disfavored: [] },
        people: [],
        ...overrides,
    };
}

describe('describeAffinity', () => {
    it('describes a score above the user average', () => {
        expect(
            describeAffinity(
                makeAffinity({ affinity_score: 1.84, sample_size: 6 }),
            ),
        ).toBe('1.8 points above your average across 6 titles');
    });

    it('describes a score below the user average with a singular title', () => {
        expect(
            describeAffinity(
                makeAffinity({ affinity_score: -0.5, sample_size: 1 }),
            ),
        ).toBe('0.5 points below your average across 1 title');
    });

    it('describes a score that rounds to zero as right at the average', () => {
        expect(
            describeAffinity(
                makeAffinity({ affinity_score: 0.04, sample_size: 3 }),
            ),
        ).toBe('Right at your average across 3 titles');
    });
});

describe('formatPoints', () => {
    it('signs positive and negative points to one decimal place', () => {
        expect(formatPoints(1.84)).toBe('+1.8');
        expect(formatPoints(-0.46)).toBe('-0.5');
    });

    it('shows a value that rounds to zero without a sign', () => {
        expect(formatPoints(-0.04)).toBe('0.0');
    });
});

describe('joinAsSentence', () => {
    it('joins one, two and three items as natural English', () => {
        expect(joinAsSentence(['A'])).toBe('A');
        expect(joinAsSentence(['A', 'B'])).toBe('A and B');
        expect(joinAsSentence(['A', 'B', 'C'])).toBe('A, B, and C');
    });
});

describe('summarizeTaste', () => {
    it('summarizes the average, genres, decade, title types and top people', () => {
        const summary = summarizeTaste(
            makeProfile({
                genres: [
                    makeAffinity({ label: 'Sci-Fi', weighted_score: 1.2 }),
                    makeAffinity({ label: 'Thriller', weighted_score: 0.8 }),
                    makeAffinity({ label: 'Mystery', weighted_score: 0.3 }),
                    makeAffinity({ label: 'Musical', weighted_score: -0.2 }),
                    makeAffinity({ label: 'Romance', weighted_score: -1.1 }),
                ],
                decades: [
                    makeAffinity({ label: '1980s', weighted_score: 0.4 }),
                    makeAffinity({ label: '1990s', weighted_score: 0.9 }),
                    makeAffinity({ label: '2010s', weighted_score: -0.6 }),
                ],
                typeBreakdown: [
                    { type: 'movie', count: 12, average_score: 6.9 },
                    { type: 'tv', count: 8, average_score: 7.7 },
                ],
                people: [
                    {
                        role: 'cast',
                        favored: [
                            {
                                ...makeAffinity({ label: 'Keanu Reeves' }),
                                tmdb_id: 6384,
                                profile_path: null,
                            },
                        ],
                        disfavored: [],
                    },
                    {
                        role: 'director',
                        favored: [
                            {
                                ...makeAffinity({ label: 'Christopher Nolan' }),
                                tmdb_id: 525,
                                profile_path: null,
                            },
                        ],
                        disfavored: [],
                    },
                ],
            }),
        );

        expect(summary).toEqual([
            'You rate titles 7.2 out of 10 on average across 20 ratings.',
            'You gravitate toward Sci-Fi and Thriller, and tend to rate Romance below your average.',
            'The 1990s are your strongest decade.',
            'You rate series 0.8 points higher than movies.',
            'Keanu Reeves is your top actor and Christopher Nolan is your top director.',
        ]);
    });

    it('says movies and series are rated about the same when their averages are close', () => {
        const summary = summarizeTaste(
            makeProfile({
                typeBreakdown: [
                    { type: 'movie', count: 12, average_score: 7.1 },
                    { type: 'tv', count: 8, average_score: 7.3 },
                ],
            }),
        );

        expect(summary).toContain('You rate movies and series about the same.');
    });

    it('only mentions disliked genres when no genre is rated above average', () => {
        const summary = summarizeTaste(
            makeProfile({
                genres: [
                    makeAffinity({ label: 'Horror', weighted_score: -0.7 }),
                ],
            }),
        );

        expect(summary).toContain(
            'You tend to rate Horror below your average.',
        );
    });

    it('leaves out highlights the profile has no data for', () => {
        expect(summarizeTaste(makeProfile({ averageScore: null }))).toEqual([]);
    });
});
