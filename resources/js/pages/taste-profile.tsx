import { Link, router, setLayoutProps } from '@inertiajs/react';
import { Clock, Sparkles } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import AffinityChart from '@/components/taste-profile/affinity-chart';
import AffinityLegend from '@/components/taste-profile/affinity-legend';
import AffinityTitlesDialog from '@/components/taste-profile/affinity-titles-dialog';
import {
    pluralize,
    ROLE_LABELS,
    summarizeTaste,
} from '@/components/taste-profile/describe';
import KeywordAffinityList from '@/components/taste-profile/keyword-affinity-list';
import PersonAffinityList from '@/components/taste-profile/person-affinity-list';
import ScoreDistributionChart from '@/components/taste-profile/score-distribution-chart';
import {
    decadeSelection,
    genreSelection,
    keywordSelection,
    personSelection,
    scoreSelection,
} from '@/components/taste-profile/selection';
import type {
    TasteProfileProps,
    TitleSelection,
} from '@/components/taste-profile/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@/components/ui/empty';
import {
    Field,
    FieldContent,
    FieldDescription,
    FieldLabel,
} from '@/components/ui/field';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { home, tasteProfile } from '@/routes';

export default function TasteProfile(profile: TasteProfileProps) {
    setLayoutProps({ title: 'Taste Profile' });

    const hasEnoughRatings = profile.ratingCount >= profile.minimumRatingCount;

    return (
        <main className="flex h-full w-full flex-col">
            <div className="mx-auto my-8 w-full max-w-7xl px-4">
                <h1 className="font-heading text-4xl">Your Taste Profile</h1>
                <p className="text-muted-foreground mt-2">
                    What your ratings say about what you like
                    {profile.updatedAt &&
                        ` · updated ${new Date(profile.updatedAt).toLocaleDateString()}`}
                </p>
            </div>
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-8">
                {hasEnoughRatings ? (
                    <Profile profile={profile} />
                ) : (
                    <NotEnoughRatings
                        ratingCount={profile.ratingCount}
                        minimumRatingCount={profile.minimumRatingCount}
                    />
                )}
            </div>
        </main>
    );
}

function NotEnoughRatings({
    ratingCount,
    minimumRatingCount,
}: {
    ratingCount: number;
    minimumRatingCount: number;
}) {
    return (
        <Empty className="border">
            <EmptyHeader>
                <EmptyMedia variant="icon">
                    <Sparkles />
                </EmptyMedia>
                <EmptyTitle>Keep rating to unlock your profile</EmptyTitle>
                <EmptyDescription>
                    Rate at least {pluralize(minimumRatingCount, 'title')} to
                    see your taste profile. You've rated {ratingCount} so far.
                </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
                <Progress
                    aria-label="Ratings toward your taste profile"
                    value={(ratingCount / minimumRatingCount) * 100}
                />
                <Button asChild>
                    <Link href={home()}>Find something to rate</Link>
                </Button>
            </EmptyContent>
        </Empty>
    );
}

