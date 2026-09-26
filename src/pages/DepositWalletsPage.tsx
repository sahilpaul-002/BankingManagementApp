import { useState, useEffect, Activity } from 'react';
import { DEPOSIT_WALLETS_LIST_FALLBACK, type WalletItem } from '@/fallbacks/wallets/depositWallets/depositWalletsFallbacks';
import { useCreateWalletMutation, useGetWalletDetailsQuery } from '@/redux/features/wallet/walletApis';
import DepositWalletsListComponent from '@/components/wallets/depositWallets/DepositWalletsListComponent';
import WalletDetailsSidebarComponent from '@/components/wallets/depositWallets/WalletDetailsSidebarComponent';
import CreateWalletSidebarComponent from '@/components/wallets/depositWallets/CreateWalletSidebarComponent';
import { useNavigate } from 'react-router';
import { useDispatch } from 'react-redux';
import { setShowInfoBanner } from '@/redux/slice/utility/utilitySlice';
import type { WalletsDetailsResponseDataType } from '@/types/wallets/depositWalletsTypes';
import ShowInConsole from '@/utils/ShowInConsole';
import PageLoaderComponent from '@/components/common/loaders/PageLoaderComponent';
import { Plus } from 'lucide-react';

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

    // ------------------------------ Create Wallet Sidebar ------------------------------ \\
    const [isCreateWalletOpen, setIsCreateWalletOpen] = useState(false);

    const handleOpenCreateWallet = () => setIsCreateWalletOpen(true);
    const handleCloseCreateWallet = () => setIsCreateWalletOpen(false);
    const handleCreateWalletSuccess = () => {
        setTimeout(() => {
            setIsCreateWalletOpen(false);
        },1000)
    };

    // All possible wallet type+currency combinations (5 total)
    const ALL_WALLET_COMBINATIONS: { wallet_type: string; wallet_currency: string }[] = [
        { wallet_type: 'FIAT', wallet_currency: 'USD' },
        { wallet_type: 'FIAT', wallet_currency: 'SGD' },
        { wallet_type: 'FIAT', wallet_currency: 'EUR' },
        { wallet_type: 'CRYPTO', wallet_currency: 'USDT' },
        { wallet_type: 'CRYPTO', wallet_currency: 'USDC' },
    ];

    const allWalletsCreated = ALL_WALLET_COMBINATIONS.every((combo) =>
        userWalletsList.some(
            (w) => w.wallet_type === combo.wallet_type && w.wallet_currency === combo.wallet_currency
        )
    );
    // -------------------------------- XXXXXXXXXXXXXXXXXXXXXXXXXX -------------------------------- \\

    return (
        <>
            {/* Page Loader */}
            <Activity mode={showPageLoader ? "visible" : "hidden"}>
                <PageLoaderComponent showPageLoader={showPageLoader} />
            </Activity>

            {/* Main Content */}
            <div className="depositWalletsPage-container w-full h-fit flex flex-col justify-start items-stretch gap-6 p-4! sm:p-6!">
                {/* Header */}
                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <h1 className="text-2xl sm:text-3xl text-[var(--ink)] tracking-normal">
                            <span className="font-serif font-medium">Deposit</span>{' '}
                            <span className="font-serif italic font-normal">Wallets</span>
                        </h1>

                        {/* Add Wallet Button — hidden when all 5 combinations exist */}
                        {!allWalletsCreated && (
                            <button
                                id="depositWalletsPage-addWallet-btn"
                                type="button"
                                onClick={handleOpenCreateWallet}
                                className="inline-flex items-center gap-2 px-4! py-2! rounded-lg text-sm font-semibold bg-[var(--nav-bg)] text-white hover:opacity-90 transition-opacity cursor-pointer"
                            >
                                <Plus className="w-4 h-4" />
                                Add Wallet
                            </button>
                        )}
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

                {/* Create Wallet Sidebar */}
                <CreateWalletSidebarComponent
                    isOpen={isCreateWalletOpen}
                    onClose={handleCloseCreateWallet}
                    onSuccess={handleCreateWalletSuccess}
                />
            </div>
        </>
    );
}
