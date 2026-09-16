import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vite-plus/test';

vi.mock('@inertiajs/react', () => ({
    Link: ({ href, children }: { href: string; children: ReactNode }) => (
        <a href={href}>{children}</a>
    ),
}));

vi.mock('@/routes', () => ({
    person: (id: number) => `/people/${id}`,
}));

import PersonList from './person-list';

describe('PersonList', () => {
    it('renders nothing when there are no people', () => {
        const { container } = render(<PersonList title="Cast" people={[]} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('renders a card for each person with a link to their page', () => {
        render(
            <PersonList
                title="Cast"
                people={[
                    {
                        id: 1,
                        tmdb_id: 6384,
                        name: 'Keanu Reeves',
                        profile_path: null,
                        role: 'Neo',
                    },
                ]}
            />,
        );

        expect(screen.getByText('Cast')).toBeInTheDocument();
        expect(screen.getByText('Keanu Reeves')).toBeInTheDocument();
        expect(screen.getByText('Neo')).toBeInTheDocument();
        expect(screen.getByRole('link')).toHaveAttribute(
            'href',
            '/people/6384',
        );
    });

    it('does not render a role when none is given', () => {
        render(
            <PersonList
                title="Crew"
                people={[
                    {
                        id: 1,
                        tmdb_id: 10,
                        name: 'Lana Wachowski',
                        profile_path: null,
                    },
                ]}
            />,
        );

        expect(screen.getByText('Lana Wachowski')).toBeInTheDocument();
        expect(screen.queryByText('undefined')).not.toBeInTheDocument();
    });
});
