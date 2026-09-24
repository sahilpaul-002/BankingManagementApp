import { useState, useEffect } from 'react';
import {DEPOSIT_WALLETS_LIST_FALLBACK, type WalletItem} from '@/fallbacks/wallets/depositWallets/depositWalletsFallbacks';
import { useGetWalletDetailsQuery } from '@/redux/features/wallet/walletApis';
import DepositWalletsListComponent from '@/components/wallets/depositWallets/DepositWalletsListComponent';
import WalletDetailsSidebarComponent from '@/components/wallets/depositWallets/WalletDetailsSidebarComponent';

export default function DepositWalletsPage() {
    // Session identifiers
    const userEmail = sessionStorage.getItem('userEmail') ?? '';
    const userCardholderId = sessionStorage.getItem('cardholderId') ?? '';

    // RTK Query
    const { data: apiResponse } = useGetWalletDetailsQuery(
        { email: userEmail, cardholderId: userCardholderId },
        { skip: !userEmail || !userCardholderId }
    );

    // Local wallets state initialised with fallback
    const [walletsList, setWalletsList] = useState<WalletItem[]>(DEPOSIT_WALLETS_LIST_FALLBACK);

    // Selected wallet for details sidebar
    const [selectedWallet, setSelectedWallet] = useState<WalletItem | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    // Sync API data into state when available
    // useEffect(() => {
    //     const details = apiResponse?.data?.wallets_details;
    //     if (Array.isArray(details) && details.length > 0) {
    //         setWalletsList(details as WalletItem[]);
    //     }
    // }, [apiResponse]);

    const handleSelectWallet = (wallet: WalletItem) => {
        setSelectedWallet(wallet);
        setIsDetailsOpen(true);
    };

    const handleCloseDetails = () => {
        setIsDetailsOpen(false);
        setSelectedWallet(null);
    };

    return (
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
                wallets={walletsList}
                onSelectWallet={handleSelectWallet}
                selectedWalletId={selectedWallet?._id}
            />

            {/* Wallet Details Sidebar */}
            <WalletDetailsSidebarComponent
                isOpen={isDetailsOpen}
                onClose={handleCloseDetails}
                wallet={selectedWallet}
            />
        </div>
    );
}
