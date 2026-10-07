import { pluralize } from '@/components/taste-profile/describe';

export default function AffinityLegend({
    showsLowConfidence,
    minimumConfidentSampleSize,
}: {
    showsLowConfidence: boolean;
    minimumConfidentSampleSize: number;
}) {
    return (
        <div className="flex flex-col gap-1">
            <ul className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-xs">
                <li className="flex items-center gap-1.5">
                    <span className="bg-affinity-above size-2.5 rounded-sm" />
                    Above your average
                </li>
                <li className="flex items-center gap-1.5">
                    <span className="bg-affinity-below size-2.5 rounded-sm" />
                    Below your average
                </li>
                {showsLowConfidence && (
                    <li className="flex items-center gap-1.5">
                        <span className="bg-affinity-above size-2.5 rounded-sm opacity-40" />
                        Low confidence
                    </li>
                )}
            </ul>
            <p className="text-muted-foreground text-xs">
                Bar length is how many points above or below your average you
                rate titles with that attribute.
                {showsLowConfidence &&
                    ` Faded bars are backed by fewer than ${pluralize(minimumConfidentSampleSize, 'title')}.`}
            </p>
        </div>
    );
}
