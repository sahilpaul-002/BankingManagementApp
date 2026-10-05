import { useEffect } from 'react';
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, ArrowDownToLine, DollarSign } from 'lucide-react';
import { toast } from 'react-toastify';
import { useDispatch } from 'react-redux';
import CustomInputComponent from '@/components/common/CustomInputComponent';
import CustomButtonComponent from '@/components/common/CustomButtonComponent';
import { useWalletToWalletLoadMutation, walletApis } from '@/redux/features/wallet/walletApis';
import { setShowInfoBanner } from '@/redux/slice/utility/utilitySlice';
import ShowInConsole from '@/utils/ShowInConsole';
import type { CardholderItemType } from '@/types/cards/cardholderTypes';
import type { WalletItemType } from '@/types/wallets/depositWalletsTypes';

// ── Validation Schema ──────────────────────────────────────────────────────────
const loadCardholderWalletSchema = z.object({
    amount: z
        .string({
            error: 'Amount is required',
        })
        .trim()
        .min(1, 'Amount is required')
        .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
            message: 'Amount must be a positive number',
        })
        .refine((val) => /^\d+(\.\d{1,4})?$/.test(val), {
            message: 'Amount must be a valid number with up to 4 decimal places',
        }),
});

type LoadCardholderWalletFormData = z.infer<typeof loadCardholderWalletSchema>;

// ── Props ─────────────────────────────────────────────────────────────────────
interface LoadCardholderWalletSidebarComponentPropsType {
    isOpen: boolean;
    onClose: () => void;
    cardholder: CardholderItemType | null;
    wallet: WalletItemType | null;
    destinationWalletId: string;
    onSuccess?: () => void;
}

// ── Helper: Format Decimal ────────────────────────────────────────────────────
function formatDecimal(val?: string) {
    const num = Number(val);
    return Number.isFinite(num) ? num.toFixed(2) : '0.00';
}

