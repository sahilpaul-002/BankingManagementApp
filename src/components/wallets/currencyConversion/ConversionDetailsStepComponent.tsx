import { useEffect } from 'react';
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, ArrowLeftRight, Info } from 'lucide-react';
import CustomInputComponent from '@/components/common/CustomInputComponent';
import CustomSelectComponent from '@/components/common/CustomSelectComponent';
import CustomButtonComponent from '@/components/common/CustomButtonComponent';
import type {
    WalletBalanceItem,
    CurrencyConversionQuoteData,
} from '@/fallbacks/wallets/currencyConversion/currencyConversionFallbacks';

// ── Conversion rules ─────────────────────────────────────────────────────────
// FIAT: USD, EUR, SGD  |  CRYPTO: USDT, USDC
const FIAT_CURRENCIES = ['USD', 'EUR', 'SGD'];
const CRYPTO_CURRENCIES = ['USDT', 'USDC'];

function isValidPair(source: string, destination: string): boolean {
    if (!source || !destination || source === destination) return false;
    const srcIsFiat = FIAT_CURRENCIES.includes(source);
    const dstIsFiat = FIAT_CURRENCIES.includes(destination);
    const srcIsCrypto = CRYPTO_CURRENCIES.includes(source);
    const dstIsCrypto = CRYPTO_CURRENCIES.includes(destination);

    // FIAT-to-FIAT ✓
    if (srcIsFiat && dstIsFiat) return true;
    // USD-to-Crypto ✓
    if (source === 'USD' && dstIsCrypto) return true;
    // Crypto-to-USD ✓
    if (srcIsCrypto && destination === 'USD') return true;

    return false;
}

// ── Zod Schema ───────────────────────────────────────────────────────────────
const conversionFormSchema = z
    .object({
        source_currency: z.string().min(1, 'Please select source wallet currency'),
        destination_currency: z.string().min(1, 'Please select destination wallet currency'),
        amount: z
            .string()
            .min(1, 'Amount is required')
            .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
                message: 'Amount must be greater than 0',
            }),
    })
    .refine((data) => data.source_currency !== data.destination_currency, {
        message: 'Source and destination currencies must be different',
        path: ['destination_currency'],
    })
    .refine((data) => isValidPair(data.source_currency, data.destination_currency), {
        message:
            'Invalid conversion pair. Only FIAT-to-FIAT or USD↔Crypto conversions are supported.',
        path: ['destination_currency'],
    });

export type ConversionFormData = z.infer<typeof conversionFormSchema>;

interface ConversionDetailsStepComponentProps {
    wallets: WalletBalanceItem[];
    quote: CurrencyConversionQuoteData | null;
    isQuoteLoading: boolean;
    onGenerateQuote: (data: ConversionFormData) => void;
    onResetQuote: () => void;
    onContinue: () => void;
}

