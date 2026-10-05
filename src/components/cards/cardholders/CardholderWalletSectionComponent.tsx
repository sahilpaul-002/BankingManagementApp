import { useEffect, Activity } from 'react';
import { Wallet, DollarSign } from 'lucide-react';
import { useGetWalletDetailsQuery } from '@/redux/features/wallet/walletApis';
import type { WalletsDetailsResponseDataType, WalletItemType } from '@/types/wallets/depositWalletsTypes';
import RingSpinnerLoaderComponent from '@/components/common/loaders/RingSpinnerLoaderComponent';
import ShowInConsole from '@/utils/ShowInConsole';
import { useDispatch } from 'react-redux';
import { setShowInfoBanner } from '@/redux/slice/utility/utilitySlice';

interface CardholderWalletSectionComponentPropsType {
    cardholderId: string | null | undefined;
    userEmail: string;
}

const formatCurrency = (amountStr?: string, currency = 'USD') => {
    if (!amountStr) return '$0.00';
    const num = Number.parseFloat(amountStr);
    if (Number.isNaN(num)) return `$${amountStr}`;
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency === 'USD' ? 'USD' : currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 4,
    }).format(num);
};

export default function CardholderWalletSectionComponent({
    cardholderId,
    userEmail,
}: CardholderWalletSectionComponentPropsType) {
    // Configure useDispatch
    const dispatch = useDispatch();
    useEffect(() => {
        // Validate session storage once
        if (!cardholderId) {
            dispatch(setShowInfoBanner('Application facing issue, necessary cardholder(cardholder_id) details not present.'));
            return;
        }
    }, [cardholderId]);

    // ------------------------------ USER USD WALLET DETAILS RTK QUERY ------------------------------ \\
    // User Wallets Details
    const { data: getWalletDetailsData, isLoading: getWalletDetailsIsLoading, isFetching: getWalletDetailsIsFetching, isError: getWalletDetailsIsError, error: getWalletDetailsError } = useGetWalletDetailsQuery({ email: userEmail!, cardholderId: cardholderId!, currency: 'USD' }, { skip: !userEmail || !cardholderId });
    const walletDetailsData = (getWalletDetailsData?.data as WalletsDetailsResponseDataType) ?? {};
    const walletList: WalletItemType[] = walletDetailsData?.wallets_details ?? [];
    const usdWallet: WalletItemType | undefined = walletList.find((w) => w.wallet_currency?.toUpperCase() === 'USD') ?? walletList[0];
    const isWalletsDetailsNotFound =
        getWalletDetailsIsError &&
        getWalletDetailsError &&
        getWalletDetailsError != null &&
        'status' in getWalletDetailsError &&
        getWalletDetailsError?.status === 404 &&
        typeof getWalletDetailsError?.data === 'object' &&
        getWalletDetailsError?.data !== null &&
        'status' in getWalletDetailsError?.data &&
        (getWalletDetailsError?.data as { status: string }).status === 'NOT_FOUND';

    useEffect(() => {
        ShowInConsole(`Cardholder - ${cardholderId} USD Wallet Details`, walletDetailsData as object);
    }, [cardholderId, walletDetailsData]);
    // ------------------------------- XXXXXXXXXXXXXXXXXXXXXXXX ------------------------------- \\

    const isFetching = getWalletDetailsIsLoading || getWalletDetailsIsFetching;

    return (
        <div className="flex flex-col gap-3 pt-4! border-t border-[var(--line)]">
            {/* Section Header */}
            <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-[var(--mute)] uppercase tracking-wider flex items-center gap-1.5">
                    <span>— USD WALLET</span>
                </div>
                {usdWallet?.wallet_status && (
                    <span
                        className={`inline-flex items-center px-2! py-0.5! rounded-full text-[10px] font-semibold uppercase tracking-wide ${usdWallet.wallet_status === 'ACTIVE'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                    >
                        {usdWallet.wallet_status}
                    </span>
                )}
            </div>

            {/* Loading State */}
            <Activity mode={isFetching ? 'visible' : 'hidden'}>
                <div className="w-full min-h-[120px] flex items-center justify-center bg-[var(--bg-subtle)] border border-[var(--line)] rounded-xl p-6!">
                    <RingSpinnerLoaderComponent
                        visible={isFetching}
                        size={28}
                        color={
                            getComputedStyle(document.documentElement)
                                .getPropertyValue('--nav-bg')
                                .trim() || '#0c1830'
                        }
                    />
                </div>
            </Activity>

            {/* Wallet Not Found State */}
            <Activity
                mode={!isFetching && (isWalletsDetailsNotFound || !usdWallet) ? 'visible' : 'hidden'}
            >
                <div className="w-full min-h-[90px] flex flex-col items-center justify-center gap-1.5 bg-[var(--bg-subtle)] border border-[var(--line)] rounded-xl p-4! text-center">
                    <Wallet className="w-5 h-5 text-[var(--mute)]" strokeWidth={1.5} />
                    <p className="text-xs font-medium text-[var(--ink)]">No USD wallet found</p>
                    <p className="text-[11px] text-[var(--mute)]">
                        USD wallet has not been provisioned for this cardholder yet.
                    </p>
                </div>
            </Activity>

            {/* Wallet Details Card */}
            <Activity
                mode={!isFetching && !isWalletsDetailsNotFound && Boolean(usdWallet) ? 'visible' : 'hidden'}
            >
                {usdWallet && (
                    <div className="w-full bg-[var(--bg-subtle)] border border-[var(--line)] rounded-xl p-4! flex flex-col gap-3">
                        {/* Top Balance Highlight */}
                        <div className="flex items-center justify-between pb-3! border-b border-[var(--line)]">
                            <div className="flex items-center gap-2">
                                <div className="p-2! rounded-lg bg-[var(--nav-bg)] text-[var(--gold)]">
                                    <DollarSign className="w-4 h-4" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[11px] text-[var(--mute)] font-medium">
                                        Available Balance
                                    </span>
                                    <span className="text-base font-bold text-[var(--ink)]">
                                        {formatCurrency(
                                            usdWallet.available_balance?.$numberDecimal,
                                            usdWallet.wallet_currency
                                        )}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-2 gap-y-2.5 text-xs">
                            <span className="text-[var(--mute)] font-medium">Wallet Type</span>
                            <span className="text-right font-semibold text-[var(--ink)]">
                                {usdWallet.wallet_type || 'FIAT'}
                            </span>

                            <span className="text-[var(--mute)] font-medium">Currency</span>
                            <span className="text-right font-semibold text-[var(--ink)]">
                                {usdWallet.wallet_currency || 'USD'}
                            </span>

                            <span className="text-[var(--mute)] font-medium">Account Balance</span>
                            <span className="text-right font-semibold text-[var(--ink)]">
                                {formatCurrency(
                                    usdWallet.account_balance?.$numberDecimal,
                                    usdWallet.wallet_currency
                                )}
                            </span>

                            <span className="text-[var(--mute)] font-medium">Available Balance</span>
                            <span className="text-right font-semibold text-[var(--ink)]">
                                {formatCurrency(
                                    usdWallet.available_balance?.$numberDecimal,
                                    usdWallet.wallet_currency
                                )}
                            </span>
                        </div>
                    </div>
                )}
            </Activity>
        </div>
    );
}
