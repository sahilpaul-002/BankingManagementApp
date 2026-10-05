import { useState, useEffect } from 'react';
import { X, ArrowDownToLine } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import type { CardholderItemType } from '@/types/cards/cardholderTypes';
import CardholderCollapsibleSectionComponent from './CardholderCollapsibleSectionComponent';
import CardholderWalletSectionComponent from './CardholderWalletSectionComponent';
import CardholderCardsSectionComponent from './CardholderCardsSectionComponent';
import LoadCardholderWalletSidebarComponent from './LoadCardholderWalletSidebarComponent';
import CustomButtonComponent from '@/components/common/CustomButtonComponent';
import { useCreateWalletMutation, useGetWalletDetailsQuery } from '@/redux/features/wallet/walletApis';
import type { WalletsDetailsResponseDataType, WalletItemType } from '@/types/wallets/depositWalletsTypes';
import { setShowInfoBanner } from '@/redux/slice/utility/utilitySlice';
import ShowInConsole from '@/utils/ShowInConsole';

// ── Status badge helpers ──────────────────────────────────────────────────────
const KYC_STATUS_STYLES: Record<string, string> = {
    PENDING:       'bg-yellow-100 text-yellow-700',
    'IN-PROGRESS': 'bg-blue-100 text-blue-700',
    RFI:           'bg-orange-100 text-orange-700',
    COMPLETED:     'bg-green-100 text-green-700',
};

const STATUS_STYLES: Record<string, string> = {
    DISABLED:       'bg-red-100 text-red-700',
    'PRE-VERIFIED': 'bg-yellow-100 text-yellow-700',
    VERIFIED:       'bg-blue-100 text-blue-700',
    ACTIVE:         'bg-green-100 text-green-700',
};

const formatDate = (iso: string) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    });
};

// ── Props ─────────────────────────────────────────────────────────────────────
interface CardholderDetailsSidebarComponentPropsType {
    isOpen: boolean;
    onClose: () => void;
    cardholder: CardholderItemType | null;
}

// ── Detail Row Helper ─────────────────────────────────────────────────────────
function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <>
            <span className="text-[var(--mute)] font-medium">{label}</span>
            <span className="text-right font-semibold text-[var(--ink)]">{value || '—'}</span>
        </>
    );
}

