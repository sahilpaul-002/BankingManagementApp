import React, { useMemo } from 'react';
import { ChevronRight, ReceiptText } from 'lucide-react';
import {
    useTable,
    tableFeatures,
    rowPaginationFeature,
    columnVisibilityFeature,
    type ColumnDef,
    type PaginationState,
} from '@tanstack/react-table';
import type { WalletTransactionItemType } from '@/types/wallets/walletTransactionsSectionTypes';
import RingSpinnerLoaderComponent from '@/components/common/loaders/RingSpinnerLoaderComponent';

const walletTableFeatures = tableFeatures({
    rowPaginationFeature,
    columnVisibilityFeature,
});

interface WalletStatementsListComponentPropsType {
    transactions: WalletTransactionItemType[];
    onSelectTransaction: (transaction: WalletTransactionItemType) => void;
    walletTransactionsNotFound?: boolean | undefined;
    getWalletTransactionsIsFetching: boolean;
    totalCount: number;
    pagination: PaginationState;
    setPagination: React.Dispatch<React.SetStateAction<PaginationState>>;
}

export default function WalletStatementsListComponent({
    transactions,
    onSelectTransaction,
    walletTransactionsNotFound,
    getWalletTransactionsIsFetching,
    totalCount,
    pagination,
    setPagination,
}: WalletStatementsListComponentPropsType) {
    // Function Format Date
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
    const formatDecimal = (
        val: { $numberDecimal: string } | string | undefined
    ) => {
        if (!val) return '0.00';

        const str =
            typeof val === 'object'
                ? val.$numberDecimal
                : String(val);

        const num = parseFloat(str);

        return isNaN(num) ? str : num.toFixed(4);
    };

    // Render Type Badge UI
    const renderTypeBadge = (type: string) => {
        const upper = (type || '').trim().toUpperCase();

        if (upper === 'LOAD') {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5! py-0.5! rounded-full text-xs font-semibold bg-[var(--ok-bg)] text-[var(--ok)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--ok)]" />
                    LOAD
                </span>
            );
        }

        if (upper === 'WITHDRAW') {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5! py-0.5! rounded-full text-xs font-semibold bg-[var(--danger-bg)] text-[var(--danger)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--danger)]" />
                    WITHDRAW
                </span>
            );
        }

        if (upper === 'RELEASE') {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5! py-0.5! rounded-full text-xs font-semibold bg-[var(--warn-bg)] text-[var(--warn)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--warn)]" />
                    RELEASE
                </span>
            );
        }

        return (
            <span className="inline-flex items-center gap-1.5 px-2.5! py-0.5! rounded-full text-xs font-semibold bg-[var(--bg-subtle)] text-[var(--ink-soft)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--mute)]" />
                {upper}
            </span>
        );
    };

    // Render Status Badge UI
    const renderStatusBadge = (status: string) => {
        const upper = (status || '').toUpperCase();

        if (upper === 'SUCCESS' || upper === 'COMPLETED') {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5! py-0.5! rounded-full text-xs font-semibold bg-[var(--ok-bg)] text-[var(--ok)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--ok)]" />
                    SUCCESS
                </span>
            );
        }

        if (upper === 'PROCESSING' || upper === 'PENDING') {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5! py-0.5! rounded-full text-xs font-semibold bg-[var(--warn-bg)] text-[var(--warn)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--warn)] animate-pulse" />
                    PROCESSING
                </span>
            );
        }

        return (
            <span className="inline-flex items-center gap-1.5 px-2.5! py-0.5! rounded-full text-xs font-semibold bg-[var(--danger-bg)] text-[var(--danger)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--danger)]" />
                {upper}
            </span>
        );
    };

    // Columns Definition
    const columns = useMemo<ColumnDef<typeof walletTableFeatures, WalletTransactionItemType>[]>(
        () => [
            {
                id: 'transaction_id',
                header: 'Transaction ID',
                accessorKey: 'transaction_id',
                cell: ({ row }) => {
                    const item = row.original;
                    return (
                        <div className="flex flex-col">
                            <span
                                className="truncate max-w-[140px]"
                                title={item.transaction_id}
                            >
                                {item.transaction_id}
                            </span>
                            <span className="text-[10px] text-[var(--mute)] font-sans font-normal truncate max-w-[140px]">
                                {item.remarks || 'No remarks'}
                            </span>
                        </div>
                    );
                },
            },
            {
                id: 'transaction_type',
                header: 'Type',
                accessorKey: 'transaction_type',
                cell: ({ row }) => renderTypeBadge(row.original.transaction_type),
            },
            {
                id: 'wallet',
                header: 'Wallet',
                cell: ({ row }) => {
                    const item = row.original;
                    return (
                        <div className="flex flex-col">
                            <span className="font-semibold text-[var(--ink)]">
                                {item.wallet_details.wallet_currency}
                            </span>
                            <span className="text-[10px] text-[var(--mute)]">
                                {item.wallet_details.wallet_type}
                            </span>
                        </div>
                    );
                },
            },
            {
                id: 'amount',
                header: 'Amount',
                accessorKey: 'amount',
                cell: ({ row }) => {
                    const item = row.original;
                    return (
                        <span className="font-mono font-semibold text-[var(--ink)]">
                            {formatDecimal(item.amount)}{' '}
                            <span className="text-[var(--ink-soft)] font-sans">
                                {item.wallet_details.wallet_currency}
                            </span>
                        </span>
                    );
                },
            },
            {
                id: 'fee',
                header: 'Fee',
                accessorKey: 'fee',
                cell: ({ row }) => {
                    const item = row.original;
                    return (
                        <span className="font-mono text-[var(--mute)]">
                            {formatDecimal(item.fee)}{' '}
                            <span className="font-sans">{item.wallet_details.wallet_currency}</span>
                        </span>
                    );
                },
            },
            {
                id: 'balance_after',
                header: 'Balance After',
                accessorKey: 'balance_after',
                cell: ({ row }) => {
                    const item = row.original;
                    return (
                        <span className="font-mono text-[var(--ink-soft)]">
                            {formatDecimal(item.balance_after)}{' '}
                            <span className="font-sans">{item.wallet_details.wallet_currency}</span>
                        </span>
                    );
                },
            },
            {
                id: 'transaction_status',
                header: 'Status',
                accessorKey: 'transaction_status',
                cell: ({ row }) => renderStatusBadge(row.original.transaction_status),
            },
            {
                id: 'createdAt',
                header: 'Date',
                accessorKey: 'createdAt',
                cell: ({ row }) => (
                    <span className="whitespace-nowrap text-[var(--mute)]">
                        {formatDate(row.original.createdAt)}
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
        features: walletTableFeatures,
        data: transactions,
        columns,
    });

    return (
        <div className="w-full bg-[var(--bg-surface)] border border-[var(--line)] rounded-xl shadow-xs overflow-hidden">
            <div className={getWalletTransactionsIsFetching || walletTransactionsNotFound ? '' : 'overflow-x-auto'}>
                <table className={`w-full text-left border-collapse ${getWalletTransactionsIsFetching || walletTransactionsNotFound ? '' : 'min-w-[900px]'}`}>
                    <thead>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <tr
                                key={headerGroup.id}
                                className="border-b border-[var(--line)] bg-[var(--bg-subtle)] text-[11px] font-semibold text-[var(--mute)] uppercase tracking-wider"
                            >
                                {headerGroup.headers.map((header) => (
                                    <th
                                        key={header.id}
                                        className={`py-3.5! ${header.id === 'transaction_id'
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
                        {getWalletTransactionsIsFetching ? (
                            <tr>
                                <td colSpan={columns.length} className="py-12!">
                                    <div className="w-full flex items-center justify-center py-6!">
                                        <RingSpinnerLoaderComponent
                                            visible={getWalletTransactionsIsFetching}
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
                        ) : walletTransactionsNotFound ? (
                            <tr>
                                <td colSpan={columns.length} className="py-12!">
                                    <div className="flex flex-col items-center justify-center gap-3">
                                        <ReceiptText
                                            className="w-8 h-8 text-[var(--ink-soft)]"
                                            strokeWidth={1.5}
                                        />

                                        <div className="flex flex-col items-center text-center gap-1">
                                            <p className="text-sm font-semibold text-[var(--ink)]">
                                                No transactions found
                                            </p>

                                            <p className="text-xs text-[var(--ink-soft)] max-w-[260px] leading-relaxed">
                                                Wallet transactions will appear here once they are available.
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
                                            className={`py-4! ${cell.column.id === 'transaction_id'
                                                ? 'px-6! font-mono text-xs font-semibold'
                                                : cell.column.id === 'wallet' || cell.column.id === 'createdAt'
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
                                    No wallet transactions found matching your criteria.
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