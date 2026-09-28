import { useEffect } from 'react';
import { Controller, useForm, type SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Wallet } from 'lucide-react';
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
}

// --- Component ---

export default function LoadWalletSidebarComponent({
    isOpen,
    onClose,
    wallet,
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
            ShowInConsole('LoadWallet form data:', data);

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

            ShowInConsole('LoadWallet payload:', payload);

            await triggerLoadWallet(payload).unwrap();

            toast.success('Wallet loaded successfully.');

            handleClose();
            navigate(0);
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
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Sidebar Panel */}
            <div className="relative z-10 flex h-full w-full max-w-[480px] flex-col bg-white shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy-800">
                            <Wallet className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-gray-900">Load Wallet</h2>
                            <p className="text-xs text-gray-500">
                                {wallet?.wallet_currency ?? '—'} &bull;{' '}
                                {wallet?.wallet_type ?? ''}
                            </p>
                        </div>
                    </div>
                    <button
                        id="loadWallet-close-btn"
                        type="button"
                        onClick={handleClose}
                        disabled={loadWalletIsSubmitting}
                        className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-6">
                    {/* Wallet info card */}
                    <div className="mb-6 rounded-xl border border-gray-100 bg-gray-50 p-4">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Account Balance</span>
                            <span className="font-semibold text-gray-900">
                                {wallet?.account_balance?.$numberDecimal ?? '0.00'}
                            </span>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-sm">
                            <span className="text-gray-500">Available Balance</span>
                            <span className="font-medium text-gray-700">
                                {wallet?.available_balance?.$numberDecimal ?? '0.00'}
                            </span>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-sm">
                            <span className="text-gray-500">Currency</span>
                            <span className="font-medium text-gray-700">
                                {wallet?.wallet_currency ?? '—'}
                            </span>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-sm">
                            <span className="text-gray-500">Status</span>
                            <span className="font-medium text-gray-700">
                                {wallet?.wallet_status ?? '—'}
                            </span>
                        </div>
                    </div>

                    {/* Form */}
                    <form id="depositWallets-loadWallet-form" onSubmit={handleSubmit(onSubmit)}>
                        <div className="space-y-5">
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
                                        error={errors.amount?.message}
                                        {...field}
                                    />
                                )}
                            />

                            {/* Currency — Read-only field */}
                            <CustomInputComponent
                                id="loadWallet-currency"
                                label="Currency"
                                type="text"
                                placeholder="Wallet currency"
                                value={wallet?.wallet_currency ?? ''}
                                disabled
                            />

                            {/* Network — Required ONLY for CRYPTO */}
                            {isCrypto && (
                                <Controller
                                    name="network"
                                    control={control}
                                    render={({ field }) => (
                                        <CustomSelectComponent
                                            id="loadWallet-network"
                                            label="Select network"
                                            labels={NETWORK_OPTIONS}
                                            error={errors.network?.message}
                                            value={field.value ?? null}
                                            onChange={field.onChange}
                                            ref={field.ref}
                                        />
                                    )}
                                />
                            )}
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 px-6 py-4">
                    <div className="flex items-center justify-end gap-3">
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
        </div>
    );
}

