import { ArrowLeft, ArrowRight, ArrowDown, Info } from 'lucide-react';
import CustomButtonComponent from '@/components/common/CustomButtonComponent';
import type { CryptoTransactionFormDataType } from '@/types/payables/payoutTypes';

const NETWORK_LABELS: Record<string, string> = {
    ETHEREUM: 'Ethereum',
    POLYGON: 'Polygon',
};

interface CryptoReviewTransactionStepComponentProps {
    formData: CryptoTransactionFormDataType;
    onBack: () => void;
    onConfirmAndSend: () => void;
    isExecuting: boolean;
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
            <span className={`text-sm font-semibold text-[var(--ink)] ${mono ? 'font-mono tracking-wider' : ''}`}>
                {value}
            </span>
        </div>
    );
}

export default function CryptoReviewTransactionStepComponent({
    formData,
    onBack,
    onConfirmAndSend,
    isExecuting
}: CryptoReviewTransactionStepComponentProps) {
    const amount = parseFloat(formData.amount);
    const currency = formData.source_wallet_currency;
    const networkLabel = NETWORK_LABELS[formData.network] ?? formData.network;

    // Truncate address for display
    const shortAddress =
        formData.destination_address.length > 16
            ? `${formData.destination_address.slice(0, 8)}...${formData.destination_address.slice(-6)}`
            : formData.destination_address;

    return (
        <div className="w-full bg-[var(--bg-surface)] rounded-xl border border-[var(--line)] p-6! shadow-xs flex flex-col gap-6">
            {/* Header */}
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-soft)]">
                Review Transaction
            </h2>

            {/* Visual Summary */}
            <div className="flex flex-col items-center gap-2 p-5! rounded-xl bg-[var(--bg-subtle)] border border-[var(--line)]">
                <div className="flex flex-col items-center gap-0.5">
                    <span className="text-xs text-[var(--mute)] font-medium">Transfer Amount</span>
                    <span className="text-2xl font-bold text-[var(--ink)]">
                        {amount.toFixed(2)}{' '}
                        <span className="text-base font-semibold text-[var(--ink-soft)]">{currency}</span>
                    </span>
                </div>

                <ArrowDown className="w-4 h-4 text-[var(--gold)]" />

                <div className="flex items-center gap-2 px-3! py-1! rounded-full bg-[var(--line-faint)] border border-[var(--line)]">
                    <span className="text-xs font-semibold text-[var(--ink-soft)]">{networkLabel}</span>
                </div>

                <ArrowDown className="w-4 h-4 text-[var(--gold)]" />

                <div className="flex flex-col items-center gap-0.5">
                    <span className="text-xs text-[var(--mute)] font-medium">Destination</span>
                    <span className="text-sm font-bold text-[var(--ink)] font-mono">{shortAddress}</span>
                </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <DetailRow label="Transfer Amount" value={`${amount.toFixed(2)} ${currency}`} />
                <DetailRow label="Network" value={networkLabel} />
                <DetailRow label="Source Wallet" value={currency} />
                <DetailRow
                    label="Destination Address"
                    value={<span className="font-mono text-xs break-all">{formData.destination_address}</span>}
                    mono
                />
            </div>

            {/* Bottom Actions */}
            <div className="pt-4! border-t border-[var(--line)] flex items-center justify-between">
                <div className="w-[100px] h-[38px]">
                    <CustomButtonComponent
                        id="crypto-reviewBack-btn"
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
                        id="crypto-confirmAndSend-btn"
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
