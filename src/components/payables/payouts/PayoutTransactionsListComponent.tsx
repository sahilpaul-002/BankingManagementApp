import React from 'react';
import { ChevronRight, ArrowRight } from 'lucide-react';
import type { PayoutTransactionItem } from '@/fallbacks/payables/payouts/payoutsFallbacks';

interface PayoutTransactionsListComponentProps {
    transactions: PayoutTransactionItem[];
    onSelectTransaction: (transaction: PayoutTransactionItem) => void;
}

export default function PayoutTransactionsListComponent({
    transactions,
    onSelectTransaction,
}: PayoutTransactionsListComponentProps) {
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

    const formatDecimal = (val: { $numberDecimal: string } | string | undefined) => {
        if (!val) return '0.00';
        const str = typeof val === 'object' ? val.$numberDecimal : String(val);
        const num = parseFloat(str);
        return isNaN(num) ? str : num.toFixed(2);
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
        <div className="w-full bg-[var(--bg-surface)] border border-[var(--line)] rounded-xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[980px]">
                    <thead>
                        <tr className="border-b border-[var(--line)] bg-[var(--bg-subtle)] text-[11px] font-semibold text-[var(--mute)] uppercase tracking-wider">
                            <th className="py-3.5! px-6!">Quote ID</th>
                            <th className="py-3.5! px-4!">Source</th>
                            <th className="py-3.5! px-4!">Destination</th>
                            <th className="py-3.5! px-4!">Ex. Rate</th>
                            <th className="py-3.5! px-4!">Fee</th>
                            <th className="py-3.5! px-4!">Status</th>
                            <th className="py-3.5! px-4!">Started At</th>
                            <th className="py-3.5! px-4!">Completed At</th>
                            <th className="py-3.5! px-4! w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--line)] text-sm text-[var(--ink)]">
                        {transactions.length > 0 ? (
                            transactions.map((item) => (
                                <tr
                                    key={item._id}
                                    onClick={() => onSelectTransaction(item)}
                                    className="hover:bg-[var(--bg-hover)] transition-colors cursor-pointer group"
                                >
                                    {/* QUOTE ID */}
                                    <td className="py-4! px-6! font-mono text-xs font-semibold text-[var(--ink)]">
                                        <div className="flex flex-col">
                                            <span>{item.quote_id}</span>
                                            <span className="text-[10px] text-[var(--mute)] font-sans font-normal truncate max-w-[150px]">
                                                {item.remarks || 'No remarks'}
                                            </span>
                                        </div>
                                    </td>

                                    {/* SOURCE CURRENCY & AMOUNT */}
                                    <td className="py-4! px-4! text-xs">
                                        <div className="font-semibold text-[var(--ink)]">
                                            {formatDecimal(item.source_amount)}{' '}
                                            <span className="font-bold text-[var(--ink-soft)]">
                                                {item.source_currency}
                                            </span>
                                        </div>
                                    </td>

                                    {/* DESTINATION CURRENCY & AMOUNT */}
                                    <td className="py-4! px-4! text-xs">
                                        <div className="font-semibold text-[var(--ink)] flex items-center gap-1">
                                            <ArrowRight className="w-3 h-3 text-[var(--mute)]" />
                                            {formatDecimal(item.destination_amount)}{' '}
                                            <span className="font-bold text-[var(--ink-soft)]">
                                                {item.destination_currency}
                                            </span>
                                        </div>
                                    </td>

                                    {/* EXCHANGE RATE */}
                                    <td className="py-4! px-4! font-mono text-xs text-[var(--ink-soft)]">
                                        {formatDecimal(item.exchange_rate)}
                                    </td>

                                    {/* FEE AMOUNT */}
                                    <td className="py-4! px-4! font-mono text-xs text-[var(--mute)]">
                                        {formatDecimal(item.fee_amount)} {item.source_currency}
                                    </td>

                                    {/* STATUS */}
                                    <td className="py-4! px-4!">
                                        {renderStatusBadge(item.status)}
                                    </td>

                                    {/* PROCESSING STARTED AT */}
                                    <td className="py-4! px-4! text-xs text-[var(--mute)] whitespace-nowrap">
                                        {formatDate(item.processing_started_at)}
                                    </td>

                                    {/* COMPLETED AT */}
                                    <td className="py-4! px-4! text-xs text-[var(--mute)] whitespace-nowrap">
                                        {formatDate(item.completed_at)}
                                    </td>

                                    {/* ACTION CHEVRON */}
                                    <td className="py-4! px-4! text-right">
                                        <ChevronRight className="w-4 h-4 text-[var(--mute)] group-hover:text-[var(--ink)] transition-colors inline-block" />
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={9} className="py-12 text-center text-[var(--mute)]">
                                    No payout transactions found matching your criteria.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
