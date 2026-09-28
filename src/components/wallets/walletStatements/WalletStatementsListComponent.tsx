import React from 'react';
import { ChevronRight, ReceiptText } from 'lucide-react';
import type { WalletTransactionItemType } from '@/types/wallets/walletTransactionsSectionTypes';
import RingSpinnerLoaderComponent from '@/components/common/loaders/RingSpinnerLoaderComponent';
import type { PaginationState } from '@tanstack/react-table';

interface WalletStatementsListComponentPropsType {
    transactions: WalletTransactionItemType[];
    onSelectTransaction: (transaction: WalletTransactionItemType) => void;
    walletTransactionsNotFound?: boolean | undefined;
    getWalletTransactionsIsFetching: boolean;
    totalCount: number;
    pagination: PaginationState;
    setPagination: React.Dispatch<React.SetStateAction<PaginationState>>;
}

export default function WalletStatementsListComponent({ transactions, onSelectTransaction, walletTransactionsNotFound, getWalletTransactionsIsFetching, totalCount, pagination, setPagination }: WalletStatementsListComponentPropsType) {
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
        const upper = (type || '').toUpperCase();

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
                <span className="inline-flex items-center gap-1.5 px-2.5! py-0.5! rounded-full text-xs font-semibold bg-[var(--err-bg)] text-[var(--err)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--err)]" />
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
            <span className="inline-flex items-center gap-1.5 px-2.5! py-0.5! rounded-full text-xs font-semibold bg-[var(--err-bg)] text-[var(--err)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--err)]" />
                {upper}
            </span>
        );
    };

    // Pagination Helpers
    const totalPages = Math.ceil(totalCount / pagination.pageSize);
    const startRecord = totalCount === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1;
    const endRecord = Math.min((pagination.pageIndex + 1) * pagination.pageSize, totalCount);

    return (
        <div className="w-full bg-[var(--bg-surface)] border border-[var(--line)] rounded-xl shadow-xs overflow-hidden">
            <div className={getWalletTransactionsIsFetching ? '' : 'overflow-x-auto'}>
                <table className={`w-full text-left border-collapse ${getWalletTransactionsIsFetching} ? "" : "min-w-[900px]" `}>
                    <thead>
                        <tr className="border-b border-[var(--line)] bg-[var(--bg-subtle)] text-[11px] font-semibold text-[var(--mute)] uppercase tracking-wider">
                            <th className="py-3.5! px-6!">Transaction ID</th>
                            <th className="py-3.5! px-4!">Type</th>
                            <th className="py-3.5! px-4!">Wallet</th>
                            <th className="py-3.5! px-4!">Amount</th>
                            <th className="py-3.5! px-4!">Fee</th>
                            <th className="py-3.5! px-4!">Balance After</th>
                            <th className="py-3.5! px-4!">Status</th>
                            <th className="py-3.5! px-4!">Date</th>
                            <th className="py-3.5! px-4! w-10"></th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-[var(--line)] text-sm text-[var(--ink)]">
                        {getWalletTransactionsIsFetching ? (
                            <tr>
                                <td colSpan={9} className="py-12!">
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
                                <td colSpan={9} className="py-12!">
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
                        ) : transactions.length > 0 ? (
                            transactions.map((item) => (
                                <tr
                                    key={item._id}
                                    onClick={() => onSelectTransaction(item)}
                                    className="hover:bg-[var(--bg-hover)] transition-colors cursor-pointer group"
                                >
                                    {/* TRANSACTION ID + REMARKS */}
                                    <td className="py-4! px-6! font-mono text-xs font-semibold text-[var(--ink)]">
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
                                    </td>

                                    {/* TRANSACTION TYPE */}
                                    <td className="py-4! px-4!">
                                        {renderTypeBadge(item.transaction_type)}
                                    </td>

                                    {/* WALLET TYPE + CURRENCY */}
                                    <td className="py-4! px-4! text-xs">
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-[var(--ink)]">
                                                {item.wallet_details.wallet_currency}
                                            </span>

                                            <span className="text-[10px] text-[var(--mute)]">
                                                {item.wallet_details.wallet_type}
                                            </span>
                                        </div>
                                    </td>

                                    {/* AMOUNT */}
                                    <td className="py-4! px-4! font-mono text-xs font-semibold text-[var(--ink)]">
                                        {formatDecimal(item.amount)}{' '}
                                        <span className="text-[var(--ink-soft)]">
                                            {item.wallet_details.wallet_currency}
                                        </span>
                                    </td>

                                    {/* FEE */}
                                    <td className="py-4! px-4! font-mono text-xs text-[var(--mute)]">
                                        {formatDecimal(item.fee)}{' '}
                                        {item.wallet_details.wallet_currency}
                                    </td>

                                    {/* BALANCE AFTER */}
                                    <td className="py-4! px-4! font-mono text-xs text-[var(--ink-soft)]">
                                        {formatDecimal(item.balance_after)}{' '}
                                        {item.wallet_details.wallet_currency}
                                    </td>

                                    {/* STATUS */}
                                    <td className="py-4! px-4!">
                                        {renderStatusBadge(item.transaction_status)}
                                    </td>

                                    {/* DATE */}
                                    <td className="py-4! px-4! text-xs text-[var(--mute)] whitespace-nowrap">
                                        {formatDate(item.createdAt)}
                                    </td>

                                    {/* ACTION CHEVRON */}
                                    <td className="py-4! px-4! text-right">
                                        <ChevronRight className="w-4 h-4 text-[var(--mute)] group-hover:text-[var(--ink)] transition-colors inline-block" />
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td
                                    colSpan={9}
                                    className="py-12! text-center text-[var(--mute)] text-sm"
                                >
                                    No wallet transactions found matching your criteria.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* Pgination */}
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
                            <select
                                value={pagination.pageSize}
                                onChange={(event) =>
                                    setPagination({
                                        pageIndex: 0,
                                        pageSize: Number(event.target.value),
                                    })
                                }
                                className="h-9 rounded-md border border-[var(--line)] bg-[var(--bg-surface)] px-2! text-xs sm:text-sm text-[var(--ink)]"
                            >
                                {[7, 10, 20, 50].map((size) => (
                                    <option key={size} value={size}>
                                        Show {size}
                                    </option>
                                ))}
                            </select>

                            <button
                                type="button"
                                disabled={pagination.pageIndex === 0}
                                onClick={() =>
                                    setPagination((prev) => ({
                                        ...prev,
                                        pageIndex: 0,
                                    }))
                                }
                            >
                                First
                            </button>

                            <button
                                type="button"
                                disabled={pagination.pageIndex === 0}
                                onClick={() =>
                                    setPagination((prev) => ({
                                        ...prev,
                                        pageIndex: prev.pageIndex - 1,
                                    }))
                                }
                            >
                                Previous
                            </button>

                            <span className="text-xs sm:text-sm text-[var(--mute)] whitespace-nowrap">
                                Page {pagination.pageIndex + 1} of {totalPages}
                            </span>

                            <button
                                type="button"
                                disabled={pagination.pageIndex >= totalPages - 1}
                                onClick={() =>
                                    setPagination((prev) => ({
                                        ...prev,
                                        pageIndex: prev.pageIndex + 1,
                                    }))
                                }
                            >
                                Next
                            </button>

                            <button
                                type="button"
                                disabled={pagination.pageIndex >= totalPages - 1}
                                onClick={() =>
                                    setPagination((prev) => ({
                                        ...prev,
                                        pageIndex: totalPages - 1,
                                    }))
                                }
                            >
                                Last
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}