export default function ConversionDetailsStepComponent({
    wallets,
    quote,
    isQuoteLoading,
    onGenerateQuote,
    onResetQuote,
    onContinue,
}: ConversionDetailsStepComponentProps) {
    const {
        register,
        handleSubmit,
        control,
        watch,
        formState: { errors },
    } = useForm<ConversionFormData>({
        resolver: zodResolver(conversionFormSchema),
        mode: 'onTouched',
        reValidateMode: 'onChange',
        defaultValues: {
            source_currency: '',
            destination_currency: '',
            amount: '',
        },
    });

    const watchedSource = watch('source_currency');
    const watchedDestination = watch('destination_currency');

    // Build wallet select options from API data
    const walletSelectOptions = wallets.map((w) => ({
        label: `${w.wallet_currency} (${w.wallet_type})`,
        value: w.wallet_currency,
    }));

    const sourceWallet = wallets.find((w) => w.wallet_currency === watchedSource) ?? null;
    const destinationWallet = wallets.find((w) => w.wallet_currency === watchedDestination) ?? null;

    const handleFormSubmit: SubmitHandler<ConversionFormData> = (data) => {
        onGenerateQuote(data);
    };

    return (
        <div className="w-full bg-[var(--bg-surface)] rounded-xl border border-[var(--line)] p-6 shadow-xs flex flex-col gap-6">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-soft)]">
                Conversion Details
            </h2>

            {/* Supported conversion info banner */}
            <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-[var(--info-bg)] border border-[var(--info)]/20 text-[11px] text-[var(--info)]">
                <Info className="w-4 h-4 shrink-0 mt-px" />
                <span className="leading-relaxed">
                    <strong className="font-semibold">Supported conversions:</strong> FIAT-to-FIAT
                    (USD, EUR, SGD) and USD-to-Crypto / Crypto-to-USD (USDT, USDC). Crypto-to-Crypto
                    and non-USD FIAT-to-Crypto pairs are not supported.
                </span>
            </div>

            <form
                id="currency-conversion-form"
                noValidate
                onSubmit={handleSubmit(handleFormSubmit)}
                className="flex flex-col gap-5"
            >
                {/* Row 1 — Source Wallet */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Controller
                        name="source_currency"
                        control={control}
                        render={({ field }) => (
                            <div className="w-full h-fit flex flex-col justify-center items-start gap-2">
                                <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">
                                    From Wallet
                                </span>
                                <CustomSelectComponent
                                    id="conversion-select-sourceCurrency"
                                    label="Select source wallet"
                                    labels={walletSelectOptions}
                                    selectTriggerClassName="w-full px-4! text-[var(--ink)]"
                                    selectGroupClassName="w-full"
                                    value={field.value}
                                    onChange={(val) => {
                                        field.onChange(val);
                                        if (quote) onResetQuote();
                                    }}
                                    error={errors?.source_currency?.message}
                                />
                            </div>
                        )}
                    />

                    {/* Source Available Balance */}
                    <div className="w-full flex flex-col justify-center items-start gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">
                            Available Balance
                        </span>
                        <div className="w-full h-10 px-4 rounded-md bg-[var(--line-faint)] border border-[var(--line)] flex items-center text-xs font-medium text-[var(--ink-soft)]">
                            {sourceWallet
                                ? `${parseFloat(sourceWallet.available_balance).toFixed(4)} ${sourceWallet.wallet_currency}`
                                : '—'}
                        </div>
                    </div>
                </div>

                {/* Row 2 — Destination Wallet */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Controller
                        name="destination_currency"
                        control={control}
                        render={({ field }) => (
                            <div className="w-full h-fit flex flex-col justify-center items-start gap-2">
                                <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">
                                    To Wallet
                                </span>
                                <CustomSelectComponent
                                    id="conversion-select-destinationCurrency"
                                    label="Select destination wallet"
                                    labels={walletSelectOptions}
                                    selectTriggerClassName="w-full px-4! text-[var(--ink)]"
                                    selectGroupClassName="w-full"
                                    value={field.value}
                                    onChange={(val) => {
                                        field.onChange(val);
                                        if (quote) onResetQuote();
                                    }}
                                    error={errors?.destination_currency?.message}
                                />
                            </div>
                        )}
                    />

                    {/* Destination Available Balance */}
                    <div className="w-full flex flex-col justify-center items-start gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">
                            Available Balance
                        </span>
                        <div className="w-full h-10 px-4 rounded-md bg-[var(--line-faint)] border border-[var(--line)] flex items-center text-xs font-medium text-[var(--ink-soft)]">
                            {destinationWallet
                                ? `${parseFloat(destinationWallet.available_balance).toFixed(4)} ${destinationWallet.wallet_currency}`
                                : '—'}
                        </div>
                    </div>
                </div>

                {/* Row 3 — Amount */}
                <CustomInputComponent
                    id="conversion-input-amount"
                    label="Amount to convert"
                    type="number"
                    placeholder="e.g. 100"
                    fieldLabelClassname="text-[var(--ink-soft)] text-xs font-semibold uppercase tracking-wide"
                    inputClassname="px-4! text-[var(--ink)]"
                    error={errors?.amount?.message}
                    {...register('amount', {
                        onChange: () => {
                            if (quote) onResetQuote();
                        },
                    })}
                />
            </form>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-[var(--line)] flex items-center justify-end gap-3">
                {!quote ? (
                    <div className="w-[180px] h-[38px]">
                        <CustomButtonComponent
                            id="conversion-generateQuote-btn"
                            label={
                                <span className="flex items-center justify-center gap-1.5">
                                    <ArrowLeftRight className="w-4 h-4" /> Get Conversion Quote
                                </span>
                            }
                            type="submit"
                            form="currency-conversion-form"
                            variant="navy"
                            showButtonLoader={isQuoteLoading}
                        />
                    </div>
                ) : (
                    <>
                        <div className="w-[160px] h-[38px]">
                            <CustomButtonComponent
                                id="conversion-resetQuote-btn"
                                label="Get New Quote"
                                type="button"
                                variant="outline"
                                onClick={onResetQuote}
                            />
                        </div>
                        <div className="w-[140px] h-[38px]">
                            <CustomButtonComponent
                                id="conversion-continueStep1-btn"
                                label={
                                    <span className="flex items-center justify-center gap-1.5">
                                        Continue <ArrowRight className="w-4 h-4" />
                                    </span>
                                }
                                type="button"
                                variant="navy"
                                onClick={onContinue}
                            />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
