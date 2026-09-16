import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { Clapperboard } from 'lucide-react';
import type { Person, Title, WatchProvider } from './types';

const { personListCalls, watchProvidersCalls } = vi.hoisted(() => ({
    personListCalls: [] as { title: string; people: unknown[] }[],
    watchProvidersCalls: [] as { providers: unknown[] }[],
}));

vi.mock('@/components/title/person-list', () => ({
    default: (props: { title: string; people: unknown[] }) => {
        personListCalls.push(props);
        return <div data-testid={`person-list-${props.title}`} />;
    },
}));

vi.mock('@/components/title/watch-providers', () => ({
    default: (props: { providers: unknown[] }) => {
        watchProvidersCalls.push(props);
        return <div data-testid="watch-providers" />;
    },
}));

vi.mock('@/components/title/title-poster', () => ({
    default: () => <div data-testid="title-poster" />,
}));

import TitleDetail from './title-detail';

function makePerson(overrides: Partial<Person> = {}): Person {
    return {
        id: 1,
        tmdb_id: 1,
        name: 'Person',
        profile_path: null,
        ...overrides,
    };
}

function makeTitle(overrides: Partial<Title> = {}): Title {
    return {
        id: 1,
        name: 'The Matrix',
        release_year: 1999,
        overview: 'A hacker learns the truth.',
        poster_path: '/matrix.jpg',
        runtime: 136,
        popularity: 80,
        vote_average: 8.2,
        genres: [],
        keywords: [],
        actors: [],
        directors: [],
        producers: [],
        composers: [],
        watch_providers: [],
        ...overrides,
    };
}

describe('TitleDetail', () => {
    beforeEach(() => {
        personListCalls.length = 0;
        watchProvidersCalls.length = 0;
    });

    it('renders the title name and release year', () => {
        render(
            <TitleDetail
                title={makeTitle({ name: 'The Matrix', release_year: 1999 })}
                posterIcon={Clapperboard}
            />,
        );

        expect(screen.getByText('The Matrix')).toBeInTheDocument();
        expect(screen.getByText('(1999)')).toBeInTheDocument();
    });

    it('shows the average rating when present', () => {
        render(
            <TitleDetail
                title={makeTitle({ vote_average: 8.2 })}
                posterIcon={Clapperboard}
            />,
        );

        expect(screen.getByText('8.2')).toBeInTheDocument();
    });

    it('shows a dash when there is no rating', () => {
        render(
            <TitleDetail
                title={makeTitle({ vote_average: null })}
                posterIcon={Clapperboard}
            />,
        );

        expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('shows the runtime when present', () => {
        render(
            <TitleDetail
                title={makeTitle({ runtime: 136 })}
                posterIcon={Clapperboard}
            />,
        );

        expect(screen.getByText('136 minutes')).toBeInTheDocument();
    });

    it('hides the runtime section when there is no runtime', () => {
        render(
            <TitleDetail
                title={makeTitle({ runtime: null })}
                posterIcon={Clapperboard}
            />,
        );

        expect(screen.queryByText(/minutes/)).not.toBeInTheDocument();
    });

    it('renders genres and keywords when present', () => {
        render(
            <TitleDetail
                title={makeTitle({
                    genres: [{ id: 1, name: 'Action' }],
                    keywords: [{ id: 2, name: 'dystopia' }],
                })}
                posterIcon={Clapperboard}
            />,
        );

        expect(screen.getByText('Action')).toBeInTheDocument();
        expect(screen.getByText('dystopia')).toBeInTheDocument();
    });

    it('combines directors, producers, and composers into the crew list with their roles', () => {
        const director = makePerson({ id: 1, name: 'Lana Wachowski' });
        const producer = makePerson({ id: 2, name: 'Joel Silver' });
        const composer = makePerson({ id: 3, name: 'Don Davis' });

        render(
            <TitleDetail
                title={makeTitle({
                    directors: [director],
                    producers: [producer],
                    composers: [composer],
                })}
                posterIcon={Clapperboard}
            />,
        );

        const crewCall = personListCalls.find((call) => call.title === 'Crew');

        expect(crewCall?.people).toEqual([
            { ...director, role: 'Director' },
            { ...producer, role: 'Producer' },
            { ...composer, role: 'Composer' },
        ]);
    });

    it('maps actors to cast entries using their pivot character as the role', () => {
        const actor = makePerson({
            id: 4,
            name: 'Keanu Reeves',
            pivot: { character: 'Neo' },
        });

        render(
            <TitleDetail
                title={makeTitle({ actors: [actor] })}
                posterIcon={Clapperboard}
            />,
        );

        const castCall = personListCalls.find((call) => call.title === 'Cast');

        expect(castCall?.people).toEqual([{ ...actor, role: 'Neo' }]);
    });

    it('leaves the role undefined for an actor with no pivot character', () => {
        const actor = makePerson({ id: 5, name: 'Extra' });

        render(
            <TitleDetail
                title={makeTitle({ actors: [actor] })}
                posterIcon={Clapperboard}
            />,
        );

        const castCall = personListCalls.find((call) => call.title === 'Cast');

        expect(castCall?.people).toEqual([{ ...actor, role: undefined }]);
    });

    it('passes the watch providers through to the WatchProviders component', () => {
        const providers: WatchProvider[] = [
            {
                id: 1,
                name: 'Netflix',
                logo_path: null,
                pivot: { access_type: 'subscription' },
            },
        ];

        render(
            <TitleDetail
                title={makeTitle({ watch_providers: providers })}
                posterIcon={Clapperboard}
            />,
        );

        expect(watchProvidersCalls[0]?.providers).toEqual(providers);
    });
});
