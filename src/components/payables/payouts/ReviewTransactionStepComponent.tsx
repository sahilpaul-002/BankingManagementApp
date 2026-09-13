import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import CustomButtonComponent from '@/components/common/CustomButtonComponent';
import type { PayoutQuoteData } from '@/fallbacks/payables/payouts/payoutsFallbacks';
import type { BeneficiaryItem } from '@/fallbacks/payables/beneficiaries/beneficiariesFallbacks';

interface ReviewTransactionStepComponentProps {
    quote: PayoutQuoteData;
    beneficiary: BeneficiaryItem | null;
    isExecuting: boolean;
    onBack: () => void;
    onConfirmAndSend: () => void;
}

export default function ReviewTransactionStepComponent({
    quote,
    beneficiary,
    isExecuting,
    onBack,
    onConfirmAndSend,
}: ReviewTransactionStepComponentProps) {
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

    const beneficiaryDisplayName = beneficiary
        ? `${beneficiary.account_holder_name} (${beneficiary.country || 'US'} • ${beneficiary.payment_method || 'SWIFT'})`
        : quote.beneficiary.account_holder_name;

    return (
        <div className="w-full bg-[var(--bg-surface)] rounded-xl border border-[var(--line)] p-6 shadow-xs flex flex-col gap-6">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-soft)]">
                Review Transaction
            </h2>

            <div className="flex flex-col gap-5 text-xs">
                {/* Source Currency */}
                <div className="flex flex-col gap-1">
                    <span className="text-[var(--mute)] font-medium">Source Currency</span>
                    <span className="text-sm font-semibold text-[var(--ink)]">{quote.source.currency}</span>
                </div>

                {/* Beneficiary */}
                <div className="flex flex-col gap-1">
                    <span className="text-[var(--mute)] font-medium">Beneficiary</span>
                    <span className="text-sm font-semibold text-[var(--ink)]">{beneficiaryDisplayName}</span>
                </div>

                {/* Transfer Amount */}
                <div className="flex flex-col gap-1">
                    <span className="text-[var(--mute)] font-medium">Transfer Amount</span>
                    <span className="text-sm font-semibold text-[var(--ink)]">
                        {parseFloat(quote.source.amount).toFixed(2)} {quote.source.currency}
                    </span>
                </div>

                {/* Receivable Amount */}
                <div className="flex flex-col gap-1">
                    <span className="text-[var(--mute)] font-medium">Receivable Amount</span>
                    <span className="text-sm font-semibold text-[var(--ink)]">
                        {parseFloat(quote.destination.amount).toFixed(2)} {quote.destination.currency}
                    </span>
                </div>

                {/* FX Rate */}
                <div className="flex flex-col gap-1">
                    <span className="text-[var(--mute)] font-medium">FX Rate</span>
                    <span className="text-sm font-semibold text-[var(--ink)] font-mono">
                        {parseFloat(quote.exchange_rate).toFixed(4)}
                    </span>
                </div>

                {/* Quote ID */}
                <div className="flex flex-col gap-1">
                    <span className="text-[var(--mute)] font-medium">Quote ID</span>
                    <span className="text-xs font-mono text-[var(--ink-soft)] tracking-wider">
                        {quote.quote_id}
                    </span>
                </div>

                {/* Quote Expires At */}
                <div className="flex flex-col gap-1">
                    <span className="text-[var(--mute)] font-medium">Quote Expires At</span>
                    <span className="text-xs font-semibold text-[var(--ink)]">
                        {formatFormattedTime(quote.expires_at)}
                    </span>
                </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-[var(--line)] flex items-center justify-between">
                <div className="w-[100px] h-[38px]">
                    <CustomButtonComponent
                        id="payout-reviewBack-btn"
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
                <div className="w-[170px] h-[38px]">
                    <CustomButtonComponent
                        id="payout-confirmAndSend-btn"
                        label={
                            <span className="flex items-center justify-center gap-1.5">
                                Confirm & Send <ArrowRight className="w-4 h-4" />
                            </span>
                        }
                        type="button"
                        variant="navy"
                        onClick={onConfirmAndSend}
                        showButtonLoader={isExecuting}
                    />
                </div>
            </div>
        </div>
    );
}
