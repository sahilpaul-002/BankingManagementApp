import React, { useEffect, useState } from 'react';
import { Activity } from 'react';
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Upload, CheckCircle, ArrowRight, WalletCards } from 'lucide-react';
import CustomInputComponent from '@/components/common/CustomInputComponent';
import CustomSelectComponent from '@/components/common/CustomSelectComponent';
import CustomButtonComponent from '@/components/common/CustomButtonComponent';
import { PURPOSE_OF_PAYMENTS_FALLBACK, type PayoutQuoteDataType, type WalletBalanceItemType } from '@/types/payables/payoutTypes';
import type { BeneficiaryItemType } from '@/types/payables/beneficiariesTypes';

const FIAT_PAYOUT_CURRENCIES = ['USD', 'SGD', 'EUR'] as const;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.csv', '.txt'];

// Document validation schema
const documentFileSchema = z
    .custom<FileList | File[] | File | undefined | null>((val) => true)
    .refine((val) => {
        if (!val) return true;
        const file = val instanceof FileList ? val[0] : Array.isArray(val) ? val[0] : val;
        if (!file) return true;
        return file.size <= MAX_FILE_SIZE;
    }, { message: 'File size must not exceed 5 MB' })
    .refine((val) => {
        if (!val) return true;
        const file = val instanceof FileList ? val[0] : Array.isArray(val) ? val[0] : val;
        if (!file) return true;
        const fileName = file.name.toLowerCase();
        return ALLOWED_EXTENSIONS.some((ext) => fileName.endsWith(ext));
    }, { message: 'Supported formats: PDF, DOC, DOCX, XLS, XLSX, CSV and TXT.' });

// ── Zod Schema ──────────────────────────────────────────────────────────────
const transactionDetailsSchema = z.object({
    source_currency: z.string().min(1, 'Please select source currency'),
    beneficiary_id: z.string().min(1, 'Please select a beneficiary'),
    amount: z
        .string()
        .min(1, 'Amount is required')
        .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
            message: 'Amount must be greater than 0',
        }),
    purpose_of_payment: z.string().min(1, 'Please select purpose of payment'),
    documents: documentFileSchema,
    memo: z.string().optional(),
});

export type TransactionDetailsFormData = z.infer<typeof transactionDetailsSchema>;

interface TransactionDetailsStepComponentPropsType {
    beneficiaries: BeneficiaryItemType[];
    defaultBeneficiaryId?: string | undefined;
    beneficiariesNotFound?: boolean | undefined;
    wallets: WalletBalanceItemType[];
    walletsBalancesListNotFound?: boolean | undefined;
    quote: PayoutQuoteDataType | null;
    isQuoteLoading: boolean;
    onGenerateQuote: (data: TransactionDetailsFormData) => void;
    onResetQuote: () => void;
    onContinue: () => void;
}

