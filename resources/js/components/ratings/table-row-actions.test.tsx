import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

const { routerDelete } = vi.hoisted(() => ({
    routerDelete: vi.fn(),
}));

vi.mock('@inertiajs/react', () => ({
    router: { delete: routerDelete },
}));

vi.mock('@/routes/rating', () => ({
    destroy: {
        url: (titleId: number) => `/titles/${titleId}/rating`,
    },
}));

import RatingsTableRowActions from './table-row-actions';

describe('RatingsTableRowActions', () => {
    beforeEach(() => {
        routerDelete.mockReset();
    });

    it('deletes the rating for the title when clicked', () => {
        render(<RatingsTableRowActions titleId={42} />);

        fireEvent.click(screen.getByRole('button', { name: 'Clear rating' }));

        expect(routerDelete).toHaveBeenCalledWith(
            '/titles/42/rating',
            expect.objectContaining({ preserveScroll: true }),
        );
    });

    it('disables the button while the request is in flight', () => {
        routerDelete.mockImplementation(() => {});

        render(<RatingsTableRowActions titleId={42} />);

        fireEvent.click(screen.getByRole('button', { name: 'Clear rating' }));

        expect(
            screen.getByRole('button', { name: 'Clear rating' }),
        ).toBeDisabled();
    });

    it('re-enables the button once the request finishes', () => {
        routerDelete.mockImplementation(
            (_url: string, options: { onFinish: () => void }) => {
                options.onFinish();
            },
        );

        render(<RatingsTableRowActions titleId={42} />);

        fireEvent.click(screen.getByRole('button', { name: 'Clear rating' }));

        expect(
            screen.getByRole('button', { name: 'Clear rating' }),
        ).not.toBeDisabled();
    });
});
