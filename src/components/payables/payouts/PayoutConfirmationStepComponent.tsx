import React from 'react';
import { Check, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CustomButtonComponent from '@/components/common/CustomButtonComponent';
import type { PayoutQuoteData } from '@/fallbacks/payables/payouts/payoutsFallbacks';
import type { BeneficiaryItem } from '@/fallbacks/payables/beneficiaries/beneficiariesFallbacks';

interface PayoutConfirmationStepComponentProps {
    quote: PayoutQuoteData | null;
    beneficiary: BeneficiaryItem | null;
    onSendAnother: () => void;
}

export default function PayoutConfirmationStepComponent({
    quote,
    beneficiary,
    onSendAnother,
}: PayoutConfirmationStepComponentProps) {
    const navigate = useNavigate();

    const amount = quote ? parseFloat(quote.source.amount).toFixed(2) : '100.00';
    const currency = quote ? quote.source.currency : 'USD';
    const beneficiaryName = beneficiary
        ? beneficiary.account_holder_name
        : quote?.beneficiary.account_holder_name || 'Jane Doe';

    const handleViewStatements = () => {
        navigate('/wallets/statements');
    };

    return (
        <div className="w-full max-w-3xl mx-auto bg-[var(--bg-surface)] rounded-xl border border-[var(--line)] p-8 sm:p-12 shadow-xs flex flex-col items-center justify-center text-center gap-6 animate-[fadeIn_0.3s_ease-out]">
            {/* Green Check Icon Circle */}
            <div className="w-16 h-16 rounded-full bg-[var(--ok-bg)] text-[var(--ok)] flex items-center justify-center shadow-xs">
                <Check className="w-8 h-8 stroke-[2.5]" />
            </div>

            {/* Title & Subtitle */}
            <div className="flex flex-col gap-2">
                <h2 className="text-2xl sm:text-3xl text-[var(--ink)] tracking-normal">
                    <span className="font-serif font-medium">Payment</span>{' '}
                    <span className="font-serif italic font-normal text-[var(--mute)]">on the way.</span>
                </h2>
                <p className="text-xs sm:text-sm text-[var(--ink-soft)] max-w-md mx-auto leading-relaxed">
                    <strong className="font-semibold text-[var(--ink)]">{amount} {currency}</strong> sent to{' '}
                    <strong className="font-semibold text-[var(--ink)]">{beneficiaryName}</strong>. We'll notify you when it settles.
                </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
                <div className="w-[140px] h-[38px]">
                    <CustomButtonComponent
                        id="payout-sendAnother-btn"
                        label="Send another"
                        type="button"
                        variant="outline"
                        onClick={onSendAnother}
                    />
                </div>
                <div className="w-[190px] h-[38px]">
                    <CustomButtonComponent
                        id="payout-viewStatements-btn"
                        label={
                            <span className="flex items-center justify-center gap-1.5">
                                View in statements <ArrowRight className="w-4 h-4" />
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
