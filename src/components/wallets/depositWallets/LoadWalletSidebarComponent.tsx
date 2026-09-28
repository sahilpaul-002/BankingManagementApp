import { useEffect } from 'react';
import { Controller, useForm, type SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useDispatch } from 'react-redux';
import { setShowErrorBanner } from '@/redux/slice/utility/utilitySlice';
import { useLoadWalletMutation } from '@/redux/features/wallet/walletApis';
import CustomInputComponent from '@/components/common/CustomInputComponent';
import CustomSelectComponent from '@/components/common/CustomSelectComponent';
import CustomButtonComponent from '@/components/common/CustomButtonComponent';
import ShowInConsole from '@/utils/ShowInConsole';
import type { WalletItemType } from '@/types/wallets/depositWalletsTypes';
import { toast } from 'react-toastify';

// --- Constants ---

const NETWORK_OPTIONS = [
    { label: 'Ethereum', value: 'ETHEREUM' },
    { label: 'Polygon', value: 'POLYGON' },
];

const CryptoNetworkEnum = z.enum(['ETHEREUM', 'TRON', 'POLYGON', 'BSC']);

// --- Schema ---

const createLoadWalletSchema = (walletType?: string) =>
    z
        .object({
            amount: z
                .string()
                .min(1, 'Amount is required')
                .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
                    message: 'Amount must be a positive number',
                }),
            network: CryptoNetworkEnum.optional(),
        })
        .superRefine((data, ctx) => {
            if (walletType === 'CRYPTO' && !data.network) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'Network is required for crypto wallet',
                    path: ['network'],
                });
            }
        });

type LoadWalletFormData = z.infer<ReturnType<typeof createLoadWalletSchema>>;

// --- Props ---

interface LoadWalletSidebarComponentPropsType {
    isOpen: boolean;
    onClose: () => void;
    wallet: WalletItemType | null;
    walletId?: string | null;
    onSuccess?: () => void;
}

// --- Component ---

