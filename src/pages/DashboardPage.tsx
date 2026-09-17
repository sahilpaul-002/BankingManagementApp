import { Activity, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftRight, Send } from 'lucide-react';
import { DEMO } from '@/fallbacks/dashboardFallbacks';
import WalletBalanceSection from '@/components/dashboard/WalletBalanceSection';
import NeedsAttentionCard from '@/components/dashboard/NeedsAttentionCard';
import ExpenditureChartSection from '@/components/dashboard/ExpenditureChartSection';
import TopCardsSection from '@/components/dashboard/TopCardsSection';
import RecentTransactionsSection from '@/components/dashboard/RecentTransactionSection';
import ScheduledPaymentsList from '@/components/dashboard/ScheduledPaymentsList';
import { selectDnsConfigDetails } from '@/redux/slice/config/configSlice';
import { useDispatch, useSelector } from 'react-redux';
import CustomButtonComponent from '@/components/common/CustomButtonComponent';
import WalletBalanceChartSection from '@/components/dashboard/WalletBalanceChartSection';
import { setShowInfoBanner } from '@/redux/slice/utility/utilitySlice';
import { useLazyGetDnsConfigQuery } from '@/redux/features/config/configApi';
import { useGetKycDetailsQuery } from '@/redux/features/kyc/kycApis';
import { useGetUserOnboardingDetailsQuery } from '@/redux/features/user/userApi';
import { isKycApproved } from '@/utils/kycHelper';
import { isKybApproved } from '@/utils/kybHelper';
import { useGetWalletDetailsQuery } from '@/redux/features/wallet/walletApis';
import ShowInConsole from '@/utils/ShowInConsole';
import DashboardPageLoaderComponent from '@/components/common/loaders/DashboardPageLoaderComponent';
import RefreshPageFallback from '@/components/common/RefreshPageFallback';
import VerificationRequiredBanner from '@/components/dashboard/VerificationRequiredBanner';
import PageLoaderComponent from '@/components/common/loaders/PageLoaderComponent';

