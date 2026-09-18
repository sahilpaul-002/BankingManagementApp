import React, { Activity, useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Pencil } from 'lucide-react';
import { toast } from 'react-toastify';
import CustomInputComponent from '@/components/common/CustomInputComponent';
import CustomButtonComponent from '@/components/common/CustomButtonComponent';
import type { AddressDetailsType, AddressType, BankDetailsType } from '@/types/user/userDetailsPageTypes';
import { useUserOnboardingMutation } from '@/redux/features/user/userApi';
import ShowInConsole from '@/utils/ShowInConsole';

// ── Zod Schema ──────────────────────────────────────────────────────────────
const addressSchema = z.object({
    line1: z.string().min(1, 'Address line 1 is required'),
    line2: z.string(),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    postal_code: z.string().min(1, 'Postal code is required'),
    country: z.string().min(1, 'Country is required'),
});

type AddressFormData = z.infer<typeof addressSchema>;

// ── Single Address Sub-Form ──────────────────────────────────────────────────
interface AddressSubFormPropsType {
    title: string;
    description: string;
    formId: string;
    defaultValues: AddressType;
    onSave: (data: AddressFormData) => Promise<boolean>;
    isSaving: boolean;
}

function AddressSubForm({ title, description, formId, defaultValues, onSave, isSaving }: AddressSubFormPropsType) {
    const [isEditing, setIsEditing] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<AddressFormData>({
        resolver: zodResolver(addressSchema),
        mode: 'onTouched',
        reValidateMode: 'onChange',
        defaultValues: {
            line1: defaultValues.line1,
            line2: defaultValues.line2,
            city: defaultValues.city,
            state: defaultValues.state,
            postal_code: defaultValues.postal_code,
            country: defaultValues.country,
        },
    });

    const onValid: SubmitHandler<AddressFormData> = async (formData) => {
        const isSaved = await onSave(formData);

        if (isSaved) {
            setIsEditing(false);
        }
    };

    const handleCancel = () => {
        reset();
        setIsEditing(false);
    };

    return (
        <div className="addressSubForm-wrapper w-full h-fit">
            {/* Sub-section Header */}
            <div className="flex items-center justify-between mb-4!">
                <div>
                    <h3 className="text-sm font-semibold text-[var(--ink)] tracking-normal">{title}</h3>
                    <p className="text-xs text-[var(--mute)] mt-0.5!">{description}</p>
                </div>
                <Activity mode={!isEditing ? 'visible' : 'hidden'}>
                    <div className="w-[90px] h-[34px]">
                        <CustomButtonComponent
                            id={`${formId}-edit-btn`}
                            label={<><Pencil className="w-3.5 h-3.5" />Edit</>}
                            type="button"
                            variant="outline"
                            onClick={() => setIsEditing(true)}
                        />
                    </div>
                </Activity>
            </div>

            {/* Form */}
            <form id={formId} noValidate onSubmit={handleSubmit(onValid)}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    {/* Line 1 */}
                    <CustomInputComponent
                        id={`${formId}-input-line1`}
                        label="Address Line 1"
                        type="text"
                        placeholder="Enter address line 1"
                        disabled={!isEditing}
                        fieldLabelClassname="text-[var(--ink-soft)] text-xs font-semibold uppercase tracking-wide"
                        inputClassname="px-4! text-[var(--ink)] disabled:opacity-70 disabled:cursor-not-allowed"
                        error={errors?.line1?.message}
                        {...register('line1')}
                    />

                    {/* Line 2 */}
                    <CustomInputComponent
                        id={`${formId}-input-line2`}
                        label="Address Line 2"
                        type="text"
                        placeholder="Enter address line 2 (optional)"
                        disabled={!isEditing}
                        fieldLabelClassname="text-[var(--ink-soft)] text-xs font-semibold uppercase tracking-wide"
                        inputClassname="px-4! text-[var(--ink)] disabled:opacity-70 disabled:cursor-not-allowed"
                        error={errors?.line2?.message}
                        {...register('line2')}
                    />

                    {/* City */}
                    <CustomInputComponent
                        id={`${formId}-input-city`}
                        label="City"
                        type="text"
                        placeholder="Enter city"
                        disabled={!isEditing}
                        fieldLabelClassname="text-[var(--ink-soft)] text-xs font-semibold uppercase tracking-wide"
                        inputClassname="px-4! text-[var(--ink)] disabled:opacity-70 disabled:cursor-not-allowed"
                        error={errors?.city?.message}
                        {...register('city')}
                    />

                    {/* State */}
                    <CustomInputComponent
                        id={`${formId}-input-state`}
                        label="State / Region"
                        type="text"
                        placeholder="Enter state"
                        disabled={!isEditing}
                        fieldLabelClassname="text-[var(--ink-soft)] text-xs font-semibold uppercase tracking-wide"
                        inputClassname="px-4! text-[var(--ink)] disabled:opacity-70 disabled:cursor-not-allowed"
                        error={errors?.state?.message}
                        {...register('state')}
                    />

                    {/* Postal Code */}
                    <CustomInputComponent
                        id={`${formId}-input-postalCode`}
                        label="Postal Code"
                        type="text"
                        placeholder="Enter postal code"
                        disabled={!isEditing}
                        fieldLabelClassname="text-[var(--ink-soft)] text-xs font-semibold uppercase tracking-wide"
                        inputClassname="px-4! text-[var(--ink)] disabled:opacity-70 disabled:cursor-not-allowed"
                        error={errors?.postal_code?.message}
                        {...register('postal_code')}
                    />

                    {/* Country */}
                    <CustomInputComponent
                        id={`${formId}-input-country`}
                        label="Country"
                        type="text"
                        placeholder="Enter country"
                        disabled={!isEditing}
                        fieldLabelClassname="text-[var(--ink-soft)] text-xs font-semibold uppercase tracking-wide"
                        inputClassname="px-4! text-[var(--ink)] disabled:opacity-70 disabled:cursor-not-allowed"
                        error={errors?.country?.message}
                        {...register('country')}
                    />
                </div>

                {/* Action Buttons — only shown in edit mode */}
                <Activity mode={isEditing ? 'visible' : 'hidden'}>
                    <div className="flex items-center justify-end gap-3 mt-5! pt-4! border-t border-[var(--line)]">
                        <div className="w-fit h-fit">
                            <CustomButtonComponent
                                id={`${formId}-cancel-btn`}
                                label="Cancel"
                                type="button"
                                variant="outline"
                                onClick={handleCancel}
                                disabled={isSaving}
                            />
                        </div>
                        <div className="w-fit h-fit">
                            <CustomButtonComponent
                                id={`${formId}-submit-btn`}
                                label="Save Changes"
                                type="submit"
                                variant="navy"
                                disabled={isSaving}
                                showButtonLoader={isSaving}
                            />
                        </div>
                    </div>
                </Activity>
            </form>
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────
interface AddressDetailsComponentProps {
    addressDetails: AddressDetailsType;
    bankDetails: BankDetailsType;
    userEmail: string;
}

export default function AddressDetailsComponent({ addressDetails, bankDetails, userEmail }: AddressDetailsComponentProps) {
    const [triggerUserOnboarding, { isLoading: isUpdating }] = useUserOnboardingMutation();

    const bankDetailsPayload = {
        email: userEmail,
        account_holder_name: bankDetails.account_holder_name,
        account_number: bankDetails.account_number,
        swift_code: bankDetails.swift_code,
        iban_code: bankDetails.iban_code,
        bank_name: bankDetails.bank_name,
        is_verified: bankDetails.is_verified,
    };

    const handleBillingSave = async (data: AddressFormData): Promise<boolean> => {
        if (!userEmail) {
            toast.error('Email not available. Please try again.');
            return false;
        }

        if (!bankDetails) {
            toast.error('Bank details are unavailable. Please try again.');
            return false;
        }

        const payload = {
            email: userEmail,
            address_details: {
                email: userEmail,
                billing_address: {
                    ...data,
                    type: 'Billing',
                },
                delivery_address: {
                    ...addressDetails.delivery_address,
                    type: 'Delivery',
                },
            },
            bank_details: bankDetailsPayload,
        };

        try {
            const result = await triggerUserOnboarding(payload).unwrap();

            if (result?.status?.toUpperCase() !== 'SUCCESS') {
                toast.error('Update user onboarding service is facing issue. Please try again later.');
                return false;
            }

            ShowInConsole('Update user onboarding response:', result);

            const normalizedMessage = result?.message?.toLowerCase();
            if (normalizedMessage?.includes('failed to sent user bank verification mail')) {
                toast.success('Address updated successfully, but the onboarding verification mail could not be sent. Please contact admin.');
                return true;
            }

            toast.success('Billing address updated successfully.');
            return true;
        } catch (err: any) {
            ShowInConsole('Update billing address / user onboarding error:', err);

            const errorMessage = Array.isArray(err?.data?.message)
                ? err.data.message[0]
                : err?.data?.message ||
                err?.message ||
                'Update user onboarding service is facing issue. Please try again later.';

            const normalizedMessage = errorMessage.toLowerCase();
            if (normalizedMessage.includes('user kyc verification has not been submitted')) {
                toast.error('User KYC verification has not been completed. Please submit KYC details before updating onboarding details.');
                return false;
            }
            if (normalizedMessage.includes('user kyc verification is under review')) {
                toast.error('User KYC details are under review. Please contact admin for further information.');
                return false;
            }
            if (normalizedMessage.includes('user kyc verification requires additional information or document re-upload')) {
                toast.error('User KYC verification requires additional information or document re-upload. Please complete the required changes before updating onboarding details.');
                return false;
            }
            if (normalizedMessage.includes('bank details already exist with the same account number')) {
                toast.error('Bank details already exist with the same account number.');
                return false;
            }
            toast.error('Update user onboarding service is facing issue. Please try again later.');

            return false;
        }
    };

    const handleDeliverySave = async (data: AddressFormData): Promise<boolean> => {
        if (!userEmail) {
            toast.error('Email not available. Please try again.');
            return false;
        }

        if (!bankDetails) {
            toast.error('Bank details are unavailable. Please try again.');
            return false;
        }

        const payload = {
            email: userEmail,
            address_details: {
                email: userEmail,
                billing_address: {
                    ...addressDetails.billing_address,
                    type: 'Billing',
                },
                delivery_address: {
                    ...data,
                    type: 'Delivery',
                },
            },
            bank_details: bankDetailsPayload,
        };

        try {
            const result = await triggerUserOnboarding(payload).unwrap();

            if (result?.status?.toUpperCase() !== 'SUCCESS') {
                toast.error('Update user onboarding service is facing issue. Please try again later.');
                return false;
            }

            ShowInConsole('Update user onboarding response:', result);

            const normalizedMessage = result?.message?.toLowerCase();
            if (normalizedMessage?.includes('failed to sent user bank verification mail')) {
                toast.success('Address updated successfully, but the onboarding verification mail could not be sent. Please contact admin.');
                return true;
            }

            toast.success('Delivery address updated successfully.');
            return true;
        } catch (err: any) {
            ShowInConsole('Update delivery address / user onboarding error:', err);

            const errorMessage = Array.isArray(err?.data?.message)
                ? err.data.message[0]
                : err?.data?.message ||
                err?.message ||
                'Update user onboarding service is facing issue. Please try again later.';

            const normalizedMessage = errorMessage.toLowerCase();
            if (normalizedMessage.includes('user kyc verification has not been submitted')) {
                toast.error('User KYC verification has not been completed. Please submit KYC details before updating onboarding details.');
                return false;
            }
            if (normalizedMessage.includes('user kyc verification is under review')) {
                toast.error('User KYC details are under review. Please contact admin for further information.');
                return false;
            }
            if (normalizedMessage.includes('user kyc verification requires additional information or document re-upload')) {
                toast.error('User KYC verification requires additional information or document re-upload. Please complete the required changes before updating onboarding details.');
                return false;
            }
            if (normalizedMessage.includes('bank details already exist with the same account number')) {
                toast.error('Bank details already exist with the same account number.');
                return false;
            }
            toast.error('Update user onboarding service is facing issue. Please try again later.');
            return false;
        }
    };

    return (
        <div className="addressDetails-wrapper w-full h-fit space-y-8!">
            <div className="mb-5!">
                <h2 className="text-base font-semibold text-[var(--ink)] tracking-normal">
                    Address Details
                </h2>

                <p className="text-xs text-[var(--mute)] mt-0.5!">
                    Manage your billing and delivery addresses
                </p>
            </div>

            <AddressSubForm
                title="Billing Address"
                description="Your registered billing address"
                formId="billingAddress-form"
                defaultValues={addressDetails.billing_address}
                onSave={handleBillingSave}
                isSaving={isUpdating}
            />

            <div className="border-t border-[var(--line-faint)]" />

            <AddressSubForm
                title="Delivery Address"
                description="Your registered delivery address"
                formId="deliveryAddress-form"
                defaultValues={addressDetails.delivery_address}
                onSave={handleDeliverySave}
                isSaving={isUpdating}
            />
        </div>
    );
}