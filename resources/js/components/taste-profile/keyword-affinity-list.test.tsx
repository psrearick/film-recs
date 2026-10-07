import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vite-plus/test';
import KeywordAffinityList from '@/components/taste-profile/keyword-affinity-list';
import type { Affinity } from '@/components/taste-profile/types';

const neoNoir: Affinity = {
    id: 9,
    label: 'neo-noir',
    affinity_score: 1.8,
    confidence: 0.58,
    weighted_score: 1.04,
    sample_size: 7,
    is_low_confidence: false,
};

describe('KeywordAffinityList', () => {
    it('selects a keyword when its badge is clicked', () => {
        const onSelect = vi.fn();
        render(
            <KeywordAffinityList
                heading="You're drawn to"
                keywords={[neoNoir]}
                direction="above"
                onSelect={onSelect}
            />,
        );

        fireEvent.click(screen.getByRole('button', { name: /neo-noir/ }));

        expect(onSelect).toHaveBeenCalledWith(neoNoir);
    });
});
