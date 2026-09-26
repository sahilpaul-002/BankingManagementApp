import { useEffect } from 'react';
import { Controller, useForm, type SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Info } from 'lucide-react';
import { toast } from 'react-toastify';
import CustomButtonComponent from '@/components/common/CustomButtonComponent';
import CustomSelectComponent from '@/components/common/CustomSelectComponent';
import { useCreateWalletMutation } from '@/redux/features/wallet/walletApis';
import ShowInConsole from '@/utils/ShowInConsole';
import { setShowErrorBanner, setShowInfoBanner } from '@/redux/slice/utility/utilitySlice';
import { useNavigate } from 'react-router';
import { useDispatch } from 'react-redux';

// ─── Constants ────────────────────────────────────────────────────────────────

const WALLET_TYPE_OPTIONS = [
    { label: 'Fiat', value: 'FIAT' },
    { label: 'Crypto', value: 'CRYPTO' },
];

const CURRENCY_OPTIONS: Record<string, { label: string; value: string }[]> = {
    FIAT: [
        { label: 'USD', value: 'USD' },
        { label: 'SGD', value: 'SGD' },
        { label: 'EUR', value: 'EUR' },
    ],
    CRYPTO: [
        { label: 'USDT', value: 'USDT' },
        { label: 'USDC', value: 'USDC' },
    ],
};

// ─── Schema ───────────────────────────────────────────────────────────────────

const createWalletSchema = z.object({
    walletType: z.enum(['FIAT', 'CRYPTO'], {
        message: 'Wallet type is required',
    }),
    walletCurrency: z.string().min(1, 'Wallet currency is required'),
});

type CreateWalletFormData = z.infer<typeof createWalletSchema>;

// ─── Props ────────────────────────────────────────────────────────────────────

interface CreateWalletSidebarComponentPropsType {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CreateWalletSidebarComponent({ isOpen, onClose, onSuccess }: CreateWalletSidebarComponentPropsType) {
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

    // ------------------------------- CREATE WALLET RTK QUERY ------------------------------- \\
    // Create Wallet
    const [triggerCreateWallet, { isLoading: isSubmitting }] = useCreateWalletMutation();
    // ------------------------------- XXXXXXXXXXXXXXXXXXXXXXX ------------------------------- \\

    const {
        control,
        handleSubmit,
        watch,
        reset,
        setValue,
        formState: { errors },
    } = useForm<CreateWalletFormData>({
        resolver: zodResolver(createWalletSchema),
        mode: 'onTouched',
        reValidateMode: 'onChange',
        defaultValues: {
            walletCurrency: '',
        },
    });

    const selectedWalletType = watch('walletType');

    // Reset currency when wallet type changes
    useEffect(() => {
        setValue('walletCurrency', '');
    }, [selectedWalletType, setValue]);

    // Lock body scroll when open
    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : 'unset';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const handleClose = () => {
        if (isSubmitting) return;
        reset();
        onClose();
    };

    const handleFormSubmit: SubmitHandler<CreateWalletFormData> = async (formData) => {
        if (!userEmail || !userCardholderId) {
            dispatch(setShowErrorBanner('Necessary user details not found. Please re-login.'));
            return;
        }

        try {
            const result = await triggerCreateWallet({
                email: userEmail,
                cardholderId: userCardholderId,
                walletDetails: {
                    walletStatus: 'ACTIVE',
                    walletType: formData.walletType,
                    walletCurrency: formData.walletCurrency as 'USD' | 'SGD' | 'EUR' | 'USDT' | 'USDC',
                },
            }).unwrap();

            ShowInConsole('Create wallet response:', result);

            if (result?.status?.toUpperCase() !== 'SUCCESS') {
                toast.error('Failed to create wallet. Please try again later.');
                return;
            }

            toast.success('Wallet created successfully.');
            reset();
            onSuccess();
        } catch (err: any) {
            ShowInConsole('Create wallet error:', err);
            
            const errorMessage =
                Array.isArray(err?.data?.message)
                    ? err.data.message[0]
                    : err?.data?.message ||
                    err?.message ||
                    'Failed to create wallet. Please try again later.';

            if (errorMessage?.toLowerCase()?.includes("wallet already exists")) {
                toast.error('Wallet already exist. Please try a different wallet.');
            }
            else {
                toast.error('Failed to create wallet. Please try again later.');
            }
        }
    };

