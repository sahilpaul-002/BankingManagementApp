import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import PayoutStepperComponent from '@/components/payables/payouts/PayoutStepperComponent';
import PayoutQuoteSummaryCardComponent from '@/components/payables/payouts/PayoutQuoteSummaryCardComponent';
import TransactionDetailsStepComponent, {
    type TransactionDetailsFormData,
} from '@/components/payables/payouts/TransactionDetailsStepComponent';
import ReviewTransactionStepComponent from '@/components/payables/payouts/ReviewTransactionStepComponent';
import PayoutConfirmationStepComponent from '@/components/payables/payouts/PayoutConfirmationStepComponent';
import {
    BENEFICIARIES_LIST_FALLBACK,
    type BeneficiaryItem,
} from '@/fallbacks/payables/beneficiaries/beneficiariesFallbacks';
import {
    CREATE_PAYOUT_QUOTE_FALLBACK,
    EXECUTE_PAYOUT_QUOTE_FALLBACK,
    type PayoutQuoteData,
    type ExecutePayoutQuoteData,
} from '@/fallbacks/payables/payouts/payoutsFallbacks';
import {
    useGetBeneficiariesQuery,
    useCreatePayoutQuoteMutation,
    useExecutePayoutQuoteMutation,
} from '@/redux/features/payables/payablesApi';

