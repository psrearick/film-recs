import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

const { formErrors } = vi.hoisted(() => ({
    formErrors: { current: {} as Record<string, string> },
}));

vi.mock('@inertiajs/react', () => ({
    Link: ({
        href,
        children,
        ...rest
    }: {
        href: string | { url: string; method?: string };
        children: ReactNode;
    }) => (
        <a href={typeof href === 'string' ? href : href.url} {...rest}>
            {children}
        </a>
    ),
    Form: ({
        action,
        method,
        className,
        children,
    }: {
        action: string;
        method: string;
        className?: string;
        children: (bag: { errors: Record<string, string> }) => ReactNode;
    }) => (
        <form action={action} method={method} className={className}>
            {children({ errors: formErrors.current })}
        </form>
    ),
}));

import Login from './login';

describe('Login page', () => {
    beforeEach(() => {
        formErrors.current = {};
    });

    it('renders email and password inputs bound to the login form', () => {
        render(<Login />);

        expect(screen.getByPlaceholderText('Email')).toHaveAttribute(
            'name',
            'email',
        );
        expect(screen.getByPlaceholderText('Email')).toHaveAttribute(
            'type',
            'email',
        );
        expect(screen.getByPlaceholderText('Password')).toHaveAttribute(
            'name',
            'password',
        );
        expect(screen.getByPlaceholderText('Password')).toHaveAttribute(
            'type',
            'password',
        );
    });

    it('submits to the login endpoint', () => {
        const { container } = render(<Login />);
        const form = container.querySelector('form');

        expect(form).toHaveAttribute('action', '/login');
        expect(form).toHaveAttribute('method', 'post');
    });

    it('shows a validation error returned for a field', () => {
        formErrors.current = {
            email: 'These credentials do not match our records.',
        };

        render(<Login />);

        expect(
            screen.getByText('These credentials do not match our records.'),
        ).toBeInTheDocument();
    });

    it('does not show an error message when there are no errors', () => {
        render(<Login />);

        expect(
            screen.queryByText(/do not match our records/i),
        ).not.toBeInTheDocument();
    });

    it('links to the registration page', () => {
        render(<Login />);

        expect(screen.getByRole('link', { name: 'Register' })).toHaveAttribute(
            'href',
            '/register',
        );
    });
});
