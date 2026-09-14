import { act, fireEvent, render, screen } from '@testing-library/react';
import { useState, type ReactNode } from 'react';
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vite-plus/test';

const { routerVisit, getMock, processingState } = vi.hoisted(() => ({
    routerVisit: vi.fn(),
    getMock: vi.fn(),
    processingState: { current: false },
}));

vi.mock('@inertiajs/react', () => ({
    router: { visit: routerVisit },
    useHttp: (initial: { search: string }) => {
        const [data, setDataState] = useState(initial);

        return {
            data,
            setData: (key: keyof typeof initial, value: string) =>
                setDataState((prev) => ({ ...prev, [key]: value })),
            get: getMock,
            processing: processingState.current,
        };
    },
}));

vi.mock('@/components/ui/popover', () => ({
    Popover: ({ children }: { children: ReactNode }) => <>{children}</>,
    PopoverTrigger: ({ children }: { children: ReactNode }) => <>{children}</>,
    PopoverContent: ({ children }: { children: ReactNode }) => (
        <div>{children}</div>
    ),
}));

vi.mock('@/components/ui/command', () => ({
    Command: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    CommandList: ({ children }: { children: ReactNode }) => (
        <div>{children}</div>
    ),
    CommandEmpty: ({ children }: { children: ReactNode }) => (
        <div>{children}</div>
    ),
    CommandGroup: ({ children }: { children: ReactNode }) => (
        <div>{children}</div>
    ),
    CommandItem: ({
        children,
        onSelect,
    }: {
        children: ReactNode;
        onSelect?: () => void;
    }) => (
        <div role="option" onClick={onSelect}>
            {children}
        </div>
    ),
}));

import SearchBar from './search-bar';

const matrixResult = {
    id: 603,
    type: 'movie' as const,
    label: 'The Matrix',
    posterPath: '/matrix.jpg',
    url: '/movies/603',
};

describe('SearchBar', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        getMock.mockReset();
        routerVisit.mockReset();
        processingState.current = false;

        getMock.mockImplementation(
            (
                _url: string,
                options: {
                    onSuccess?: (response: {
                        results: (typeof matrixResult)[];
                    }) => void;
                },
            ) => {
                options.onSuccess?.({ results: [matrixResult] });
                return Promise.resolve({ results: [matrixResult] });
            },
        );
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('debounces the search request while the user types', () => {
        render(<SearchBar />);

        fireEvent.change(screen.getByPlaceholderText(/search for a movie/i), {
            target: { value: 'matrix' },
        });

        expect(getMock).not.toHaveBeenCalled();

        act(() => {
            vi.advanceTimersByTime(300);
        });

        expect(getMock).toHaveBeenCalledTimes(1);
        expect(getMock).toHaveBeenCalledWith(
            '/search',
            expect.objectContaining({
                onSuccess: expect.any(Function),
                onError: expect.any(Function),
            }),
        );
    });

    it('lists the results returned from the search', () => {
        render(<SearchBar />);

        fireEvent.change(screen.getByPlaceholderText(/search for a movie/i), {
            target: { value: 'matrix' },
        });

        act(() => {
            vi.advanceTimersByTime(300);
        });

        expect(screen.getByText('The Matrix')).toBeInTheDocument();
    });

    it('navigates to the selected result and closes the list', () => {
        render(<SearchBar />);

        fireEvent.change(screen.getByPlaceholderText(/search for a movie/i), {
            target: { value: 'matrix' },
        });

        act(() => {
            vi.advanceTimersByTime(300);
        });

        fireEvent.click(screen.getByRole('option', { name: 'The Matrix' }));

        expect(routerVisit).toHaveBeenCalledWith('/movies/603');
    });

    it('cancels a pending search and clears results when the input is emptied', () => {
        render(<SearchBar />);

        const input = screen.getByPlaceholderText(/search for a movie/i);

        fireEvent.change(input, { target: { value: 'matrix' } });
        fireEvent.change(input, { target: { value: '' } });

        act(() => {
            vi.advanceTimersByTime(300);
        });

        expect(getMock).not.toHaveBeenCalled();
        expect(screen.queryByText('The Matrix')).not.toBeInTheDocument();
    });

    it('shows a loading indicator while a request is processing', () => {
        processingState.current = true;

        const { container } = render(<SearchBar />);

        expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    });
});
