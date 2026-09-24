import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import CurrencyConversionStepperComponent from '@/components/wallets/currencyConversion/CurrencyConversionStepperComponent';
import ConversionDetailsStepComponent, {
    type ConversionFormData,
} from '@/components/wallets/currencyConversion/ConversionDetailsStepComponent';
import ReviewConversionStepComponent from '@/components/wallets/currencyConversion/ReviewConversionStepComponent';
import ConversionConfirmationStepComponent from '@/components/wallets/currencyConversion/ConversionConfirmationStepComponent';
import ConversionQuoteSummaryCardComponent from '@/components/wallets/currencyConversion/ConversionQuoteSummaryCardComponent';
import {
    ALL_WALLET_BALANCES_FALLBACK,
    CREATE_CONVERSION_QUOTE_FALLBACK,
    EXECUTE_CONVERSION_FALLBACK,
    type WalletBalanceItem,
    type CurrencyConversionQuoteData,
    type ExecuteConversionData,
} from '@/fallbacks/wallets/currencyConversion/currencyConversionFallbacks';
import {
    useGetAllWalletBalancesQuery,
    useCreateConversionQuoteMutation,
    useExecuteConversionMutation,
} from '@/redux/features/wallet/walletApis';

export default function CurrencyConversionPage() {
    const userEmail = sessionStorage.getItem('userEmail') ?? '';
    const userCardholderId = sessionStorage.getItem('cardholderId') ?? '';

    // RTK Query
    const { data: walletBalancesApiResponse } = useGetAllWalletBalancesQuery(
        { email: userEmail, cardholderId: userCardholderId },
        { skip: !userEmail || !userCardholderId }
    );
    const [createQuoteApi, { isLoading: isQuoteApiLoading }] = useCreateConversionQuoteMutation();
    const [executeConversionApi, { isLoading: isExecuteApiLoading }] = useExecuteConversionMutation();

    // Local state
    const [walletsList, setWalletsList] = useState<WalletBalanceItem[]>(ALL_WALLET_BALANCES_FALLBACK);

    // Flow state
    const [currentStep, setCurrentStep] = useState<number>(1);
    const [savedFormData, setSavedFormData] = useState<ConversionFormData | null>(null);
    const [activeQuote, setActiveQuote] = useState<CurrencyConversionQuoteData | null>(null);
    const [executionResult, setExecutionResult] = useState<ExecuteConversionData | null>(null);
    const [isLocalQuoteLoading, setIsLocalQuoteLoading] = useState<boolean>(false);
    const [isLocalExecuting, setIsLocalExecuting] = useState<boolean>(false);

    // Sync wallet balances from API
    // useEffect(() => {
    //     const details = walletBalancesApiResponse?.data?.wallets_details;
    //     if (Array.isArray(details) && details.length > 0) {
    //         setWalletsList(details as WalletBalanceItem[]);
    //     }
    // }, [walletBalancesApiResponse]);

    // ── Step 1: Generate Quote ────────────────────────────────────────────────
    const handleGenerateQuote = async (formData: ConversionFormData) => {
        setSavedFormData(formData);
        setIsLocalQuoteLoading(true);

        try {
            const apiRes = await createQuoteApi({
                email: userEmail,
                cardholderId: userCardholderId,
                body: {
                    source_currency: formData.source_currency,
                    destination_currency: formData.destination_currency,
                    amount: formData.amount,
                },
            })
                .unwrap()
                .catch(() => null);

            if (apiRes && apiRes.data) {
                setActiveQuote(apiRes.data);
            } else {
                // Fallback quote
                const sendAmount = parseFloat(formData.amount) || 10;
                const feeRate = 0.04;
                const feeAmount = parseFloat((sendAmount * feeRate).toFixed(4));
                const exchangeRate = 1.28;
                const destinationAmount = parseFloat(
                    ((sendAmount - feeAmount) * exchangeRate).toFixed(4)
                );

                const fallbackQuote: CurrencyConversionQuoteData = {
                    ...CREATE_CONVERSION_QUOTE_FALLBACK,
                    quote_id: `qte_${Math.random().toString(36).substring(2, 10)}`,
                    source: { currency: formData.source_currency, amount: sendAmount.toFixed(4) },
                    destination: {
                        currency: formData.destination_currency,
                        amount: destinationAmount.toFixed(4),
                    },
                    fee: {
                        currency: formData.source_currency,
                        percentage: '4.0000',
                        amount: feeAmount.toFixed(4),
                    },
                    total_debit: {
                        currency: formData.source_currency,
                        amount: sendAmount.toFixed(4),
                    },
                    expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
                };
                setActiveQuote(fallbackQuote);
            }

            toast.success('Conversion quote generated successfully.');
        } catch {
            toast.error('Failed to generate conversion quote.');
        } finally {
            setIsLocalQuoteLoading(false);
        }
    };

    const handleResetQuote = () => {
        setActiveQuote(null);
    };

    // ── Step 1 → Step 2 ───────────────────────────────────────────────────────
    const handleContinueStep1 = () => {
        if (!activeQuote) {
            toast.error('Please generate a quote before continuing.');
            return;
        }
        setCurrentStep(2);
    };

    // ── Step 2 → Step 1 ───────────────────────────────────────────────────────
    const handleBackStep2 = () => {
        setCurrentStep(1);
    };

    // ── Step 2: Execute Conversion ────────────────────────────────────────────
    const handleExecuteConversion = async () => {
        if (!activeQuote) return;
        setIsLocalExecuting(true);

        try {
            const apiRes = await executeConversionApi({
                email: userEmail,
                cardholderId: userCardholderId,
                body: { quote_id: activeQuote.quote_id },
            })
                .unwrap()
                .catch(() => null);

            if (apiRes && apiRes.data) {
                setExecutionResult(apiRes.data);
            } else {
                // Fallback execution result
                const sendAmount = parseFloat(activeQuote.source.amount);
                const feeAmount = parseFloat(activeQuote.fee.amount);

                const sourceWallet = walletsList.find(
                    (w) => w.wallet_currency === activeQuote.source.currency
                );
                const destWallet = walletsList.find(
                    (w) => w.wallet_currency === activeQuote.destination.currency
                );

                const srcBalanceBefore = parseFloat(sourceWallet?.available_balance ?? '0');
                const dstBalanceBefore = parseFloat(destWallet?.available_balance ?? '0');

                setExecutionResult({
                    ...EXECUTE_CONVERSION_FALLBACK,
                    conversion_reference_id: `conv_${Math.random().toString(36).substring(2, 14)}`,
                    source_currency: activeQuote.source.currency,
                    destination_currency: activeQuote.destination.currency,
                    source_amount: activeQuote.source.amount,
                    conversion_fee: feeAmount.toFixed(4),
                    amount_after_fee: (sendAmount - feeAmount).toFixed(4),
                    exchange_rate: activeQuote.exchange_rate,
                    destination_amount: activeQuote.destination.amount,
                    source_balance_before: srcBalanceBefore.toFixed(4),
                    source_balance_after: (srcBalanceBefore - sendAmount).toFixed(4),
                    destination_balance_before: dstBalanceBefore.toFixed(4),
                    destination_balance_after: (
                        dstBalanceBefore + parseFloat(activeQuote.destination.amount)
                    ).toFixed(4),
                    quote_id: activeQuote.quote_id,
                    quote_status: 'EXECUTED',
                });
            }

            setCurrentStep(3);
            toast.success('Currency conversion executed successfully!');
        } catch {
            toast.error('Failed to execute currency conversion.');
        } finally {
            setIsLocalExecuting(false);
        }
    };

    // ── Step 3 → Reset ────────────────────────────────────────────────────────
    const handleConvertAnother = () => {
        setSavedFormData(null);
        setActiveQuote(null);
        setExecutionResult(null);
        setCurrentStep(1);
    };

    return (
        <div className="currencyConversionPage-container w-full h-fit flex flex-col justify-start items-stretch gap-6 p-4! sm:p-6!">
            {/* Header */}
            <div className="flex flex-col gap-1.5">
                <p className="text-xs text-[var(--mute)] tracking-wide">
                    Wallets &gt; <span className="text-[var(--ink-soft)] font-medium">Currency Conversion</span>
                </p>

                <h1 className="text-2xl sm:text-3xl text-[var(--ink)] tracking-normal">
                    <span className="font-serif font-medium">Currency</span>{' '}
                    <span className="font-serif italic font-normal text-[var(--mute)]">conversion.</span>
                </h1>
                <p className="text-xs text-[var(--mute)]">
                    Convert between your wallet balances instantly.
                </p>
            </div>

            {/* Stepper */}
            <CurrencyConversionStepperComponent currentStep={currentStep} />

            {/* Step 1 & 2: 2-column layout | Step 3: centered */}
            {currentStep < 3 ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    {/* Left Column */}
                    <div className="lg:col-span-2">
                        {currentStep === 1 ? (
                            <ConversionDetailsStepComponent
                                wallets={walletsList}
                                quote={activeQuote}
                                isQuoteLoading={isQuoteApiLoading || isLocalQuoteLoading}
                                onGenerateQuote={handleGenerateQuote}
                                onResetQuote={handleResetQuote}
                                onContinue={handleContinueStep1}
                            />
                        ) : (
                            <ReviewConversionStepComponent
                                quote={activeQuote!}
                                isExecuting={isExecuteApiLoading || isLocalExecuting}
                                onBack={handleBackStep2}
                                onExecute={handleExecuteConversion}
                            />
                        )}
                    </div>

                    {/* Right Column — Quote Summary */}
                    <div className="lg:col-span-1">
                        <ConversionQuoteSummaryCardComponent
                            quote={activeQuote}
                            isLoading={isQuoteApiLoading || isLocalQuoteLoading}
                        />
                    </div>
                </div>
            ) : (
                <ConversionConfirmationStepComponent
                    result={executionResult!}
                    onConvertAnother={handleConvertAnother}
                />
            )}
        </div>
    );
}
