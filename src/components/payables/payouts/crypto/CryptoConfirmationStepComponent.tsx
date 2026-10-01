import { Check, ArrowRight, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CustomButtonComponent from '@/components/common/CustomButtonComponent';
import type { CryptoTransactionFormData } from './CryptoTransactionDetailsStepComponent';

const SIMULATED_NETWORK_FEE = 5;

const NETWORK_LABELS: Record<string, string> = {
    ETHEREUM: 'Ethereum',
    POLYGON: 'Polygon',
};

interface CryptoConfirmationStepComponentProps {
    formData: CryptoTransactionFormData;
    transactionHash: string;
    onSendAnother: () => void;
}

interface DetailRowProps {
    label: string;
    value: React.ReactNode;
}

function DetailRow({ label, value }: DetailRowProps) {
    return (
        <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--mute)] font-medium">{label}</span>
            <span className="font-semibold text-[var(--ink)] text-right">{value}</span>
        </div>
    );
}

export default function CryptoConfirmationStepComponent({
    formData,
    transactionHash,
    onSendAnother,
}: CryptoConfirmationStepComponentProps) {
    const navigate = useNavigate();

    const amount = parseFloat(formData.amount);
    const fee = SIMULATED_NETWORK_FEE;
    const totalDebit = amount + fee;
    const currency = formData.source_wallet_currency;
    const networkLabel = NETWORK_LABELS[formData.network] ?? formData.network;

    const shortAddress =
        formData.destination_address.length > 16
            ? `${formData.destination_address.slice(0, 8)}...${formData.destination_address.slice(-6)}`
            : formData.destination_address;

    return (
        <div className="w-full max-w-3xl mx-auto bg-[var(--bg-surface)] rounded-xl border border-[var(--line)] p-8! sm:p-12! shadow-xs flex flex-col items-center text-center gap-6 animate-[fadeIn_0.3s_ease-out]">

            {/* Success Icon */}
            <div className="w-16 h-16 rounded-full bg-[var(--ok-bg)] text-[var(--ok)] flex items-center justify-center shadow-xs">
                <Check className="w-8 h-8 stroke-[2.5]" />
            </div>

            {/* Title */}
            <div className="flex flex-col gap-2">
                <h2 className="text-2xl sm:text-3xl text-[var(--ink)] tracking-normal">
                    <span className="font-serif font-medium">Crypto payment</span>{' '}
                    <span className="font-serif italic font-normal text-[var(--mute)]">sent.</span>
                </h2>
                <p className="text-xs sm:text-sm text-[var(--ink-soft)] max-w-md mx-auto leading-relaxed">
                    <strong className="font-semibold text-[var(--ink)]">
                        {amount.toFixed(2)} {currency}
                    </strong>{' '}
                    sent via{' '}
                    <strong className="font-semibold text-[var(--ink)]">{networkLabel}</strong>.
                </p>
            </div>

            {/* Summary Card */}
            <div className="w-full max-w-md text-left bg-[var(--bg-subtle)] border border-[var(--line)] rounded-xl p-5! flex flex-col gap-3">

                {/* Visual Summary */}
                <div className="flex items-center justify-center gap-5 pb-4! border-b border-[var(--line)] flex-wrap">
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-xs text-[var(--mute)] font-medium">Amount Sent</span>
                        <div className="flex items-center gap-1.5">
                            <span className="text-xl font-bold text-[var(--ink)]">{amount.toFixed(2)}</span>
                            <span className="text-[10px] font-semibold text-[var(--ink-soft)] bg-[var(--line-faint)] px-3! py-1! rounded-full border border-[var(--line)]">
                                {currency}
                            </span>
                        </div>
                    </div>

                    <div className="text-[var(--gold)] text-xs font-semibold">→</div>

                    <div className="flex flex-col items-center gap-1">
                        <span className="text-xs text-[var(--mute)] font-medium">Destination</span>
                        <span className="text-sm font-bold text-[var(--ink)] font-mono">{shortAddress}</span>
                    </div>
                </div>

                {/* Payment Details */}
                <div className="flex flex-col gap-2.5">
                    <DetailRow label="Network" value={networkLabel} />
                    <DetailRow
                        label="Destination Address"
                        value={<span className="font-mono text-[10px] break-all">{formData.destination_address}</span>}
                    />
                    <DetailRow label="Network Fee" value={`${fee.toFixed(2)} ${currency}`} />
                    <DetailRow label="Total Debit" value={`${totalDebit.toFixed(2)} ${currency}`} />
                    <div className="pt-2 border-t border-[var(--line)]">
                        <DetailRow
                            label="Transaction Hash"
                            value={
                                <span className="font-mono text-[10px] text-[var(--mute)]">{transactionHash}</span>
                            }
                        />
                        <div className="mt-1.5 flex items-center justify-between text-xs">
                            <span className="text-[var(--mute)] font-medium">Transaction Type</span>
                            <span className="px-2! py-0.5! rounded-full bg-[var(--gold)]/10 border border-[var(--gold)]/30 text-[var(--gold)] font-semibold text-[10px]">
                                SIMULATED
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Demo Notice */}
            <div className="flex items-start gap-3 p-3! rounded-lg bg-[var(--bg-subtle)] border border-[var(--line)] w-full max-w-md text-left">
                <AlertTriangle className="w-4 h-4 text-[var(--gold)] shrink-0 mt-0.5" />
                <p className="text-xs text-[var(--mute)] leading-relaxed">
                    <span className="font-semibold text-[var(--ink-soft)]">Demo transaction</span> — This transfer was
                    simulated and no blockchain transaction was submitted.
                </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-center gap-3 pt-2! flex-wrap">
                <div className="w-[160px] h-[38px]">
                    <CustomButtonComponent
                        id="crypto-sendAnother-btn"
                        label="Send another"
                        type="button"
                        variant="outline"
                        onClick={onSendAnother}
                    />
                </div>

                <div className="w-[200px] h-[38px]">
                    <CustomButtonComponent
                        id="crypto-viewTransactions-btn"
                        label={
                            <span className="flex items-center justify-center gap-1.5">
                                View in transactions
                                <ArrowRight className="w-4 h-4" />
                            </span>
                        }
                        type="button"
                        variant="navy"
                        onClick={() => navigate('/payables/transactions')}
                    />
                </div>
            </div>
        </div>
    );
}
