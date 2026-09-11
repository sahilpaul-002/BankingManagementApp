import React, { Activity, useEffect, useState } from 'react';
import { Controller, useForm, type SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Pencil } from 'lucide-react';
import { toast } from 'react-toastify';
import CustomInputComponent from '@/components/common/CustomInputComponent';
import CustomButtonComponent from '@/components/common/CustomButtonComponent';
import CustomSelectComponent from '@/components/common/CustomSelectComponent';
import mobileCountryCodesLists from '@/utils/mobileCountryCodesList';
import { PERSONAL_DETAILS_FALLBACK } from '@/fallbacks/user/userDetails/personalDetailsFallbacks';

// ── Zod Schema ──────────────────────────────────────────────────────────────
const personalDetailsSchema = z.object({
    fullName: z
        .string()
        .min(4, 'Full name must be at least 4 characters')
        .regex(/^[A-Za-z0-9 .'"-]+$/, 'Full name contains invalid characters'),
    userEmail: z.string().email('Invalid email'),
    gender: z.string().min(1, 'Please select a gender'),
    isEmailVerified: z.string(),
    isAdmin: z.string(),
    mobileCountryCode: z.string().min(1, 'Please select a dial code'),
    mobileCountryName: z.string().min(1, 'Please select a country'),
    twoFaType: z.string(),
});

type PersonalDetailsFormData = z.infer<typeof personalDetailsSchema>;

// ── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ value, trueLabel = 'Yes', falseLabel = 'No' }: { value: string; trueLabel?: string; falseLabel?: string }) {
    const isActive = value === 'Y' || value === 'true';
    return (
        <span
            className={`inline-flex items-center px-2.5! py-0.5! rounded-full text-xs font-semibold tracking-wide ${isActive
                ? 'bg-[var(--ok-bg)] text-[var(--ok)]'
                : 'bg-[var(--danger-bg)] text-[var(--danger)]'
                }`}
        >
            {isActive ? trueLabel : falseLabel}
        </span>
    );
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function PersonalDetailsComponent() {
    const [isEditing, setIsEditing] = useState(false);

    // ── Country codes lists ──
    const [mobileDialCodes, setMobileDialCodes] = useState<Array<{ label: string; value: string }> | null>(null);
    const [mobileCountryCodes, setMobileCountryCodes] = useState<Array<{ label: string; value: string }> | null>(null);

    useEffect(() => {
        const list = mobileCountryCodesLists();
        setMobileDialCodes(list.map(item => ({ id: item.name, label: item.country, value: item.code } as any)));
        setMobileCountryCodes(list.map(item => ({ id: item.name, label: item.name, value: item.country } as any)));
    }, []);

    // ── React Hook Form ──
    const {
        register,
        handleSubmit,
        control,
        reset,
        formState: { errors },
    } = useForm<PersonalDetailsFormData>({
        resolver: zodResolver(personalDetailsSchema),
        mode: 'onTouched',
        reValidateMode: 'onChange',
        defaultValues: {
            fullName: PERSONAL_DETAILS_FALLBACK.fullName,
            userEmail: PERSONAL_DETAILS_FALLBACK.userEmail,
            gender: PERSONAL_DETAILS_FALLBACK.gender,
            isEmailVerified: PERSONAL_DETAILS_FALLBACK.isEmailVerified,
            isAdmin: PERSONAL_DETAILS_FALLBACK.isAdmin,
            mobileCountryCode: PERSONAL_DETAILS_FALLBACK.mobileCountryCode,
            mobileCountryName: PERSONAL_DETAILS_FALLBACK.mobileCountryName,
            twoFaType: PERSONAL_DETAILS_FALLBACK.twoFaType,
        },
    });

    const onValid: SubmitHandler<PersonalDetailsFormData> = async (formData) => {
        try {
            // TODO: wire up actual API mutation
            console.log('Personal details submit:', formData);
            toast.success('Personal details updated successfully.');
            setIsEditing(false);
        } catch {
            toast.error('Failed to update personal details. Please try again.');
        }
    };

    const handleCancel = () => {
        reset();
        setIsEditing(false);
    };

    return (
        <div className="personalDetails-wrapper w-full h-fit">
            {/* Section Header */}
            <div className="flex items-center justify-between mb-5!">
                <div>
                    <h2 className="text-base font-semibold text-[var(--ink)] tracking-normal">Personal Details</h2>
                    <p className="text-xs text-[var(--mute)] mt-0.5!">Manage your personal account information</p>
                </div>
                <Activity mode={!isEditing ? 'visible' : 'hidden'}>
                    <div className="w-[90px] h-[34px]">
                        <CustomButtonComponent
                            id="personalDetails-edit-btn"
                            label={<><Pencil className="w-3.5 h-3.5" />Edit</>}
                            type="button"
                            variant="outline"
                            onClick={() => setIsEditing(true)}
                        />
                    </div>
                </Activity>
            </div>

            {/* Form */}
            <form
                id="personalDetails-form"
                noValidate
                onSubmit={handleSubmit(onValid)}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    {/* Full Name */}
                    <CustomInputComponent
                        id="personalDetails-input-fullName"
                        label="Full Name"
                        type="text"
                        placeholder="Enter full name"
                        disabled={!isEditing}
                        fieldLabelClassname="text-[var(--ink-soft)] text-xs font-semibold uppercase tracking-wide"
                        inputClassname="px-4! text-[var(--ink)] disabled:opacity-70 disabled:cursor-not-allowed"
                        error={errors?.fullName?.message}
                        {...register('fullName')}
                    />

                    {/* Email (always read-only) */}
                    <CustomInputComponent
                        id="personalDetails-input-email"
                        label="Email Address"
                        type="email"
                        placeholder="—"
                        disabled
                        fieldLabelClassname="text-[var(--ink-soft)] text-xs font-semibold uppercase tracking-wide"
                        inputClassname="px-4! text-[var(--ink)] disabled:opacity-70 disabled:cursor-not-allowed"
                        error={errors?.userEmail?.message}
                        {...register('userEmail')}
                    />

                    {/* Gender */}
                    <Controller
                        name="gender"
                        control={control}
                        render={({ field }) => (
                            <div className="w-full h-fit flex flex-col justify-center items-start gap-2">
                                <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">
                                    Gender
                                </span>
                                <CustomSelectComponent
                                    id="personalDetails-select-gender"
                                    label="Select Gender"
                                    labels={['Male', 'Female', 'Other']}
                                    selectTriggerClassName="w-full px-4! text-[var(--ink)] disabled:opacity-70 disabled:cursor-not-allowed"
                                    selectGroupClassName="w-full"
                                    value={
                                        field.value === 'MALE'
                                            ? 'Male'
                                            : field.value === 'FEMALE'
                                                ? 'Female'
                                                : field.value === 'OTHER'
                                                    ? 'Other'
                                                    : ''
                                    }
                                    onChange={(val) => {
                                        field.onChange(
                                            val === 'Male' ? 'MALE' : val === 'Female' ? 'FEMALE' : 'OTHER'
                                        );
                                    }}
                                    error={errors?.gender?.message}
                                    disabled={!isEditing}
                                />
                            </div>
                        )}
                    />

                    {/* Two FA Type (read-only) */}
                    <CustomInputComponent
                        id="personalDetails-input-twoFaType"
                        label="Two-Factor Auth Method"
                        type="text"
                        placeholder="—"
                        disabled
                        fieldLabelClassname="text-[var(--ink-soft)] text-xs font-semibold uppercase tracking-wide"
                        inputClassname="px-4! text-[var(--ink)] disabled:opacity-70 disabled:cursor-not-allowed"
                        {...register('twoFaType')}
                    />

                    {/* Mobile Dial Code */}
                    <Controller
                        name="mobileCountryCode"
                        control={control}
                        render={({ field }) => (
                            <div className="w-full h-fit flex flex-col justify-center items-start gap-2">
                                <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">
                                    Mobile Dial Code
                                </span>
                                <CustomSelectComponent
                                    id="personalDetails-select-dialCode"
                                    label="Select Dial Code"
                                    labels={mobileDialCodes}
                                    selectTriggerClassName="w-full px-4! text-[var(--ink)] disabled:opacity-70 disabled:cursor-not-allowed"
                                    selectGroupClassName="w-full"
                                    value={field.value}
                                    onChange={field.onChange}
                                    error={errors?.mobileCountryCode?.message}
                                    disabled={!isEditing}
                                />
                            </div>
                        )}
                    />

                    {/* Mobile Country Name */}
                    <Controller
                        name="mobileCountryName"
                        control={control}
                        render={({ field }) => (
                            <div className="w-full h-fit flex flex-col justify-center items-start gap-2">
                                <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">
                                    Mobile Country
                                </span>
                                <CustomSelectComponent
                                    id="personalDetails-select-countryName"
                                    label="Select Country"
                                    labels={mobileCountryCodes}
                                    selectTriggerClassName="w-full px-4! text-[var(--ink)] disabled:opacity-70 disabled:cursor-not-allowed"
                                    selectGroupClassName="w-full"
                                    value={field.value}
                                    onChange={field.onChange}
                                    error={errors?.mobileCountryName?.message}
                                    disabled={!isEditing}
                                />
                            </div>
                        )}
                    />

                    {/* Email Verified Badge */}
                    <div className="w-full h-fit flex flex-col justify-center items-start gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">
                            Email Verified
                        </span>
                        <div className="w-full h-10 flex items-center px-3! border border-[var(--line)] rounded-md bg-[var(--bg-subtle)]">
                            <StatusBadge value={PERSONAL_DETAILS_FALLBACK.isEmailVerified} trueLabel="Verified" falseLabel="Not Verified" />
                        </div>
                    </div>

                    {/* Is Admin Badge */}
                    <div className="w-full h-fit flex flex-col justify-center items-start gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">
                            Admin Access
                        </span>
                        <div className="w-full h-10 flex items-center px-3! border border-[var(--line)] rounded-md bg-[var(--bg-subtle)]">
                            <StatusBadge value={PERSONAL_DETAILS_FALLBACK.isAdmin} trueLabel="Admin" falseLabel="Not Admin" />
                        </div>
                    </div>
                </div>

                {/* Action Buttons — only shown in edit mode */}
                <Activity mode={isEditing ? 'visible' : 'hidden'}>
                    <div className="flex items-center justify-end gap-3 mt-6! pt-4! border-t border-[var(--line)]">
                        <div className="w-[100px] h-[36px]">
                            <CustomButtonComponent
                                id="personalDetails-cancel-btn"
                                label="Cancel"
                                type="button"
                                variant="outline"
                                onClick={handleCancel}
                            />
                        </div>
                        <div className="w-[130px] h-[36px]">
                            <CustomButtonComponent
                                id="personalDetails-submit-btn"
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
