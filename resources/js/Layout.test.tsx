import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vite-plus/test';

vi.mock('@inertiajs/react', () => ({
    Head: ({ title }: { title: string }) => (
        <div data-testid="head" data-title={title} />
    ),
}));

vi.mock('@/components/navbar', () => ({
    default: ({ hideLink }: { hideLink?: 'login' | 'register' }) => (
        <div data-testid="navbar" data-hide-link={hideLink ?? ''} />
    ),
}));

import Layout from './Layout';

describe('Layout', () => {
    it('renders the given title in the document head', () => {
        render(
            <Layout title="Movie Title">
                <p>Content</p>
            </Layout>,
        );

        expect(screen.getByTestId('head')).toHaveAttribute(
            'data-title',
            'Movie Title',
        );
    });

    it('defaults the title to FilmRecs', () => {
        render(
            <Layout>
                <p>Content</p>
            </Layout>,
        );

        expect(screen.getByTestId('head')).toHaveAttribute(
            'data-title',
            'FilmRecs',
        );
    });

    it('passes hideNavbarLink through to the navbar', () => {
        render(
            <Layout hideNavbarLink="login">
                <p>Content</p>
            </Layout>,
        );

        expect(screen.getByTestId('navbar')).toHaveAttribute(
            'data-hide-link',
            'login',
        );
    });

    it('renders its children', () => {
        render(
            <Layout>
                <p>Page content</p>
            </Layout>,
        );

        expect(screen.getByText('Page content')).toBeInTheDocument();
    });

    it('renders the current year in the footer', () => {
        render(
            <Layout>
                <p>Content</p>
            </Layout>,
        );

        const year = new Date().getFullYear().toString();
        expect(screen.getByText(new RegExp(year))).toBeInTheDocument();
    });
});
