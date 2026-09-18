import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vite-plus/test';
import type { ReactNode } from 'react';
import type { PersonCredit, PersonProfile } from '@/components/title/types';

const { setLayoutProps } = vi.hoisted(() => ({
    setLayoutProps: vi.fn(),
}));

vi.mock('@inertiajs/react', () => ({
    setLayoutProps,
    Link: ({ href, children }: { href: string; children: ReactNode }) => (
        <a href={href}>{children}</a>
    ),
}));

vi.mock('@/routes', () => ({
    movie: (id: number) => `/movies/${id}`,
    series: (id: number) => `/series/${id}`,
}));

vi.mock('@/components/title/title-poster', () => ({
    default: ({ name }: { name: string }) => (
        <div data-testid="title-poster">{name}</div>
    ),
}));

import Person from './person';

const person: PersonProfile = {
    id: 1,
    tmdb_id: 6384,
    name: 'Keanu Reeves',
    biography: 'Canadian actor.',
    profile_path: '/keanu.jpg',
    vote_averages: [{ job: 'Average', vote_average: 8.2, count: 1 }],
};

const castCredit: PersonCredit = {
    tmdb_id: 603,
    media_type: 'movie',
    title: 'The Matrix',
    poster_path: '/matrix.jpg',
    release_year: 1999,
    character: 'Neo',
    job: null,
    vote_average: 8.2,
};

const crewCredit: PersonCredit = {
    tmdb_id: 4607,
    media_type: 'tv',
    title: 'Lost',
    poster_path: '/lost.jpg',
    release_year: 2004,
    character: null,
    job: 'Director',
    vote_average: 8.0,
};

describe('Person page', () => {
    it('sets the page title to the person name', () => {
        render(<Person person={person} credits={[]} />);

        expect(setLayoutProps).toHaveBeenCalledWith({ title: 'Keanu Reeves' });
    });

    it('shows the average rating when present', () => {
        render(<Person person={person} credits={[]} />);

        expect(screen.getAllByText('8.2').length).toEqual(2);
    });

    it('shows a dash when there is no average rating', () => {
        render(
            <Person person={{ ...person, vote_averages: [] }} credits={[]} />,
        );

        expect(screen.getAllByText('—').length).toEqual(2);
    });

    it('lists credits with a character under acting credits', () => {
        render(<Person person={person} credits={[castCredit, crewCredit]} />);

        expect(screen.getByText('Acting Credits')).toBeInTheDocument();
        expect(screen.getByText('Neo')).toBeInTheDocument();
    });

    it('lists credits with a job under crew credits', () => {
        render(<Person person={person} credits={[castCredit, crewCredit]} />);

        expect(screen.getByText('Crew Credits')).toBeInTheDocument();
        expect(screen.getByText('Director')).toBeInTheDocument();
    });

    it('hides the acting credits section when there are none', () => {
        render(<Person person={person} credits={[crewCredit]} />);

        expect(screen.queryByText('Acting Credits')).not.toBeInTheDocument();
    });

    it('hides the crew credits section when there are none', () => {
        render(<Person person={person} credits={[castCredit]} />);

        expect(screen.queryByText('Crew Credits')).not.toBeInTheDocument();
    });

    it('links a movie credit to the movie page', () => {
        render(<Person person={person} credits={[castCredit]} />);

        expect(screen.getByRole('link')).toHaveAttribute('href', '/movies/603');
    });

    it('links a tv credit to the series page', () => {
        render(<Person person={person} credits={[crewCredit]} />);

        expect(screen.getByRole('link')).toHaveAttribute(
            'href',
            '/series/4607',
        );
    });
});
