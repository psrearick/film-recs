import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vite-plus/test';
import ScoreDistributionChart from '@/components/taste-profile/score-distribution-chart';

describe('ScoreDistributionChart', () => {
    it('selects a score from the table, but only scores with titles', () => {
        const onSelect = vi.fn();
        render(
            <ScoreDistributionChart
                distribution={[
                    { score: 7, count: 0 },
                    { score: 8, count: 46 },
                ]}
                onSelect={onSelect}
            />,
        );

        fireEvent.click(screen.getByRole('button', { name: '8' }));

        expect(onSelect).toHaveBeenCalledWith({ score: 8, count: 46 });
        expect(
            screen.queryByRole('button', { name: '7' }),
        ).not.toBeInTheDocument();
    });
});
