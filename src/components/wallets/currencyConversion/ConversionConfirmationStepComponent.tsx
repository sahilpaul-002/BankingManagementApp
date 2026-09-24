import React from 'react';
import { Check, ArrowRight, ArrowLeftRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CustomButtonComponent from '@/components/common/CustomButtonComponent';
import type { ExecuteConversionData } from '@/fallbacks/wallets/currencyConversion/currencyConversionFallbacks';

interface ConversionConfirmationStepComponentProps {
    result: ExecuteConversionData;
    onConvertAnother: () => void;
}

interface DetailRowProps {
    label: string;
    value: React.ReactNode;
    mono?: boolean;
}

function DetailRow({ label, value, mono = false }: DetailRowProps) {
    return (
        <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--mute)] font-medium">{label}</span>
            <span
                className={`font-semibold text-[var(--ink)] text-right ${mono ? 'font-mono' : ''}`}
            >
                {value}
            </span>
        </div>
    );
}

export default function ConversionConfirmationStepComponent({
    result,
    onConvertAnother,
}: ConversionConfirmationStepComponentProps) {
    const navigate = useNavigate();

    return (
        <div className="w-full max-w-3xl mx-auto bg-[var(--bg-surface)] rounded-xl border border-[var(--line)] p-8 sm:p-12 shadow-xs flex flex-col items-center text-center gap-6 animate-[fadeIn_0.3s_ease-out]">
            {/* Success Icon */}
            <div className="w-16 h-16 rounded-full bg-[var(--ok-bg)] text-[var(--ok)] flex items-center justify-center shadow-xs">
                <Check className="w-8 h-8 stroke-[2.5]" />
            </div>

            {/* Title */}
            <div className="flex flex-col gap-2">
                <h2 className="text-2xl sm:text-3xl text-[var(--ink)] tracking-normal">
                    <span className="font-serif font-medium">Conversion</span>{' '}
                    <span className="font-serif italic font-normal text-[var(--mute)]">complete.</span>
                </h2>
                <p className="text-xs sm:text-sm text-[var(--ink-soft)] max-w-md mx-auto leading-relaxed">
                    Successfully converted{' '}
                    <strong className="font-semibold text-[var(--ink)]">
                        {parseFloat(result.source_amount).toFixed(4)} {result.source_currency}
                    </strong>{' '}
                    to{' '}
                    <strong className="font-semibold text-[var(--ok)]">
                        {parseFloat(result.destination_amount).toFixed(4)} {result.destination_currency}
                    </strong>
                    .
                </p>
            </div>

            {/* Conversion Summary Card */}
            <div className="w-full max-w-md text-left bg-[var(--bg-subtle)] border border-[var(--line)] rounded-xl p-5 flex flex-col gap-3">
                {/* Visual from → to */}
                <div className="flex items-center justify-center gap-3 pb-3 border-b border-[var(--line)]">
                    <div className="flex flex-col items-center gap-0.5">
                        <span className="text-lg font-bold text-[var(--ink)]">
                            {parseFloat(result.source_amount).toFixed(4)}
                        </span>
                        <span className="text-[10px] font-semibold text-[var(--ink-soft)] bg-[var(--line-faint)] px-2 py-0.5 rounded-full border border-[var(--line)]">
                            {result.source_currency}
                        </span>
                    </div>
                    <ArrowLeftRight className="w-4 h-4 text-[var(--gold)]" />
                    <div className="flex flex-col items-center gap-0.5">
                        <span className="text-lg font-bold text-[var(--ok)]">
                            {parseFloat(result.destination_amount).toFixed(4)}
                        </span>
                        <span className="text-[10px] font-semibold text-[var(--ink-soft)] bg-[var(--line-faint)] px-2 py-0.5 rounded-full border border-[var(--line)]">
                            {result.destination_currency}
                        </span>
                    </div>
                </div>

                <div className="flex flex-col gap-2.5">
                    <DetailRow
                        label="Reference ID"
                        value={result.conversion_reference_id}
                        mono
                    />
                    <DetailRow
                        label="Exchange Rate"
                        value={`${parseFloat(result.exchange_rate).toFixed(8)}`}
                        mono
                    />
                    <DetailRow
                        label="Conversion Fee"
                        value={`${parseFloat(result.conversion_fee).toFixed(4)} ${result.source_currency}`}
                    />
                    <DetailRow
                        label="Amount after Fee"
                        value={`${parseFloat(result.amount_after_fee).toFixed(4)} ${result.source_currency}`}
                    />

                    <div className="w-full h-px bg-[var(--line)] my-0.5!" />

                    <DetailRow
                        label="Source Balance Before"
                        value={`${parseFloat(result.source_balance_before).toFixed(4)} ${result.source_currency}`}
                    />
                    <DetailRow
                        label="Source Balance After"
                        value={`${parseFloat(result.source_balance_after).toFixed(4)} ${result.source_currency}`}
                    />
                    <DetailRow
                        label="Destination Balance Before"
                        value={`${parseFloat(result.destination_balance_before).toFixed(4)} ${result.destination_currency}`}
                    />
                    <DetailRow
                        label="Destination Balance After"
                        value={`${parseFloat(result.destination_balance_after).toFixed(4)} ${result.destination_currency}`}
                    />
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-center gap-3 flex-wrap">
                <div className="w-[160px] h-[38px]">
                    <CustomButtonComponent
                        id="conversion-convertAnother-btn"
                        label="Convert another"
                        type="button"
                        variant="outline"
                        onClick={onConvertAnother}
                    />
                </div>
                <div className="w-[200px] h-[38px]">
                    <CustomButtonComponent
                        id="conversion-viewStatements-btn"
                        label={
                            <span className="flex items-center justify-center gap-1.5">
                                View in statements <ArrowRight className="w-4 h-4" />
                            </span>
                        }
                        type="button"
                        variant="navy"
                        onClick={() => navigate('/wallets/statements')}
                    />
                </div>
            </div>
        </div>
    );
}
