import React from 'react';
import { Check, ArrowRight, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CustomButtonComponent from '@/components/common/CustomButtonComponent';
import type { PayoutQuoteDataType } from '@/types/payables/payoutTypes';
import type { BeneficiaryItemType } from '@/types/payables/beneficiariesTypes';

interface PayoutConfirmationStepComponentProps {
    quote: PayoutQuoteDataType | null;
    beneficiary: BeneficiaryItemType | null;
    onSendAnother: () => void;
}

interface DetailRowProps {
    label: string;
    value: React.ReactNode;
}

function DetailRow({ label, value }: DetailRowProps) {
    return (
        <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--mute)] font-medium">
                {label}
            </span>

            <span className="font-semibold text-[var(--ink)] text-right">
                {value}
            </span>
        </div>
    );
}

export default function PayoutConfirmationStepComponent({
    quote,
    beneficiary,
    onSendAnother,
}: PayoutConfirmationStepComponentProps) {
    const navigate = useNavigate();

    const amount = quote
        ? parseFloat(quote.source.amount).toFixed(2)
        : '--';

    const currency = quote
        ? quote.source.currency
        : '--';

    const beneficiaryName = beneficiary
        ? beneficiary.account_holder_name
        : quote?.beneficiary.account_holder_name;

    const handleViewStatements = () => {
        navigate('/payables/transactions');
    };

    return (
        <div className="w-full max-w-3xl mx-auto bg-[var(--bg-surface)] rounded-xl border border-[var(--line)] p-8! sm:p-12! shadow-xs flex flex-col items-center text-center gap-6 animate-[fadeIn_0.3s_ease-out]">

            {/* Success Icon */}
            <div className="w-16 h-16 rounded-full bg-[var(--ok-bg)] text-[var(--ok)] flex items-center justify-center shadow-xs">
                <Check className="w-8 h-8 stroke-[2.5]" />
            </div>

            {/* Title & Subtitle */}
            <div className="flex flex-col gap-2">
                <h2 className="text-2xl sm:text-3xl text-[var(--ink)] tracking-normal">
                    <span className="font-serif font-medium">
                        Payment
                    </span>{' '}
                    <span className="font-serif italic font-normal text-[var(--mute)]">
                        on the way.
                    </span>
                </h2>

                <p className="text-xs sm:text-sm text-[var(--ink-soft)] max-w-md mx-auto leading-relaxed">
                    <strong className="font-semibold text-[var(--ink)]">
                        {amount} {currency}
                    </strong>{' '}
                    sent to{' '}
                    <strong className="font-semibold text-[var(--ink)]">
                        {beneficiaryName}
                    </strong>
                    . We'll notify you when it settles.
                </p>
            </div>

            {/* Payment Summary Card */}
            <div className="w-full max-w-md text-left bg-[var(--bg-subtle)] border border-[var(--line)] rounded-xl p-5! flex flex-col gap-3">

                {/* Visual Payment Summary */}
                <div className="flex items-start justify-center gap-5 pb-4! border-b border-[var(--line)]">

                    {/* Amount */}
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-xs text-[var(--mute)] font-medium">
                            Amount Sent
                        </span>

                        <div className="flex justify-center items-center gap-1.5">
                            <span className="text-xl font-bold text-[var(--ink)]">
                                {amount}
                            </span>

                            <span className="text-[10px] font-semibold text-[var(--ink-soft)] bg-[var(--line-faint)] px-3! py-1! rounded-full border border-[var(--line)]">
                                {currency}
                            </span>
                        </div>
                    </div>

                    {/* Direction */}
                    <div className="flex items-center justify-center text-[var(--gold)]">
                        <Send className="w-5 h-5" />
                    </div>

                    {/* Beneficiary */}
                    <div className="flex flex-col items-center gap-1 max-w-[160px]">
                        <span className="text-xs text-[var(--mute)] font-medium">
                            Sent To
                        </span>

                        <span className="text-sm font-bold text-[var(--ink)] text-center truncate max-w-full">
                            {beneficiaryName}
                        </span>
                    </div>
                </div>

                {/* Payment Details */}
                <div className="flex flex-col gap-2.5">
                    <DetailRow
                        label="Amount"
                        value={`${amount} ${currency}`}
                    />

                    <DetailRow
                        label="Beneficiary"
                        value={beneficiaryName}
                    />
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-center gap-3 pt-2! flex-wrap">

                <div className="w-[160px] h-[38px]">
                    <CustomButtonComponent
                        id="payout-sendAnother-btn"
                        label="Send another"
                        type="button"
                        variant="outline"
                        onClick={onSendAnother}
                    />
                </div>

                <div className="w-[200px] h-[38px]">
                    <CustomButtonComponent
                        id="payout-viewStatements-btn"
                        label={
                            <span className="flex items-center justify-center gap-1.5">
                                View in transactions
                                <ArrowRight className="w-4 h-4" />
                            </span>
                        }
                        type="button"
                        variant="navy"
                        onClick={handleViewStatements}
                    />
                </div>
            </div>
        </div>
    );
}