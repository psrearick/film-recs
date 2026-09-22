import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vite-plus/test';

vi.mock('@inertiajs/react', () => ({
    Form: ({
        action,
        onSuccess,
        children,
    }: {
        action: string;
        onSuccess?: () => void;
        children: (bag: { processing: boolean }) => ReactNode;
    }) => (
        <form
            action={action}
            onSubmit={(event) => {
                event.preventDefault();
                onSuccess?.();
            }}
        >
            {children({ processing: false })}
        </form>
    ),
}));

vi.mock('@/routes', () => ({
    rating: {
        form: (titleId: number) => ({
            action: `/titles/${titleId}/rating`,
            method: 'post',
        }),
    },
}));

import RatingsTableRatingCell from './table-rating-cell';

function filledStars(form: HTMLFormElement) {
    return Array.from(form.querySelectorAll('svg')).filter((star) =>
        star.getAttribute('class')?.includes('fill-amber-400'),
    );
}

describe('RatingsTableRatingCell', () => {
    it('shows the current score on the trigger', () => {
        render(<RatingsTableRatingCell titleId={1} score={6} />);

        expect(screen.getByRole('button', { name: '6' })).toBeInTheDocument();
    });

    it('opens a popover with the current rating preselected', () => {
        render(<RatingsTableRatingCell titleId={1} score={6} />);

        fireEvent.click(screen.getByRole('button', { name: '6' }));

        const form = screen
            .getByRole('button', { name: 'Save' })
            .closest('form')!;

        expect(filledStars(form)).toHaveLength(6);
    });

    it('disables save until the rating changes', () => {
        render(<RatingsTableRatingCell titleId={1} score={6} />);

        fireEvent.click(screen.getByRole('button', { name: '6' }));

        expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    });

    it("submits the selected score to the title's rating endpoint and closes on success", () => {
        render(<RatingsTableRatingCell titleId={42} score={6} />);

        fireEvent.click(screen.getByRole('button', { name: '6' }));

        const form = screen
            .getByRole('button', { name: 'Save' })
            .closest('form')!;
        fireEvent.click(form.querySelectorAll('svg')[8]);

        expect(form).toHaveAttribute('action', '/titles/42/rating');
        expect(screen.getByRole('button', { name: 'Save' })).not.toBeDisabled();

        fireEvent.submit(form);

        expect(
            screen.queryByRole('button', { name: 'Save' }),
        ).not.toBeInTheDocument();
    });

    it('resets the selection when the popover is closed without saving', () => {
        render(<RatingsTableRatingCell titleId={1} score={6} />);

        const trigger = screen.getByRole('button', { name: '6' });
        fireEvent.click(trigger);

        const openForm = screen
            .getByRole('button', { name: 'Save' })
            .closest('form')!;
        fireEvent.click(openForm.querySelectorAll('svg')[8]);
        expect(screen.getByRole('button', { name: 'Save' })).not.toBeDisabled();

        fireEvent.click(trigger);
        fireEvent.click(trigger);

        const reopenedForm = screen
            .getByRole('button', { name: 'Save' })
            .closest('form')!;
        expect(filledStars(reopenedForm)).toHaveLength(6);
    });
});