export default function TransactionDetailsStepComponent({
    beneficiaries,
    defaultBeneficiaryId,
    beneficiariesNotFound,
    wallets,
    walletsBalancesListNotFound,
    quote,
    isQuoteLoading,
    onGenerateQuote,
    onResetQuote,
    onContinue,
}: TransactionDetailsStepComponentPropsType) {
    const [selectedBeneficiary, setSelectedBeneficiary] = useState<BeneficiaryItemType | null>(null);

    // Filter wallets to available FIAT wallets only (USD, SGD, EUR)
    const fiatWallets = (wallets ?? []).filter(
        (w) => FIAT_PAYOUT_CURRENCIES.includes(w.wallet_currency as typeof FIAT_PAYOUT_CURRENCIES[number])
    );

    const walletSelectOptions = fiatWallets.map((w) => ({
        label: `${w.wallet_currency} — ${parseFloat(w.available_balance).toFixed(2)} available`,
        value: w.wallet_currency,
    }));

    const {
        register,
        handleSubmit,
        control,
        watch,
        setValue,
        formState: { errors },
    } = useForm<TransactionDetailsFormData>({
        resolver: zodResolver(transactionDetailsSchema),
        mode: 'onTouched',
        reValidateMode: 'onChange',
        defaultValues: {
            source_currency: '',
            beneficiary_id: defaultBeneficiaryId || '',
            amount: '100',
            purpose_of_payment: '',
            memo: '',
        },
    });

    const watchedBeneficiaryId = watch('beneficiary_id');
    const watchedSourceCurrency = watch('source_currency');
    const watchedDocuments = watch('documents');

    // Derive selected source wallet for balance display
    const selectedSourceWallet = fiatWallets.find((w) => w.wallet_currency === watchedSourceCurrency) ?? null;

    // Sync selected beneficiary details
    useEffect(() => {
        if (watchedBeneficiaryId) {
            const found = beneficiaries.find((b) => b._id === watchedBeneficiaryId);
            setSelectedBeneficiary(found || null);
        } else {
            setSelectedBeneficiary(null);
        }
    }, [watchedBeneficiaryId, beneficiaries]);

    // Set default beneficiary if passed via URL prop
    useEffect(() => {
        if (defaultBeneficiaryId) {
            setValue('beneficiary_id', defaultBeneficiaryId);
        }
    }, [defaultBeneficiaryId, setValue]);

    const getFileName = (fileInput?: FileList | File[] | File | null): string | null => {
        if (!fileInput) return null;
        if (fileInput instanceof FileList) return fileInput[0]?.name || null;
        if (Array.isArray(fileInput)) return fileInput[0]?.name || null;
        if (fileInput instanceof File) return fileInput.name;
        return null;
    };

    const uploadedFileName = getFileName(watchedDocuments);

    // Format Beneficiary Select Options e.g. "Jane Doe • USD • SWIFT • US"
    const beneficiarySelectOptions = beneficiaries.map((b) => ({
        label: `${b.account_holder_name} • ${b.account_currency}`,
        value: b._id,
    }));

    const handleFormSubmit: SubmitHandler<TransactionDetailsFormData> = (data) => {
        onGenerateQuote(data);
    };

    return (
        <>
            {/* Wallets Not Found Empty State */}
            <Activity mode={walletsBalancesListNotFound ? "visible" : "hidden"}>
                <div className="w-full min-h-[420px] bg-[var(--bg-surface)] rounded-xl border border-[var(--line)] p-6! shadow-xs flex items-center justify-center">
                    <div className="flex flex-col items-center justify-center text-center max-w-md">
                        <div className="w-16 h-16 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--line)] flex items-center justify-center mb-5">
                            <WalletCards className="w-8 h-8 text-[var(--mute)]" />
                        </div>
                        <h2 className="text-lg font-semibold text-[var(--ink)]">
                            No Wallets Found
                        </h2>
                        <p className="mt-2 text-sm leading-relaxed text-[var(--mute)]">
                            We couldn't find any wallet balance details for your account.
                            Please create a wallet before initiating a payout.
                        </p>
                    </div>
                </div>
            </Activity>

            {/* Transaction Details Form */}
            <Activity mode={!walletsBalancesListNotFound ? "visible" : "hidden"}>
                <div className="w-full bg-[var(--bg-surface)] rounded-xl border border-[var(--line)] p-6! shadow-xs flex flex-col gap-6">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-soft)]">
                        Transaction Details
                    </h2>

                    <form
                        id="payout-transaction-form"
                        noValidate
                        onSubmit={handleSubmit(handleFormSubmit)}
                        className="flex flex-col gap-5"
                    >
                        {/* Row 1: Source Currency & Available Balance */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Source Currency */}
                            <Controller
                                name="source_currency"
                                control={control}
                                render={({ field }) => (
                                    <div className="w-full h-fit flex flex-col justify-center items-start gap-2">
                                        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">
                                            Source Currency
                                        </span>
                                        <CustomSelectComponent
                                            id="payout-select-sourceCurrency"
                                            label="Select currency"
                                            labels={walletSelectOptions}
                                            selectTriggerClassName="w-full px-4! text-[var(--ink)]"
                                            selectGroupClassName="w-full p-2!"
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

                            {/* Source Currency Available Balance */}
                            <div className="w-full flex flex-col justify-center items-start gap-2">
                                <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">
                                    Available Balance
                                </span>
                                <div className="w-full h-8 px-4! rounded-md bg-[var(--line-faint)] border border-[var(--line)] flex items-center text-xs font-medium text-[var(--ink-soft)]">
                                    {selectedSourceWallet
                                        ? `${parseFloat(selectedSourceWallet.available_balance).toFixed(2)} ${selectedSourceWallet.wallet_currency}`
                                        : '—'}
                                </div>
                            </div>
                        </div>

                        {/* Row 2: Whom do you want to send money to? */}
                        <Controller
                            name="beneficiary_id"
                            control={control}
                            render={({ field }) => (
                                <div className="w-full h-fit flex flex-col justify-center items-start gap-2">
                                    <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">
                                        Whom do you want to send money to?
                                    </span>
                                    <CustomSelectComponent
                                        id="payout-select-beneficiary"
                                        label="Select Beneficiary"
                                        labels={beneficiarySelectOptions}
                                        selectTriggerClassName="w-full px-4! text-[var(--ink)]"
                                        selectGroupClassName="w-full p-2!"
                                        value={field.value}
                                        onChange={(val) => {
                                            field.onChange(val);
                                            if (quote) onResetQuote();
                                        }}
                                        error={errors?.beneficiary_id?.message}
                                    />
                                </div>
                            )}
                        />

                        {/* Row 3: Amount to send & Destination Currency */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Amount to send */}
                            <CustomInputComponent
                                id="payout-input-amount"
                                label="Amount to send"
                                type="number"
                                placeholder="e.g. 1000"
                                fieldLabelClassname="text-[var(--ink-soft)] text-xs font-semibold uppercase tracking-wide"
                                inputClassname="px-4! text-[var(--ink)]"
                                error={errors?.amount?.message}
                                {...register('amount', {
                                    onChange: () => {
                                        if (quote) onResetQuote();
                                    },
                                })}
                            />

                            {/* Destination Currency */}
                            <div className="w-full flex flex-col justify-center items-start gap-2">
                                <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">
                                    Destination Currency
                                </span>
                                <div className="w-full h-8 px-4! rounded-md bg-[var(--line-faint)] border border-[var(--line)] flex items-center text-xs font-medium text-[var(--ink-soft)]">
                                    {selectedBeneficiary?.account_currency ?? 'N/A'}
                                </div>
                            </div>
                        </div>

                        {/* Row 4: Purpose of Payment */}
                        <Controller
                            name="purpose_of_payment"
                            control={control}
                            render={({ field }) => (
                                <div className="w-full h-fit flex flex-col justify-center items-start gap-2">
                                    <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">
                                        Purpose of Payment
                                    </span>
                                    <CustomSelectComponent
                                        id="payout-select-purpose"
                                        label="Select purpose"
                                        labels={PURPOSE_OF_PAYMENTS_FALLBACK}
                                        selectTriggerClassName="w-full px-4! text-[var(--ink)]"
                                        selectGroupClassName="w-full p-2!"
                                        value={field.value}
                                        onChange={(val) => {
                                            field.onChange(val);
                                            if (quote) onResetQuote();
                                        }}
                                        error={errors?.purpose_of_payment?.message}
                                    />
                                </div>
                            )}
                        />

                        {/* Row 5: Attach Documents (optional) */}
                        <div className="w-full flex flex-col gap-1.5">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">
                                    Attach Documents <span className="lowercase text-[var(--mute)] font-normal">(optional)</span>
                                </span>
                            </div>

                            <div className="relative w-full border border-[var(--line)] hover:border-[var(--line-strong)] rounded-md bg-[var(--bg-surface)] p-2! px-3! flex items-center justify-between transition-colors">
                                <input
                                    id="payout-input-documents"
                                    type="file"
                                    accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    onChange={(e) => {
                                        if (e.target.files) {
                                            setValue('documents', e.target.files, { shouldValidate: true });
                                        }
                                    }}
                                />

                                {uploadedFileName ? (
                                    <div className="flex items-center gap-2 text-xs font-medium text-[var(--ok)] z-0">
                                        <CheckCircle className="w-4 h-4 shrink-0" />
                                        <span className="truncate max-w-[300px]">{uploadedFileName}</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-xs text-[var(--ink-soft)] z-0">
                                        <span className="px-3! py-1.5! rounded bg-[var(--bg-subtle)] border border-[var(--line)] text-xs font-medium text-[var(--ink)] flex items-center gap-1.5">
                                            <Upload className="w-3.5 h-3.5" /> Choose file
                                        </span>
                                    </div>
                                )}
                            </div>

                            <p className="text-[11px] text-[var(--mute)]">
                                Supported formats: PDF, DOC, DOCX, XLS, XLSX, CSV and TXT. Maximum file size: 5 MB.
                            </p>

                            {errors.documents && (
                                <p className="text-xs text-[var(--danger)] mt-0.5!">
                                    {errors.documents.message as string}
                                </p>
                            )}
                        </div>

                        {/* Row 6: Memo (optional) */}
                        <CustomInputComponent
                            id="payout-input-memo"
                            label="Memo (optional)"
                            type="text"
                            placeholder="What's this payment for?"
                            fieldLabelClassname="text-[var(--ink-soft)] text-xs font-semibold uppercase tracking-wide"
                            inputClassname="px-4! text-[var(--ink)]"
                            error={errors?.memo?.message}
                            {...register('memo')}
                        />
                    </form>

                    {/* Bottom Actions */}
                    <div className="pt-4 border-t border-[var(--line)] flex items-center justify-end gap-3">
                        {!quote ? (
                            <div className="w-[160px] h-[38px]">
                                <CustomButtonComponent
                                    id="payout-generateQuote-btn"
                                    label="Generate Quote"
                                    type="submit"
                                    form="payout-transaction-form"
                                    variant="navy"
                                    showButtonLoader={isQuoteLoading}
                                />
                            </div>
                        ) : (
                            <>
                                <div className="w-[160px] h-[38px]">
                                    <CustomButtonComponent
                                        id="payout-generateNewQuote-btn"
                                        label="Generate New Quote"
                                        type="button"
                                        variant="outline"
                                        onClick={onResetQuote}
                                    />
                                </div>
                                <div className="w-[140px] h-[38px]">
                                    <CustomButtonComponent
                                        id="payout-continueStep1-btn"
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
            </Activity>
        </>
    );
}
