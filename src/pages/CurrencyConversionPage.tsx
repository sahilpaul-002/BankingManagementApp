import { useState, useEffect, Activity } from 'react';
import { toast } from 'react-toastify';
import CurrencyConversionStepperComponent from '@/components/wallets/currencyConversion/CurrencyConversionStepperComponent';
import ConversionDetailsStepComponent, { type ConversionFormData } from '@/components/wallets/currencyConversion/ConversionDetailsStepComponent';
import ReviewConversionStepComponent from '@/components/wallets/currencyConversion/ReviewConversionStepComponent';
import ConversionConfirmationStepComponent from '@/components/wallets/currencyConversion/ConversionConfirmationStepComponent';
import ConversionQuoteSummaryCardComponent from '@/components/wallets/currencyConversion/ConversionQuoteSummaryCardComponent';
import { useCreateCurrencyConversionQuoteMutation, useExecuteCurrencyConversionQuoteMutation, useGetAllWalletBalancesQuery } from '@/redux/features/wallet/walletApis';
import { useNavigate } from 'react-router';
import { useDispatch } from 'react-redux';
import { setShowInfoBanner } from '@/redux/slice/utility/utilitySlice';
import type { AllWalletBalancesResponseDataType, CurrencyConversionQuoteDataType, ExecuteConversionDataType, WalletBalanceItemType } from '@/types/wallets/currencyConversionTypes';
import ShowInConsole from '@/utils/ShowInConsole';
import PageLoaderComponent from '@/components/common/loaders/PageLoaderComponent';

