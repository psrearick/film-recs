import { describeAffinity } from '@/components/taste-profile/describe';
import type { Affinity } from '@/components/taste-profile/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function KeywordAffinityList({
    heading,
    keywords,
    direction,
    onSelect,
}: {
    heading: string;
    keywords: Affinity[];
    direction: 'above' | 'below';
    onSelect: (keyword: Affinity) => void;
}) {
    if (keywords.length === 0) {
        return null;
    }

    return (
        <div className="flex flex-col gap-2">
            <h3 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                {heading}
            </h3>
            <ul className="flex flex-wrap gap-2">
                {keywords.map((keyword) => (
                    <li key={keyword.id}>
                        <Badge variant="outline" asChild>
                            <button
                                type="button"
                                className="cursor-pointer"
                                title={describeAffinity(keyword)}
                                onClick={() => onSelect(keyword)}
                            >
                                <span
                                    aria-hidden="true"
                                    data-icon="inline-start"
                                    className={cn(
                                        'size-2 rounded-full',
                                        direction === 'above'
                                            ? 'bg-affinity-above'
                                            : 'bg-affinity-below',
                                        keyword.is_low_confidence &&
                                            'opacity-40',
                                    )}
                                />
                                {keyword.label}
                                <span className="sr-only">
                                    : {describeAffinity(keyword)}
                                </span>
                            </button>
                        </Badge>
                    </li>
                ))}
            </ul>
        </div>
    );
}
