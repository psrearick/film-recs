import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vite-plus/test';

const { setLayoutProps } = vi.hoisted(() => ({
    setLayoutProps: vi.fn(),
}));

vi.mock('@inertiajs/react', () => ({
    setLayoutProps,
}));

import Welcome from './welcome';

describe('Welcome page', () => {
    it('renders a welcome message', () => {
        render(<Welcome />);

        expect(screen.getByText('Welcome')).toBeInTheDocument();
    });

    it('sets the page title via layout props', () => {
        render(<Welcome />);

        expect(setLayoutProps).toHaveBeenCalledWith({ title: 'Welcome' });
    });
});