export default function CurrencyConversionPage() {
    // Configure useNavigate
    const navigate = useNavigate();

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

    // -------------------------------- ALL WALLETS BALANCES RTK QUERY -------------------------------- \\
    // User All Wallets Balances
    const { data: getAllWalletsBalancesData, isLoading: getAllWalletsBanalcesIsLoading, isFetching: getAllWalletsBanalcesIsFetching, isError: getAllWalletsBalancesIsError, error: getAllWalletsBalancesError, isSuccess: getAllWalletsBalancesIsSuccess, refetch: refetchGetAllWalletsBalances } = useGetAllWalletBalancesQuery({ email: userEmail!, cardholderId: userCardholderId! }, { skip: !userEmail || !userCardholderId }
    );
    const userAllWalletsBalances = getAllWalletsBalancesData?.data as AllWalletBalancesResponseDataType ?? [];
    userWalletId = (getAllWalletsBalancesData?.data as AllWalletBalancesResponseDataType | undefined)?.walletId || null;
    const userWalletsBalancesList = userAllWalletsBalances?.wallets_details as WalletBalanceItemType[]
    useEffect(() => {
        if (!getAllWalletsBalancesIsSuccess) {
            return;
        }

        if (userWalletId) {
            sessionStorage.setItem("walletId", userWalletId);
        } else {
            sessionStorage.removeItem("walletId");
        }
    }, [getAllWalletsBalancesIsSuccess, userWalletId]);
    const isAllWalletsBalancesNotFound =
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
        ShowInConsole("User All Wallets Balances details", userAllWalletsBalances);
    }, [userAllWalletsBalances])
    // ---------------------------- XXXXXXXXXXXXXXXXXXXX ---------------------------- \\

    // ------------ CREATE CURRENCY CONVERSION QUOTE / EXECUTE CURRENCY CONVERSION QUOTE RTK MUTATION ------------ \\
    const [triggerCreateCurrencyConversionQuote, { isLoading: createCurrencyConversionQuoteIsLoading }] = useCreateCurrencyConversionQuoteMutation();
    const [triggerExecuteCurrencyConversionQuote, { isLoading: executeCurrencyConversionQuoteIsLoading }] = useExecuteCurrencyConversionQuoteMutation();
    // ---------------------------- XXXXXXXXXXXXXXXXXXXX ---------------------------- \\

    // ----------------------- Currency Conversion States ----------------------- \\
    const [currentStep, setCurrentStep] = useState<number>(1);
    const [savedFormData, setSavedFormData] = useState<ConversionFormData | null>(null);
    const [activeQuote, setActiveQuote] = useState<CurrencyConversionQuoteDataType | null>(null);
    const [executionResult, setExecutionResult] = useState<ExecuteConversionDataType | null>(null);
    // ----------------------- XXXXXXXXXXXXXXX ----------------------- \\

    // Function to Create Currency Conversion Quote
    const handleGenerateQuote = async (formData: ConversionFormData) => {
        setSavedFormData(formData);

        try {
            const createCurrencyConversionResult = await triggerCreateCurrencyConversionQuote({
                email: userEmail!,
                bodyPayload: {
                    cardholderId: userCardholderId!,
                    sourceWalletCurrency: formData.source_currency as "USD" | "SGD" | "EUR" | "USDT" | "USDC",
                    distinatinWalletCurrency: formData.destination_currency as "USD" | "SGD" | "EUR" | "USDT" | "USDC",
                    amount: formData.amount,
                },
            }).unwrap();
            if (createCurrencyConversionResult?.status?.toUpperCase() !== "SUCCESS") {
                toast.error('Failed to generate currency conversion quote. Please try again later.');
            }

            setActiveQuote(createCurrencyConversionResult?.data as CurrencyConversionQuoteDataType ?? null);

            toast.success('Conversion quote generated successfully.');
        }
        catch (err: any) {
            ShowInConsole('Create currency conversion quote error:', err);

            const errorMessage =
                Array.isArray(err?.data?.message)
                    ? err.data.message[0]
                    : err?.data?.message ||
                    err?.message ||
                    'Failed to generate currency conversion quote. Please try again later.';
            const normalizeErrorMessage = errorMessage?.toLowerCase();

            if (normalizeErrorMessage?.includes("insufficient available") && normalizeErrorMessage?.includes("wallet balance")) {
                toast.error(`${errorMessage}. Please try a different wallet or add funds in the wallet.`);
            }
            else {
                toast.error('Failed to generate currency conversion quote. Please try again later.');
            }
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

    // Function to Execute Currency Conversion Quote
    const handleExecuteConversion = async () => {
        if (!activeQuote) return;

        try {
            const executeCurrencyConversionResult = await triggerExecuteCurrencyConversionQuote({
                email: userEmail!,
                bodyPayload: { quoteId: activeQuote.quote_id, cardholderId: userCardholderId!, },
            }).unwrap();

            if (executeCurrencyConversionResult?.status?.toUpperCase() !== "SUCCESS") {
                toast.error('Failed to generate currency conversion quote. Please try again later.');
            }

            setExecutionResult(executeCurrencyConversionResult?.data as ExecuteConversionDataType ?? null);
            
            setCurrentStep(3);
            toast.success('Currency conversion quote executed successfully!');
        }
        catch (err: any) {
            ShowInConsole('Create currency conversion quote error:', err);

            const errorMessage =
                Array.isArray(err?.data?.message)
                    ? err.data.message[0]
                    : err?.data?.message ||
                    err?.message ||
                    'Failed to execute currency conversion quote. Please try again later.';
            const normalizeErrorMessage = errorMessage?.toLowerCase();

            if (normalizeErrorMessage?.includes("currency conversion quote has expired")) {
                toast.error('Currency conversion quote has expired. Please generate a new quote and try again.');
            }
            else {
                toast.error('Failed to execute currency conversion quote. Please try again later.');
            }
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
        <>
            {/* Page Loader */}
            <Activity mode={getAllWalletsBanalcesIsLoading ? "visible" : "hidden"}>
                <PageLoaderComponent showPageLoader={getAllWalletsBanalcesIsLoading} />
            </Activity>

            {/* Main Content */}
            <Activity mode={!getAllWalletsBanalcesIsLoading ? "visible" : "hidden"}>
                <div className="currencyConversionPage-container w-full h-fit flex flex-col justify-start items-stretch gap-6 p-4! sm:p-6!">
                    {/* Header */}
                    <div className="flex flex-col gap-1.5">
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
                                        wallets={userWalletsBalancesList}
                                        walletsBalancesListNotFound={isAllWalletsBalancesNotFound}
                                        quote={activeQuote}
                                        isQuoteLoading={createCurrencyConversionQuoteIsLoading}
                                        onGenerateQuote={handleGenerateQuote}
                                        onResetQuote={handleResetQuote}
                                        onContinue={handleContinueStep1}
                                    />
                                ) : (
                                    <ReviewConversionStepComponent
                                        quote={activeQuote!}
                                        isExecuting={executeCurrencyConversionQuoteIsLoading}
                                        onBack={handleBackStep2}
                                        onExecute={handleExecuteConversion}
                                    />
                                )}
                            </div>

                            {/* Right Column — Quote Summary */}
                            <div className="lg:col-span-1">
                                <ConversionQuoteSummaryCardComponent
                                    quote={activeQuote}
                                    isLoading={createCurrencyConversionQuoteIsLoading}
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
            </Activity>
        </>
    );
}
