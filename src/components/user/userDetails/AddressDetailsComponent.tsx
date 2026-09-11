import React, { Activity, useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Pencil } from 'lucide-react';
import { toast } from 'react-toastify';
import CustomInputComponent from '@/components/common/CustomInputComponent';
import CustomButtonComponent from '@/components/common/CustomButtonComponent';
import { ADDRESS_DETAILS_FALLBACK, type AddressType } from '@/fallbacks/user/userDetails/addressDetailsFallbacks';

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
interface AddressSubFormProps {
    title: string;
    description: string;
    formId: string;
    defaultValues: AddressType;
    onSave: (data: AddressFormData) => Promise<void>;
}

function AddressSubForm({ title, description, formId, defaultValues, onSave }: AddressSubFormProps) {
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
        await onSave(formData);
        setIsEditing(false);
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
                        <div className="w-[100px] h-[36px]">
                            <CustomButtonComponent
                                id={`${formId}-cancel-btn`}
                                label="Cancel"
                                type="button"
                                variant="outline"
                                onClick={handleCancel}
                            />
                        </div>
                        <div className="w-[130px] h-[36px]">
                            <CustomButtonComponent
                                id={`${formId}-submit-btn`}
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

// ── Main Component ────────────────────────────────────────────────────────────
export default function AddressDetailsComponent() {
    const handleBillingSave = async (data: AddressFormData) => {
        try {
            // TODO: wire up actual API mutation
            console.log('Billing address submit:', data);
            toast.success('Billing address updated successfully.');
        } catch {
            toast.error('Failed to update billing address. Please try again.');
        }
    };

    const handleDeliverySave = async (data: AddressFormData) => {
        try {
            // TODO: wire up actual API mutation
            console.log('Delivery address submit:', data);
            toast.success('Delivery address updated successfully.');
        } catch {
            toast.error('Failed to update delivery address. Please try again.');
        }
    };

    return (
        <div className="addressDetails-wrapper w-full h-fit space-y-8!">
            {/* Section Header */}
            <div className="mb-5!">
                <h2 className="text-base font-semibold text-[var(--ink)] tracking-normal">Address Details</h2>
                <p className="text-xs text-[var(--mute)] mt-0.5!">Manage your billing and delivery addresses</p>
            </div>

            {/* Billing Address Sub-Form */}
            <AddressSubForm
                title="Billing Address"
                description="Your registered billing address"
                formId="billingAddress-form"
                defaultValues={ADDRESS_DETAILS_FALLBACK.billing_address}
                onSave={handleBillingSave}
            />

            {/* Divider */}
            <div className="border-t border-[var(--line-faint)]" />

            {/* Delivery Address Sub-Form */}
            <AddressSubForm
                title="Delivery Address"
                description="Your registered delivery address"
                formId="deliveryAddress-form"
                defaultValues={ADDRESS_DETAILS_FALLBACK.delivery_address}
                onSave={handleDeliverySave}
            />
        </div>
    );
}