export default function DashboardPage() {
    // Configure useNavigate
    const navigate = useNavigate();

    // Configure useDispatch
    const dispatch = useDispatch();

    // ------------------------------- GET EMAL FROM SESSION STORAGE ---------------------------------- \\
    // Get necessary user details from session storage
    const userEmail = sessionStorage.getItem('userEmail');
    const userId = sessionStorage.getItem("userId")
    const userCardholderId = sessionStorage.getItem("cardholderId")

    useEffect(() => {
        // Validate email once
        if (!userEmail || !userId || !userCardholderId) {
            dispatch(
                setShowInfoBanner("Application facing issue, necessary user details not present in session storage. Please re-login.")
            );
            return;
        }
    }, [userEmail, userId, userCardholderId]);
    // ---------------------------------- XXXXXXXXXXXXXXXXXXXXXXXXXX ---------------------------------- \\

    // ---------------------------------- Get Dns Data ---------------------------------- \\
    // Get dns data from redux
    const dnsData = useSelector(selectDnsConfigDetails)

    // Dns Config Data
    const domainName = window.location.hostname;
    const [triggerDnsConfig, { isFetching, data }] = useLazyGetDnsConfigQuery();
    useEffect(() => {
        if (!dnsData && !isFetching) {
            triggerDnsConfig({
                domainName: domainName,
            });
        }
    }, [dnsData, isFetching, triggerDnsConfig]);
    // --------------------------------- XXXXXXXXXXXXXXXXXXXXX --------------------------------- \\

    // ----------------------------------- Get User KYC/KYB Verification Status ----------------------------------- \\
    // Get Kyc Verification Status
    const { data: getKycData, isLoading: getKycDetailsIsLoading, isFetching: getKycDetailsIsFetching, isError: getKycDetailsIsError, error: getKycDetailsError, isSuccess: getKycDetailsIsSuccess, refetch: refetchGetKycDetails } = useGetKycDetailsQuery({ email: userEmail! }, { skip: !userEmail });
    const userKycDetails = getKycData?.data as Record<string, any>;
    console.log("Kyc error:", getKycDetailsError)

    // Kyc not found error
    const isKycNotFound =
        getKycDetailsIsError &&
        getKycDetailsError &&
        "status" in getKycDetailsError &&
        getKycDetailsError.status === 404 &&
        typeof getKycDetailsError?.data === "object" &&
        getKycDetailsError?.data !== null &&
        "status" in getKycDetailsError?.data &&
        getKycDetailsError?.data?.status === "NOT_FOUND";

    // Get User Onboarding Details (Onboarding Verification Status)
    const { data: getOnboardingData, isLoading: getOnboardingDetailsLoading, isFetching: getOnboardingDetailsIsFetching, isError: getOnboardingDetailsIsError, error: getOnboardingDetailsError, isSuccess: getOnboardingDetailsIsSuccess, refetch: refetchGetOnboardingDetails } = useGetUserOnboardingDetailsQuery({ email: userEmail! }, { skip: !userEmail });
    const userOnboardingDetails = getOnboardingData?.data as Record<string, any>;

    // Onboarding details not found error
    const isOnboardingNotFound =
        getOnboardingDetailsIsError &&
        getOnboardingDetailsError &&
        "status" in getOnboardingDetailsError &&
        getOnboardingDetailsError?.status === 404 &&
        typeof getOnboardingDetailsError?.data === "object" &&
        getOnboardingDetailsError?.data !== null &&
        "status" in getOnboardingDetailsError?.data &&
        getOnboardingDetailsError?.data.status === "NOT_FOUND";

    const kycApproved = isKycApproved(getKycData?.data);
    const kybApproved = isKybApproved(getOnboardingData?.data);

    const verificationApisCompleted =
        !!userEmail &&
        !!userKycDetails &&
        !!userOnboardingDetails &&
        getKycDetailsIsSuccess &&
        getOnboardingDetailsIsSuccess &&
        !getKycDetailsIsError &&
        !getOnboardingDetailsIsError;

    const shouldFetchDependentApis = verificationApisCompleted;
    // ----------------------------------------- XXXXXXXXXXXXXXXXXXXXXX ----------------------------------------- \\

    // -------------------------------- Wallet Details / Cards List / Wallet Transaction -------------------------------- \\
    // User Wallets
    const { data: getUserWalletsListData, isLoading: getUserWalletsListLoading, isFetching: getUserWalletsListIsFetching, isError: getUserWalletsListIsError, refetch: refetchUserWalletsList } = useGetWalletDetailsQuery({ email: userEmail!, cardholderId: userCardholderId! }, { skip: !userEmail || !shouldFetchDependentApis, refetchOnMountOrArgChange: true, }
    );
    const userWalletsList = getUserWalletsListData?.data ?? [];

    // // Business Cards List
    // const { data: getCardsListData, isFetching: getCardsListLoading, isError: getCardsListIsError, refetch: refetchCardsList } = useGetCardsListQuery({ email: email! }, { skip: !email || !shouldFetchDependentApis }
    // );
    // const userCardsList = getCardsListData?.data?.data ?? [];

    // // Account Statements
    // const { data: getAccountStatementsData, isFetching: getAccountStatementsLoading, isError: getAccountStatementsIsError, refetch: refetchAccountStatements } = useGetStatementQuery({ pageNumber: 1, pageSize: 7 }, { skip: !email || !shouldFetchDependentApis })
    // const accountStatementsList = getAccountStatementsData?.data?.entries as Record<string, any>[] ?? []

    useEffect(() => {
        ShowInConsole("User Wallets List details", userWalletsList);
    }, [userWalletsList])
    // --------------------------------- XXXXXXXXXXXXXXXXXXXXXXXXX --------------------------------- \\

    // ---------------------------------------- DASHBOARD ACCESS / FAILURE HANDLING ---------------------------------------- \\
    const isInitialPageLoading =
        getKycDetailsIsLoading ||
        getOnboardingDetailsLoading ||
        getUserWalletsListLoading;

    const isPageFetching =
        getKycDetailsIsFetching ||
        getOnboardingDetailsIsFetching ||
        getUserWalletsListIsFetching;

    // Mutually exclusive loader states
    const showInitialPageLoader = isInitialPageLoading;

    const showPageFetchingLoader =
        !isInitialPageLoading && isPageFetching;
    const loaderType =
        showInitialPageLoader
            ? "initial"
            : showPageFetchingLoader
                ? "fetching"
                : null;
    const hasBlockingApiFailure = (getKycDetailsIsError && !isKycNotFound) || (getOnboardingDetailsIsError && !isOnboardingNotFound);
    const hasDashboardUiApiFaliure = getUserWalletsListIsError
    const canRenderDashboard = !showInitialPageLoader && !hasBlockingApiFailure;
    const canAccessDashboard = kycApproved && kybApproved;

    useEffect(() => {
        if (hasBlockingApiFailure) {
            dispatch(setShowInfoBanner("Application failed to fetch necessary details. Please refresh the page or try again later."));
            return;
        }
        else if (hasDashboardUiApiFaliure) {
            dispatch(setShowInfoBanner("Some dashboard services are currently unavailable."));
            return
        }
        else {
            return
        }
    }, [hasBlockingApiFailure, hasDashboardUiApiFaliure, dispatch, navigate]);

    // Retry handler - re-triggers only the requests that are relevant, without a full page reload
    const handleRetryFailedRequests = () => {
        if (getKycDetailsIsError) {
            refetchGetKycDetails();
        }

        if (getOnboardingDetailsIsError) {
            refetchGetOnboardingDetails();
        }

        if (getUserWalletsListIsError) {
            refetchUserWalletsList();
        }
    };
    // ----------------------------------- XXXXXXXXXXXXXXXXXXXXXX ----------------------------------- \\

    // Function to handle the greetings text
    const greeting = useMemo(() => {
        const hour = new Date().getHours();

        if (hour >= 5 && hour < 12) {
            return "Good morning";
        }

        if (hour >= 12 && hour < 17) {
            return "Good afternoon";
        }

        if (hour >= 17 && hour < 21) {
            return "Good evening";
        }

        return "Good night";
    }, []);

    // Calculate total USD equivalent
    const totalUSD = useMemo(() => {
        return DEMO.balances.reduce((sum, balance) => {
            // Simple conversion - in real app would use fx rates
            return sum + balance.amount;
        }, 0);
    }, []);

    return (
        <>
            {/* Page Loader */}
            {/* Initial Page Loader */}
            {loaderType === "initial" && (
                <DashboardPageLoaderComponent showPageLoader />
            )}
            {/* Regular Page Loader */}
            {loaderType === "fetching" && (
                <PageLoaderComponent showPageLoader />
            )}

            {/* Refresh Page */}
            <Activity mode={!showInitialPageLoader && hasBlockingApiFailure ? "visible" : "hidden"}>
                <RefreshPageFallback visible={!showInitialPageLoader && hasBlockingApiFailure} onRetry={handleRetryFailedRequests} isLoading={getKycDetailsIsLoading || getOnboardingDetailsLoading} />
            </Activity>

            <Activity mode={canRenderDashboard ? "visible" : "hidden"}>
                {/* Render Verification Notification */}
                <Activity mode={!canAccessDashboard ? "visible" : "hidden"}>
                    <Activity mode={!kycApproved ? "visible" : "hidden"}>
                        <VerificationRequiredBanner
                            title="User Details Verification Required"
                            description="Your user details verification is incomplete. Please complete your verification to access financial features such as Accounts, Stablecoins, Payables, Cards, and Transfers."
                            buttonText="Complete User Verification"
                            onAction={() => navigate("/user/verification")}
                        />
                    </Activity>

                    <Activity mode={!kybApproved ? "visible" : "hidden"}>
                        <VerificationRequiredBanner
                            title="User Bank Details Verification Required"
                            description="Your bank details verification is incomplete. Please complete your bank details verification to access financial features such as Accounts, Stablecoins, Payables, Cards, and Transfers."
                            buttonText="Complete Bank Details Verification"
                            onAction={() => navigate("/user")}
                        />
                    </Activity>
                </Activity>

                {/* Render Dashboard Components */}
                <Activity mode={canAccessDashboard ? "visible" : "hidden"}>
                    <div className='dashboardPage-container w-full h-fit flex flex-col justify-start items-stretch gap-3'>
                        {/* Dashboard Page Header with Actions */}
                        <div className="w-full h-fit flex flex-col lg:flex-row items-start lg:items-end justify-between gap-4 mb-7!">
                            <div className="min-w-0">
                                {/* <div className="text-xs text-[var(--mute)] font-semibold tracking-[0.18em] uppercase mb-2!">
                        {dnsData?.dashboard_name}
                    </div> */}
                                <h1 className="text-4xl t-[var(--ink)] font-medium tracking-normal mb-1.5!">
                                    {greeting}
                                </h1>
                                <p className="text-sm text-[var(--ink-soft)]">
                                    Here's where things stand across your treasury today.
                                </p>
                            </div>
                            <div className="w-fit flex justify-center items-center gap-2">
                                {/* Convert Button */}
                                <div className="dashboardPage-convert-button-container w-[140px] sm:w-[160px] h-[30px] sm:h-[40px]">
                                    <CustomButtonComponent id={"dashboardPage-convert-button"} label={<><ArrowLeftRight className="w-4 h-4" /> Convert</>} type="button" variant={"navy"} onClick={() => navigate('/wallets/currencyConversion')} />
                                </div>
                                {/* Send Money Button */}
                                <div className="dashboardPage-sendMoney-button-container w-[140px] sm:w-[160px] h-[30px] sm:h-[40px]">
                                    <CustomButtonComponent id={"dashboardPage-sendMoney-button"} label={<><Send className="w-3.5 h-3.5" />Send money</>} type="button" variant={"navy"} onClick={() => navigate('/payables/payout')} />
                                </div>
                            </div>
                        </div>

                        {/* Main Layout Grid */}
                        <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-6">

                            {/* ------------------- Row 1 ------------------- */}
                            {/* Wallet Section */}
                            <WalletBalanceSection
                                totalUSD={totalUSD}
                                changePercent={2.4}
                                lastRefreshed="2 min ago"
                                balances={DEMO.balances}
                            />
                            {/* Cards Section */}
                            <TopCardsSection cards={DEMO.cards} />

                            {/* ------------------- Row 2 ------------------- */}
                            {/* Chart Section */}
                            <ExpenditureChartSection />
                            {/* Wallet Balance Chart */}
                            <WalletBalanceChartSection />

                            {/* ------------------- Row 3 ------------------- */}
                            {/* Recent Activity Section */}
                            <RecentTransactionsSection />
                            {/* Schedule Payments List */}
                            <ScheduledPaymentsList payments={DEMO.scheduledPayments} />
                        </div>

                        {/* Recent Activity Section */}
                        {/* <div className="recentTransactions-section-container-wrapper w-full h-full">
                <RecentTransactionsSection />
            </div> */}
                    </div>
                </Activity>
            </Activity>
        </>
    );
}