export default function LoadWalletSidebarComponent({
    isOpen,
    onClose,
    wallet,
    onSuccess,
}: LoadWalletSidebarComponentPropsType) {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const isFiat = wallet?.wallet_type === 'FIAT';
    const isCrypto = wallet?.wallet_type === 'CRYPTO';

    const [triggerLoadWallet, { isLoading: loadWalletIsSubmitting }] = useLoadWalletMutation();

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<LoadWalletFormData>({
        resolver: zodResolver(createLoadWalletSchema(wallet?.wallet_type)),
        defaultValues: {
            amount: '',
            network: undefined,
        },
    });

    // Lock body scroll when open
    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : 'unset';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) {
            reset({
                amount: '',
                network: undefined,
            });
        }
    }, [isOpen, wallet?._id, wallet?.wallet_type, reset]);

    const handleClose = () => {
        reset({
            amount: '',
            network: undefined,
        });
        onClose();
    };

    const onSubmit: SubmitHandler<LoadWalletFormData> = async (data) => {
        const userEmail = sessionStorage.getItem('userEmail');
        const userCardholderId = sessionStorage.getItem('cardholderId');
        const userWalletId = sessionStorage.getItem('walletId');

        if (!userEmail || !userCardholderId || !userWalletId) {
            dispatch(
                setShowErrorBanner(
                    'Application facing issue — necessary user details not present in session storage. Please re-login.'
                )
            );
            return;
        }

        if (!wallet) {
            dispatch(setShowErrorBanner('No wallet selected. Please try again.'));
            return;
        }

        try {
            const payload = {
                email: userEmail,
                walletDetails: {
                    cardholderId: userCardholderId,
                    walletId: userWalletId,
                    walletType: wallet.wallet_type,
                    walletCurrency: wallet.wallet_currency as "USD" | "SGD" | "EUR" | "USDT" | "USDC",
                    amount: Number(data.amount),
                    ...(isCrypto && data.network
                        ? {
                              network: data.network as 'ETHEREUM' | 'POLYGON',
                          }
                        : {}),
                },
            };

            await triggerLoadWallet(payload).unwrap();

            toast.success('Wallet loaded successfully.');

            handleClose();
            onSuccess?.();
        } catch (error: any) {
            ShowInConsole('LoadWallet error:', error);

            const errorMessage =
                Array.isArray(error?.data?.message)
                    ? error.data.message[0]
                    : error?.data?.message ||
                      error?.message ||
                      'Failed to load wallet. Please try again later.';

            toast.error(errorMessage);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-xs"
                onClick={handleClose}
            />

            {/* Right Sidebar Panel */}
            <div className="relative z-10 w-full max-w-md h-full bg-[var(--bg-surface)] border-l border-[var(--line)] shadow-2xl flex flex-col overflow-hidden animate-[slideInRight_0.25s_ease-out]">
                <style>{`
                    @keyframes slideInRight {
                        from { transform: translateX(100%); }
                        to   { transform: translateX(0); }
                    }
                `}</style>

                {/* Header */}
                <div className="shrink-0 p-6! border-b border-[var(--line)] bg-[var(--bg-subtle)] flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-[var(--ink)]">
                            Load Wallet
                        </h3>
                        <p className="text-xs text-[var(--mute)] mt-1!">
                            {wallet?.wallet_currency ?? '—'} &bull;{' '}
                            {wallet?.wallet_type === 'FIAT' ? 'Fiat Currency Wallet' : 'Crypto Currency Wallet'}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={loadWalletIsSubmitting}
                        className="p-1.5 rounded-lg text-[var(--mute)] hover:text-[var(--ink)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer disabled:opacity-50"
                        aria-label="Close sidebar"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body Form */}
                <form
                    id="depositWallets-loadWallet-form"
                    noValidate
                    onSubmit={handleSubmit(onSubmit)}
                    className="flex-1 overflow-y-auto p-6! space-y-6!"
                >
                    {/* Wallet info card */}
                    <div className="p-4! rounded-xl bg-[var(--bg-subtle)] border border-[var(--line)] space-y-2.5">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-[var(--mute)] font-medium">Account Balance</span>
                            <span className="font-semibold text-[var(--ink)]">
                                {wallet?.account_balance?.$numberDecimal ?? '0.00'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-[var(--mute)] font-medium">Available Balance</span>
                            <span className="font-semibold text-[var(--ok)]">
                                {wallet?.available_balance?.$numberDecimal ?? '0.00'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-[var(--mute)] font-medium">Currency</span>
                            <span className="font-semibold text-[var(--ink)] uppercase">
                                {wallet?.wallet_currency ?? '—'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-[var(--mute)] font-medium">Status</span>
                            <span className="font-semibold text-[var(--ink)]">
                                {wallet?.wallet_status ?? '—'}
                            </span>
                        </div>
                    </div>

                    {/* Amount */}
                    <Controller
                        name="amount"
                        control={control}
                        render={({ field }) => (
                            <CustomInputComponent
                                id="loadWallet-amount"
                                label="Amount"
                                placeholder="Enter amount"
                                type="number"
                                fieldLabelClassname="text-sm text-[var(--ink-soft)] font-semibold tracking-normal mb-2"
                                inputClassname="px-4! text-[var(--ink)]"
                                error={errors.amount?.message}
                                {...field}
                            />
                        )}
                    />

                    {/* Currency — Read-only field */}
                    <CustomInputComponent
                        id="loadWallet-currency"
                        label="Wallet Currency"
                        placeholder="Wallet currency"
                        type="text"
                        fieldLabelClassname="text-sm text-[var(--ink-soft)] font-semibold tracking-normal mb-2"
                        inputClassname="px-4! text-[var(--ink)] opacity-70"
                        value={wallet?.wallet_currency ?? ''}
                        disabled
                    />

                    {/* Network — Required ONLY for CRYPTO */}
                    {isCrypto && (
                        <div className="w-full h-fit flex flex-col justify-center items-start gap-2">
                            <span className="text-sm text-[var(--ink-soft)] font-semibold tracking-normal">
                                Network
                            </span>
                            <Controller
                                name="network"
                                control={control}
                                render={({ field }) => (
                                    <CustomSelectComponent
                                        id="loadWallet-network"
                                        label="Select network"
                                        labels={NETWORK_OPTIONS}
                                        selectTriggerClassName="w-full h-[42px] px-4! text-[var(--ink-2)]"
                                        selectGroupClassName="w-full"
                                        error={errors.network?.message}
                                        value={field.value ?? null}
                                        onChange={field.onChange}
                                        ref={field.ref}
                                    />
                                )}
                            />
                        </div>
                    )}
                </form>

                {/* Footer */}
                <div className="shrink-0 p-6! border-t border-[var(--line)] bg-[var(--bg-subtle)] flex items-center justify-end gap-3">
                    <div className="w-[100px] h-[38px]">
                        <CustomButtonComponent
                            id="loadWallet-cancel-btn"
                            label="Cancel"
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={loadWalletIsSubmitting}
                        />
                    </div>

                    <div className="w-[140px] h-[38px]">
                        <CustomButtonComponent
                            id="loadWallet-submit-btn"
                            label="Load Wallet"
                            type="submit"
                            form="depositWallets-loadWallet-form"
                            variant="navy"
                            showButtonLoader={loadWalletIsSubmitting}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}


