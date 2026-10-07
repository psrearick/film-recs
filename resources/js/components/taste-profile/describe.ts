import type {
    Affinity,
    CreditRole,
    TasteProfileProps,
} from '@/components/taste-profile/types';

export const ROLE_LABELS: Record<
    CreditRole,
    { singular: string; plural: string }
> = {
    cast: { singular: 'actor', plural: 'Actors' },
    director: { singular: 'director', plural: 'Directors' },
    producer: { singular: 'producer', plural: 'Producers' },
    composer: { singular: 'composer', plural: 'Composers' },
};

export function formatPoints(points: number): string {
    const rounded = Math.round(points * 10) / 10;

    if (rounded === 0) {
        return '0.0';
    }

    return `${rounded > 0 ? '+' : ''}${rounded.toFixed(1)}`;
}

export function pluralize(count: number, noun: string): string {
    return `${count} ${noun}${count === 1 ? '' : 's'}`;
}

export function describeAffinity(affinity: Affinity): string {
    const titles = pluralize(affinity.sample_size, 'title');

    if (Math.abs(affinity.affinity_score) < 0.05) {
        return `Right at your average across ${titles}`;
    }

    const direction = affinity.affinity_score > 0 ? 'above' : 'below';

    return `${Math.abs(affinity.affinity_score).toFixed(1)} points ${direction} your average across ${titles}`;
}

export function joinAsSentence(items: string[]): string {
    if (items.length <= 1) {
        return items.join('');
    }

    if (items.length === 2) {
        return `${items[0]} and ${items[1]}`;
    }

    return `${items.slice(0, -1).join(', ')}, and ${items.at(-1)}`;
}

/**
 * Plain-language highlights of the profile, skipping any that the data can't
 * support yet.
 */
export function summarizeTaste(profile: TasteProfileProps): string[] {
    const sentences: string[] = [];

    if (profile.averageScore !== null) {
        sentences.push(
            `You rate titles ${profile.averageScore.toFixed(1)} out of 10 on average across ${pluralize(profile.ratingCount, 'rating')}.`,
        );
    }

    const favoredGenres = profile.genres
        .filter((genre) => genre.weighted_score > 0)
        .slice(0, 2)
        .map((genre) => genre.label);
    const leastFavoredGenre = profile.genres
        .filter((genre) => genre.weighted_score < 0)
        .at(-1);

    if (favoredGenres.length > 0 && leastFavoredGenre) {
        sentences.push(
            `You gravitate toward ${joinAsSentence(favoredGenres)}, and tend to rate ${leastFavoredGenre.label} below your average.`,
        );
    } else if (favoredGenres.length > 0) {
        sentences.push(
            `You gravitate toward ${joinAsSentence(favoredGenres)}.`,
        );
    } else if (leastFavoredGenre) {
        sentences.push(
            `You tend to rate ${leastFavoredGenre.label} below your average.`,
        );
    }

    const strongestDecade = profile.decades
        .filter((decade) => decade.weighted_score > 0)
        .reduce<Affinity | null>(
            (strongest, decade) =>
                !strongest || decade.weighted_score > strongest.weighted_score
                    ? decade
                    : strongest,
            null,
        );

    if (strongestDecade) {
        sentences.push(
            `The ${strongestDecade.label} are your strongest decade.`,
        );
    }

    const movies = profile.typeBreakdown.find((type) => type.type === 'movie');
    const series = profile.typeBreakdown.find((type) => type.type === 'tv');

    if (movies && series) {
        const difference = series.average_score - movies.average_score;

        sentences.push(
            Math.abs(difference) < 0.3
                ? 'You rate movies and series about the same.'
                : `You rate ${difference > 0 ? 'series' : 'movies'} ${Math.abs(difference).toFixed(1)} points higher than ${difference > 0 ? 'movies' : 'series'}.`,
        );
    }

    const favoritePeople = profile.people
        .filter((role) => role.favored.length > 0)
        .map(
            (role) =>
                `${role.favored[0].label} is your top ${ROLE_LABELS[role.role].singular}`,
        );

    if (favoritePeople.length > 0) {
        sentences.push(`${joinAsSentence(favoritePeople)}.`);
    }

    return sentences;
}
