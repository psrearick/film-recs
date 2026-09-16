import { act, render, screen } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vite-plus/test';

import { ThemeProvider, useTheme } from './theme-provider';

function Consumer() {
    const { theme, setTheme } = useTheme();

    return (
        <div>
            <p>Current theme: {theme}</p>
            <button onClick={() => setTheme('dark')}>Set dark</button>
        </div>
    );
}

function matchMediaMock(matches: boolean) {
    return vi.fn().mockImplementation((query: string) => ({
        matches,
        media: query,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    }));
}

describe('ThemeProvider', () => {
    beforeEach(() => {
        document.documentElement.classList.remove('light', 'dark');
        window.matchMedia = matchMediaMock(false);
    });

    afterEach(() => {
        document.documentElement.classList.remove('light', 'dark');
    });

    it('defaults to the system theme when storage is empty', () => {
        render(
            <ThemeProvider storageKey="test-theme">
                <Consumer />
            </ThemeProvider>,
        );

        expect(screen.getByText('Current theme: system')).toBeInTheDocument();
    });

    it('reads the initial theme from local storage', () => {
        localStorage.setItem('test-theme', 'dark');

        render(
            <ThemeProvider storageKey="test-theme">
                <Consumer />
            </ThemeProvider>,
        );

        expect(screen.getByText('Current theme: dark')).toBeInTheDocument();
    });

    it('applies the dark class when the system prefers dark and theme is system', () => {
        window.matchMedia = matchMediaMock(true);

        render(
            <ThemeProvider storageKey="test-theme">
                <Consumer />
            </ThemeProvider>,
        );

        expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('applies the light class when the system prefers light and theme is system', () => {
        render(
            <ThemeProvider storageKey="test-theme">
                <Consumer />
            </ThemeProvider>,
        );

        expect(document.documentElement.classList.contains('light')).toBe(true);
    });

    it('persists a new theme to local storage and updates the document class', () => {
        render(
            <ThemeProvider storageKey="test-theme">
                <Consumer />
            </ThemeProvider>,
        );

        act(() => {
            fireEvent.click(screen.getByRole('button', { name: 'Set dark' }));
        });

        expect(screen.getByText('Current theme: dark')).toBeInTheDocument();
        expect(localStorage.getItem('test-theme')).toBe('dark');
        expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('throws when useTheme is used outside of a provider', () => {
        const consoleError = vi
            .spyOn(console, 'error')
            .mockImplementation(() => {});

        expect(() => render(<Consumer />)).toThrow(
            'useTheme must be used within a ThemeProvider',
        );

        consoleError.mockRestore();
    });
});
