import React, { useEffect } from 'react';
import { X, ArrowRight, ExternalLink } from 'lucide-react';
import type { PayoutTransactionItem } from '@/fallbacks/payables/payouts/payoutsFallbacks';

interface PayoutTransactionDetailsSidebarComponentProps {
    isOpen: boolean;
    onClose: () => void;
    transaction: PayoutTransactionItem | null;
}

export default function PayoutTransactionDetailsSidebarComponent({
    isOpen,
    onClose,
    transaction,
}: PayoutTransactionDetailsSidebarComponentProps) {
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

    const renderStatusBadge = (status: string) => {
        const uppercaseStatus = (status || 'PROCESSING').toUpperCase();
        if (uppercaseStatus === 'SUCCESS' || uppercaseStatus === 'COMPLETED') {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--ok-bg)] text-[var(--ok)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--ok)]"></span>
                    SUCCESS
                </span>
            );
        }
        if (uppercaseStatus === 'PROCESSING' || uppercaseStatus === 'PENDING') {
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
                {uppercaseStatus}
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
                        <span className="font-serif font-medium">Payout</span>{' '}
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
                    {/* Top Status & Amount Block */}
                    <div className="flex flex-col gap-2 p-4 bg-[var(--bg-subtle)] rounded-xl border border-[var(--line)]">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-[var(--mute)] font-medium">Transaction Status</span>
                            {renderStatusBadge(transaction.status)}
                        </div>
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-2xl font-bold text-[var(--ink)]">
                                {formatDecimal(transaction.source_amount)} {transaction.source_currency}
                            </span>
                            <ArrowRight className="w-4 h-4 text-[var(--mute)] self-center" />
                            <span className="text-lg font-semibold text-[var(--ink-soft)]">
                                {formatDecimal(transaction.destination_amount)} {transaction.destination_currency}
                            </span>
                        </div>
                    </div>

                    {/* Section: TRANSACTION SUMMARY */}
                    <div className="flex flex-col gap-3 pt-2">
                        <div className="text-xs font-semibold text-[var(--mute)] uppercase tracking-wider">
                            <span>— TRANSACTION SUMMARY</span>
                        </div>
                        <div className="grid grid-cols-2 gap-y-3 text-xs">
                            <span className="text-[var(--mute)] font-medium">Quote ID</span>
                            <span className="text-right font-mono font-semibold text-[var(--ink)] truncate" title={transaction.quote_id}>
                                {transaction.quote_id}
                            </span>

                            <span className="text-[var(--mute)] font-medium">Source Amount</span>
                            <span className="text-right font-mono font-semibold text-[var(--ink)]">
                                {formatDecimal(transaction.source_amount)} {transaction.source_currency}
                            </span>

                            <span className="text-[var(--mute)] font-medium">Destination Amount</span>
                            <span className="text-right font-mono font-semibold text-[var(--ink)]">
                                {formatDecimal(transaction.destination_amount)} {transaction.destination_currency}
                            </span>

                            <span className="text-[var(--mute)] font-medium">Exchange Rate</span>
                            <span className="text-right font-mono font-semibold text-[var(--ink)]">
                                {formatDecimal(transaction.exchange_rate)}
                            </span>

                            <span className="text-[var(--mute)] font-medium">Fee Amount</span>
                            <span className="text-right font-mono font-semibold text-[var(--ink)]">
                                {formatDecimal(transaction.fee_amount)} {transaction.source_currency}
                            </span>
                        </div>
                    </div>

                    {/* Section: BENEFICIARY & TIMESTAMPS */}
                    <div className="flex flex-col gap-3 pt-4 border-t border-[var(--line)]">
                        <div className="text-xs font-semibold text-[var(--mute)] uppercase tracking-wider">
                            <span>— TIMESTAMPS & REFERENCES</span>
                        </div>
                        <div className="grid grid-cols-2 gap-y-3 text-xs">
                            <span className="text-[var(--mute)] font-medium">Beneficiary ID</span>
                            <span className="text-right font-mono font-semibold text-[var(--ink)] truncate" title={transaction.beneficiary_id}>
                                {transaction.beneficiary_id}
                            </span>

                            <span className="text-[var(--mute)] font-medium">Provider Ref</span>
                            <span className="text-right font-mono text-[var(--ink)] truncate text-[11px]" title={transaction.provider_reference}>
                                {transaction.provider_reference || 'N/A'}
                            </span>

                            <span className="text-[var(--mute)] font-medium">Processing Started</span>
                            <span className="text-right font-semibold text-[var(--ink)]">
                                {formatDate(transaction.processing_started_at)}
                            </span>

                            <span className="text-[var(--mute)] font-medium">Completed At</span>
                            <span className="text-right font-semibold text-[var(--ink)]">
                                {formatDate(transaction.completed_at)}
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
