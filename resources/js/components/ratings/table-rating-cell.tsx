import { useState } from 'react';
import { Star } from 'lucide-react';
import { Form } from '@inertiajs/react';
import { rating } from '@/routes';
import StarRatingPicker from '@/components/star-rating-picker';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';

export default function RatingsTableRatingCell({
    titleId,
    score,
}: {
    titleId: number;
    score: number;
}) {
    const [open, setOpen] = useState(false);
    const [selectedRating, setSelectedRating] = useState(score);
    const [hoverRating, setHoverRating] = useState(0);

    function handleOpenChange(isOpen: boolean) {
        if (!isOpen) {
            setSelectedRating(score);
            setHoverRating(0);
        }
        setOpen(isOpen);
    }

    return (
        <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className="hover:text-muted-foreground inline-flex items-center gap-2"
                >
                    <Star className="h-4 fill-amber-400 text-amber-400" />
                    <span className="font-medium">{score}</span>
                </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-auto">
                <Form
                    {...rating.form(titleId)}
                    onSuccess={() => setOpen(false)}
                >
                    {({ processing }) => (
                        <>
                            <StarRatingPicker
                                value={selectedRating}
                                hoverValue={hoverRating}
                                onHover={setHoverRating}
                                onSelect={setSelectedRating}
                                className="py-2"
                            />
                            <input
                                type="hidden"
                                name="score"
                                value={selectedRating}
                            />
                            <Button
                                type="submit"
                                size="sm"
                                className="w-full"
                                disabled={
                                    processing || selectedRating === score
                                }
                            >
                                Save
                            </Button>
                        </>
                    )}
                </Form>
            </PopoverContent>
        </Popover>
    );
}
