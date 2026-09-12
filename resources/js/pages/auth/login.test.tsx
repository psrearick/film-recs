import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

const { formErrors } = vi.hoisted(() => ({
    formErrors: { current: {} as Record<string, string> },
}));

vi.mock('@/components/navbar', () => ({
    default: () => <nav>Navbar</nav>,
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

        expect(screen.getByLabelText('Email')).toHaveAttribute('name', 'email');
        expect(screen.getByLabelText('Email')).toHaveAttribute('type', 'email');
        expect(screen.getByLabelText('Password')).toHaveAttribute(
            'name',
            'password',
        );
        expect(screen.getByLabelText('Password')).toHaveAttribute(
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

    it('includes the remember-me value on submit only when checked', () => {
        const { container } = render(<Login />);
        const form = container.querySelector('form') as HTMLFormElement;
        const checkbox = screen.getByRole('checkbox', {
            name: 'Remember me',
        });

        let submitted: FormData | undefined;
        form.addEventListener('submit', (event) => {
            event.preventDefault();
            submitted = new FormData(form);
        });

        fireEvent.submit(form);
        expect(submitted?.has('remember')).toBe(false);

        fireEvent.click(checkbox);
        fireEvent.submit(form);
        expect(submitted?.get('remember')).toBe('on');
    });
});
