import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

const { setLayoutProps, optimistic, post, destroyRequest } = vi.hoisted(() => {
    const post = vi.fn();
    const destroyRequest = vi.fn();

    return {
        setLayoutProps: vi.fn(),
        post,
        destroyRequest,
        optimistic: vi.fn(() => ({ post, delete: destroyRequest })),
    };
});

vi.mock('@inertiajs/react', () => ({
    setLayoutProps,
    router: { optimistic },
}));

vi.mock('@/routes/watch-providers', () => ({
    store: { url: (id: number) => `/watch-providers/${id}` },
    destroy: { url: (id: number) => `/watch-providers/${id}` },
}));

import WatchProviders from './watch-providers';

const providers = [
    { id: 1, name: 'Netflix', logo_path: '/netflix.jpg' },
    { id: 2, name: 'Hulu', logo_path: null },
    { id: 3, name: 'Disney Plus', logo_path: '/disney.jpg' },
];

type OptimisticCallback = (props: { userProviderIds: number[] }) => {
    userProviderIds: number[];
};

function lastOptimisticCallback(): OptimisticCallback {
    return (optimistic.mock.calls.at(-1) as unknown as [OptimisticCallback])[0];
}

describe('WatchProviders page', () => {
    beforeEach(() => {
        setLayoutProps.mockClear();
        optimistic.mockClear();
        post.mockClear();
        destroyRequest.mockClear();
    });

    it('sets the page title to Watch Providers', () => {
        render(<WatchProviders providers={[]} userProviderIds={[]} />);

        expect(setLayoutProps).toHaveBeenCalledWith({
            title: 'Watch Providers',
        });
    });

    it('renders the page heading', () => {
        render(<WatchProviders providers={[]} userProviderIds={[]} />);

        expect(screen.getByText('Your Watch Providers')).toBeInTheDocument();
    });

    it("lists every provider with a checkbox reflecting the user's access", () => {
        render(<WatchProviders providers={providers} userProviderIds={[2]} />);

        expect(
            screen.getByRole('checkbox', { name: 'Netflix' }),
        ).not.toBeChecked();
        expect(screen.getByRole('checkbox', { name: 'Hulu' })).toBeChecked();
        expect(
            screen.getByRole('checkbox', { name: 'Disney Plus' }),
        ).not.toBeChecked();
    });

    it('shows provider logos', () => {
        const { container } = render(
            <WatchProviders providers={providers} userProviderIds={[]} />,
        );

        const sources = Array.from(container.querySelectorAll('img')).map(
            (img) => img.getAttribute('src'),
        );

        expect(sources).toEqual([
            'https://image.tmdb.org/t/p/w92/netflix.jpg',
            'https://image.tmdb.org/t/p/w92/disney.jpg',
        ]);
    });

    it('filters providers by the search query, ignoring case', () => {
        render(<WatchProviders providers={providers} userProviderIds={[]} />);

        fireEvent.change(
            screen.getByRole('searchbox', { name: 'Search watch providers' }),
            {
                target: { value: 'NET' },
            },
        );

        expect(
            screen.getByRole('checkbox', { name: 'Netflix' }),
        ).toBeInTheDocument();
        expect(
            screen.queryByRole('checkbox', { name: 'Hulu' }),
        ).not.toBeInTheDocument();
        expect(
            screen.queryByRole('checkbox', { name: 'Disney Plus' }),
        ).not.toBeInTheDocument();
    });

    it('shows an empty state when no providers match the search', () => {
        render(<WatchProviders providers={providers} userProviderIds={[]} />);

        fireEvent.change(
            screen.getByRole('searchbox', { name: 'Search watch providers' }),
            {
                target: { value: 'nothing matches' },
            },
        );

        expect(
            screen.getByText('No watch providers found.'),
        ).toBeInTheDocument();
    });

    it('adds the provider to the user when checked', () => {
        render(<WatchProviders providers={providers} userProviderIds={[2]} />);

        fireEvent.click(screen.getByRole('checkbox', { name: 'Netflix' }));

        expect(post).toHaveBeenCalledWith(
            '/watch-providers/1',
            {},
            { preserveScroll: true },
        );
        expect(destroyRequest).not.toHaveBeenCalled();
        expect(lastOptimisticCallback()({ userProviderIds: [2] })).toEqual({
            userProviderIds: [2, 1],
        });
    });

    it('removes the provider from the user when unchecked', () => {
        render(
            <WatchProviders providers={providers} userProviderIds={[1, 2]} />,
        );

        fireEvent.click(screen.getByRole('checkbox', { name: 'Hulu' }));

        expect(destroyRequest).toHaveBeenCalledWith('/watch-providers/2', {
            preserveScroll: true,
        });
        expect(post).not.toHaveBeenCalled();
        expect(lastOptimisticCallback()({ userProviderIds: [1, 2] })).toEqual({
            userProviderIds: [1],
        });
    });
});
