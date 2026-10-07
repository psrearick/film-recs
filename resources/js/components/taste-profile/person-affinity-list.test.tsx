import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vite-plus/test';
import PersonAffinityList from '@/components/taste-profile/person-affinity-list';
import type { PersonAffinity } from '@/components/taste-profile/types';

const nolan: PersonAffinity = {
    id: 4,
    label: 'Christopher Nolan',
    affinity_score: 2.3,
    confidence: 0.5,
    weighted_score: 1.15,
    sample_size: 5,
    is_low_confidence: false,
    tmdb_id: 525,
    profile_path: null,
};

describe('PersonAffinityList', () => {
    it('selects a person when their row is clicked', () => {
        const onSelect = vi.fn();
        render(
            <PersonAffinityList
                heading="You rate highly"
                people={[nolan]}
                onSelect={onSelect}
            />,
        );

        fireEvent.click(
            screen.getByRole('button', { name: /Christopher Nolan/ }),
        );

        expect(onSelect).toHaveBeenCalledWith(nolan);
    });

    it('renders nothing without people', () => {
        const { container } = render(
            <PersonAffinityList
                heading="You rate highly"
                people={[]}
                onSelect={vi.fn()}
            />,
        );

        expect(container).toBeEmptyDOMElement();
    });
});
