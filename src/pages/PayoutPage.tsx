import { useState, useEffect, Activity } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useDispatch } from 'react-redux';
import PayoutStepperComponent from '@/components/payables/payouts/fiat/PayoutStepperComponent';
import PayoutQuoteSummaryCardComponent from '@/components/payables/payouts/fiat/PayoutQuoteSummaryCardComponent';
import TransactionDetailsStepComponent, {
    type TransactionDetailsFormData,
} from '@/components/payables/payouts/fiat/TransactionDetailsStepComponent';
import ReviewTransactionStepComponent from '@/components/payables/payouts/fiat/ReviewTransactionStepComponent';
import PayoutConfirmationStepComponent from '@/components/payables/payouts/fiat/PayoutConfirmationStepComponent';
import CryptoPayoutFlowComponent from '@/components/payables/payouts/crypto/CryptoPayoutFlowComponent';
import { useGetBeneficiariesQuery } from '@/redux/features/beneficiaries/beneficiariesApi';
import { useCreatePayoutQuoteMutation, useCryptoBeneficiaryTransferMutation, useExecutePayoutQuoteMutation } from '@/redux/features/transfer/transferApis';
import { setShowInfoBanner } from '@/redux/slice/utility/utilitySlice';
import type { BeneficiaryItemType } from '@/types/payables/beneficiariesTypes';
import type { PayoutQuoteData, ExecutePayoutQuoteData, AllWalletBalancesResponseDataType, WalletBalanceItemType, CryptoTransactionFormDataType } from '@/types/payables/payoutTypes';
import ShowInConsole from '@/utils/ShowInConsole';
import { useGetAllWalletBalancesQuery } from '@/redux/features/wallet/walletApis';
import PageLoaderComponent from '@/components/common/loaders/PageLoaderComponent';
import CryptoSummaryCard from '@/components/payables/payouts/crypto/CryptoSummaryCard';
import CryptoTransactionDetailsStepComponent from '@/components/payables/payouts/crypto/CryptoTransactionDetailsStepComponent';
import CryptoReviewTransactionStepComponent from '@/components/payables/payouts/crypto/CryptoReviewTransactionStepComponent';
import CryptoConfirmationStepComponent from '@/components/payables/payouts/crypto/CryptoConfirmationStepComponent';

type PaymentType = 'FIAT' | 'CRYPTO';

function generateSimulatedHash(): string {
    const hex = Math.random().toString(16).slice(2, 12);
    return `SIMULATED-${hex}`;
}

