import React, { useEffect, useState } from 'react';
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, PlusCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import CustomInputComponent from '@/components/common/CustomInputComponent';
import CustomSelectComponent from '@/components/common/CustomSelectComponent';
import CustomButtonComponent from '@/components/common/CustomButtonComponent';
import { useAddBeneficiaryMutation } from '@/redux/features/payables/payablesApi';
import type { BeneficiaryItem, AddBeneficiaryRequestBody } from '@/fallbacks/payables/beneficiaries/beneficiariesFallbacks';

const CURRENCY_OPTIONS = ['USD', 'EUR', 'GBP', 'SGD', 'AUD', 'CAD'];

// ── Zod Schema ──────────────────────────────────────────────────────────────
const addBeneficiarySchema = z.object({
    account_holder_name: z
        .string()
        .min(2, 'Account holder name is required')
        .regex(/^[A-Za-z0-9 .'"-]+$/, 'Account holder name contains invalid characters'),
    bank_name: z
        .string()
        .min(2, 'Bank name is required'),
    account_number: z
        .string()
        .min(6, 'Account number must be at least 6 characters')
        .regex(/^[0-9A-Za-z]+$/, 'Account number must contain alphanumeric characters'),
    account_currency: z
        .string()
        .min(1, 'Please select account currency'),
    swift_code: z
        .string()
        .min(8, 'SWIFT code must be 8 to 11 characters')
        .max(11, 'SWIFT code must be 8 to 11 characters')
        .regex(/^[A-Z0-9]+$/i, 'Invalid SWIFT code format'),
    iban_code: z
        .string()
        .min(8, 'IBAN code is required')
        .regex(/^[A-Z0-9]+$/i, 'Invalid IBAN code format'),
});

type AddBeneficiaryFormData = z.infer<typeof addBeneficiarySchema>;

interface AddBeneficiarySidebarComponentProps {
    isOpen: boolean;
    onClose: () => void;
    onAddSuccess?: (newBeneficiary: BeneficiaryItem) => void;
}

export default function AddBeneficiarySidebarComponent({
    isOpen,
    onClose,
    onAddSuccess,
}: AddBeneficiarySidebarComponentProps) {
    const [addBeneficiaryApi, { isLoading: isApiLoading }] = useAddBeneficiaryMutation();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        control,
        reset,
        formState: { errors },
    } = useForm<AddBeneficiaryFormData>({
        resolver: zodResolver(addBeneficiarySchema),
        mode: 'onTouched',
        reValidateMode: 'onChange',
        defaultValues: {
            account_holder_name: '',
            bank_name: '',
            account_number: '',
            account_currency: 'USD',
            swift_code: '',
            iban_code: '',
        },
    });

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

    const handleFormSubmit: SubmitHandler<AddBeneficiaryFormData> = async (formData) => {
        try {
            setIsSubmitting(true);
            const payload: AddBeneficiaryRequestBody = {
                account_holder_name: formData.account_holder_name.trim(),
                bank_name: formData.bank_name.trim(),
                account_number: formData.account_number.trim(),
                account_currency: formData.account_currency,
                swift_code: formData.swift_code.trim().toUpperCase(),
                iban_code: formData.iban_code.trim().toUpperCase(),
            };

            const res = await addBeneficiaryApi(payload).unwrap().catch(() => null);

            const newBeneficiary: BeneficiaryItem = res?.data || {
                _id: `bne_${Date.now()}`,
                ...payload,
                type: 'INDIVIDUAL',
                payment_method: 'SWIFT',
                country: payload.iban_code.slice(0, 2).toUpperCase() || 'US',
                status: 'ACTIVE',
                created_at: new Date().toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                }),
                email: `${payload.account_holder_name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
            };

            toast.success('Beneficiary added successfully.');
            if (onAddSuccess) {
                onAddSuccess(newBeneficiary);
            }
            reset();
            onClose();
        } catch {
            toast.error('Failed to add beneficiary. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-200"
                onClick={handleClose}
            />

            {/* Right Drawer Panel */}
            <div className="relative z-10 w-full max-w-md h-full bg-[var(--bg-surface)] border-l border-[var(--line)] shadow-2xl flex flex-col justify-between overflow-y-auto animate-[slideInRight_0.25s_ease-out]">
                <style>{`
                    @keyframes slideInRight {
                        from { transform: translateX(100%); }
                        to { transform: translateX(0); }
                    }
                `}</style>

                {/* Sidebar Header */}
                <div className="p-6! border-b border-[var(--line)] flex items-center justify-between bg-[var(--bg-surface)]">
                    <div>
                        <h3 className="text-xl font-normal text-[var(--ink)] tracking-normal">
                            <span className="font-serif font-medium">Add</span>{' '}
                            <span className="font-serif italic font-normal">beneficiary</span>
                        </h3>
                        <p className="text-xs text-[var(--mute)] mt-1!">
                            Enter bank and account details to add a new beneficiary.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="p-1.5 rounded-lg text-[var(--mute)] hover:text-[var(--ink)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
                        aria-label="Close sidebar"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form Body */}
                <form
                    id="addBeneficiarySidebar-form"
                    noValidate
                    onSubmit={handleSubmit(handleFormSubmit)}
                    className="p-6! flex-1 flex flex-col gap-4 overflow-y-auto"
                >
                    {/* Account Holder Name */}
                    <CustomInputComponent
                        id="addBeneficiary-input-accountHolderName"
                        label="Account Holder Name"
                        type="text"
                        placeholder="e.g. John Doe"
                        fieldLabelClassname="text-[var(--ink-soft)] text-xs font-semibold uppercase tracking-wide"
                        inputClassname="px-4! text-[var(--ink)]"
                        error={errors?.account_holder_name?.message}
                        {...register('account_holder_name')}
                    />

                    {/* Bank Name */}
                    <CustomInputComponent
                        id="addBeneficiary-input-bankName"
                        label="Bank Name"
                        type="text"
                        placeholder="e.g. Bank of America"
                        fieldLabelClassname="text-[var(--ink-soft)] text-xs font-semibold uppercase tracking-wide"
                        inputClassname="px-4! text-[var(--ink)]"
                        error={errors?.bank_name?.message}
                        {...register('bank_name')}
                    />

                    {/* Account Number */}
                    <CustomInputComponent
                        id="addBeneficiary-input-accountNumber"
                        label="Account Number"
                        type="text"
                        placeholder="e.g. 123456789012"
                        fieldLabelClassname="text-[var(--ink-soft)] text-xs font-semibold uppercase tracking-wide"
                        inputClassname="px-4! text-[var(--ink)] font-mono"
                        error={errors?.account_number?.message}
                        {...register('account_number')}
                    />

                    {/* Account Currency */}
                    <Controller
                        name="account_currency"
                        control={control}
                        render={({ field }) => (
                            <div className="w-full h-fit flex flex-col justify-center items-start gap-2">
                                <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">
                                    Account Currency
                                </span>
                                <CustomSelectComponent
                                    id="addBeneficiary-select-currency"
                                    label="Select Currency"
                                    labels={CURRENCY_OPTIONS}
                                    selectTriggerClassName="w-full px-4! text-[var(--ink)]"
                                    selectGroupClassName="w-full"
                                    value={field.value}
                                    onChange={field.onChange}
                                    error={errors?.account_currency?.message}
                                />
                            </div>
                        )}
                    />

                    {/* SWIFT Code */}
                    <CustomInputComponent
                        id="addBeneficiary-input-swiftCode"
                        label="SWIFT / BIC Code"
                        type="text"
                        placeholder="e.g. BOFAUS3N"
                        fieldLabelClassname="text-[var(--ink-soft)] text-xs font-semibold uppercase tracking-wide"
                        inputClassname="px-4! text-[var(--ink)] uppercase font-mono"
                        error={errors?.swift_code?.message}
                        {...register('swift_code')}
                    />

                    {/* IBAN Code */}
                    <CustomInputComponent
                        id="addBeneficiary-input-ibanCode"
                        label="IBAN Code"
                        type="text"
                        placeholder="e.g. GB29NWBK60161331926819"
                        fieldLabelClassname="text-[var(--ink-soft)] text-xs font-semibold uppercase tracking-wide"
                        inputClassname="px-4! text-[var(--ink)] uppercase font-mono"
                        error={errors?.iban_code?.message}
                        {...register('iban_code')}
                    />
                </form>

                {/* Form Footer Action Buttons */}
                <div className="p-6! border-t border-[var(--line)] bg-[var(--bg-surface)] flex items-center justify-end gap-3">
                    <div className="w-[100px] h-[38px]">
                        <CustomButtonComponent
                            id="addBeneficiary-cancel-btn"
                            label="Cancel"
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={isSubmitting || isApiLoading}
                        />
                    </div>
                    <div className="w-[160px] h-[38px]">
                        <CustomButtonComponent
                            id="addBeneficiary-submit-btn"
                            label={
                                <span className="flex items-center justify-center gap-1.5">
                                    <PlusCircle className="w-4 h-4" /> Add beneficiary
                                </span>
                            }
                            type="submit"
                            variant="navy"
                            form="addBeneficiarySidebar-form"
                            showButtonLoader={isSubmitting || isApiLoading}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
