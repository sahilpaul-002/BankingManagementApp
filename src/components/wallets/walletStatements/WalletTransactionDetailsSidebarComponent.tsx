import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import type { WalletTransactionItem } from '@/fallbacks/wallets/walletStatements/walletStatementsFallbacks';

interface WalletTransactionDetailsSidebarComponentProps {
    isOpen: boolean;
    onClose: () => void;
    transaction: WalletTransactionItem | null;
}

export default function WalletTransactionDetailsSidebarComponent({
    isOpen,
    onClose,
    transaction,
}: WalletTransactionDetailsSidebarComponentProps) {
    // Lock background scroll when drawer is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen || !transaction) return null;

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
                second: '2-digit',
            });
        } catch {
            return dateStr;
        }
    };

    const formatDecimal = (val: { $numberDecimal: string } | string | undefined) => {
        if (!val) return '0.00';
        const str = typeof val === 'object' ? val.$numberDecimal : String(val);
        const num = parseFloat(str);
        return isNaN(num) ? str : num.toFixed(4);
    };

    const renderTypeBadge = (type: string) => {
        const upper = (type || '').toUpperCase();
        if (upper === 'LOAD') {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--ok-bg)] text-[var(--ok)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--ok)]"></span>
                    LOAD
                </span>
            );
        }
        if (upper === 'WITHDRAW') {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--err-bg)] text-[var(--err)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--err)]"></span>
                    WITHDRAW
                </span>
            );
        }
        if (upper === 'RELEASE') {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--warn-bg)] text-[var(--warn)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--warn)]"></span>
                    RELEASE
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--bg-subtle)] text-[var(--ink-soft)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--mute)]"></span>
                {upper}
            </span>
        );
    };

    const renderStatusBadge = (status: string) => {
        const upper = (status || '').toUpperCase();
        if (upper === 'SUCCESS' || upper === 'COMPLETED') {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--ok-bg)] text-[var(--ok)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--ok)]"></span>
                    SUCCESS
                </span>
            );
        }
        if (upper === 'PROCESSING' || upper === 'PENDING') {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--warn-bg)] text-[var(--warn)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--warn)] animate-pulse"></span>
                    PROCESSING
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--err-bg)] text-[var(--err)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--err)]"></span>
                {upper}
            </span>
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-200"
                onClick={onClose}
            />

            {/* Right Drawer Panel */}
            <div className="relative z-10 w-full max-w-md h-full bg-[var(--bg-surface)] border-l border-[var(--line)] shadow-2xl flex flex-col justify-between overflow-y-auto animate-[slideInRight_0.25s_ease-out]">
                <style>{`
                    @keyframes slideInRight {
                        from { transform: translateX(100%); }
                        to { transform: translateX(0); }
                    }
                `}</style>

                {/* Sidebar Header */}
                <div className="p-6! border-b border-[var(--line)] flex items-center justify-between bg-[var(--bg-surface)]">
                    <h3 className="text-xl font-normal text-[var(--ink)] tracking-normal">
                        <span className="font-serif font-medium">Wallet</span>{' '}
                        <span className="font-serif italic font-normal">transaction details</span>
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-[var(--mute)] hover:text-[var(--ink)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
                        aria-label="Close details"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content Body */}
                <div className="p-6! flex-1 flex flex-col gap-6 overflow-y-auto">
                    {/* Top Amount & Type Block */}
                    <div className="flex flex-col gap-2 p-4 bg-[var(--bg-subtle)] rounded-xl border border-[var(--line)]">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-[var(--mute)] font-medium">Transaction Type</span>
                            {renderTypeBadge(transaction.transaction_type)}
                        </div>
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-2xl font-bold text-[var(--ink)]">
                                {formatDecimal(transaction.amount)}{' '}
                                {transaction.wallet_details.wallet_currency}
                            </span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                            <span className="text-xs text-[var(--mute)] font-medium">Status</span>
                            {renderStatusBadge(transaction.transaction_status)}
                        </div>
                    </div>

                    {/* Section: TRANSACTION SUMMARY */}
                    <div className="flex flex-col gap-3 pt-2">
                        <div className="text-xs font-semibold text-[var(--mute)] uppercase tracking-wider">
                            <span>— TRANSACTION SUMMARY</span>
                        </div>
                        <div className="grid grid-cols-2 gap-y-3 text-xs">
                            <span className="text-[var(--mute)] font-medium">Transaction ID</span>
                            <span
                                className="text-right font-mono font-semibold text-[var(--ink)] truncate"
                                title={transaction.transaction_id}
                            >
                                {transaction.transaction_id}
                            </span>

                            <span className="text-[var(--mute)] font-medium">Wallet Type</span>
                            <span className="text-right font-semibold text-[var(--ink)]">
                                {transaction.wallet_details.wallet_type}
                            </span>

                            <span className="text-[var(--mute)] font-medium">Currency</span>
                            <span className="text-right font-semibold text-[var(--ink)]">
                                {transaction.wallet_details.wallet_currency}
                            </span>

                            <span className="text-[var(--mute)] font-medium">Amount</span>
                            <span className="text-right font-mono font-semibold text-[var(--ink)]">
                                {formatDecimal(transaction.amount)}{' '}
                                {transaction.wallet_details.wallet_currency}
                            </span>

                            <span className="text-[var(--mute)] font-medium">Fee</span>
                            <span className="text-right font-mono font-semibold text-[var(--ink)]">
                                {formatDecimal(transaction.fee)}{' '}
                                {transaction.wallet_details.wallet_currency}
                            </span>

                            <span className="text-[var(--mute)] font-medium">Balance After</span>
                            <span className="text-right font-mono font-semibold text-[var(--ink)]">
                                {formatDecimal(transaction.balance_after)}{' '}
                                {transaction.wallet_details.wallet_currency}
                            </span>
                        </div>
                    </div>

                    {/* Section: TIMESTAMPS */}
                    <div className="flex flex-col gap-3 pt-4 border-t border-[var(--line)]">
                        <div className="text-xs font-semibold text-[var(--mute)] uppercase tracking-wider">
                            <span>— TIMESTAMPS</span>
                        </div>
                        <div className="grid grid-cols-2 gap-y-3 text-xs">
                            <span className="text-[var(--mute)] font-medium">Created At</span>
                            <span className="text-right font-semibold text-[var(--ink)]">
                                {formatDate(transaction.createdAt)}
                            </span>
                        </div>
                    </div>

                    {/* Section: REMARKS */}
                    <div className="flex flex-col gap-2 pt-4 border-t border-[var(--line)]">
                        <div className="text-xs font-semibold text-[var(--mute)] uppercase tracking-wider">
                            <span>— REMARKS</span>
                        </div>
                        <p className="text-xs text-[var(--ink-soft)] bg-[var(--bg-subtle)] p-3 rounded-lg border border-[var(--line)] leading-relaxed">
                            {transaction.remarks || 'No additional remarks.'}
                        </p>
                    </div>
                </div>

                {/* Footer Close */}
                <div className="p-6! border-t border-[var(--line)] bg-[var(--bg-surface)]">
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full py-2.5 px-4 bg-[var(--bg-subtle)] border border-[var(--line)] hover:bg-[var(--bg-hover)] text-[var(--ink)] text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
