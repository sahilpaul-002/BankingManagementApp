import React from 'react';
import { Info } from 'lucide-react';
import type { PayoutQuoteData } from '@/fallbacks/payables/payouts/payoutsFallbacks';

interface PayoutQuoteSummaryCardComponentProps {
    quote: PayoutQuoteData | null;
    isLoading?: boolean;
}

export default function PayoutQuoteSummaryCardComponent({
    quote,
    isLoading = false,
}: PayoutQuoteSummaryCardComponentProps) {
    const formatFormattedTime = (isoString?: string) => {
        if (!isoString) return '';
        try {
            const date = new Date(isoString);
            return date.toLocaleString('en-US', {
                month: 'numeric',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                second: '2-digit',
                hour12: true,
            });
        } catch {
            return isoString;
        }
    };

    return (
        <div className="w-full bg-[var(--bg-surface)] rounded-xl border border-[var(--line)] p-6 shadow-xs flex flex-col gap-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-soft)]">
                Summary
            </h3>

            {isLoading ? (
                <div className="py-8 flex flex-col items-center justify-center gap-2">
                    <div className="w-6 h-6 border-2 border-[var(--ink)] border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-[var(--mute)]">Generating quote...</span>
                </div>
            ) : !quote ? (
                <div className="py-6 text-xs text-[var(--gold)] font-medium">
                    Generate a quote to view the quote summary.
                </div>
            ) : (
                <div className="flex flex-col gap-4 text-xs">
                    {/* You send */}
                    <div className="flex items-center justify-between">
                        <span className="text-[var(--mute)]">You send</span>
                        <span className="font-semibold text-[var(--ink)]">
                            {parseFloat(quote.source.amount).toFixed(2)} {quote.source.currency}
                        </span>
                    </div>

                    {/* Total fees */}
                    <div className="flex items-center justify-between">
                        <span className="text-[var(--mute)]">Total fees</span>
                        <span className="font-semibold text-[var(--ink)]">
                            {parseFloat(quote.fee.amount).toFixed(2)} {quote.fee.currency}
                        </span>
                    </div>

                    {/* FX Rate */}
                    <div className="flex items-center justify-between">
                        <span className="text-[var(--mute)]">FX Rate</span>
                        <span className="font-semibold text-[var(--ink)] font-mono">
                            {parseFloat(quote.exchange_rate).toFixed(4)}
                        </span>
                    </div>

                    <div className="w-full h-[1px] bg-[var(--line)] my-1!" />

                    {/* Receives */}
                    <div className="flex items-center justify-between">
                        <span className="font-semibold text-[var(--ink)]">Receives</span>
                        <span className="font-semibold text-[var(--ink)]">
                            {parseFloat(quote.destination.amount).toFixed(2)} {quote.destination.currency}
                        </span>
                    </div>

                    {/* Total debit */}
                    <div className="flex items-center justify-between">
                        <span className="font-semibold text-[var(--ink)]">Total debit</span>
                        <span className="font-semibold text-[var(--ink)]">
                            {parseFloat(quote.total_debit.amount).toFixed(2)} {quote.total_debit.currency}
                        </span>
                    </div>

                    {/* Expiration Notice */}
                    <div className="mt-2! p-3 rounded-lg bg-[var(--bg-subtle)] border border-[var(--line)] flex items-start gap-2 text-[11px] text-[var(--ink-soft)]">
                        <Info className="w-4 h-4 shrink-0 text-[var(--ink-soft)] mt-0.5" />
                        <span>
                            Quote expires at{' '}
                            <strong className="font-semibold text-[var(--ink)]">
                                {formatFormattedTime(quote.expires_at)}
                            </strong>
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
