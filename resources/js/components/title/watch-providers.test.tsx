import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vite-plus/test';

import WatchProviders from './watch-providers';

describe('WatchProviders', () => {
    it('renders nothing when there are no providers', () => {
        const { container } = render(<WatchProviders providers={[]} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('groups providers by access type under a labeled heading', () => {
        render(
            <WatchProviders
                providers={[
                    {
                        id: 1,
                        name: 'Netflix',
                        logo_path: '/netflix.jpg',
                        pivot: { access_type: 'subscription' },
                    },
                    {
                        id: 2,
                        name: 'Apple TV',
                        logo_path: '/appletv.jpg',
                        pivot: { access_type: 'rent' },
                    },
                ]}
            />,
        );

        expect(screen.getByText('Stream')).toBeInTheDocument();
        expect(screen.getByText('Rent')).toBeInTheDocument();
        expect(screen.getByAltText('Netflix')).toHaveAttribute(
            'src',
            'https://image.tmdb.org/t/p/w92/netflix.jpg',
        );
        expect(screen.getByAltText('Apple TV')).toHaveAttribute(
            'src',
            'https://image.tmdb.org/t/p/w92/appletv.jpg',
        );
    });

    it('groups multiple providers of the same access type together', () => {
        render(
            <WatchProviders
                providers={[
                    {
                        id: 1,
                        name: 'Netflix',
                        logo_path: '/netflix.jpg',
                        pivot: { access_type: 'subscription' },
                    },
                    {
                        id: 2,
                        name: 'Hulu',
                        logo_path: '/hulu.jpg',
                        pivot: { access_type: 'subscription' },
                    },
                ]}
            />,
        );

        expect(screen.getAllByText('Stream')).toHaveLength(1);
        expect(screen.getByAltText('Netflix')).toBeInTheDocument();
        expect(screen.getByAltText('Hulu')).toBeInTheDocument();
    });
});
