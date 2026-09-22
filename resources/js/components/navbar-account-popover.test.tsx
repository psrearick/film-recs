import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vite-plus/test';

vi.mock('@inertiajs/react', () => ({
    Link: ({
        href,
        method,
        as,
        onClick,
        children,
        ...rest
    }: {
        href: string | { url: string; method?: string };
        method?: string;
        as?: string;
        onClick?: () => void;
        children: ReactNode;
    }) => {
        const Tag = as === 'button' ? 'button' : 'a';
        const url = typeof href === 'string' ? href : href.url;

        return (
            <Tag href={url} data-method={method} onClick={onClick} {...rest}>
                {children}
            </Tag>
        );
    },
}));

vi.mock('@/routes', () => ({
    logout: () => '/logout',
    ratings: () => '/ratings',
}));

import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuList,
} from '@/components/ui/navigation-menu';
import NavbarAccountPopover from './navbar-account-popover';

function renderPopover() {
    return render(
        <NavigationMenu>
            <NavigationMenuList>
                <NavigationMenuItem>
                    <NavbarAccountPopover />
                </NavigationMenuItem>
            </NavigationMenuList>
        </NavigationMenu>,
    );
}

describe('NavbarAccountPopover', () => {
    it('hides the menu until the trigger is clicked', () => {
        renderPopover();

        expect(screen.queryByText('Your Ratings')).not.toBeInTheDocument();
        expect(screen.queryByText('Logout')).not.toBeInTheDocument();
    });

    it('shows links to the ratings page and logout when opened', () => {
        renderPopover();

        fireEvent.click(screen.getByRole('button', { name: 'Account menu' }));

        expect(
            screen.getByRole('button', { name: 'Your Ratings' }),
        ).toHaveAttribute('href', '/ratings');

        const logout = screen.getByRole('button', { name: 'Logout' });
        expect(logout).toHaveAttribute('href', '/logout');
        expect(logout).toHaveAttribute('data-method', 'post');
    });

    it('closes the menu after selecting Your Ratings', () => {
        renderPopover();

        fireEvent.click(screen.getByRole('button', { name: 'Account menu' }));
        fireEvent.click(screen.getByRole('button', { name: 'Your Ratings' }));

        expect(
            screen.queryByRole('button', { name: 'Your Ratings' }),
        ).not.toBeInTheDocument();
    });

    it('closes the menu after selecting Logout', () => {
        renderPopover();

        fireEvent.click(screen.getByRole('button', { name: 'Account menu' }));
        fireEvent.click(screen.getByRole('button', { name: 'Logout' }));

        expect(
            screen.queryByRole('button', { name: 'Logout' }),
        ).not.toBeInTheDocument();
    });
});
