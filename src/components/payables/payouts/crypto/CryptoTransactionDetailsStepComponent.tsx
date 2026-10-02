import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Wallet, ArrowRight, Info, CircleAlert } from 'lucide-react';
import CustomInputComponent from '@/components/common/CustomInputComponent';
import CustomSelectComponent from '@/components/common/CustomSelectComponent';
import CustomButtonComponent from '@/components/common/CustomButtonComponent';
import type { CryptoTransactionFormDataType, WalletBalanceItemType } from '@/types/payables/payoutTypes';
import { Activity } from 'react';

// ── Constants ────────────────────────────────────────────────────────────────
const CRYPTO_TRANSFER_FEE_PERCENTAGE = 20;
const CRYPTO_CURRENCIES = ['USDT', 'USDC'] as const;
const CRYPTO_NETWORKS = ['ETHEREUM', 'POLYGON'] as const;

const NETWORK_OPTIONS = [
    { label: 'Ethereum', value: 'ETHEREUM' },
    { label: 'Polygon', value: 'POLYGON' },
];

// ── Zod Schema ───────────────────────────────────────────────────────────────
export const cryptoTransactionSchema = z.object({
    source_wallet_currency: z.enum(['USDT', 'USDC'], {
        message: 'Please select a source wallet',
    }),

    network: z.enum(['ETHEREUM', 'POLYGON'], {
        message: 'Please select a network',
    }),

    destination_address: z
        .string()
        .min(1, 'Destination address is required')
        .trim()
        .regex(
            /^0x[0-9a-fA-F]{40}$/,
            'Must be a valid Ethereum-style address (0x followed by 40 hex characters)'
        ),

    amount: z
        .string()
        .min(1, 'Amount is required')
        .refine(
            (val) => !isNaN(Number(val)) && Number(val) > 0,
            {
                message: 'Amount must be greater than 0',
            }
        ),
});

export type CryptoTransactionFormSchemaDataType = z.infer<typeof cryptoTransactionSchema>;

// ── Props ─────────────────────────────────────────────────────────────────────
interface CryptoTransactionDetailsStepComponentProps {
    wallets: WalletBalanceItemType[];
    walletsBalancesListNotFound?: boolean | undefined;
    onSubmit: (data: CryptoTransactionFormSchemaDataType) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--mute)] font-medium">{label}</span>
            <span className="font-semibold text-[var(--ink)]">{value}</span>
        </div>
    );
}