export default function CardholderDetailsSidebarComponent({
    isOpen,
    onClose,
    cardholder,
}: CardholderDetailsSidebarComponentPropsType) {
    const dispatch = useDispatch();

    // Lock background scroll when drawer is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const userEmail = sessionStorage.getItem('userEmail') || cardholder?.email || '';
    const targetCardholderId = cardholder?.cardholder_id;

    // Selected state for loading wallet
    const [isLoadWalletOpen, setIsLoadWalletOpen] = useState(false);

    // ------------------------------ USER USD WALLET DETAILS RTK QUERY ------------------------------ \\
    const {data: getWalletDetailsData, isFetching: getWalletDetailsIsFetching, isError: getWalletDetailsIsError, error: getWalletDetailsError} = useGetWalletDetailsQuery({ email: userEmail, cardholderId: targetCardholderId!, currency: 'USD' }, { skip: !isOpen || !userEmail || !targetCardholderId });
    const walletDetailsData = (getWalletDetailsData?.data as WalletsDetailsResponseDataType) ?? {};
    const walletList: WalletItemType[] = walletDetailsData?.wallets_details ?? [];
    const usdWallet: WalletItemType | undefined = walletList.find((w) => w.wallet_currency?.toUpperCase() === 'USD') ?? walletList[0];
    const destinationWalletId = walletDetailsData?.walletId || (usdWallet as any)?.walletId || usdWallet?._id || '';
    const isWalletsDetailsNotFound =
        (getWalletDetailsIsError &&
            getWalletDetailsError &&
            getWalletDetailsError != null &&
            'status' in getWalletDetailsError &&
            getWalletDetailsError?.status === 404 &&
            typeof getWalletDetailsError?.data === 'object' &&
            getWalletDetailsError?.data !== null &&
            'status' in getWalletDetailsError?.data &&
            (getWalletDetailsError?.data as { status: string }).status === 'NOT_FOUND') ||
        (!getWalletDetailsIsFetching && !usdWallet);
    // ------------------------------- XXXXXXXXXXXXXXXXXXXXXXXX ------------------------------- \\

    // ------------------------------- CREATE WALLET RTK QUERY ------------------------------- \\
    const [triggerCreateWallet, { isLoading: isCreatingWallet }] = useCreateWalletMutation();
    // ------------------------------- XXXXXXXXXXXXXXXXXXXXXXX ------------------------------- \\

    const handleCreateWallet = async () => {
        if (!userEmail || !cardholder?.cardholder_id) {
            dispatch(setShowInfoBanner('Necessary cardholder details not found to create wallet.'));
            return;
        }

        try {
            const result = await triggerCreateWallet({
                email: userEmail,
                cardholderId: cardholder.cardholder_id,
                walletDetails: {
                    walletStatus: 'ACTIVE',
                    walletType: 'FIAT',
                    walletCurrency: 'USD',
                },
            }).unwrap();

            ShowInConsole('Create wallet response:', result);

            if (result?.status?.toUpperCase() !== 'SUCCESS') {
                toast.error('Failed to create wallet. Please try again later.');
                return;
            }

            toast.success('USD wallet created successfully.');
        } catch (err: any) {
            ShowInConsole('Create wallet error:', err);

            const errorMessage =
                Array.isArray(err?.data?.message)
                    ? err.data.message[0]
                    : err?.data?.message ||
                      err?.message ||
                      'Failed to create wallet. Please try again later.';

            if (errorMessage?.toLowerCase()?.includes('wallet already exists')) {
                toast.error('Wallet already exists.');
            } else {
                toast.error('Failed to create wallet. Please try again later.');
            }
        }
    };

    if (!isOpen || !cardholder) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-200"
                onClick={onClose}
            />

            {/* Right Drawer Panel */}
            <div className="relative z-10 w-full max-w-md sm:max-w-lg h-full bg-[var(--bg-surface)] border-l border-[var(--line)] shadow-2xl flex flex-col overflow-hidden animate-[slideInRight_0.25s_ease-out]">
                <style>{`
                    @keyframes slideInRight {
                        from { transform: translateX(100%); }
                        to { transform: translateX(0); }
                    }
                `}</style>

                {/* Sidebar Header */}
                <div className="p-6! border-b border-[var(--line)] flex items-center justify-between bg-[var(--bg-surface)] shrink-0">
                    <h3 className="text-xl font-normal text-[var(--ink)] tracking-normal">
                        <span className="font-serif font-medium">Cardholder</span>{' '}
                        <span className="font-serif italic font-normal">details</span>
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5! rounded-lg text-[var(--mute)] hover:text-[var(--ink)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
                        aria-label="Close details"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content Body */}
                <div className="p-6! flex-1 flex flex-col gap-6 overflow-y-auto">
                    {/* Top Identity Block */}
                    <div className="flex flex-col gap-1.5">
                        <h2 className="text-2xl font-bold text-[var(--ink)]">
                            {cardholder.full_name}
                        </h2>
                        <p className="text-sm text-[var(--mute)]">{cardholder.email}</p>
                    </div>

                    {/* Section 1: STATUS (unchanged, not collapsible) */}
                    <div className="flex flex-col gap-3 pt-4! border-t border-[var(--line)]">
                        <div className="text-xs font-semibold text-[var(--mute)] uppercase tracking-wider">
                            <span>— STATUS</span>
                        </div>
                        <div className="grid grid-cols-2 gap-y-3 text-xs">
                            <span className="text-[var(--mute)] font-medium">KYC Status</span>
                            <span className="text-right">
                                <span
                                    className={`inline-flex items-center px-2! py-0.5! rounded-full text-[10px] font-semibold uppercase tracking-wide ${KYC_STATUS_STYLES[cardholder.kyc_status] ?? 'bg-gray-100 text-gray-600'}`}
                                >
                                    {cardholder.kyc_status}
                                </span>
                            </span>

                            <span className="text-[var(--mute)] font-medium">Account Status</span>
                            <span className="text-right">
                                <span
                                    className={`inline-flex items-center px-2! py-0.5! rounded-full text-[10px] font-semibold uppercase tracking-wide ${STATUS_STYLES[cardholder.status] ?? 'bg-gray-100 text-gray-600'}`}
                                >
                                    {cardholder.status}
                                </span>
                            </span>
                        </div>
                    </div>

                    {/* Section 2: PERSONAL (collapsible, default collapsed) */}
                    <CardholderCollapsibleSectionComponent title="— PERSONAL" defaultOpen={false}>
                        <div className="grid grid-cols-2 gap-y-3 text-xs">
                            <DetailRow label="Full Name" value={cardholder.full_name} />
                            <DetailRow label="Gender" value={cardholder.gender} />
                            <DetailRow
                                label="Date of Birth"
                                value={formatDate(cardholder.date_of_birth)}
                            />
                        </div>
                    </CardholderCollapsibleSectionComponent>

                    {/* Section 3: CONTACT (collapsible, default collapsed) */}
                    <CardholderCollapsibleSectionComponent title="— CONTACT" defaultOpen={false}>
                        <div className="grid grid-cols-2 gap-y-3 text-xs">
                            <DetailRow label="Email" value={cardholder.email} />
                            <DetailRow
                                label="Phone"
                                value={`${cardholder.mobile_country_code} ${cardholder.phone_number}`}
                            />
                            <DetailRow label="Country Code" value={cardholder.mobile_country_name} />
                        </div>
                    </CardholderCollapsibleSectionComponent>

                    {/* Section 4: PROGRAM (collapsible, default collapsed) */}
                    <CardholderCollapsibleSectionComponent title="— PROGRAM" defaultOpen={false}>
                        <div className="grid grid-cols-2 gap-y-3 text-xs">
                            <DetailRow label="Business" value={cardholder.business_name} />
                            <DetailRow label="Program Type" value={cardholder.program_type} />
                            <DetailRow
                                label="Cardholder ID"
                                value={cardholder.cardholder_id ?? '—'}
                            />
                        </div>
                    </CardholderCollapsibleSectionComponent>

                    {/* Section 5: SECURITY (collapsible, default collapsed) */}
                    <CardholderCollapsibleSectionComponent title="— SECURITY" defaultOpen={false}>
                        <div className="grid grid-cols-2 gap-y-3 text-xs">
                            <DetailRow
                                label="Email Verified"
                                value={cardholder.is_email_verified === 'Y' ? 'Yes' : 'No'}
                            />
                            <DetailRow
                                label="2FA Enabled"
                                value={cardholder.is_2fa_enabled === 'Y' ? 'Yes' : 'No'}
                            />
                            <DetailRow
                                label="2FA Type"
                                value={cardholder.two_fa_type ?? '—'}
                            />
                        </div>
                    </CardholderCollapsibleSectionComponent>

                    {/* Section 6: USD WALLET */}
                    <CardholderWalletSectionComponent
                        cardholderId={targetCardholderId}
                        userEmail={userEmail}
                    />

                    {/* Section 7: CARDS LIST */}
                    <CardholderCardsSectionComponent
                        cardholderId={targetCardholderId}
                        userEmail={userEmail}
                    />
                </div>

                {/* Footer: Create Wallet Button when wallet is not found, or Load Wallet Button when wallet exists */}
                {isWalletsDetailsNotFound ? (
                    <div className="shrink-0 p-4! sm:p-6! border-t border-[var(--line)] bg-[var(--bg-subtle)] flex items-center justify-end">
                        <div className="w-full sm:w-[150px] h-[38px]">
                            <CustomButtonComponent
                                id="cardholderDetails-createWallet-btn"
                                label="Create Wallet"
                                type="button"
                                variant="navy"
                                onClick={handleCreateWallet}
                                showButtonLoader={isCreatingWallet}
                                disabled={isCreatingWallet}
                            />
                        </div>
                    </div>
                ) : usdWallet ? (
                    <div className="shrink-0 p-4! sm:p-6! border-t border-[var(--line)] bg-[var(--bg-subtle)] flex items-center justify-end">
                        <div className="w-full sm:w-[150px] h-[38px]">
                            <CustomButtonComponent
                                id="cardholderDetails-loadWallet-btn"
                                label={
                                    <span className="flex items-center justify-center gap-1.5">
                                        <ArrowDownToLine className="w-4 h-4" /> Load Wallet
                                    </span>
                                }
                                type="button"
                                variant="navy"
                                onClick={() => setIsLoadWalletOpen(true)}
                            />
                        </div>
                    </div>
                ) : null}
            </div>

            {/* Load Cardholder Wallet Sidebar Drawer */}
            <LoadCardholderWalletSidebarComponent
                isOpen={isLoadWalletOpen}
                onClose={() => setIsLoadWalletOpen(false)}
                cardholder={cardholder}
                wallet={usdWallet ?? null}
                destinationWalletId={destinationWalletId}
            />
        </div>
    );
}
