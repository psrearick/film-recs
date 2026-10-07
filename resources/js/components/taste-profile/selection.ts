import {
    describeAffinity,
    pluralize,
    ROLE_LABELS,
} from '@/components/taste-profile/describe';
import type {
    Affinity,
    CreditRole,
    PersonAffinity,
    TitleSelection,
} from '@/components/taste-profile/types';

export function genreSelection(genre: Affinity): TitleSelection {
    return {
        query: { type: 'genre', id: genre.id ?? undefined },
        eyebrow: 'Genre',
        heading: genre.label,
        description: describeAffinity(genre),
    };
}

export function keywordSelection(keyword: Affinity): TitleSelection {
    return {
        query: { type: 'keyword', id: keyword.id ?? undefined },
        eyebrow: 'Theme',
        heading: keyword.label,
        description: describeAffinity(keyword),
    };
}

export function decadeSelection(decade: Affinity): TitleSelection {
    return {
        query: { type: 'decade', value: decade.label.replace(/s$/, '') },
        eyebrow: 'Decade',
        heading: `The ${decade.label}`,
        description: describeAffinity(decade),
    };
}

export function personSelection(
    role: CreditRole,
    person: PersonAffinity,
): TitleSelection {
    const roleLabel = ROLE_LABELS[role].singular;

    return {
        query: { type: 'person', id: person.id ?? undefined, value: role },
        eyebrow: roleLabel.charAt(0).toUpperCase() + roleLabel.slice(1),
        heading: person.label,
        description: describeAffinity(person),
        person: { tmdbId: person.tmdb_id, profilePath: person.profile_path },
    };
}

export function scoreSelection(score: number, count: number): TitleSelection {
    return {
        query: { type: 'score', value: String(score) },
        eyebrow: 'Score',
        heading: `Rated ${score}`,
        description: `You gave ${pluralize(count, 'title')} a ${score}`,
    };
}
