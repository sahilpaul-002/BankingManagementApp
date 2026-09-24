import React from 'react';
import { ArrowLeft, ArrowRight, ArrowLeftRight } from 'lucide-react';
import CustomButtonComponent from '@/components/common/CustomButtonComponent';
import type { CurrencyConversionQuoteData } from '@/fallbacks/wallets/currencyConversion/currencyConversionFallbacks';

interface ReviewConversionStepComponentProps {
    quote: CurrencyConversionQuoteData;
    isExecuting: boolean;
    onBack: () => void;
    onExecute: () => void;
}

function formatTime(isoString?: string): string {
    if (!isoString) return '';
    try {
        return new Date(isoString).toLocaleString('en-US', {
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
}

interface DetailRowProps {
    label: string;
    value: React.ReactNode;
    mono?: boolean;
}

function DetailRow({ label, value, mono = false }: DetailRowProps) {
    return (
        <div className="flex flex-col gap-1">
            <span className="text-xs text-[var(--mute)] font-medium">{label}</span>
            <span
                className={`text-sm font-semibold text-[var(--ink)] ${mono ? 'font-mono tracking-wider' : ''}`}
            >
                {value}
            </span>
        </div>
    );
}

export default function ReviewConversionStepComponent({
    quote,
    isExecuting,
    onBack,
    onExecute,
}: ReviewConversionStepComponentProps) {
    return (
        <div className="w-full bg-[var(--bg-surface)] rounded-xl border border-[var(--line)] p-6 shadow-xs flex flex-col gap-6">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-soft)]">
                Review Conversion
            </h2>

            {/* Conversion visual summary */}
            <div className="flex items-center justify-center gap-4 p-5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--line)]">
                <div className="flex flex-col items-center gap-1">
                    <span className="text-xs text-[var(--mute)] font-medium">You convert</span>
                    <span className="text-xl font-bold text-[var(--ink)]">
                        {parseFloat(quote.source.amount).toFixed(4)}
                    </span>
                    <span className="text-xs font-semibold text-[var(--ink-soft)] bg-[var(--line-faint)] px-3 py-1 rounded-full border border-[var(--line)]">
                        {quote.source.currency}
                    </span>
                </div>

                <div className="flex flex-col items-center gap-1 text-[var(--gold)]">
                    <ArrowLeftRight className="w-5 h-5" />
                    <span className="text-[10px] font-mono text-[var(--mute)]">
                        {parseFloat(quote.exchange_rate).toFixed(4)}
                    </span>
                </div>

                <div className="flex flex-col items-center gap-1">
                    <span className="text-xs text-[var(--mute)] font-medium">You receive</span>
                    <span className="text-xl font-bold text-[var(--ok)]">
                        {parseFloat(quote.destination.amount).toFixed(4)}
                    </span>
                    <span className="text-xs font-semibold text-[var(--ink-soft)] bg-[var(--line-faint)] px-3 py-1 rounded-full border border-[var(--line)]">
                        {quote.destination.currency}
                    </span>
                </div>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <DetailRow
                    label="Exchange Rate"
                    value={`1 ${quote.source.currency} = ${parseFloat(quote.exchange_rate).toFixed(8)} ${quote.destination.currency}`}
                    mono
                />
                <DetailRow
                    label="Conversion Fee"
                    value={`${parseFloat(quote.fee.amount).toFixed(4)} ${quote.fee.currency} (${parseFloat(quote.fee.percentage).toFixed(2)}%)`}
                />
                <DetailRow
                    label="Total Debit"
                    value={`${parseFloat(quote.total_debit.amount).toFixed(4)} ${quote.total_debit.currency}`}
                />
                <DetailRow label="Quote Status" value={quote.quote_status} />
                <DetailRow label="Quote ID" value={quote.quote_id} mono />
                <DetailRow label="Quote Expires At" value={formatTime(quote.expires_at)} />
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-[var(--line)] flex items-center justify-between">
                <div className="w-[100px] h-[38px]">
                    <CustomButtonComponent
                        id="conversion-reviewBack-btn"
                        label={
                            <span className="flex items-center justify-center gap-1.5">
                                <ArrowLeft className="w-4 h-4" /> Back
                            </span>
                        }
                        type="button"
                        variant="outline"
                        onClick={onBack}
                        disabled={isExecuting}
                    />
                </div>
                <div className="w-[200px] h-[38px]">
                    <CustomButtonComponent
                        id="conversion-execute-btn"
                        label={
                            <span className="flex items-center justify-center gap-1.5">
                                Execute Conversion <ArrowRight className="w-4 h-4" />
                            </span>
                        }
                        type="button"
                        variant="navy"
                        onClick={onExecute}
                        showButtonLoader={isExecuting}
                    />
                </div>
            </div>
        </div>
    );
}
