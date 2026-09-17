import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vite-plus/test';

import { useMediaQuery } from './use-media-query';

function matchMediaMock(initialMatches: boolean) {
    let matches = initialMatches;
    const listeners: (() => void)[] = [];

    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        get matches() {
            return matches;
        },
        media: query,
        addEventListener: (_event: string, listener: () => void) => {
            listeners.push(listener);
        },
        removeEventListener: vi.fn(),
    }));

    return {
        setMatches: (value: boolean) => {
            matches = value;
            listeners.forEach((listener) => listener());
        },
    };
}

describe('useMediaQuery', () => {
    it('returns the initial match state', () => {
        matchMediaMock(true);

        const { result } = renderHook(() =>
            useMediaQuery('(min-width: 768px)'),
        );

        expect(result.current).toBe(true);
    });

    it('updates when the media query match changes', () => {
        const mock = matchMediaMock(false);

        const { result } = renderHook(() =>
            useMediaQuery('(min-width: 768px)'),
        );

        expect(result.current).toBe(false);

        act(() => {
            mock.setMatches(true);
        });

        expect(result.current).toBe(true);
    });
});
