import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useDispatch } from 'react-redux';
import PayoutStepperComponent from '@/components/payables/payouts/PayoutStepperComponent';
import PayoutQuoteSummaryCardComponent from '@/components/payables/payouts/PayoutQuoteSummaryCardComponent';
import TransactionDetailsStepComponent, {
    type TransactionDetailsFormData,
} from '@/components/payables/payouts/TransactionDetailsStepComponent';
import ReviewTransactionStepComponent from '@/components/payables/payouts/ReviewTransactionStepComponent';
import PayoutConfirmationStepComponent from '@/components/payables/payouts/PayoutConfirmationStepComponent';
import { useGetBeneficiariesQuery } from '@/redux/features/beneficiaries/beneficiariesApi';
import { useCreatePayoutQuoteMutation, useExecutePayoutQuoteMutation } from '@/redux/features/transfer/transferApis';
import { setShowInfoBanner } from '@/redux/slice/utility/utilitySlice';
import type { BeneficiaryItemType } from '@/types/payables/beneficiariesTypes';
import type { PayoutQuoteData, ExecutePayoutQuoteData } from '@/types/payables/payoutTypes';
import ShowInConsole from '@/utils/ShowInConsole';

export default function PayoutPage() {
    const { id: urlBeneficiaryId } = useParams<{ id?: string }>();

    // Configure useDispatch
    const dispatch = useDispatch();

    // ------------------------------- GET USER DETAILS FROM SESSION STORAGE ---------------------------------- \\
    // Get necessary user details from session storage
    const userEmail = sessionStorage.getItem('userEmail');
    const userId = sessionStorage.getItem('userId');

    useEffect(() => {
        // Validate session details once
        if (!userEmail || !userId) {
            dispatch(setShowInfoBanner("Application facing issue, necessary user details not present in session storage. Please re-login."));
            return;
        }
    }, [userEmail, userId]);
    // ---------------------------------- XXXXXXXXXXXXXXXXXXXXXXXXXX ---------------------------------- \\

    // ------------------------------ BENEFICIARIES RTK QUERY ------------------------------ \\
    // Beneficiaries List
    const { data: getBeneficiariesData } = useGetBeneficiariesQuery(
        { email: userEmail! },
        { skip: !userEmail }
    );
    const beneficiariesList = getBeneficiariesData?.data as BeneficiaryItemType[] ?? [];

    useEffect(() => {
        ShowInConsole("Beneficiaries list", beneficiariesList);
    }, [beneficiariesList]);
    // ------------------------------- XXXXXXXXXXXXXXXXXXXXXXXX ------------------------------- \\

    // ------------ CREATE PAYOUT QUOTE / EXECUTE PAYOUT QUOTE RTK MUTATION ------------ \\
    const [triggerCreatePayoutQuote, { isLoading: createPayoutQuoteIsLoading }] = useCreatePayoutQuoteMutation();
    const [triggerExecutePayoutQuote, { isLoading: executePayoutQuoteIsLoading }] = useExecutePayoutQuoteMutation();
    // ---------------------------- XXXXXXXXXXXXXXXXXXXX ---------------------------- \\

    // ----------------------- Payout Flow States ----------------------- \\
    const [currentStep, setCurrentStep] = useState<number>(1);
    const [savedFormData, setSavedFormData] = useState<TransactionDetailsFormData | null>(null);
    const [activeQuote, setActiveQuote] = useState<PayoutQuoteData | null>(null);
    const [executionResult, setExecutionResult] = useState<ExecutePayoutQuoteData | null>(null);
    // ----------------------- XXXXXXXXXXXXXXX ----------------------- \\

    // Find selected beneficiary object
    const selectedBeneficiary = savedFormData?.beneficiary_id
        ? beneficiariesList.find((b) => b._id === savedFormData.beneficiary_id) || null
        : urlBeneficiaryId
        ? beneficiariesList.find((b) => b._id === urlBeneficiaryId) || null
        : null;

    // Function to Create Payout Quote
    const handleGenerateQuote = async (formData: TransactionDetailsFormData) => {
        setSavedFormData(formData);

        try {
            const createPayoutQuoteResult = await triggerCreatePayoutQuote({
                email: userEmail!,
                payoutDetails: {
                    benefeciaryId: formData.beneficiary_id,
                    sourceWalletCurrency: formData.source_currency as 'USD' | 'SGD' | 'EUR',
                    sourceAmout: formData.amount,
                },
            }).unwrap();

            if (createPayoutQuoteResult?.status?.toUpperCase() !== 'SUCCESS') {
                toast.error('Failed to generate payout quote. Please try again later.');
            }

            setActiveQuote(createPayoutQuoteResult?.data as PayoutQuoteData ?? null);

            toast.success('Payout quote generated successfully.');
        } catch (err: any) {
            ShowInConsole('Create payout quote error:', err);

            const errorMessage =
                Array.isArray(err?.data?.message)
                    ? err.data.message[0]
                    : err?.data?.message ||
                    err?.message ||
                    'Failed to generate payout quote. Please try again later.';

            toast.error(errorMessage);
        }
    };

    // Reset Quote
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

    // Function to Execute Payout Quote
    const handleConfirmAndSend = async () => {
        if (!activeQuote) return;

        try {
            const executePayoutQuoteResult = await triggerExecutePayoutQuote({
                email: userEmail!,
                quoteId: activeQuote.quote_id,
            }).unwrap();

            if (executePayoutQuoteResult?.status?.toUpperCase() !== 'SUCCESS') {
                toast.error('Failed to execute payout. Please try again later.');
            }

            setExecutionResult(executePayoutQuoteResult?.data as ExecutePayoutQuoteData ?? null);

            setCurrentStep(3);
            toast.success('Payout executed successfully!');
        } catch (err: any) {
            ShowInConsole('Execute payout quote error:', err);

            const errorMessage =
                Array.isArray(err?.data?.message)
                    ? err.data.message[0]
                    : err?.data?.message ||
                    err?.message ||
                    'Failed to execute payout. Please try again later.';
            const normalizeErrorMessage = errorMessage?.toLowerCase();

            if (normalizeErrorMessage?.includes('quote') && normalizeErrorMessage?.includes('expired')) {
                toast.error('Payout quote has expired. Please generate a new quote and try again.');
            } else {
                toast.error('Failed to execute payout. Please try again later.');
            }
        }
    };

    // ── Step 3 → Reset flow to Step 1 ────────────────────────────────────────────────────────
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
                                isQuoteLoading={createPayoutQuoteIsLoading}
                                onGenerateQuote={handleGenerateQuote}
                                onResetQuote={handleResetQuote}
                                onContinue={handleContinueStep1}
                            />
                        ) : (
                            <ReviewTransactionStepComponent
                                quote={activeQuote!}
                                beneficiary={selectedBeneficiary}
                                isExecuting={executePayoutQuoteIsLoading}
                                onBack={handleBackStep2}
                                onConfirmAndSend={handleConfirmAndSend}
                            />
                        )}
                    </div>

                    {/* Right Column Summary Card (1/3 width) */}
                    <div className="lg:col-span-1">
                        <PayoutQuoteSummaryCardComponent
                            quote={activeQuote}
                            isLoading={createPayoutQuoteIsLoading}
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
