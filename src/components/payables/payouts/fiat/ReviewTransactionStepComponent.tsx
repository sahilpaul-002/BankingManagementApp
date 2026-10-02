import React from 'react';
import { ArrowLeft, ArrowRight, ArrowLeftRight } from 'lucide-react';
import CustomButtonComponent from '@/components/common/CustomButtonComponent';
import type { PayoutQuoteDataType } from '@/types/payables/payoutTypes';
import type { BeneficiaryItemType } from '@/types/payables/beneficiariesTypes';

interface ReviewTransactionStepComponentProps {
    quote: PayoutQuoteDataType;
    beneficiary: BeneficiaryItemType | null;
    isExecuting: boolean;
    onBack: () => void;
    onConfirmAndSend: () => void;
}

interface DetailRowProps {
    label: string;
    value: React.ReactNode;
    mono?: boolean;
}

function DetailRow({ label, value, mono = false }: DetailRowProps) {
    return (
        <div className="flex flex-col gap-1">
            <span className="text-xs text-[var(--mute)] font-medium">
                {label}
            </span>

            <span
                className={`text-sm font-semibold text-[var(--ink)] ${mono ? 'font-mono tracking-wider' : ''
                    }`}
            >
                {value}
            </span>
        </div>
    );
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
        ? `${beneficiary.account_holder_name})`
        : quote.beneficiary.account_holder_name;

    return (
        <div className="w-full bg-[var(--bg-surface)] rounded-xl border border-[var(--line)] p-6! shadow-xs flex flex-col gap-6">

            {/* Header */}
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-soft)]">
                Review Transaction
            </h2>

            {/* Transaction Visual Summary */}
            <div className="flex items-center justify-center gap-4 p-5! rounded-xl bg-[var(--bg-subtle)] border border-[var(--line)]">

                {/* Source */}
                <div className="flex flex-col items-center gap-1">
                    <span className="text-xs text-[var(--mute)] font-medium">
                        Transfer Amount
                    </span>

                    <span className="text-xl font-bold text-[var(--ink)]">
                        {parseFloat(quote.source.amount).toFixed(2)}
                    </span>

                    <span className="text-xs font-semibold text-[var(--ink-soft)] bg-[var(--line-faint)] px-3! py-1! rounded-full border border-[var(--line)]">
                        {quote.source.currency}
                    </span>
                </div>

                {/* Direction / FX */}
                <div className="flex flex-col items-center gap-1 text-[var(--gold)]">
                    <ArrowLeftRight className="w-5 h-5" />

                    <span className="text-[10px] text-[var(--mute)]">
                        {parseFloat(quote.exchange_rate).toFixed(2)}
                    </span>
                </div>

                {/* Destination */}
                <div className="flex flex-col items-center gap-1">
                    <span className="text-xs text-[var(--mute)] font-medium">
                        Receivable Amount
                    </span>

                    <span className="text-xl font-bold text-[var(--ok)]">
                        {parseFloat(quote.destination.amount).toFixed(2)}
                    </span>

                    <span className="text-xs font-semibold text-[var(--ink-soft)] bg-[var(--line-faint)] px-3! py-1! rounded-full border border-[var(--line)]">
                        {quote.destination.currency}
                    </span>
                </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

                {/* Source Currency */}
                <DetailRow
                    label="Source Currency"
                    value={quote.source.currency}
                />

                {/* Beneficiary */}
                <DetailRow
                    label="Beneficiary"
                    value={beneficiaryDisplayName}
                />

                {/* Transfer Amount */}
                <DetailRow
                    label="Transfer Amount"
                    value={`${parseFloat(quote.source.amount).toFixed(2)} ${quote.source.currency}`}
                />

                {/* Receivable Amount */}
                <DetailRow
                    label="Receivable Amount"
                    value={`${parseFloat(quote.destination.amount).toFixed(2)} ${quote.destination.currency}`}
                />

                {/* FX Rate */}
                <DetailRow
                    label="FX Rate"
                    value={parseFloat(quote.exchange_rate).toFixed(2)}
                    mono
                />

                {/* Quote ID */}
                <DetailRow
                    label="Quote ID"
                    value={quote.quote_id}
                    mono
                />

                {/* Quote Expires At */}
                <DetailRow
                    label="Quote Expires At"
                    value={formatFormattedTime(quote.expires_at)}
                />
            </div>

            {/* Bottom Actions */}
            <div className="pt-4! border-t border-[var(--line)] flex items-center justify-between">

                <div className="w-[100px] h-[38px]">
                    <CustomButtonComponent
                        id="payout-reviewBack-btn"
                        label={
                            <span className="flex items-center justify-center gap-1.5">
                                <ArrowLeft className="w-4 h-4" />
                                Back
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
                                Confirm & Send
                                <ArrowRight className="w-4 h-4" />
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