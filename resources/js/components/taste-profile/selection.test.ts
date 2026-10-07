import { describe, expect, it } from 'vite-plus/test';
import {
    decadeSelection,
    genreSelection,
    keywordSelection,
    personSelection,
    scoreSelection,
} from '@/components/taste-profile/selection';
import type { Affinity } from '@/components/taste-profile/types';

const affinity: Affinity = {
    id: 7,
    label: 'Drama',
    affinity_score: 1.2,
    confidence: 0.5,
    weighted_score: 0.6,
    sample_size: 4,
    is_low_confidence: false,
};

describe('selection builders', () => {
    it('queries a genre or keyword by its id', () => {
        expect(genreSelection(affinity)).toMatchObject({
            query: { type: 'genre', id: 7 },
            eyebrow: 'Genre',
            heading: 'Drama',
            description: '1.2 points above your average across 4 titles',
        });
        expect(keywordSelection(affinity).query).toEqual({
            type: 'keyword',
            id: 7,
        });
    });

    it('queries a decade by its starting year', () => {
        expect(
            decadeSelection({ ...affinity, id: null, label: '1990s' }),
        ).toMatchObject({
            query: { type: 'decade', value: '1990' },
            heading: 'The 1990s',
        });
    });

    it('queries a person by id and role, and keeps their profile details', () => {
        expect(
            personSelection('director', {
                ...affinity,
                label: 'Denis Villeneuve',
                tmdb_id: 137427,
                profile_path: '/denis.jpg',
            }),
        ).toMatchObject({
            query: { type: 'person', id: 7, value: 'director' },
            eyebrow: 'Director',
            heading: 'Denis Villeneuve',
            person: { tmdbId: 137427, profilePath: '/denis.jpg' },
        });
    });

    it('queries a score by its value', () => {
        expect(scoreSelection(8, 46)).toMatchObject({
            query: { type: 'score', value: '8' },
            heading: 'Rated 8',
            description: 'You gave 46 titles a 8',
        });
    });
});
