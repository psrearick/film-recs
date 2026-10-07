import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';
import { pluralize } from '@/components/taste-profile/describe';
import type { ScoreCount } from '@/components/taste-profile/types';
import {
    type ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from '@/components/ui/chart';

const chartConfig = {
    count: { label: 'Titles', color: 'var(--primary)' },
} satisfies ChartConfig;

export default function ScoreDistributionChart({
    distribution,
    onSelect,
}: {
    distribution: ScoreCount[];
    onSelect: (scoreCount: ScoreCount) => void;
}) {
    return (
        <figure>
            <ChartContainer
                config={chartConfig}
                className="aspect-auto h-48 w-full cursor-pointer"
            >
                <BarChart data={distribution}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                        dataKey="score"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                    />
                    <ChartTooltip
                        cursor={{ fill: 'var(--muted)', fillOpacity: 0.5 }}
                        content={
                            <ChartTooltipContent
                                hideIndicator
                                labelFormatter={(_label, payload) =>
                                    `Rated ${(payload[0]?.payload as ScoreCount | undefined)?.score}`
                                }
                                formatter={(count) =>
                                    pluralize(Number(count), 'title')
                                }
                            />
                        }
                    />
                    <Bar
                        dataKey="count"
                        fill="var(--color-count)"
                        radius={[4, 4, 0, 0]}
                        background={{ fill: 'transparent' }}
                        onClick={(_bar, index) => {
                            const scoreCount = distribution[index];

                            if (scoreCount.count > 0) {
                                onSelect(scoreCount);
                            }
                        }}
                    />
                </BarChart>
            </ChartContainer>
            <table className="sr-only text-sm focus-within:not-sr-only focus-within:mt-4 focus-within:block">
                <caption className="text-left font-medium">
                    How many titles you gave each score
                </caption>
                <thead>
                    <tr>
                        <th scope="col" className="pr-4 text-left">
                            Score
                        </th>
                        <th scope="col" className="text-left">
                            Titles
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {distribution.map((scoreCount) => (
                        <tr key={scoreCount.score}>
                            <th scope="row" className="pr-4 text-left">
                                {scoreCount.count > 0 ? (
                                    <button
                                        type="button"
                                        className="underline-offset-4 hover:underline"
                                        onClick={() => onSelect(scoreCount)}
                                    >
                                        {scoreCount.score}
                                    </button>
                                ) : (
                                    scoreCount.score
                                )}
                            </th>
                            <td>{scoreCount.count}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </figure>
    );
}