export default function LoadCardholderWalletSidebarComponent({
    isOpen,
    onClose,
    cardholder,
    wallet,
    destinationWalletId,
    onSuccess,
}: LoadCardholderWalletSidebarComponentPropsType) {
    const dispatch = useDispatch();

    // ---------------------------- WALLET TO WALLET LOAD MUTATION ---------------------------- \\
    const [triggerWalletToWalletLoad, { isLoading: isSubmitting }] = useWalletToWalletLoadMutation();
    // ----------------------------- XXXXXXXXXXXXXXXXXXXXXXXXXXXX ----------------------------- \\

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<LoadCardholderWalletFormData>({
        resolver: zodResolver(loadCardholderWalletSchema),
        defaultValues: {
            amount: '',
        },
    });

    // Lock body scroll when open
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

    useEffect(() => {
        if (!isOpen) {
            reset({
                amount: '',
            });
        }
    }, [isOpen, reset]);

    const handleClose = () => {
        reset({
            amount: '',
        });
        onClose();
    };

    const handleFormSubmit: SubmitHandler<LoadCardholderWalletFormData> = async (formData) => {
        const userEmail = sessionStorage.getItem('userEmail');
        const userId = sessionStorage.getItem('userId');
        const userWalletId = sessionStorage.getItem('walletId');

        if (!userEmail || !userId || !userWalletId) {
            dispatch(
                setShowInfoBanner(
                    'Application facing issue, necessary user details not present in session storage. Please re-login.'
                )
            );
            return;
        }

        if (!destinationWalletId) {
            toast.error('Destination wallet ID not found. Please try again.');
            return;
        }

        try {
            const payload = {
                email: userEmail,
                loadDetails: {
                    sourceUserId: userId,
                    sourceWalletId: userWalletId,
                    destinationWalletId: destinationWalletId,
                    amount: formData.amount.trim(),
                },
            };

            const result = await triggerWalletToWalletLoad(payload).unwrap();
            ShowInConsole('Wallet to wallet load response:', result);

            toast.success('Cardholder USD wallet loaded successfully.');

            // Invalidate wallet tags to ensure UI refresh
            dispatch(
                walletApis.util.invalidateTags([
                    { type: 'Wallet', id: 'DETAILS' },
                    { type: 'Wallet', id: 'BALANCES' },
                ])
            );

            handleClose();
            onSuccess?.();
        } catch (error: any) {
            ShowInConsole('Wallet to wallet load error:', error);

            const errorMessage =
                Array.isArray(error?.data?.message)
                    ? error.data.message[0]
                    : error?.data?.message ||
                      error?.message ||
                      'Failed to load cardholder wallet. Please try again later.';

            const normalizeErrorMessage = errorMessage?.toLowerCase();
            if (normalizeErrorMessage?.includes('insufficient source usd wallet balance')) {
                toast.error('Insufficient source USD wallet balance to complete this transfer.');
            } 
            else if (normalizeErrorMessage?.includes('source') && (normalizeErrorMessage?.includes('wallet') || normalizeErrorMessage?.includes('wallets')) && normalizeErrorMessage?.includes('not found')) {
                toast.error('Admin wallet not found. Please try again.');
            } 
            else if (normalizeErrorMessage?.includes('active usd source wallet not found') && normalizeErrorMessage?.includes('source usd wallet details not found')) {
                toast.error('Admin USD wallet not found. Please try again.');
            } 
            else if (normalizeErrorMessage?.includes('destination') && (normalizeErrorMessage?.includes('wallet') || normalizeErrorMessage?.includes('wallets')) && normalizeErrorMessage?.includes('not found')) {
                toast.error('Cardholder wallet not found. Please try again.');
            } 
            else if (normalizeErrorMessage?.includes('active usd destination wallet not found') && normalizeErrorMessage?.includes('destination usd wallet details not found')) {
                toast.error('Cardholder USD wallet not found. Please try again.');
            } 
            else if (normalizeErrorMessage?.includes('source and destination wallet cannot be the same')) {
                toast.error('Admin and cardholder wallet cannot be same. Please try for different cardholder.');
            } 
            else {
                toast.error('Failed to load cardholder wallet. Please try again later.');
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-60 flex justify-end">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-200"
                onClick={handleClose}
            />

            {/* Right Drawer Panel */}
            <div className="relative z-10 w-full max-w-md h-full bg-[var(--bg-surface)] border-l border-[var(--line)] shadow-2xl flex flex-col justify-between overflow-hidden animate-[slideInRight_0.25s_ease-out]">
                <style>{`
                    @keyframes slideInRight {
                        from { transform: translateX(100%); }
                        to   { transform: translateX(0); }
                    }
                `}</style>

                {/* Sidebar Header */}
                <div className="p-6! border-b border-[var(--line)] bg-[var(--bg-subtle)] flex items-center justify-between shrink-0">
                    <div>
                        <h3 className="text-xl font-normal text-[var(--ink)] tracking-normal">
                            <span className="font-serif font-medium">Load</span>{' '}
                            <span className="font-serif italic font-normal">Wallet</span>
                        </h3>
                        <p className="text-xs text-[var(--mute)] mt-1!">
                            Transfer funds directly from company wallet to cardholder USD wallet.
                        </p>
                    </div>

                    <button
                        type="button"
                        id="loadCardholderWallet-close-btn"
                        onClick={handleClose}
                        disabled={isSubmitting}
                        className="p-1.5 rounded-lg text-[var(--mute)] hover:text-[var(--ink)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer disabled:opacity-50"
                        aria-label="Close load wallet drawer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body Form */}
                <form
                    id="cardholder-loadWallet-form"
                    noValidate
                    onSubmit={handleSubmit(handleFormSubmit)}
                    className="flex-1 overflow-y-auto p-6! space-y-5!"
                >
                    {/* Destination Cardholder Summary Card */}
                    {cardholder && (
                        <div className="p-4! rounded-xl bg-[var(--bg-subtle)] border border-[var(--line)] space-y-2.5">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-[var(--mute)] uppercase tracking-wider">
                                    Recipient Cardholder
                                </span>
                                <span className="text-[10px] font-bold text-[var(--gold)] uppercase bg-[var(--bg-surface)] px-2! py-0.5! rounded border border-[var(--line)]">
                                    USD
                                </span>
                            </div>
                            <div className="text-sm font-bold text-[var(--ink)]">
                                {cardholder.full_name}
                            </div>
                            <div className="text-xs text-[var(--mute)]">
                                {cardholder.email}
                            </div>
                        </div>
                    )}

                    {/* Destination Wallet Balance Card */}
                    {wallet && (
                        <div className="p-4! rounded-xl bg-[var(--bg-subtle)] border border-[var(--line)] space-y-2.5">
                            <div className="flex items-center justify-between pb-2! border-b border-[var(--line)]">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5! rounded-lg bg-[var(--nav-bg)] text-[var(--gold)]">
                                        <DollarSign className="w-3.5 h-3.5" />
                                    </div>
                                    <span className="text-xs font-medium text-[var(--mute)]">
                                        Current Available Balance
                                    </span>
                                </div>
                                <span className="text-sm font-bold text-[var(--ink)]">
                                    ${formatDecimal(wallet.available_balance?.$numberDecimal)}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-y-2 text-xs">
                                <span className="text-[var(--mute)] font-medium">Currency</span>
                                <span className="text-right font-semibold text-[var(--ink)]">
                                    {wallet.wallet_currency || 'USD'}
                                </span>

                                <span className="text-[var(--mute)] font-medium">Wallet Status</span>
                                <span className="text-right">
                                    <span className="inline-flex items-center px-2! py-0.5! rounded-full text-[10px] font-semibold uppercase bg-green-100 text-green-700">
                                        {wallet.wallet_status || 'ACTIVE'}
                                    </span>
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Amount Input Field */}
                    <Controller
                        name="amount"
                        control={control}
                        render={({ field }) => (
                            <CustomInputComponent
                                id="loadCardholderWallet-amount-input"
                                label="Amount (USD)"
                                placeholder="Enter amount to transfer (e.g. 50.00)"
                                type="number"
                                fieldLabelClassname="text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)] mb-2"
                                inputClassname="px-4! text-[var(--ink)]"
                                error={errors.amount?.message}
                                {...field}
                            />
                        )}
                    />
                </form>

                {/* Footer Action Buttons */}
                <div className="shrink-0 p-6! border-t border-[var(--line)] bg-[var(--bg-subtle)] flex items-center justify-end gap-3">
                    <div className="w-[100px] h-[38px]">
                        <CustomButtonComponent
                            id="loadCardholderWallet-cancel-btn"
                            label="Cancel"
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="w-[150px] h-[38px]">
                        <CustomButtonComponent
                            id="loadCardholderWallet-submit-btn"
                            label={
                                <span className="flex items-center justify-center gap-1.5">
                                    <ArrowDownToLine className="w-4 h-4" /> Load Wallet
                                </span>
                            }
                            type="submit"
                            form="cardholder-loadWallet-form"
                            variant="navy"
                            showButtonLoader={isSubmitting}
                            disabled={isSubmitting}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
