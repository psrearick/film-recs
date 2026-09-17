import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vite-plus/test';

const { setLayoutProps } = vi.hoisted(() => ({
    setLayoutProps: vi.fn(),
}));

vi.mock('@inertiajs/react', () => ({
    setLayoutProps,
    usePage: () => ({
        props: {
            auth: {
                user: true,
            },
        },
        url: '/',
        version: null,
    }),
}));

import Welcome from './welcome';

describe('Welcome page', () => {
    it('renders a welcome message', () => {
        render(<Welcome />);

        expect(
            screen.getByText("Let's discover your next watch."),
        ).toBeInTheDocument();
    });

    it('sets the page title via layout props', () => {
        render(<Welcome />);

        expect(setLayoutProps).toHaveBeenCalledWith({ title: 'Welcome' });
    });
});
