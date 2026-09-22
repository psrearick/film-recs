import { Star } from 'lucide-react';
import { cn } from 'cn';

export const RATING_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default function StarRatingPicker({
    value,
    hoverValue,
    onHover,
    onSelect,
    className,
}: {
    value: number;
    hoverValue: number;
    onHover: (value: number) => void;
    onSelect: (value: number) => void;
    className?: string;
}) {
    const displayedRating = hoverValue || value;

    return (
        <div
            className={cn('flex justify-center gap-1', className)}
            onMouseLeave={() => onHover(0)}
        >
            {RATING_VALUES.map((rating) => (
                <Star
                    key={rating}
                    className={cn(
                        'h-5 cursor-pointer transition-colors',
                        rating <= displayedRating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-muted-foreground',
                    )}
                    onMouseEnter={() => onHover(rating)}
                    onClick={() => onSelect(rating)}
                />
            ))}
        </div>
    );
}
