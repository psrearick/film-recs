import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import type { Column, RowData, SortingState } from '@tanstack/react-table';
import { type RatingsTableFeatures } from '@/components/ratings/table-features';
import { Button } from '@/components/ui/button';
import { cn } from 'cn';

export default function RatingsTableSortableHeader<
    TData extends RowData,
    TValue,
>({
    column,
    label,
    align = 'center',
}: {
    column: Column<RatingsTableFeatures, TData, TValue>;
    label: string;
    align?: 'left' | 'center' | 'right';
}) {
    const sorting =
        (column.table.options.meta as { sorting?: SortingState } | undefined)
            ?.sorting ?? [];
    const columnSort = sorting.find((entry) => entry.id === column.id);
    const sort = !columnSort ? false : columnSort.desc ? 'desc' : 'asc';
    const Arrow =
        sort === 'asc' ? ArrowUp : sort === 'desc' ? ArrowDown : ArrowUpDown;

    function handleClick() {
        if (sort === 'asc') {
            column.toggleSorting(true);
        } else if (sort === 'desc') {
            column.clearSorting();
        } else {
            column.toggleSorting(false);
        }
    }

    return (
        <Button
            className={cn(
                'w-full',
                align === 'right' && 'justify-end',
                align === 'left' && 'justify-start',
            )}
            variant="ghost"
            onClick={handleClick}
        >
            {label}
            <Arrow className="ml-2 size-4" />
        </Button>
    );
}