function Profile({ profile }: { profile: TasteProfileProps }) {
    const [selection, setSelection] = useState<TitleSelection | null>(null);
    const summary = summarizeTaste(profile);
    const genresByPoints = profile.genres.toSorted(
        (first, second) => second.affinity_score - first.affinity_score,
    );
    const movies = profile.typeBreakdown.find((type) => type.type === 'movie');
    const series = profile.typeBreakdown.find((type) => type.type === 'tv');
    const hasKeywords =
        profile.keywords.favored.length > 0 ||
        profile.keywords.disfavored.length > 0;

    return (
        <>
            <LowConfidenceToggle
                includeLowConfidence={profile.includeLowConfidence}
                minimumConfidentSampleSize={profile.minimumConfidentSampleSize}
            />
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <StatTile label="Ratings" value={profile.ratingCount} />
                <StatTile
                    label="Average score"
                    value={profile.averageScore?.toFixed(1) ?? '–'}
                />
                <StatTile
                    label="Movies"
                    value={movies?.count ?? 0}
                    detail={movies && `avg ${movies.average_score.toFixed(1)}`}
                />
                <StatTile
                    label="Series"
                    value={series?.count ?? 0}
                    detail={series && `avg ${series.average_score.toFixed(1)}`}
                />
            </div>

            <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
                <Card>
                    <CardHeader>
                        <CardTitle>At a glance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {profile.updatedAt ? (
                            <ul className="flex list-disc flex-col gap-2 pl-5 text-base">
                                {summary.map((sentence) => (
                                    <li key={sentence}>{sentence}</li>
                                ))}
                            </ul>
                        ) : (
                            <Alert>
                                <Clock />
                                <AlertTitle>Still calculating</AlertTitle>
                                <AlertDescription>
                                    Your taste profile is still being
                                    calculated. Check back in a minute.
                                </AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>How you score</CardTitle>
                        <CardDescription>
                            How many titles you gave each score
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScoreDistributionChart
                            distribution={profile.scoreDistribution}
                            onSelect={({ score, count }) =>
                                setSelection(scoreSelection(score, count))
                            }
                        />
                    </CardContent>
                </Card>
            </div>

            {(profile.genres.length > 0 || profile.decades.length > 0) && (
                <div className="flex flex-col gap-3">
                    <AffinityLegend
                        showsLowConfidence={profile.includeLowConfidence}
                        minimumConfidentSampleSize={
                            profile.minimumConfidentSampleSize
                        }
                    />
                    <div className="grid items-start gap-6 lg:grid-cols-2">
                        {profile.genres.length > 0 && (
                            <AffinityCard
                                title="Genres"
                                description={withHiddenCount(
                                    'How you rate each genre compared to your average.',
                                    profile.hiddenCounts.genres,
                                    'genre',
                                )}
                            >
                                <AffinityChart
                                    caption="Your genre affinities"
                                    affinities={genresByPoints}
                                    onSelect={(genre) =>
                                        setSelection(genreSelection(genre))
                                    }
                                />
                            </AffinityCard>
                        )}
                        {profile.decades.length > 0 && (
                            <AffinityCard
                                title="Decades"
                                description={withHiddenCount(
                                    'How you rate titles from each decade compared to your average.',
                                    profile.hiddenCounts.decades,
                                    'decade',
                                )}
                            >
                                <AffinityChart
                                    caption="Your decade affinities"
                                    affinities={profile.decades}
                                    onSelect={(decade) =>
                                        setSelection(decadeSelection(decade))
                                    }
                                />
                            </AffinityCard>
                        )}
                    </div>
                </div>
            )}

            {profile.people.length > 0 && (
                <div className="grid gap-6 md:grid-cols-2">
                    {profile.people.map(({ role, favored, disfavored }) => (
                        <AffinityCard
                            key={role}
                            title={ROLE_LABELS[role].plural}
                        >
                            <div className="grid gap-6 sm:grid-cols-2">
                                <PersonAffinityList
                                    heading="You rate highly"
                                    people={favored}
                                    onSelect={(person) =>
                                        setSelection(
                                            personSelection(role, person),
                                        )
                                    }
                                />
                                <PersonAffinityList
                                    heading="You rate lower"
                                    people={disfavored}
                                    onSelect={(person) =>
                                        setSelection(
                                            personSelection(role, person),
                                        )
                                    }
                                />
                            </div>
                        </AffinityCard>
                    ))}
                </div>
            )}

            {hasKeywords && (
                <AffinityCard
                    title="Themes"
                    description="Story elements that show up in the titles you rate highest and lowest."
                >
                    <div className="flex flex-col gap-6">
                        <KeywordAffinityList
                            heading="You're drawn to"
                            keywords={profile.keywords.favored}
                            direction="above"
                            onSelect={(keyword) =>
                                setSelection(keywordSelection(keyword))
                            }
                        />
                        <KeywordAffinityList
                            heading="Not your thing"
                            keywords={profile.keywords.disfavored}
                            direction="below"
                            onSelect={(keyword) =>
                                setSelection(keywordSelection(keyword))
                            }
                        />
                    </div>
                </AffinityCard>
            )}
            <AffinityTitlesDialog
                selection={selection}
                onClose={() => setSelection(null)}
            />
        </>
    );
}

function LowConfidenceToggle({
    includeLowConfidence,
    minimumConfidentSampleSize,
}: {
    includeLowConfidence: boolean;
    minimumConfidentSampleSize: number;
}) {
    function setIncludeLowConfidence(include: boolean) {
        router
            .optimistic<TasteProfileProps>(() => ({
                includeLowConfidence: include,
            }))
            .get(
                tasteProfile.url({
                    query: include ? { include_low_confidence: 1 } : {},
                }),
                {},
                { preserveScroll: true, preserveState: true },
            );
    }

    return (
        <Field orientation="horizontal" className="w-fit">
            <Switch
                id="include-low-confidence"
                checked={includeLowConfidence}
                onCheckedChange={setIncludeLowConfidence}
            />
            <FieldContent>
                <FieldLabel htmlFor="include-low-confidence">
                    Include low-confidence results
                </FieldLabel>
                <FieldDescription>
                    Results backed by fewer than{' '}
                    {pluralize(minimumConfidentSampleSize, 'title')} are{' '}
                    {includeLowConfidence ? 'shown faded' : 'hidden'}.
                </FieldDescription>
            </FieldContent>
        </Field>
    );
}

function StatTile({
    label,
    value,
    detail,
}: {
    label: string;
    value: number | string;
    detail?: string;
}) {
    return (
        <Card>
            <CardHeader>
                <CardDescription>{label}</CardDescription>
                <CardTitle className="text-3xl tabular-nums">{value}</CardTitle>
                {detail && <CardDescription>{detail}</CardDescription>}
            </CardHeader>
        </Card>
    );
}

function AffinityCard({
    title,
    description,
    children,
}: {
    title: string;
    description?: string;
    children: ReactNode;
}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                {description && (
                    <CardDescription>{description}</CardDescription>
                )}
            </CardHeader>
            <CardContent>{children}</CardContent>
        </Card>
    );
}

function withHiddenCount(
    description: string,
    hiddenCount: number,
    noun: string,
): string {
    return hiddenCount > 0
        ? `${description} ${pluralize(hiddenCount, `low-confidence ${noun}`)} hidden.`
        : description;
}
