import { render, screen } from '@testing-library/react';
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
    Head: () => null,
    Link: ({
        href,
        method,
        as,
        children,
        ...rest
    }: {
        href: string;
        method?: string;
        as?: string;
        children: ReactNode;
    }) => {
        const Tag = as === 'button' ? 'button' : 'a';

        return (
            <Tag href={href} data-method={method} {...rest}>
                {children}
            </Tag>
        );
    },
    usePage: () => ({ props: pageProps.current }),
}));

import Welcome from './welcome';

describe('Welcome page', () => {
    it('shows login and register links for a guest', () => {
        pageProps.current = { auth: { user: null } };

        render(<Welcome />);

        expect(screen.getByRole('link', { name: 'Login' })).toHaveAttribute(
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

        render(<Welcome />);

        const logout = screen.getByRole('button', { name: 'Logout' });
        expect(logout).toHaveAttribute('href', '/logout');
        expect(logout).toHaveAttribute('data-method', 'post');
        expect(
            screen.queryByRole('link', { name: 'Login' }),
        ).not.toBeInTheDocument();
        expect(
            screen.queryByRole('link', { name: 'Register' }),
        ).not.toBeInTheDocument();
    });
});