export default function PayoutPage() {
    const { id: urlBeneficiaryId } = useParams<{ id?: string }>();

    // Configure useDispatch
    const dispatch = useDispatch();

    // ------------------------------- GET EMAIL FROM SESSION STORAGE ---------------------------------- \\
    // Get necessary user details from session storage
    const userEmail = sessionStorage.getItem('userEmail');
    const userId = sessionStorage.getItem("userId")
    const userCardholderId = sessionStorage.getItem("cardholderId")
    let userWalletId = sessionStorage.getItem('walletId');

    useEffect(() => {
        // Validate email once
        if (!userEmail || !userId || !userCardholderId || !userWalletId) {
            dispatch(setShowInfoBanner("Application facing issue, necessary user details not present in session storage. Please re-login."));
            return;
        }
    }, [userEmail, userId, userCardholderId, userWalletId]);
    // ---------------------------------- XXXXXXXXXXXXXXXXXXXXXXXXXX ---------------------------------- \\

    // ------------------------------ ALL WALLETS BALANCES RTK QUERY ------------------------------ \\
    // User All Wallets Balances
    const { data: getAllWalletsBalancesData, isLoading: getAllWalletsBanalcesIsLoading, isFetching: getAllWalletsBanalcesIsFetching, isError: getAllWalletsBalancesIsError, error: getAllWalletsBalancesError, isSuccess: getAllWalletsBalancesIsSuccess } = useGetAllWalletBalancesQuery({ email: userEmail!, cardholderId: userCardholderId! }, { skip: !userEmail || !userCardholderId }
    );
    const userAllWalletsBalances = getAllWalletsBalancesData?.data as AllWalletBalancesResponseDataType ?? [];
    const userWalletsBalancesList = userAllWalletsBalances?.wallets_details as WalletBalanceItemType[]
    const allWalletsBalancesNotFound =
        getAllWalletsBalancesIsError &&
        getAllWalletsBalancesError &&
        getAllWalletsBalancesError != null &&
        "status" in getAllWalletsBalancesError &&
        getAllWalletsBalancesError?.status === 404 &&
        typeof getAllWalletsBalancesError?.data === "object" &&
        getAllWalletsBalancesError?.data !== null &&
        "status" in getAllWalletsBalancesError?.data &&
        getAllWalletsBalancesError?.data.status === "NOT_FOUND";
    useEffect(() => {
        ShowInConsole("All wallet balances", userAllWalletsBalances);
    }, [userAllWalletsBalances]);
    // ------------------------------- XXXXXXXXXXXXXXXXXXXX ------------------------------- \\ 

    // ------------------------------ GET BENEFICIARIES RTK QUERY ------------------------------ \\
    // Get Beneficiaries List
    const { data: getBeneficiariesData, isLoading: getBeneficiariesIsLoading, isFetching: getBeneficiariesIsFetching, isError: getBeneficiariesIsError, error: getBeneficiariesError, isSuccess: getBeneficiariesIsSuccess } = useGetBeneficiariesQuery({ email: userEmail! }, { skip: !userEmail });
    const beneficiariesList = getBeneficiariesData?.data as BeneficiaryItemType[] ?? [];
    const beneficiariesListNotFound =
        getBeneficiariesIsError &&
        getBeneficiariesError &&
        getBeneficiariesError != null &&
        "status" in getBeneficiariesError &&
        getBeneficiariesError?.status === 404 &&
        typeof getBeneficiariesError?.data === "object" &&
        getBeneficiariesError?.data !== null &&
        "status" in getBeneficiariesError?.data &&
        getBeneficiariesError?.data.status === "NOT_FOUND";

    useEffect(() => {
        ShowInConsole("Beneficiaries list", beneficiariesList);
    }, [beneficiariesList]);
    // ------------------------------- XXXXXXXXXXXXXXXXXXXXXXXX ------------------------------- \\

    // ------------ CREATE PAYOUT QUOTE / EXECUTE PAYOUT QUOTE / CRYPTO BENEFICIARY TRANSFER RTK MUTATION ------------ \\
    const [triggerCreatePayoutQuote, { isLoading: createPayoutQuoteIsLoading }] = useCreatePayoutQuoteMutation();
    const [triggerExecutePayoutQuote, { isLoading: executePayoutQuoteIsLoading }] = useExecutePayoutQuoteMutation();
    const [triggerCryptoBeneficiaryTransfer, { isLoading: cryptoBeneficiaryTransferIsLoading }] = useCryptoBeneficiaryTransferMutation();
    // ---------------------------- XXXXXXXXXXXXXXXXXXXX ---------------------------- \\

    // ----------------------- Payout Flow States ----------------------- \\
    const [paymentType, setPaymentType] = useState<PaymentType>('FIAT');
    const [currentStep, setCurrentStep] = useState<number>(1);
    const [savedFormData, setSavedFormData] = useState<TransactionDetailsFormData | null>(null);
    const [activeQuote, setActiveQuote] = useState<PayoutQuoteData | null>(null);
    const [executionResult, setExecutionResult] = useState<ExecutePayoutQuoteData | null>(null);
    // ----------------------- XXXXXXXXXXXXXXX ----------------------- \\

    // ------------------------ Fiat Beneficiary Payout ------------------------ \\
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

            toast.error('Failed to generate payout quote. Please try again later.');
        }
    };

    // Reset Quote
    const handleResetQuote = () => {
        setActiveQuote(null);
    };

    // ── Step 1 → Step 2 ────────────────
    const handleContinueStep1 = () => {
        if (!activeQuote) {
            toast.error('Please generate a quote before continuing.');
            return;
        }
        setCurrentStep(2);
    };

    // ── Step 2 → Step 1 ────────────────
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

            if (normalizeErrorMessage?.includes('payout quote has expired')) {
                toast.error('Payout quote has expired. Please generate a new quote and try again.');
            } else {
                toast.error('Failed to execute payout. Please try again later.');
            }
        }
    };

    // ── Step 3 → Reset flow to Step 1 ────────────────
    const handleSendAnother = () => {
        setSavedFormData(null);
        setActiveQuote(null);
        setExecutionResult(null);
        setCurrentStep(1);
    };
    // ----------------------------- XXXXXXXXXXXXXXXXXXXXXXXXX ----------------------------- \\

    // ------------------------- Crypto Beneficiary Transfer ------------------------- \\
    // Fucntion to handle crypto beneficiary transfer
    const handleCryptoTransfer = async (formData: CryptoTransactionFormDataType) => {
        const email = sessionStorage.getItem('userEmail');

        if (!email) {
            dispatch(setShowInfoBanner("Application facing issue, necessary user details not present in session storage. Please re-login."));
            return;
        }

        try {
            const result = await triggerCryptoBeneficiaryTransfer({
                email,
                transferDetails: {
                    sourceCurrency: formData.source_wallet_currency,
                    destinationNetwork: formData.network,
                    destinationAddress: formData.destination_address,
                    amount: formData.amount,
                },
            }).unwrap();

            console.log('Crypto beneficiary transfer response:', result);

            return result;
        } catch (error) {
            console.error('Crypto beneficiary transfer failed:', error);
            throw error;
        }
    };

    const [cryptoCurrentStep, setCryptoCurrentStep] = useState<number>(1);
    const [cryptoFormData, setCryptoFormData] = useState<CryptoTransactionFormDataType | null>(null);
    const [cryptoTransactionHash, setCryptoTransactionHash] = useState<string | null>(null);

    const handleCryptoDetailsSubmit = (data: CryptoTransactionFormDataType) => {
        setCryptoFormData(data);
        setCryptoCurrentStep(2);
    };

    const handleCrytoBack = () => {
        setCryptoCurrentStep(1);
    };

    const handleCryptoConfirmAndSend = async () => {
        if (!cryptoFormData) return;

        try {
            const result = await handleCryptoTransfer(cryptoFormData);

            if (!result) {
                return;
            }

            const hash = generateSimulatedHash();

            setCryptoTransactionHash(hash);
            setCryptoCurrentStep(3);

            toast.success('Crypto transfer executed successfully!');
        } catch (error: any) {
            ShowInConsole('Crypto beneficiary transfer error:', error);

            toast.error('Failed to execute crypto transfer. Please try again.');
        }
    };

    const handleCryptoSendAnother = () => {
        setCryptoFormData(null);
        setCryptoTransactionHash(null);
        setCryptoCurrentStep(1);
    };
    // ------------------------ XXXXXXXXXXXXXXXXXXXXXX ------------------------ \\

    return (
        <>
            {/* Page Loader */}
            <Activity mode={(getAllWalletsBanalcesIsLoading || getBeneficiariesIsLoading) ? "visible" : "hidden"}>
                <PageLoaderComponent showPageLoader={getAllWalletsBanalcesIsLoading || getBeneficiariesIsLoading} />
            </Activity>

            {/* Main Content */}
            <Activity mode={(!getAllWalletsBanalcesIsLoading && !getBeneficiariesIsLoading) ? "visible" : "hidden"}>
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

                    {/* Payment Type Selector */}
                    <div className="flex flex-col gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-soft)]">
                            Payment Type
                        </span>
                        <div className="inline-flex items-center gap-1 p-1! rounded-lg bg-[var(--bg-subtle)] border border-[var(--line)] w-fit">
                            <button
                                id="payout-type-fiat-btn"
                                type="button"
                                onClick={() => setPaymentType('FIAT')}
                                className={`px-4! py-1.5! rounded-md text-xs font-semibold transition-all duration-150 cursor-pointer ${paymentType === 'FIAT'
                                    ? 'bg-[var(--bg-surface)] text-[var(--ink)] shadow-xs border border-[var(--line)]'
                                    : 'text-[var(--mute)] hover:text-[var(--ink-soft)]'
                                    }`}
                            >
                                Fiat
                            </button>
                            <button
                                id="payout-type-crypto-btn"
                                type="button"
                                onClick={() => setPaymentType('CRYPTO')}
                                className={`px-4! py-1.5! rounded-md text-xs font-semibold transition-all duration-150 cursor-pointer ${paymentType === 'CRYPTO'
                                    ? 'bg-[var(--bg-surface)] text-[var(--ink)] shadow-xs border border-[var(--line)]'
                                    : 'text-[var(--mute)] hover:text-[var(--ink-soft)]'
                                    }`}
                            >
                                Crypto
                            </button>
                        </div>
                    </div>

                    {/* ── FIAT Flow  ───────────────────────────────────── */}
                    {paymentType === 'FIAT' && (
                        <>
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
                                                beneficiariesNotFound={beneficiariesListNotFound}
                                                wallets={userWalletsBalancesList}
                                                walletsBalancesListNotFound={allWalletsBalancesNotFound}
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
                        </>
                    )}

                    {/* ── CRYPTO Flow ─────────────────────────────────────────────── */}
                    {paymentType === 'CRYPTO' && (
                        <>
                            {/* Stepper */}
                            <PayoutStepperComponent currentStep={cryptoCurrentStep} />

                            {/* Step content */}
                            {cryptoCurrentStep < 3 ? (
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                                    <div className="lg:col-span-2">
                                        {cryptoCurrentStep === 1 ? (
                                            <CryptoTransactionDetailsStepComponent
                                                wallets={userWalletsBalancesList}
                                                walletsBalancesListNotFound={allWalletsBalancesNotFound}
                                                onSubmit={handleCryptoDetailsSubmit}
                                            />
                                        ) : (
                                            cryptoFormData && (
                                                <CryptoReviewTransactionStepComponent
                                                    formData={cryptoFormData}
                                                    onBack={handleCrytoBack}
                                                    onConfirmAndSend={handleCryptoConfirmAndSend}
                                                />
                                            )
                                        )}
                                    </div>

                                    {/* Right summary panel (Step 1 only) */}
                                    {cryptoCurrentStep === 1 && (
                                        <div className="lg:col-span-1">
                                            <CryptoSummaryCard wallets={userWalletsBalancesList} />
                                        </div>
                                    )}
                                </div>
                            ) : (
                                cryptoFormData && cryptoTransactionHash && (
                                    <CryptoConfirmationStepComponent
                                        formData={cryptoFormData}
                                        transactionHash={cryptoTransactionHash}
                                        onSendAnother={handleCryptoSendAnother}
                                    />
                                )
                            )}
                        </>
                    )}
                </div>
            </Activity>
        </>
    );
}