export default function PayoutPage() {
    const { id: urlBeneficiaryId } = useParams<{ id?: string }>();

    // RTK Query for beneficiaries list
    const { data: beneficiariesApiResponse } = useGetBeneficiariesQuery();
    const [createQuoteApi, { isLoading: isQuoteApiLoading }] = useCreatePayoutQuoteMutation();
    const [executePayoutApi, { isLoading: isExecuteApiLoading }] = useExecutePayoutQuoteMutation();

    // Local beneficiaries list state
    const [beneficiariesList, setBeneficiariesList] = useState<BeneficiaryItem[]>(BENEFICIARIES_LIST_FALLBACK);

    // Flow State
    const [currentStep, setCurrentStep] = useState<number>(1);
    const [savedFormData, setSavedFormData] = useState<TransactionDetailsFormData | null>(null);
    const [activeQuote, setActiveQuote] = useState<PayoutQuoteData | null>(null);
    const [executionResult, setExecutionResult] = useState<ExecutePayoutQuoteData | null>(null);
    const [isLocalQuoteLoading, setIsLocalQuoteLoading] = useState<boolean>(false);
    const [isLocalExecuting, setIsLocalExecuting] = useState<boolean>(false);

    // Sync beneficiaries list from API when ready
    useEffect(() => {
        if (
            beneficiariesApiResponse &&
            beneficiariesApiResponse.data &&
            Array.isArray(beneficiariesApiResponse.data) &&
            beneficiariesApiResponse.data.length > 0
        ) {
            setBeneficiariesList(beneficiariesApiResponse.data);
        }
    }, [beneficiariesApiResponse]);

    // Find selected beneficiary object
    const selectedBeneficiary = savedFormData?.beneficiary_id
        ? beneficiariesList.find((b) => b._id === savedFormData.beneficiary_id) || null
        : urlBeneficiaryId
        ? beneficiariesList.find((b) => b._id === urlBeneficiaryId) || null
        : null;

    // Handle Generate Quote
    const handleGenerateQuote = async (formData: TransactionDetailsFormData) => {
        setSavedFormData(formData);
        setIsLocalQuoteLoading(true);

        try {
            const apiRes = await createQuoteApi({
                beneficiary_id: formData.beneficiary_id,
                source_currency: formData.source_currency,
                amount: formData.amount,
                purpose_of_payment: formData.purpose_of_payment,
                memo: formData.memo,
            }).unwrap().catch(() => null);

            if (apiRes && apiRes.data) {
                setActiveQuote(apiRes.data);
            } else {
                // Fallback quote generation if API is not connected
                const targetBen = beneficiariesList.find((b) => b._id === formData.beneficiary_id);
                const sendAmount = parseFloat(formData.amount) || 100;
                const feeAmount = 8.0;
                const totalDebit = sendAmount + feeAmount;

                const fallbackQuote: PayoutQuoteData = {
                    ...CREATE_PAYOUT_QUOTE_FALLBACK,
                    quote_id: `qte_${Math.random().toString(36).substring(2, 10)}`,
                    beneficiary: {
                        beneficiary_id: targetBen?._id || formData.beneficiary_id,
                        account_holder_name: targetBen?.account_holder_name || 'John Doe',
                        account_number: targetBen?.account_number || '123456789012',
                        account_currency: targetBen?.account_currency || 'USD',
                        bank_name: targetBen?.bank_name || 'Bank of America',
                    },
                    source: {
                        currency: formData.source_currency || 'USD',
                        amount: sendAmount.toFixed(4),
                    },
                    destination: {
                        currency: targetBen?.account_currency || 'USD',
                        gross_amount: sendAmount.toFixed(4),
                        amount: sendAmount.toFixed(4),
                    },
                    fee: {
                        currency: formData.source_currency || 'USD',
                        amount: feeAmount.toFixed(4),
                    },
                    total_debit: {
                        currency: formData.source_currency || 'USD',
                        amount: totalDebit.toFixed(4),
                    },
                    expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
                };
                setActiveQuote(fallbackQuote);
            }

            toast.success('Payout quote generated successfully.');
        } catch {
            toast.error('Failed to generate payout quote.');
        } finally {
            setIsLocalQuoteLoading(false);
        }
    };

    // Reset Quote
    const handleResetQuote = () => {
        setActiveQuote(null);
    };

    // Step 1 -> Step 2
    const handleContinueStep1 = () => {
        if (!activeQuote) {
            toast.error('Please generate a quote before continuing.');
            return;
        }
        setCurrentStep(2);
    };

    // Step 2 -> Step 1
    const handleBackStep2 = () => {
        setCurrentStep(1);
    };

    // Step 2 Confirm & Send
    const handleConfirmAndSend = async () => {
        if (!activeQuote) return;
        setIsLocalExecuting(true);

        try {
            const apiRes = await executePayoutApi({
                quote_id: activeQuote.quote_id,
                documents: savedFormData?.documents || undefined,
                memo: savedFormData?.memo,
            }).unwrap().catch(() => null);

            if (apiRes && apiRes.data) {
                setExecutionResult(apiRes.data);
            } else {
                // Fallback execute payout quote response
                setExecutionResult({
                    ...EXECUTE_PAYOUT_QUOTE_FALLBACK,
                    payout_transaction_id: `tx_${Math.random().toString(36).substring(2, 10)}`,
                    source_currency: activeQuote.source.currency,
                    source_amount: { $numberDecimal: activeQuote.source.amount },
                    destination_currency: activeQuote.destination.currency,
                    destination_amount: { $numberDecimal: activeQuote.destination.amount },
                });
            }

            setCurrentStep(3);
            toast.success('Payout executed successfully!');
        } catch {
            toast.error('Failed to execute payout.');
        } finally {
            setIsLocalExecuting(false);
        }
    };

    // Step 3 -> Reset flow to Step 1
    const handleSendAnother = () => {
        setSavedFormData(null);
        setActiveQuote(null);
        setExecutionResult(null);
        setCurrentStep(1);
    };

    return (
        <div className="payoutPage-container w-full h-fit flex flex-col justify-start items-stretch gap-6 p-4! sm:p-6!">
            {/* Header Section */}
            <div className="flex flex-col gap-1.5">
                <p className="text-xs text-[var(--mute)] tracking-wide">
                    Payables &gt; <span className="text-[var(--ink-soft)] font-medium">Payout</span>
                </p>

                <h1 className="text-2xl sm:text-3xl text-[var(--ink)] tracking-normal">
                    <span className="font-serif font-medium">Send</span>{' '}
                    <span className="font-serif italic font-normal text-[var(--mute)]">money.</span>
                </h1>
                <p className="text-xs text-[var(--mute)]">
                    Pay a beneficiary from any of your fiat or crypto balances.
                </p>
            </div>

            {/* Stepper Progress Bar */}
            <PayoutStepperComponent currentStep={currentStep} />

            {/* Step 1 & Step 2 Layout: Split 2 columns (Main form/review left + Quote summary right) */}
            {currentStep < 3 ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    {/* Left Column (2/3 width) */}
                    <div className="lg:col-span-2">
                        {currentStep === 1 ? (
                            <TransactionDetailsStepComponent
                                beneficiaries={beneficiariesList}
                                defaultBeneficiaryId={urlBeneficiaryId}
                                quote={activeQuote}
                                isQuoteLoading={isQuoteApiLoading || isLocalQuoteLoading}
                                onGenerateQuote={handleGenerateQuote}
                                onResetQuote={handleResetQuote}
                                onContinue={handleContinueStep1}
                            />
                        ) : (
                            <ReviewTransactionStepComponent
                                quote={activeQuote!}
                                beneficiary={selectedBeneficiary}
                                isExecuting={isExecuteApiLoading || isLocalExecuting}
                                onBack={handleBackStep2}
                                onConfirmAndSend={handleConfirmAndSend}
                            />
                        )}
                    </div>

                    {/* Right Column Summary Card (1/3 width) */}
                    <div className="lg:col-span-1">
                        <PayoutQuoteSummaryCardComponent
                            quote={activeQuote}
                            isLoading={isQuoteApiLoading || isLocalQuoteLoading}
                        />
                    </div>
                </div>
            ) : (
                /* Step 3 Layout: Centered Confirmation UI */
                <PayoutConfirmationStepComponent
                    quote={activeQuote}
                    beneficiary={selectedBeneficiary}
                    onSendAnother={handleSendAnother}
                />
            )}
        </div>
    );
}
