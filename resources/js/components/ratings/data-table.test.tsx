import { fireEvent, render, screen } from '@testing-library/react';
import { createColumnHelper } from '@tanstack/react-table';
import { describe, expect, it } from 'vite-plus/test';
import { RatingsDataTable } from './data-table';
import { type RatingsTableFeatures } from './table-features';

type Row = { id: number; name: string };

const columnHelper = createColumnHelper<RatingsTableFeatures, Row>();
const columns = columnHelper.columns([
    columnHelper.accessor('name', { header: 'Name' }),
]);

function makeRows(count: number): Row[] {
    return Array.from({ length: count }, (_, index) => ({
        id: index + 1,
        name: `Row ${index + 1}`,
    }));
}

describe('RatingsDataTable', () => {
    it('renders a header for each column', () => {
        render(<RatingsDataTable columns={columns} data={[]} />);

        expect(screen.getByText('Name')).toBeInTheDocument();
    });

    it('renders a row for each data item', () => {
        const data: Row[] = [
            { id: 1, name: 'First' },
            { id: 2, name: 'Second' },
        ];

        render(<RatingsDataTable columns={columns} data={data} />);

        expect(screen.getByText('First')).toBeInTheDocument();
        expect(screen.getByText('Second')).toBeInTheDocument();
    });

    it('shows a message when there is no data', () => {
        render(<RatingsDataTable columns={columns} data={[]} />);

        expect(screen.getByText('No results.')).toBeInTheDocument();
    });

    it('does not show pagination controls when all rows fit on one page', () => {
        render(<RatingsDataTable columns={columns} data={makeRows(10)} />);

        expect(screen.queryByText(/Page \d+ of \d+/)).not.toBeInTheDocument();
    });

    it('shows only the first page of rows when there are more rows than the page size', () => {
        render(<RatingsDataTable columns={columns} data={makeRows(25)} />);

        expect(screen.getByText('Row 1')).toBeInTheDocument();
        expect(screen.getByText('Row 10')).toBeInTheDocument();
        expect(screen.queryByText('Row 11')).not.toBeInTheDocument();
        expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: 'Previous page' }),
        ).toBeDisabled();
        expect(
            screen.getByRole('button', { name: 'Next page' }),
        ).not.toBeDisabled();
    });

    it('advances to the next page and back when the pagination buttons are clicked', () => {
        render(<RatingsDataTable columns={columns} data={makeRows(25)} />);

        fireEvent.click(screen.getByRole('button', { name: 'Next page' }));

        expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();
        expect(screen.getByText('Row 11')).toBeInTheDocument();
        expect(screen.queryByText('Row 1')).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Previous page' }));

        expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
        expect(screen.getByText('Row 1')).toBeInTheDocument();
    });

    it('disables the next button on the last page', () => {
        render(<RatingsDataTable columns={columns} data={makeRows(25)} />);

        fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
        fireEvent.click(screen.getByRole('button', { name: 'Next page' }));

        expect(screen.getByText('Page 3 of 3')).toBeInTheDocument();
        expect(screen.getByText('Row 21')).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: 'Next page' }),
        ).toBeDisabled();
    });

    it('clamps to the last available page when the row count shrinks', () => {
        const { rerender } = render(
            <RatingsDataTable columns={columns} data={makeRows(25)} />,
        );

        fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
        fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
        expect(screen.getByText('Page 3 of 3')).toBeInTheDocument();

        rerender(<RatingsDataTable columns={columns} data={makeRows(12)} />);

        expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
        expect(screen.getByText('Row 11')).toBeInTheDocument();
    });
});
