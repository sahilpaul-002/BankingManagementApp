import React, { useMemo } from 'react';
import { ChevronRight, ArrowRight, ReceiptText } from 'lucide-react';
import {
    useTable,
    tableFeatures,
    rowPaginationFeature,
    columnVisibilityFeature,
    type ColumnDef,
    type PaginationState,
} from '@tanstack/react-table';
import type { PayoutTransactionItem } from '@/types/payables/payoutTypes';
import RingSpinnerLoaderComponent from '@/components/common/loaders/RingSpinnerLoaderComponent';
import CustomTooltipComponent from '@/components/common/CustomToolTipComponent';

const payoutTableFeatures = tableFeatures({
    rowPaginationFeature,
    columnVisibilityFeature,
});

interface PayoutTransactionsListComponentPropsType {
    transactions: PayoutTransactionItem[];
    onSelectTransaction: (transaction: PayoutTransactionItem) => void;
    payoutTransactionsNotFound?: boolean | undefined;
    getPayoutTransactionsIsFetching: boolean;
    totalCount: number;
    pagination: PaginationState;
    setPagination: React.Dispatch<React.SetStateAction<PaginationState>>;
}

export default function PayoutTransactionsListComponent({
    transactions,
    onSelectTransaction,
    payoutTransactionsNotFound,
    getPayoutTransactionsIsFetching,
    totalCount,
    pagination,
    setPagination,
}: PayoutTransactionsListComponentPropsType) {
    const maskQuoteId = (id: string) => {
        if (!id) return '—';
        if (id.length <= 8) return id;
        return `${id.slice(0, 4)}••••${id.slice(-4)}`;
    };

    // Function to Format Date
    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '—';

        try {
            const date = new Date(dateStr);

            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return dateStr;
        }
    };

    // Function to format Decimal Amount
    const formatDecimal = (val: { $numberDecimal: string } | string | undefined) => {
        if (!val) return '0.00';

        const str = typeof val === 'object' ? val.$numberDecimal : String(val);
        const num = parseFloat(str);

        return isNaN(num) ? str : num.toFixed(2);
    };

    // Render Status Badge UI
    const renderStatusBadge = (status: string) => {
        const uppercaseStatus = (status || 'PROCESSING').toUpperCase();

        if (uppercaseStatus === 'SUCCESS' || uppercaseStatus === 'COMPLETED') {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5! py-0.5! rounded-full text-xs font-semibold bg-[var(--ok-bg)] text-[var(--ok)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--ok)]"></span>
                    SUCCESS
                </span>
            );
        }

        if (uppercaseStatus === 'PROCESSING' || uppercaseStatus === 'PENDING') {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5! py-0.5! rounded-full text-xs font-semibold bg-[var(--warn-bg)] text-[var(--warn)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--warn)] animate-pulse"></span>
                    PROCESSING
                </span>
            );
        }

        return (
            <span className="inline-flex items-center gap-1.5 px-2.5! py-0.5! rounded-full text-xs font-semibold bg-[var(--err-bg)] text-[var(--err)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--err)]"></span>
                {uppercaseStatus}
            </span>
        );
    };

    // Columns Definition
    const columns = useMemo<ColumnDef<typeof payoutTableFeatures, PayoutTransactionItem>[]>(
        () => [
            {
                id: 'quote_id',
                header: 'Quote ID',
                accessorKey: 'quote_id',
                cell: ({ row }) => {
                    const item = row.original;
                    return (
                        <div className="flex flex-col gap-0.5">
                            <CustomTooltipComponent
                                content={item.quote_id}
                                side="right"
                                align="start"
                                sideOffset={6}
                                contentClassName="bg-[var(--bg-surface)] text-[var(--ink)] border border-[var(--line)] shadow-[var(--shadow-sm)] text-[11px]"
                            >
                                <span className="cursor-pointer hover:text-[var(--ink-soft)] transition-colors underline decoration-dotted underline-offset-2">
                                    {maskQuoteId(item.quote_id)}
                                </span>
                            </CustomTooltipComponent>
                            {item.remarks && (
                                <CustomTooltipComponent
                                    content={item.remarks}
                                    side="right"
                                    align="start"
                                    sideOffset={6}
                                    contentClassName="bg-[var(--bg-surface)] text-[var(--ink)] border border-[var(--line)] shadow-[var(--shadow-sm)] text-[11px] max-w-[260px]"
                                >
                                    <span className="text-[10px] text-[var(--mute)] font-sans font-normal truncate max-w-[150px] cursor-pointer hover:text-[var(--ink)] transition-colors underline decoration-dotted underline-offset-2">
                                        {item.remarks}
                                    </span>
                                </CustomTooltipComponent>
                            )}
                            {!item.remarks && (
                                <span className="text-[10px] text-[var(--mute)] font-sans font-normal">
                                    No remarks
                                </span>
                            )}
                        </div>
                    );
                },
            },
            {
                id: 'source',
                header: 'Source',
                cell: ({ row }) => {
                    const item = row.original;
                    return (
                        <div className="font-semibold text-[var(--ink)]">
                            {formatDecimal(item.source_amount)}{' '}
                            <span className="font-bold text-[var(--ink-soft)]">
                                {item.source_currency}
                            </span>
                        </div>
                    );
                },
            },
            {
                id: 'destination',
                header: 'Destination',
                cell: ({ row }) => {
                    const item = row.original;
                    return (
                        <div className="font-semibold text-[var(--ink)] flex items-center gap-1">
                            {formatDecimal(item.destination_amount)}{' '}
                            <span className="font-bold text-[var(--ink-soft)]">
                                {item.destination_currency}
                            </span>
                        </div>
                    );
                },
            },
            {
                id: 'exchange_rate',
                header: 'Ex. Rate',
                accessorKey: 'exchange_rate',
                cell: ({ row }) => (
                    <span className="font-mono text-[var(--ink-soft)]">
                        {formatDecimal(row.original.exchange_rate)}
                    </span>
                ),
            },
            {
                id: 'fee_amount',
                header: 'Fee',
                accessorKey: 'fee_amount',
                cell: ({ row }) => {
                    const item = row.original;
                    return (
                        <span className="font-mono text-[var(--mute)]">
                            {formatDecimal(item.fee_amount)} {item.source_currency}
                        </span>
                    );
                },
            },
            {
                id: 'status',
                header: 'Status',
                accessorKey: 'status',
                cell: ({ row }) => renderStatusBadge(row.original.status),
            },
            {
                id: 'processing_started_at',
                header: 'Started At',
                accessorKey: 'processing_started_at',
                cell: ({ row }) => (
                    <span className="whitespace-nowrap text-[var(--mute)]">
                        {formatDate(row.original.processing_started_at)}
                    </span>
                ),
            },
            {
                id: 'completed_at',
                header: 'Completed At',
                accessorKey: 'completed_at',
                cell: ({ row }) => (
                    <span className="whitespace-nowrap text-[var(--mute)]">
                        {formatDate(row.original.completed_at)}
                    </span>
                ),
            },
            {
                id: 'actions',
                header: () => null,
                cell: () => (
                    <div className="text-right">
                        <ChevronRight className="w-4 h-4 text-[var(--mute)] group-hover:text-[var(--ink)] transition-colors inline-block" />
                    </div>
                ),
            },
        ],
        []
    );

    const totalPages = Math.ceil(totalCount / pagination.pageSize);
    const startRecord = totalCount === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1;
    const endRecord = Math.min((pagination.pageIndex + 1) * pagination.pageSize, totalCount);

    const table = useTable({
        features: payoutTableFeatures,
        data: transactions,
        columns,
    });

    return (
        <div className="w-full bg-[var(--bg-surface)] border border-[var(--line)] rounded-xl shadow-xs overflow-hidden">
            <div className={getPayoutTransactionsIsFetching || payoutTransactionsNotFound ? '' : 'overflow-x-auto'}>
                <table className={`w-full text-left border-collapse ${getPayoutTransactionsIsFetching || payoutTransactionsNotFound ? '' : 'min-w-[980px]'}`}>
                    <thead>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <tr
                                key={headerGroup.id}
                                className="border-b border-[var(--line)] bg-[var(--bg-subtle)] text-[11px] font-semibold text-[var(--mute)] uppercase tracking-wider"
                            >
                                {headerGroup.headers.map((header) => (
                                    <th
                                        key={header.id}
                                        className={`py-3.5! ${header.id === 'quote_id'
                                            ? 'px-6!'
                                            : header.id === 'actions'
                                                ? 'px-4! w-10'
                                                : 'px-4!'
                                            }`}
                                    >
                                        {header.isPlaceholder ? null : (
                                            <table.FlexRender header={header} />
                                        )}
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>

                    <tbody className="divide-y divide-[var(--line)] text-sm text-[var(--ink)]">
                        {getPayoutTransactionsIsFetching ? (
                            <tr>
                                <td colSpan={columns.length} className="py-12!">
                                    <div className="w-full flex items-center justify-center py-6!">
                                        <RingSpinnerLoaderComponent
                                            visible={getPayoutTransactionsIsFetching}
                                            size={30}
                                            color={getComputedStyle(
                                                document.documentElement
                                            )
                                                .getPropertyValue('--nav-bg')
                                                .trim()}
                                        />
                                    </div>
                                </td>
                            </tr>
                        ) : payoutTransactionsNotFound ? (
                            <tr>
                                <td colSpan={columns.length} className="py-12!">
                                    <div className="flex flex-col items-center justify-center gap-3">
                                        <ReceiptText
                                            className="w-8 h-8 text-[var(--ink-soft)]"
                                            strokeWidth={1.5}
                                        />

                                        <div className="flex flex-col items-center text-center gap-1">
                                            <p className="text-sm font-semibold text-[var(--ink)]">
                                                No payout transactions found
                                            </p>

                                            <p className="text-xs text-[var(--ink-soft)] max-w-[260px] leading-relaxed">
                                                Payout transactions will appear here once they are available.
                                            </p>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ) : table.getRowModel().rows.length > 0 ? (
                            table.getRowModel().rows.map((row) => (
                                <tr
                                    key={row.id}
                                    onClick={() => onSelectTransaction(row.original)}
                                    className="hover:bg-[var(--bg-hover)] transition-colors cursor-pointer group"
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <td
                                            key={cell.id}
                                            className={`py-4! ${cell.column.id === 'quote_id'
                                                ? 'px-6! font-mono text-xs font-semibold'
                                                : cell.column.id === 'source' || cell.column.id === 'destination' || cell.column.id === 'processing_started_at' || cell.column.id === 'completed_at'
                                                    ? 'px-4! text-xs'
                                                    : 'px-4!'
                                                }`}
                                        >
                                            <table.FlexRender cell={cell} />
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td
                                    colSpan={columns.length}
                                    className="py-12! text-center text-[var(--mute)] text-sm"
                                >
                                    No payout transactions found matching your criteria.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {totalCount > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4! py-3! border-t border-[var(--line)]">
                    <div className="text-xs sm:text-sm text-[var(--mute)]">
                        Showing{' '}
                        <span className="text-[var(--ink)] font-medium">
                            {startRecord}
                        </span>
                        {' - '}
                        <span className="text-[var(--ink)] font-medium">
                            {endRecord}
                        </span>
                        {' of '}
                        <span className="text-[var(--ink)] font-medium">
                            {totalCount}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Page Size */}
                        <select
                            value={pagination.pageSize}
                            onChange={(event) => {
                                setPagination({
                                    pageIndex: 0,
                                    pageSize: Number(event.target.value),
                                });
                            }}
                            className="h-9 rounded-md border border-[var(--line)] bg-[var(--bg-surface)] px-2! text-xs sm:text-sm text-[var(--ink)]"
                        >
                            {[7, 10, 20, 50].map((size) => (
                                <option key={size} value={size}>
                                    Show {size}
                                </option>
                            ))}
                        </select>

                        {/* Previous */}
                        <button
                            type="button"
                            disabled={pagination.pageIndex === 0}
                            onClick={() => {
                                setPagination((previous) => ({
                                    ...previous,
                                    pageIndex: previous.pageIndex - 1,
                                }));
                            }}
                            className="disabled:text-[var(--mute)] disabled:cursor-not-allowed cursor-pointer text-xs sm:text-sm"
                        >
                            Previous
                        </button>

                        {/* Current Page */}
                        <span className="text-xs sm:text-sm text-[var(--mute)] whitespace-nowrap">
                            Page {pagination.pageIndex + 1} of {totalPages}
                        </span>

                        {/* Next */}
                        <button
                            type="button"
                            disabled={pagination.pageIndex >= totalPages - 1}
                            onClick={() => {
                                setPagination((previous) => ({
                                    ...previous,
                                    pageIndex: previous.pageIndex + 1,
                                }));
                            }}
                            className="disabled:text-[var(--mute)] disabled:cursor-not-allowed cursor-pointer text-xs sm:text-sm"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
