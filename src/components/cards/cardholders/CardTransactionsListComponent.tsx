import React from 'react';
import { ShoppingBag, RotateCcw, CreditCard, ChevronRight, ReceiptText, ShieldAlert, ShieldCheck } from 'lucide-react';
import type { PaginationState } from '@tanstack/react-table';
import type { CardTransactionItemType, CardTransactionType, CardTransactionStatusType } from '@/types/cards/cardDetailsTypes';
import RingSpinnerLoaderComponent from '@/components/common/loaders/RingSpinnerLoaderComponent';
import CustomTooltipComponent from '@/components/common/CustomToolTipComponent';

interface CardTransactionsListComponentPropsType {
    transactions: CardTransactionItemType[];
    onSelectTransaction: (transaction: CardTransactionItemType) => void;
    cardTransactionsNotFound?: boolean | undefined;
    getCardTransactionsIsFetching: boolean;
    totalCount: number;
    pagination: PaginationState;
    setPagination: React.Dispatch<React.SetStateAction<PaginationState>>;
}

type TransactionVisualConfigType = {
    icon: typeof ShoppingBag;
    iconBackground: string;
    iconColor: string;
    amountColor: string;
    sign: string;
};

type TransactionStatusVisualConfigType = {
    backgroundColor: string;
    color: string;
};

const transactionTypeConfig: Record<string, TransactionVisualConfigType> = {
    PURCHASE: {
        icon: ShoppingBag,
        iconBackground: 'var(--ok-bg)',
        iconColor: 'var(--ok)',
        amountColor: 'var(--ink)',
        sign: '-',
    },
    REFUND: {
        icon: RotateCcw,
        iconBackground: 'var(--info-bg)',
        iconColor: 'var(--info)',
        amountColor: 'var(--ok)',
        sign: '+',
    },
    DEFAULT: {
        icon: CreditCard,
        iconBackground: 'var(--bg-subtle)',
        iconColor: 'var(--ink-soft)',
        amountColor: 'var(--ink)',
        sign: '',
    },
};

const transactionStatusConfig: Record<string, TransactionStatusVisualConfigType> = {
    SUCCESS: {
        backgroundColor: 'var(--ok-bg)',
        color: 'var(--ok)',
    },
    COMPLETED: {
        backgroundColor: 'var(--ok-bg)',
        color: 'var(--ok)',
    },
    PENDING: {
        backgroundColor: 'var(--warn-bg)',
        color: 'var(--warn)',
    },
    PROCESSING: {
        backgroundColor: 'var(--warn-bg)',
        color: 'var(--warn)',
    },
    FAILED: {
        backgroundColor: 'var(--danger-bg)',
        color: 'var(--danger)',
    },
    REVERSED: {
        backgroundColor: 'var(--warn-bg)',
        color: 'var(--warn)',
    },
};

const authStatusConfig: Record<string, TransactionStatusVisualConfigType> = {
    AUTHORIZED: {
        backgroundColor: 'var(--ok-bg)',
        color: 'var(--ok)',
    },
    EXPIRED: {
        backgroundColor: 'var(--warn-bg)',
        color: 'var(--warn)',
    },
    REJECTED: {
        backgroundColor: 'var(--danger-bg)',
        color: 'var(--danger)',
    },
    PENDING: {
        backgroundColor: 'var(--warn-bg)',
        color: 'var(--warn)',
    },
};

function maskTransactionId(transactionId: string): string {
    if (!transactionId) {
        return '—';
    }
    if (transactionId.length <= 8) {
        return transactionId;
    }
    return `${transactionId.slice(0, 4)}••••${transactionId.slice(-4)}`;
}

function parseDecimal(val: { $numberDecimal: string } | string | undefined): number {
    if (!val) return 0;
    const str = typeof val === 'object' ? val.$numberDecimal : String(val);
    const parsed = Number.parseFloat(str);
    return Number.isFinite(parsed) ? parsed : 0;
}

