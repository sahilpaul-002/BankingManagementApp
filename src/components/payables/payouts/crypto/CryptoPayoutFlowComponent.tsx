import { useState } from 'react';
import CryptoTransactionDetailsStepComponent from './CryptoTransactionDetailsStepComponent';
import CryptoReviewTransactionStepComponent from './CryptoReviewTransactionStepComponent';
import CryptoConfirmationStepComponent from './CryptoConfirmationStepComponent';
import PayoutStepperComponent from '@/components/payables/payouts/fiat/PayoutStepperComponent';
import type { CryptoTransactionFormDataType, WalletBalanceItemType } from '@/types/payables/payoutTypes';

interface CryptoPayoutFlowComponentPropsType {
    wallets: WalletBalanceItemType[];
}

function generateSimulatedHash(): string {
    const hex = Math.random().toString(16).slice(2, 12);
    return `SIMULATED-${hex}`;
}

export default function CryptoPayoutFlowComponent({ wallets }: CryptoPayoutFlowComponentPropsType) {
    const [currentStep, setCurrentStep] = useState<number>(1);
    const [cryptoFormData, setCryptoFormData] = useState<CryptoTransactionFormDataType | null>(null);
    const [cryptoTransactionHash, setCryptoTransactionHash] = useState<string | null>(null);

    const handleDetailsSubmit = (data: CryptoTransactionFormDataType) => {
        setCryptoFormData(data);
        setCurrentStep(2);
    };

    const handleBack = () => {
        setCurrentStep(1);
    };

    const handleConfirmAndSend = () => {
        const hash = generateSimulatedHash();
        setCryptoTransactionHash(hash);
        setCurrentStep(3);
    };

    const handleSendAnother = () => {
        setCryptoFormData(null);
        setCryptoTransactionHash(null);
        setCurrentStep(1);
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Stepper */}
            <PayoutStepperComponent currentStep={currentStep} />

            {/* Step content */}
            {currentStep < 3 ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    <div className="lg:col-span-2">
                        {currentStep === 1 ? (
                            <CryptoTransactionDetailsStepComponent
                                wallets={wallets}
                                onSubmit={handleDetailsSubmit}
                            />
                        ) : (
                            cryptoFormData && (
                                <CryptoReviewTransactionStepComponent
                                    formData={cryptoFormData}
                                    onBack={handleBack}
                                    onConfirmAndSend={handleConfirmAndSend}
                                />
                            )
                        )}
                    </div>

                    {/* Right summary panel (Step 1 only) */}
                    {currentStep === 1 && (
                        <div className="lg:col-span-1">
                            <CryptoSummaryCard wallets={wallets} />
                        </div>
                    )}
                </div>
            ) : (
                cryptoFormData && cryptoTransactionHash && (
                    <CryptoConfirmationStepComponent
                        formData={cryptoFormData}
                        transactionHash={cryptoTransactionHash}
                        onSendAnother={handleSendAnother}
                    />
                )
            )}
        </div>
    );
}

// ── Inline summary card shown on step 1 ──────────────────────────────────────
function CryptoSummaryCard({ wallets }: { wallets: WalletBalanceItemType[] }) {
    const cryptoWallets = wallets.filter(
        (w) => w.wallet_currency === 'USDT' || w.wallet_currency === 'USDC'
    );

    return (
        <div className="w-full bg-[var(--bg-surface)] rounded-xl border border-[var(--line)] p-5! shadow-xs flex flex-col gap-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-soft)]">
                Crypto Wallets
            </h3>

            {cryptoWallets.length === 0 ? (
                <p className="text-xs text-[var(--mute)]">No crypto wallets found.</p>
            ) : (
                <div className="flex flex-col gap-3">
                    {cryptoWallets.map((w) => (
                        <div
                            key={w._id}
                            className="flex items-center justify-between p-3! rounded-lg bg-[var(--bg-subtle)] border border-[var(--line)]"
                        >
                            <div className="flex flex-col gap-0.5">
                                <span className="text-xs font-semibold text-[var(--ink)]">{w.wallet_currency}</span>
                                <span className="text-[11px] text-[var(--mute)]">
                                    {w.wallet_type}
                                </span>
                            </div>
                            <div className="text-right">
                                <span className="text-sm font-bold text-[var(--ink)]">
                                    {parseFloat(w.available_balance).toFixed(2)}
                                </span>
                                <span className="text-[11px] text-[var(--mute)] ml-1">{w.wallet_currency}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="pt-3 border-t border-[var(--line)]">
                <p className="text-[11px] text-[var(--mute)] leading-relaxed">
                    Supported networks: <strong className="text-[var(--ink-soft)]">Ethereum</strong> &{' '}
                    <strong className="text-[var(--ink-soft)]">Polygon</strong>
                </p>
            </div>
        </div>
    );
}
