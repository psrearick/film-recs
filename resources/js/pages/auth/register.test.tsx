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

import Register from './register';

describe('Register page', () => {
    beforeEach(() => {
        formErrors.current = {};
    });

    it('renders name, email, password, and confirmation inputs bound to the register form', () => {
        render(<Register />);

        expect(screen.getByPlaceholderText('Name')).toHaveAttribute(
            'name',
            'name',
        );
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
        expect(screen.getByPlaceholderText('Confirm Password')).toHaveAttribute(
            'name',
            'password_confirmation',
        );
    });

    it('submits to the registration endpoint', () => {
        const { container } = render(<Register />);
        const form = container.querySelector('form');

        expect(form).toHaveAttribute('action', '/register');
        expect(form).toHaveAttribute('method', 'post');
    });

    it('shows validation errors returned for each field', () => {
        formErrors.current = {
            name: 'The name field is required.',
            email: 'The email has already been taken.',
            password: 'The password field confirmation does not match.',
        };

        render(<Register />);

        expect(
            screen.getByText('The name field is required.'),
        ).toBeInTheDocument();
        expect(
            screen.getByText('The email has already been taken.'),
        ).toBeInTheDocument();
        expect(
            screen.getByText('The password field confirmation does not match.'),
        ).toBeInTheDocument();
    });

    it('does not show error messages when there are no errors', () => {
        render(<Register />);

        expect(
            screen.queryByText(/required|already been taken|does not match/i),
        ).not.toBeInTheDocument();
    });

    it('links to the login page', () => {
        render(<Register />);

        expect(screen.getByRole('link', { name: 'Login' })).toHaveAttribute(
            'href',
            '/login',
        );
    });
});
