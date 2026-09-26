import { useState, useEffect, Activity } from 'react';
import { DEPOSIT_WALLETS_LIST_FALLBACK, type WalletItem } from '@/fallbacks/wallets/depositWallets/depositWalletsFallbacks';
import { useGetWalletDetailsQuery } from '@/redux/features/wallet/walletApis';
import DepositWalletsListComponent from '@/components/wallets/depositWallets/DepositWalletsListComponent';
import WalletDetailsSidebarComponent from '@/components/wallets/depositWallets/WalletDetailsSidebarComponent';
import { useNavigate } from 'react-router';
import { useDispatch } from 'react-redux';
import { setShowInfoBanner } from '@/redux/slice/utility/utilitySlice';
import type { WalletsDetailsResponseDataType } from '@/types/wallets/depositWalletsTypes';
import ShowInConsole from '@/utils/ShowInConsole';
import PageLoaderComponent from '@/components/common/loaders/PageLoaderComponent';

export default function DepositWalletsPage() {
    // Configure useNavigate
    const navigate = useNavigate();

    // Configure useDispatch
    const dispatch = useDispatch();

    // ------------------------------- GET EMAIL FROM SESSION STORAGE ---------------------------------- \\
    // Get necessary user details from session storage
    const userEmail = sessionStorage.getItem('userEmail');
    const userId = sessionStorage.getItem("userId")
    const userCardholderId = sessionStorage.getItem("cardholderId")

    useEffect(() => {
        // Validate email once
        if (!userEmail || !userId || !userCardholderId) {
            dispatch(setShowInfoBanner("Application facing issue, necessary user details not present in session storage. Please re-login."));
            return;
        }
    }, [userEmail, userId, userCardholderId]);
    // ---------------------------------- XXXXXXXXXXXXXXXXXXXXXXXXXX ---------------------------------- \\

    // ------------------------------ USER WALLET DETAILS RTK QUERY ------------------------------ \\
    // User Wallets Details
    const { data: getWalletsDetailsData, isLoading: getWalletsDetailsIsLoading, isFetching: getWalletsDetailsIsFetching, isError: getWalletsDetailsIsError, error: getWalletsDetailsError, isSuccess: getWalletsDetailsIsSuccess, refetch: refetchWalletsDetails } = useGetWalletDetailsQuery({ email: userEmail!, cardholderId: userCardholderId! }, { skip: !userEmail || !userCardholderId }
    );
    const userWalletsDetails = getWalletsDetailsData?.data as WalletsDetailsResponseDataType ?? [];
    const userWalletsList = userWalletsDetails?.wallets_details ?? []
    const isWalletsDetailsNotFound =
        getWalletsDetailsIsError &&
        getWalletsDetailsError &&
        getWalletsDetailsError != null &&
        "status" in getWalletsDetailsError &&
        getWalletsDetailsError?.status === 404 &&
        typeof getWalletsDetailsError?.data === "object" &&
        getWalletsDetailsError?.data !== null &&
        "status" in getWalletsDetailsError?.data &&
        getWalletsDetailsError?.data.status === "NOT_FOUND";

    useEffect(() => {
        ShowInConsole("User wallets details", userWalletsDetails);
    }, [userWalletsDetails])
    // ------------------------------- XXXXXXXXXXXXXXXXXXXXXXXX ------------------------------- \\
    const showPageLoader = getWalletsDetailsData ? getWalletsDetailsIsLoading : getWalletsDetailsIsFetching;

    // Selected wallet for details sidebar
    const [selectedWallet, setSelectedWallet] = useState<WalletItem | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    const handleSelectWallet = (wallet: WalletItem) => {
        setSelectedWallet(wallet);
        setIsDetailsOpen(true);
    };

    const handleCloseDetails = () => {
        setIsDetailsOpen(false);
        setSelectedWallet(null);
    };

    return (
        <>
            {/* Page Loader */}
            <Activity mode={showPageLoader ? "visible" : "hidden"}>
                <PageLoaderComponent showPageLoader={showPageLoader} />
            </Activity>

            {/* Main Content */}
            <div className="depositWalletsPage-container w-full h-fit flex flex-col justify-start items-stretch gap-6 p-4! sm:p-6!">
                {/* Breadcrumb & Header */}
                <div className="flex flex-col gap-3">
                    <p className="text-xs text-[var(--mute)] tracking-wide">
                        Payables &gt; <span className="text-[var(--ink-soft)] font-medium">Deposit Wallets</span>
                    </p>

                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <h1 className="text-2xl sm:text-3xl text-[var(--ink)] tracking-normal">
                            <span className="font-serif font-medium">Deposit</span>{' '}
                            <span className="font-serif italic font-normal">Wallets</span>
                        </h1>
                    </div>
                </div>

                {/* Wallets List */}
                <DepositWalletsListComponent
                    wallets={userWalletsList}
                    onSelectWallet={handleSelectWallet}
                    selectedWalletId={selectedWallet?._id}
                    walletsDetailsNotFound={isWalletsDetailsNotFound}
                    getWalletsDetailsIsFetching={getWalletsDetailsIsFetching}
                />

                {/* Wallet Details Sidebar */}
                <WalletDetailsSidebarComponent
                    isOpen={isDetailsOpen}
                    onClose={handleCloseDetails}
                    wallet={selectedWallet}
                />
            </div>
        </>
    );
}
