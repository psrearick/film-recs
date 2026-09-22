import {
    useTable,
    type ColumnDef,
    type PaginationState,
    type RowData,
    type SortingState,
} from '@tanstack/react-table';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    features,
    type RatingsTableFeatures,
} from '@/components/ratings/table-features';
import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PAGE_SIZE = 10;

interface DataTableProps<TData extends RowData> {
    columns: ColumnDef<RatingsTableFeatures, TData>[];
    data: TData[];
}

export function RatingsDataTable<TData extends RowData>({
    columns,
    data,
}: DataTableProps<TData>) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: PAGE_SIZE,
    });

    const pageCount = Math.max(1, Math.ceil(data.length / pagination.pageSize));
    const hasPrevious = pagination.pageIndex > 0;
    const hasNext = pagination.pageIndex < pageCount - 1;

    useEffect(() => {
        setPagination((current) => ({
            ...current,
            pageIndex: Math.min(current.pageIndex, pageCount - 1),
        }));
    }, [pageCount]);

    const table = useTable({
        features,
        data,
        columns,
        state: { sorting, pagination },
        onSortingChange: setSorting,
        onPaginationChange: setPagination,
        meta: { sorting },
    });

    return (
        <div className="flex flex-col gap-4">
            <div className="overflow-hidden rounded-md border">
                <Table className="lg:table-fixed">
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow
                                key={headerGroup.id}
                                className="bg-sidebar hover:bg-sidebar"
                            >
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead
                                            key={header.id}
                                            className={
                                                header.column.columnDef.meta
                                                    ?.className
                                            }
                                        >
                                            {header.isPlaceholder ? null : (
                                                <table.FlexRender
                                                    header={header}
                                                />
                                            )}
                                        </TableHead>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={
                                        row.getIsSelected() && 'selected'
                                    }
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            <table.FlexRender cell={cell} />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center"
                                >
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            {pageCount > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-muted-foreground text-sm">
                        Page {pagination.pageIndex + 1} of {pageCount}
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={!hasPrevious}
                            onClick={() =>
                                setPagination((current) => ({
                                    ...current,
                                    pageIndex: current.pageIndex - 1,
                                }))
                            }
                            aria-label="Previous page"
                        >
                            <ChevronLeft />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={!hasNext}
                            onClick={() =>
                                setPagination((current) => ({
                                    ...current,
                                    pageIndex: current.pageIndex + 1,
                                }))
                            }
                            aria-label="Next page"
                        >
                            <ChevronRight />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
