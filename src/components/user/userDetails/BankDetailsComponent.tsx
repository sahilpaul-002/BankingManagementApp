import React, { Activity, useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Pencil } from 'lucide-react';
import { toast } from 'react-toastify';
import CustomInputComponent from '@/components/common/CustomInputComponent';
import CustomButtonComponent from '@/components/common/CustomButtonComponent';
import { BANK_DETAILS_FALLBACK } from '@/fallbacks/user/userDetails/bankDetailsFallbacks';

// ── Zod Schema ──────────────────────────────────────────────────────────────
const bankDetailsSchema = z.object({
    account_holder_name: z.string().min(1, 'Account holder name is required'),
    account_number: z
        .string()
        .min(6, 'Account number must be at least 6 digits')
        .regex(/^[0-9]+$/, 'Account number must contain only digits'),
    swift_code: z
        .string()
        .min(8, 'SWIFT code must be 8–11 characters')
        .max(11, 'SWIFT code must be 8–11 characters'),
    iban_code: z.string().min(15, 'IBAN must be at least 15 characters'),
    bank_name: z.string().min(1, 'Bank name is required'),
});

type BankDetailsFormData = z.infer<typeof bankDetailsSchema>;

// ── Verification Badge ────────────────────────────────────────────────────────
function VerificationBadge({ verified }: { verified: boolean }) {
    return (
        <span
            className={`inline-flex items-center px-2.5! py-0.5! rounded-full text-xs font-semibold tracking-wide ${verified
                ? 'bg-[var(--ok-bg)] text-[var(--ok)]'
                : 'bg-[var(--warn-bg)] text-[var(--warn)]'
                }`}
        >
            {verified ? 'Verified' : 'Pending Verification'}
        </span>
    );
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function BankDetailsComponent() {
    const [isEditing, setIsEditing] = useState(false);

    // ── React Hook Form ──
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<BankDetailsFormData>({
        resolver: zodResolver(bankDetailsSchema),
        mode: 'onTouched',
        reValidateMode: 'onChange',
        defaultValues: {
            account_holder_name: BANK_DETAILS_FALLBACK.account_holder_name,
            account_number: BANK_DETAILS_FALLBACK.account_number,
            swift_code: BANK_DETAILS_FALLBACK.swift_code,
            iban_code: BANK_DETAILS_FALLBACK.iban_code,
            bank_name: BANK_DETAILS_FALLBACK.bank_name,
        },
    });

    const onValid: SubmitHandler<BankDetailsFormData> = async (formData) => {
        try {
            // TODO: wire up actual API mutation
            console.log('Bank details submit:', formData);
            toast.success('Bank details updated successfully.');
            setIsEditing(false);
        } catch {
            toast.error('Failed to update bank details. Please try again.');
        }
    };

    const handleCancel = () => {
        reset();
        setIsEditing(false);
    };

    return (
        <div className="bankDetails-wrapper w-full h-fit">
            {/* Section Header */}
            <div className="flex items-center justify-between mb-5!">
                <div>
                    <h2 className="text-base font-semibold text-[var(--ink)] tracking-normal">Bank Details</h2>
                    <p className="text-xs text-[var(--mute)] mt-0.5!">Manage your linked bank account information</p>
                </div>
                <Activity mode={!isEditing ? 'visible' : 'hidden'}>
                    <div className="w-[90px] h-[34px]">
                        <CustomButtonComponent
                            id="bankDetails-edit-btn"
                            label={<><Pencil className="w-3.5 h-3.5" />Edit</>}
                            type="button"
                            variant="outline"
                            onClick={() => setIsEditing(true)}
                        />
                    </div>
                </Activity>
            </div>

            {/* Form */}
            <form id="bankDetails-form" noValidate onSubmit={handleSubmit(onValid)}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    {/* Bank Name */}
                    <CustomInputComponent
                        id="bankDetails-input-bankName"
                        label="Bank Name"
                        type="text"
                        placeholder="Enter bank name"
                        disabled={!isEditing}
                        fieldLabelClassname="text-[var(--ink-soft)] text-xs font-semibold uppercase tracking-wide"
                        inputClassname="px-4! text-[var(--ink)] disabled:opacity-70 disabled:cursor-not-allowed"
                        error={errors?.bank_name?.message}
                        {...register('bank_name')}
                    />

                    {/* Account Holder Name */}
                    <CustomInputComponent
                        id="bankDetails-input-accountHolderName"
                        label="Account Holder Name"
                        type="text"
                        placeholder="Enter account holder name"
                        disabled={!isEditing}
                        fieldLabelClassname="text-[var(--ink-soft)] text-xs font-semibold uppercase tracking-wide"
                        inputClassname="px-4! text-[var(--ink)] disabled:opacity-70 disabled:cursor-not-allowed"
                        error={errors?.account_holder_name?.message}
                        {...register('account_holder_name')}
                    />

                    {/* Account Number */}
                    <CustomInputComponent
                        id="bankDetails-input-accountNumber"
                        label="Account Number"
                        type="text"
                        placeholder="Enter account number"
                        disabled={!isEditing}
                        fieldLabelClassname="text-[var(--ink-soft)] text-xs font-semibold uppercase tracking-wide"
                        inputClassname="px-4! text-[var(--ink)] disabled:opacity-70 disabled:cursor-not-allowed"
                        error={errors?.account_number?.message}
                        {...register('account_number')}
                    />

                    {/* SWIFT Code */}
                    <CustomInputComponent
                        id="bankDetails-input-swiftCode"
                        label="SWIFT / BIC Code"
                        type="text"
                        placeholder="Enter SWIFT code"
                        disabled={!isEditing}
                        fieldLabelClassname="text-[var(--ink-soft)] text-xs font-semibold uppercase tracking-wide"
                        inputClassname="px-4! text-[var(--ink)] disabled:opacity-70 disabled:cursor-not-allowed"
                        error={errors?.swift_code?.message}
                        {...register('swift_code')}
                    />

                    {/* IBAN Code */}
                    <CustomInputComponent
                        id="bankDetails-input-ibanCode"
                        label="IBAN Code"
                        type="text"
                        placeholder="Enter IBAN code"
                        disabled={!isEditing}
                        fieldLabelClassname="text-[var(--ink-soft)] text-xs font-semibold uppercase tracking-wide"
                        inputClassname="px-4! text-[var(--ink)] disabled:opacity-70 disabled:cursor-not-allowed"
                        error={errors?.iban_code?.message}
                        {...register('iban_code')}
                    />

                    {/* Verification Status (read-only badge) */}
                    <div className="w-full h-fit flex flex-col justify-center items-start gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">
                            Verification Status
                        </span>
                        <div className="w-full h-10 flex items-center px-3! border border-[var(--line)] rounded-md bg-[var(--bg-subtle)]">
                            <VerificationBadge verified={BANK_DETAILS_FALLBACK.is_verified} />
                        </div>
                    </div>
                </div>

                {/* Action Buttons — only shown in edit mode */}
                <Activity mode={isEditing ? 'visible' : 'hidden'}>
                    <div className="flex items-center justify-end gap-3 mt-6! pt-4! border-t border-[var(--line)]">
                        <div className="w-[100px] h-[36px]">
                            <CustomButtonComponent
                                id="bankDetails-cancel-btn"
                                label="Cancel"
                                type="button"
                                variant="outline"
                                onClick={handleCancel}
                            />
                        </div>
                        <div className="w-[130px] h-[36px]">
                            <CustomButtonComponent
                                id="bankDetails-submit-btn"
                                label="Save Changes"
                                type="submit"
                                variant="navy"
                            />
                        </div>
                    </div>
                </Activity>
            </form>
        </div>
    );
}
