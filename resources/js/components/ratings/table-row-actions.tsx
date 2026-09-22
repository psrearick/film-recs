import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { router } from '@inertiajs/react';
import { destroy } from '@/routes/rating';
import { Button } from '@/components/ui/button';

export default function RatingsTableRowActions({
    titleId,
}: {
    titleId: number;
}) {
    const [clearing, setClearing] = useState(false);

    function handleClear() {
        setClearing(true);
        router.delete(destroy.url(titleId), {
            preserveScroll: true,
            onFinish: () => setClearing(false),
        });
    }

    return (
        <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground hover:text-destructive"
            disabled={clearing}
            onClick={handleClear}
            aria-label="Clear rating"
        >
            <Trash2 />
        </Button>
    );
}