function formatAmount(val: { $numberDecimal: string } | string | undefined): string {
    return parseDecimal(val).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function formatTransactionLabel(value: string): string {
    if (!value) return '—';
    return value
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatTransactionDate(createdAt: string): string {
    if (!createdAt) return '—';
    const date = new Date(createdAt);
    if (Number.isNaN(date.getTime())) {
        return '—';
    }
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function CardTransactionsListComponent({
    transactions,
    onSelectTransaction,
    cardTransactionsNotFound,
    getCardTransactionsIsFetching,
    totalCount,
    pagination,
    setPagination,
}: CardTransactionsListComponentPropsType) {
    const totalPages = Math.max(1, Math.ceil(totalCount / pagination.pageSize));
    const startRecord = totalCount === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1;
    const endRecord = Math.min((pagination.pageIndex + 1) * pagination.pageSize, totalCount);

    return (
        <div className="w-full flex flex-col gap-4">
            {/* Loading State */}
            {getCardTransactionsIsFetching ? (
                <div className="w-full min-h-[220px] flex items-center justify-center py-12!">
                    <RingSpinnerLoaderComponent
                        visible={getCardTransactionsIsFetching}
                        size={32}
                        color={getComputedStyle(document.documentElement)
                            .getPropertyValue('--nav-bg')
                            .trim()}
                    />
                </div>
            ) : cardTransactionsNotFound || transactions.length === 0 ? (
                /* Empty / Not Found State */
                <div className="w-full min-h-[200px] flex flex-col items-center justify-center gap-3 py-10! bg-[var(--bg-subtle)]/50 rounded-2xl border border-[var(--line)]">
                    <ReceiptText
                        className="w-8 h-8 text-[var(--ink-soft)]"
                        strokeWidth={1.5}
                    />
                    <div className="flex flex-col items-center text-center gap-1">
                        <p className="text-sm font-semibold text-[var(--ink)]">
                            No card transactions found
                        </p>
                        <p className="text-xs text-[var(--ink-soft)] max-w-[260px] leading-relaxed">
                            Transactions made using this card will appear here once activity is available.
                        </p>
                    </div>
                </div>
            ) : (
                /* Transactions List - Similar to RecentTransactionsSection */
                <div className="flex flex-col space-y-1.5!">
                    {transactions.map((transaction: CardTransactionItemType) => {
                        const typeKey = (transaction.transaction_type || '').toUpperCase();
                        const typeConfig = transactionTypeConfig[typeKey] ?? transactionTypeConfig.DEFAULT!;
                        const statusKey = (transaction.transaction_status || '').toUpperCase();
                        const statusConfig =
                            transactionStatusConfig[statusKey] || {
                                backgroundColor: 'var(--bg-subtle)',
                                color: 'var(--ink-soft)',
                            };
                        const authKey = (transaction.authorization_status || '').toUpperCase();
                        const authConfig =
                            authStatusConfig[authKey] || {
                                backgroundColor: 'var(--bg-subtle)',
                                color: 'var(--ink-soft)',
                            };

                        const TransactionIcon = typeConfig.icon;

                        return (
                            <div
                                key={transaction._id || transaction.transaction_id}
                                onClick={() => onSelectTransaction(transaction)}
                                className="group flex items-center justify-between gap-4 p-3! rounded-xl border border-[var(--line)] bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)] transition-all cursor-pointer select-none"
                            >
                                {/* Left Side: Icon + Transaction Info */}
                                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                                    {/* Type Icon */}
                                    <div
                                        className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center border border-[var(--line)]"
                                        style={{
                                            backgroundColor: typeConfig.iconBackground,
                                        }}
                                    >
                                        <TransactionIcon
                                            className="w-5 h-5"
                                            style={{
                                                color: typeConfig.iconColor,
                                            }}
                                        />
                                    </div>

                                    {/* Type Label, ID & Date */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="font-semibold text-xs text-[var(--ink)] tracking-wide"
                                            >
                                                {formatTransactionLabel(transaction.transaction_type)}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2 mt-0.5! text-xs text-[var(--mute)]">
                                            <CustomTooltipComponent
                                                content={transaction.transaction_id}
                                                side="top"
                                                align="start"
                                                sideOffset={4}
                                                contentClassName="bg-[var(--bg-surface)] text-[var(--ink)] border border-[var(--line)] shadow-[var(--shadow-sm)] text-[11px] font-mono"
                                            >
                                                <span className="font-mono text-[11px] cursor-pointer hover:text-[var(--ink)] transition-colors underline decoration-dotted underline-offset-2">
                                                    {maskTransactionId(transaction.transaction_id)}
                                                </span>
                                            </CustomTooltipComponent>
                                            <span>•</span>
                                            <span className="text-[10px] text-[var(--mute)]">
                                                {formatTransactionDate(transaction.createdAt)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side: Amount + Statuses + Chevron */}
                                <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                                    {/* Amount */}
                                    <div className="text-right">
                                        <div className="font-mono font-bold text-sm text-[var(--ink)]">
                                            ${formatAmount(transaction.amount)}
                                            <span className="text-xs text-[var(--mute)] font-sans font-normal ml-1">
                                                {transaction.currency || 'USD'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Authorization Status Badge */}
                                    {transaction.authorization_status && (
                                        <span
                                            className="hidden sm:inline-flex px-2.5! py-1! rounded-md text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap border border-black/5"
                                            style={{
                                                backgroundColor: authConfig.backgroundColor,
                                                color: authConfig.color,
                                            }}
                                        >
                                            Auth: {formatTransactionLabel(transaction.authorization_status)}
                                        </span>
                                    )}

                                    {/* Transaction Status Badge */}
                                    <span
                                        className="inline-flex px-2.5! py-1! rounded-md text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap border border-black/5"
                                        style={{
                                            backgroundColor: statusConfig.backgroundColor,
                                            color: statusConfig.color,
                                        }}
                                    >
                                        {formatTransactionLabel(transaction.transaction_status)}
                                    </span>

                                    {/* Chevron Right */}
                                    <ChevronRight className="w-4 h-4 text-[var(--mute)] group-hover:text-[var(--ink)] group-hover:translate-x-0.5 transition-all" />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Pagination Controls */}
            {totalCount > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2! py-3! border-t border-[var(--line)]">
                    <div className="text-xs text-[var(--mute)]">
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
                            className="h-8 rounded-md border border-[var(--line)] bg-[var(--bg-surface)] px-2! text-xs text-[var(--ink)]"
                        >
                            {[5, 7, 10, 20].map((size) => (
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
                            className="disabled:text-[var(--mute)] disabled:cursor-not-allowed cursor-pointer text-xs font-medium text-[var(--ink)] hover:underline"
                        >
                            Previous
                        </button>

                        {/* Current Page */}
                        <span className="text-xs text-[var(--mute)] whitespace-nowrap">
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
                            className="disabled:text-[var(--mute)] disabled:cursor-not-allowed cursor-pointer text-xs font-medium text-[var(--ink)] hover:underline"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
