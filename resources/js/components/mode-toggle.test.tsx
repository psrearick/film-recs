import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vite-plus/test';

const { themeState, setTheme } = vi.hoisted(() => ({
    themeState: { current: 'light' as 'light' | 'dark' | 'system' },
    setTheme: vi.fn(),
}));

vi.mock('@/components/theme-provider', () => ({
    useTheme: () => ({ theme: themeState.current, setTheme }),
}));

import { ModeToggle } from './mode-toggle';

describe('ModeToggle', () => {
    it('shows the current theme in the accessible label', () => {
        themeState.current = 'light';

        render(<ModeToggle />);

        expect(
            screen.getByRole('button', {
                name: 'Switch theme (currently light)',
            }),
        ).toBeInTheDocument();
    });

    it('cycles from light to dark when clicked', () => {
        themeState.current = 'light';
        render(<ModeToggle />);

        fireEvent.click(screen.getByRole('button'));

        expect(setTheme).toHaveBeenCalledWith('dark');
    });

    it('cycles from dark to system when clicked', () => {
        themeState.current = 'dark';
        render(<ModeToggle />);

        fireEvent.click(screen.getByRole('button'));

        expect(setTheme).toHaveBeenCalledWith('system');
    });

    it('cycles from system to light when clicked', () => {
        themeState.current = 'system';
        render(<ModeToggle />);

        fireEvent.click(screen.getByRole('button'));

        expect(setTheme).toHaveBeenCalledWith('light');
    });
});