export default function CryptoTransactionDetailsStepComponent({
    wallets,
    walletsBalancesListNotFound,
    onSubmit,
}: CryptoTransactionDetailsStepComponentProps) {
    // Filter crypto wallets
    const cryptoWallets = (wallets ?? []).filter(
        (w) => CRYPTO_CURRENCIES.includes(w.wallet_currency as typeof CRYPTO_CURRENCIES[number])
    );
    const hasCryptoWallets = cryptoWallets.length > 0;

    const walletSelectOptions = cryptoWallets.map((w) => ({
        label: `${w.wallet_currency} — ${parseFloat(w.available_balance).toFixed(2)} available`,
        value: w.wallet_currency,
    }));

    const {
        register,
        handleSubmit,
        control,
        watch,
        formState: { errors },
        setError,
    } = useForm<CryptoTransactionFormSchemaDataType>({
        resolver: zodResolver(cryptoTransactionSchema),
        mode: 'onTouched',
        reValidateMode: 'onChange',
        defaultValues: {
            destination_address: '',
            amount: '',
        },
    });

    const watchedCurrency = watch('source_wallet_currency');
    const watchedAmount = watch('amount');

    const selectedWallet = cryptoWallets.find((w) => w.wallet_currency === watchedCurrency) ?? null;
    const availableBalance = selectedWallet ? parseFloat(selectedWallet.available_balance) : 0;
    const parsedAmount = parseFloat(watchedAmount) || 0;

    const handleFormSubmit: SubmitHandler<CryptoTransactionFormDataType> = (data) => {
        const balance = cryptoWallets.find((w) => w.wallet_currency === data.source_wallet_currency)
            ? parseFloat(cryptoWallets.find((w) => w.wallet_currency === data.source_wallet_currency)!.available_balance)
            : 0;

        const amount = parseFloat(data.amount);

        if (amount > balance) {
            setError('amount', {
                type: 'manual',
                message: `Amount (${amount.toFixed(2)} ${data.source_wallet_currency}) exceeds available balance (${balance.toFixed(2)} ${data.source_wallet_currency})`,
            });
            return;
        }

        onSubmit({
            ...data,
            destination_address: data.destination_address.trim(),
        });
    };

    const currencyLabel = watchedCurrency || '';

    return (
        <>
            {/* Wallets Not Found */}
            <Activity mode={walletsBalancesListNotFound || !hasCryptoWallets ? "visible" : "hidden"}>
                <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--bg-subtle)] border border-[var(--line)]">
                        <CircleAlert className="h-5 w-5 text-[var(--mute)]" />
                    </div>

                    <div className="flex flex-col gap-1">
                        <p className="text-sm font-semibold text-[var(--ink)]">
                            Crypto wallets not found
                        </p>

                        <p className="max-w-md text-xs leading-relaxed text-[var(--mute)]">
                            No USDT or USDC wallet is available for crypto transfers.
                        </p>
                    </div>
                </div>
            </Activity>

            {/* Main Content */}
            <Activity mode={walletsBalancesListNotFound || !hasCryptoWallets ? "hidden" : "visible"}>
                <div className="w-full bg-[var(--bg-surface)] rounded-xl border border-[var(--line)] p-6! shadow-xs flex flex-col gap-6">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-soft)]">
                        Crypto Transaction Details
                    </h2>

                    <form
                        id="crypto-payout-transaction-form"
                        noValidate
                        onSubmit={handleSubmit(handleFormSubmit)}
                        className="flex flex-col gap-5"
                    >
                        {/* Row 1: Source Wallet & Available Balance */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Source Wallet */}
                            <Controller
                                name="source_wallet_currency"
                                control={control}
                                render={({ field }) => (
                                    <div className="w-full h-fit flex flex-col justify-center items-start gap-2">
                                        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">
                                            Source Wallet
                                        </span>
                                        <CustomSelectComponent
                                            id="crypto-select-sourceWallet"
                                            label="Select wallet"
                                            labels={walletSelectOptions}
                                            selectTriggerClassName="w-full px-4! text-[var(--ink)]"
                                            selectGroupClassName="w-full p-2!"
                                            value={field.value ?? ''}
                                            onChange={field.onChange}
                                            error={errors?.source_wallet_currency?.message}
                                        />
                                    </div>
                                )}
                            />

                            {/* Available Balance */}
                            <div className="w-full flex flex-col justify-center items-start gap-2">
                                <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">
                                    Available Balance
                                </span>
                                <div className="w-full h-8 px-4! rounded-md bg-[var(--line-faint)] border border-[var(--line)] flex items-center text-xs font-medium text-[var(--ink-soft)]">
                                    {selectedWallet
                                        ? `${parseFloat(selectedWallet.available_balance).toFixed(2)} ${selectedWallet.wallet_currency}`
                                        : '—'}
                                </div>
                            </div>
                        </div>

                        {/* Row 2: Destination Network */}
                        <Controller
                            name="network"
                            control={control}
                            render={({ field }) => (
                                <div className="w-full h-fit flex flex-col justify-center items-start gap-2">
                                    <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">
                                        Destination Network
                                    </span>
                                    <CustomSelectComponent
                                        id="crypto-select-network"
                                        label="Select network"
                                        labels={NETWORK_OPTIONS}
                                        selectTriggerClassName="w-full px-4! text-[var(--ink)]"
                                        selectGroupClassName="w-full p-2!"
                                        value={field.value ?? ''}
                                        onChange={field.onChange}
                                        error={errors?.network?.message}
                                    />
                                </div>
                            )}
                        />

                        {/* Row 3: Destination Address */}
                        <div className="w-full h-fit flex flex-col justify-center items-start gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">
                                Destination Address
                            </span>
                            <div className="relative w-full">
                                <CustomInputComponent
                                    id="crypto-input-destinationAddress"
                                    label=""
                                    type="text"
                                    placeholder="0x71C765..."
                                    inputClassname="p-2! text-[var(--ink)] text-xs"
                                    error={errors?.destination_address?.message}
                                    {...register('destination_address')}
                                />
                            </div>
                        </div>

                        {/* Row 4: Amount */}
                        <CustomInputComponent
                            id="crypto-input-amount"
                            label="Amount to send"
                            type="number"
                            placeholder="e.g. 200"
                            fieldLabelClassname="text-[var(--ink-soft)] text-xs font-semibold uppercase tracking-wide"
                            inputClassname="px-4! text-[var(--ink)]"
                            {...(parsedAmount > 0
                                ? { hint: `${parsedAmount.toFixed(2)} ${currencyLabel}` }
                                : {})}
                            error={errors?.amount?.message}
                            {...register('amount')}
                        />

                        {/* Crypto Transfer Fee Information */}
                        <div className="flex items-start gap-3 rounded-lg border border-[var(--line)] bg-[var(--bg-subtle)] px-4! py-3!">
                            <Info className="w-4 h-4 mt-0.5 shrink-0 text-[var(--gold)]" />

                            <div className="flex flex-col gap-1">
                                <span className="text-xs font-semibold text-[var(--ink)]">
                                    Crypto transfer fee
                                </span>

                                <p className="text-xs leading-relaxed text-[var(--mute)]">
                                    A {CRYPTO_TRANSFER_FEE_PERCENTAGE}% transfer fee applies to crypto transfers.
                                    The applicable fee is charged separately in USD.
                                </p>
                            </div>
                        </div>
                    </form>

                    {/* Bottom Actions */}
                    <div className="pt-4 border-t border-[var(--line)] flex items-center justify-end gap-3">
                        <div className="w-[160px] h-[38px]">
                            <CustomButtonComponent
                                id="crypto-reviewTransaction-btn"
                                label={
                                    <span className="flex items-center justify-center gap-1.5">
                                        Review <ArrowRight className="w-4 h-4" />
                                    </span>
                                }
                                type="submit"
                                form="crypto-payout-transaction-form"
                                variant="navy"
                            />
                        </div>
                    </div>
                </div>
            </Activity>
        </>
    );
}
