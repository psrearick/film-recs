import {
    Bar,
    BarChart,
    Cell,
    LabelList,
    type LabelProps,
    ReferenceLine,
    XAxis,
    YAxis,
} from 'recharts';
import {
    describeAffinity,
    formatPoints,
} from '@/components/taste-profile/describe';
import type { Affinity } from '@/components/taste-profile/types';
import {
    type ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from '@/components/ui/chart';

const chartConfig = {
    above: { label: 'Above your average', color: 'var(--affinity-above)' },
    below: { label: 'Below your average', color: 'var(--affinity-below)' },
} satisfies ChartConfig;

const ROW_HEIGHT = 30;

/**
 * Room either side of the longest bar for its value label.
 */
const LABEL_HEADROOM = 1.3;

/**
 * A diverging bar per affinity, centered on the user's average, with length set by
 * how many points above or below it the user rates that attribute. Bars backed by
 * few titles are faded rather than shortened. Clicking anywhere along a row selects that
 * affinity: the bar's transparent background spans the row, and its click handler
 * gets the exact index, unlike the chart's own click state, which can lag the
 * cursor because Recharts throttles mouse moves to animation frames. The chart is
 * keyed by its rows so a different set of rows grows in fresh, rather than Recharts
 * morphing old bars into new ones while their colors have already changed.
 */
export default function AffinityChart({
    caption,
    affinities,
    onSelect,
}: {
    caption: string;
    affinities: Affinity[];
    onSelect: (affinity: Affinity) => void;
}) {
    const largestScore = Math.max(
        ...affinities.map((affinity) => Math.abs(affinity.affinity_score)),
        0.01,
    );

    return (
        <figure>
            <ChartContainer
                key={affinities.map((affinity) => affinity.label).join('|')}
                config={chartConfig}
                className="aspect-auto w-full cursor-pointer"
                style={{ height: affinities.length * ROW_HEIGHT + 8 }}
            >
                <BarChart
                    data={affinities}
                    layout="vertical"
                    margin={{ top: 4, bottom: 4, left: 0, right: 0 }}
                >
                    <XAxis
                        type="number"
                        dataKey="affinity_score"
                        domain={[
                            -largestScore * LABEL_HEADROOM,
                            largestScore * LABEL_HEADROOM,
                        ]}
                        hide
                    />
                    <YAxis
                        type="category"
                        dataKey="label"
                        width={130}
                        tickLine={false}
                        axisLine={false}
                    />
                    <ReferenceLine x={0} stroke="var(--border)" />
                    <ChartTooltip
                        cursor={{ fill: 'var(--muted)', fillOpacity: 0.5 }}
                        content={
                            <ChartTooltipContent
                                hideLabel
                                hideIndicator
                                formatter={(_value, _name, item) => (
                                    <AffinityTooltip
                                        affinity={item.payload as Affinity}
                                    />
                                )}
                            />
                        }
                    />
                    <Bar
                        dataKey="affinity_score"
                        radius={4}
                        barSize={18}
                        background={{ fill: 'transparent' }}
                        onClick={(_bar, index) => onSelect(affinities[index])}
                    >
                        {affinities.map((affinity) => (
                            <Cell
                                key={`${affinity.id}-${affinity.label}`}
                                fill={
                                    affinity.affinity_score >= 0
                                        ? 'var(--color-above)'
                                        : 'var(--color-below)'
                                }
                                fillOpacity={
                                    affinity.is_low_confidence ? 0.4 : 1
                                }
                            />
                        ))}
                        <LabelList
                            dataKey="affinity_score"
                            content={(props) => (
                                <BarEndLabel
                                    {...props}
                                    affinity={affinities[Number(props.index)]}
                                />
                            )}
                        />
                    </Bar>
                </BarChart>
            </ChartContainer>
            <table className="sr-only text-sm focus-within:not-sr-only focus-within:mt-4 focus-within:block">
                <caption className="text-left font-medium">{caption}</caption>
                <thead>
                    <tr>
                        <th scope="col" className="text-left">
                            Name
                        </th>
                        <th scope="col" className="text-left">
                            Compared to your average
                        </th>
                        <th scope="col" className="text-left">
                            Confidence
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {affinities.map((affinity) => (
                        <tr key={`${affinity.id}-${affinity.label}`}>
                            <th scope="row" className="pr-4 text-left">
                                <button
                                    type="button"
                                    className="underline-offset-4 hover:underline"
                                    onClick={() => onSelect(affinity)}
                                >
                                    {affinity.label}
                                </button>
                            </th>
                            <td className="pr-4">
                                {describeAffinity(affinity)}
                            </td>
                            <td>
                                {Math.round(affinity.confidence * 100)}%
                                {affinity.is_low_confidence &&
                                    ' (low confidence)'}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </figure>
    );
}

/**
 * The raw point difference, just past whichever end of the bar is away from zero.
 */
function BarEndLabel({
    x,
    y,
    width,
    height,
    affinity,
}: LabelProps & { affinity?: Affinity }) {
    if (!affinity) {
        return null;
    }

    const barStart = Number(x);
    const barEnd = barStart + Number(width);
    const isAbove = affinity.affinity_score >= 0;

    return (
        <text
            x={
                isAbove
                    ? Math.max(barStart, barEnd) + 6
                    : Math.min(barStart, barEnd) - 6
            }
            y={Number(y) + Number(height) / 2}
            dominantBaseline="central"
            textAnchor={isAbove ? 'start' : 'end'}
            className="fill-muted-foreground text-xs tabular-nums"
        >
            {formatPoints(affinity.affinity_score)}
        </text>
    );
}

function AffinityTooltip({ affinity }: { affinity: Affinity }) {
    return (
        <div className="flex max-w-56 flex-col gap-0.5">
            <p className="font-medium">{affinity.label}</p>
            <p>{describeAffinity(affinity)}</p>
            <p className="text-muted-foreground">
                {Math.round(affinity.confidence * 100)}% confidence
                {affinity.is_low_confidence && ' · low confidence'}
            </p>
            <p className="text-muted-foreground">Click to see the titles</p>
        </div>
    );
}