    const currencyOptions = selectedWalletType ? CURRENCY_OPTIONS[selectedWalletType] ?? [] : [];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-xs"
                onClick={handleClose}
            />

            {/* Right Sidebar */}
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
                            Create Wallet
                        </h3>
                        <p className="text-xs text-[var(--mute)] mt-1!">
                            Add a new deposit wallet to your account.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={isSubmitting}
                        className="p-1.5 rounded-lg text-[var(--mute)] hover:text-[var(--ink)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer disabled:opacity-50"
                        aria-label="Close sidebar"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form
                    id="depositWallets-createWallet-form"
                    noValidate
                    onSubmit={handleSubmit(handleFormSubmit)}
                    className="flex-1 overflow-y-auto p-6! space-y-6!"
                >
                    {/* Info Banner */}
                    <div className="flex items-start gap-3 p-4! rounded-xl bg-[var(--bg-subtle)] border border-[var(--line)]">
                        <Info className="w-4 h-4 mt-0.5 shrink-0 text-[var(--mute)]" />
                        <p className="text-xs text-[var(--mute)] leading-relaxed">
                            Only one wallet can be created for each combination of wallet type and
                            currency. For example, you can have one{' '}
                            <strong className="text-[var(--ink-soft)]">FIAT — USD</strong> wallet and one{' '}
                            <strong className="text-[var(--ink-soft)]">CRYPTO — USDT</strong> wallet.
                        </p>
                    </div>

                    {/* Wallet Type */}
                    <div className="w-full h-fit flex flex-col justify-center items-start gap-2">
                        <span className="text-sm text-[var(--ink-soft)] font-semibold tracking-normal">
                            Wallet Type
                        </span>

                        <Controller
                            name="walletType"
                            control={control}
                            render={({ field }) => (
                                <CustomSelectComponent
                                    id="createWallet-walletType"
                                    label="Select wallet type"
                                    labels={WALLET_TYPE_OPTIONS}
                                    selectTriggerClassName="w-full h-[42px] px-4! text-[var(--ink-2)]"
                                    selectGroupClassName="w-full"
                                    value={field.value ?? null}
                                    onChange={field.onChange}
                                    error={errors?.walletType?.message}
                                />
                            )}
                        />
                    </div>

                    {/* Wallet Currency */}
                    <div className="w-full h-fit flex flex-col justify-center items-start gap-2">
                        <span className="text-sm text-[var(--ink-soft)] font-semibold tracking-normal">
                            Wallet Currency
                        </span>

                        <Controller
                            name="walletCurrency"
                            control={control}
                            render={({ field }) => (
                                <CustomSelectComponent
                                    id="createWallet-walletCurrency"
                                    label={
                                        selectedWalletType
                                            ? 'Select wallet currency'
                                            : 'Select wallet type first'
                                    }
                                    labels={currencyOptions}
                                    selectTriggerClassName="w-full h-[42px] px-4! text-[var(--ink-2)]"
                                    selectGroupClassName="w-full"
                                    value={field.value || null}
                                    onChange={field.onChange}
                                    error={errors?.walletCurrency?.message}
                                    disabled={!selectedWalletType}
                                />
                            )}
                        />
                    </div>
                </form>

                {/* Footer */}
                <div className="shrink-0 p-6! border-t border-[var(--line)] bg-[var(--bg-subtle)] flex items-center justify-end gap-3">
                    <div className="w-[100px] h-[38px]">
                        <CustomButtonComponent
                            id="createWallet-cancel-btn"
                            label="Cancel"
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="w-[140px] h-[38px]">
                        <CustomButtonComponent
                            id="createWallet-submit-btn"
                            label="Create Wallet"
                            type="submit"
                            form="depositWallets-createWallet-form"
                            variant="navy"
                            showButtonLoader={isSubmitting}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
