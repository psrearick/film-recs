import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vite-plus/test';
import AffinityChart from '@/components/taste-profile/affinity-chart';
import type { Affinity } from '@/components/taste-profile/types';

function makeAffinity(overrides: Partial<Affinity>): Affinity {
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

describe('AffinityChart', () => {
    it('describes each affinity in a table for screen readers', () => {
        render(
            <AffinityChart
                caption="Your genre affinities"
                onSelect={vi.fn()}
                affinities={[
                    makeAffinity({
                        label: 'Sci-Fi',
                        affinity_score: 1.8,
                        sample_size: 6,
                        confidence: 0.55,
                    }),
                ]}
            />,
        );

        expect(
            screen.getByRole('table', { name: 'Your genre affinities' }),
        ).toHaveTextContent(
            'Sci-Fi1.8 points above your average across 6 titles55%',
        );
    });

    it('flags low-confidence affinities in the screen reader table', () => {
        render(
            <AffinityChart
                caption="Your genre affinities"
                onSelect={vi.fn()}
                affinities={[
                    makeAffinity({
                        label: 'War',
                        affinity_score: 1.6,
                        sample_size: 2,
                        confidence: 0.29,
                        is_low_confidence: true,
                    }),
                ]}
            />,
        );

        expect(
            screen.getByRole('table', { name: 'Your genre affinities' }),
        ).toHaveTextContent('29% (low confidence)');
    });

    it('selects an affinity from the table, for keyboard users', () => {
        const onSelect = vi.fn();
        const sciFi = makeAffinity({ label: 'Sci-Fi' });
        render(
            <AffinityChart
                caption="Your genre affinities"
                affinities={[sciFi]}
                onSelect={onSelect}
            />,
        );

        fireEvent.click(screen.getByRole('button', { name: 'Sci-Fi' }));

        expect(onSelect).toHaveBeenCalledWith(sciFi);
    });
});
