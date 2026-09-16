import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vite-plus/test';

vi.mock('@inertiajs/react', () => ({
    Link: ({ href, children }: { href: string; children: ReactNode }) => (
        <a href={href}>{children}</a>
    ),
}));

vi.mock('@/components/logo', () => ({
    default: () => <span>Logo</span>,
}));

vi.mock('@/components/mode-toggle', () => ({
    ModeToggle: () => <button>Mode Toggle</button>,
}));

vi.mock('@/components/nav-menu', () => ({
    default: ({ hideLink }: { hideLink?: 'login' | 'register' }) => (
        <div data-testid="nav-menu" data-hide-link={hideLink ?? ''} />
    ),
}));

vi.mock('@/components/search-bar', () => ({
    default: () => <div data-testid="search-bar" />,
}));

import Navbar from './navbar';

describe('Navbar', () => {
    it('links the logo to the home page', () => {
        render(<Navbar />);

        expect(screen.getByRole('link')).toHaveAttribute('href', '/');
        expect(screen.getByText('Logo')).toBeInTheDocument();
    });

    it('renders the search bar, nav menu, and mode toggle', () => {
        render(<Navbar />);

        expect(screen.getAllByTestId('search-bar')).toHaveLength(2);
        expect(screen.getByTestId('nav-menu')).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: 'Mode Toggle' }),
        ).toBeInTheDocument();
    });

    it('passes the hideLink prop through to the nav menu', () => {
        render(<Navbar hideLink="register" />);

        expect(screen.getByTestId('nav-menu')).toHaveAttribute(
            'data-hide-link',
            'register',
        );
    });
});
