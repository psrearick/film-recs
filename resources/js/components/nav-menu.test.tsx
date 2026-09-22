import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vite-plus/test';

const { pageProps } = vi.hoisted(() => ({
    pageProps: {
        current: { auth: { user: null } } as {
            auth: { user: { id: number; name: string } | null };
        },
    },
}));

vi.mock('@inertiajs/react', () => ({
    Link: ({
        href,
        method,
        as,
        children,
        ...rest
    }: {
        href: string | { url: string; method?: string };
        method?: string;
        as?: string;
        children: ReactNode;
    }) => {
        const Tag = as === 'button' ? 'button' : 'a';
        const url = typeof href === 'string' ? href : href.url;

        return (
            <Tag href={url} data-method={method} {...rest}>
                {children}
            </Tag>
        );
    },
    usePage: () => ({ props: pageProps.current }),
}));

import NavMenu from './nav-menu';

describe('NavMenu', () => {
    it('shows sign in and register links for a guest', () => {
        pageProps.current = { auth: { user: null } };

        render(<NavMenu />);

        expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute(
            'href',
            '/login',
        );
        expect(screen.getByRole('link', { name: 'Register' })).toHaveAttribute(
            'href',
            '/register',
        );
        expect(
            screen.queryByRole('button', { name: 'Logout' }),
        ).not.toBeInTheDocument();
    });

    it('shows a logout action for an authenticated user', () => {
        pageProps.current = {
            auth: { user: { id: 1, name: 'Test User' } },
        };

        render(<NavMenu />);

        fireEvent.click(screen.getByRole('button', { name: 'Account menu' }));

        const logout = screen.getByRole('button', { name: 'Logout' });
        expect(logout).toHaveAttribute('href', '/logout');
        expect(logout).toHaveAttribute('data-method', 'post');
        expect(
            screen.queryByRole('link', { name: 'Sign in' }),
        ).not.toBeInTheDocument();
        expect(
            screen.queryByRole('link', { name: 'Register' }),
        ).not.toBeInTheDocument();
    });

    it('hides the sign in link when hideLink is "login"', () => {
        pageProps.current = { auth: { user: null } };

        render(<NavMenu hideLink="login" />);

        expect(
            screen.queryByRole('link', { name: 'Sign in' }),
        ).not.toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Register' })).toHaveAttribute(
            'href',
            '/register',
        );
    });

    it('hides the register link when hideLink is "register"', () => {
        pageProps.current = { auth: { user: null } };

        render(<NavMenu hideLink="register" />);

        expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute(
            'href',
            '/login',
        );
        expect(
            screen.queryByRole('link', { name: 'Register' }),
        ).not.toBeInTheDocument();
    });
});
