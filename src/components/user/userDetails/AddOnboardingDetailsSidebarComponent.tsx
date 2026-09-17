import { useEffect, useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import CustomButtonComponent from '@/components/common/CustomButtonComponent';
import CustomInputComponent from '@/components/common/CustomInputComponent';

const onboardingDetailsSchema = z.object({
    billingLine1: z
        .string()
        .trim()
        .min(1, 'Billing address line 1 is required'),

    billingLine2: z
        .string()
        .trim()
        .optional(),

    billingCity: z
        .string()
        .trim()
        .min(1, 'Billing city is required'),

    billingState: z
        .string()
        .trim()
        .min(1, 'Billing state is required'),

    billingPostalCode: z
        .string()
        .trim()
        .min(1, 'Billing postal code is required'),

    billingCountry: z
        .string()
        .trim()
        .min(1, 'Billing country is required'),

    deliveryLine1: z
        .string()
        .trim()
        .min(1, 'Delivery address line 1 is required'),

    deliveryLine2: z
        .string()
        .trim()
        .optional(),

    deliveryCity: z
        .string()
        .trim()
        .min(1, 'Delivery city is required'),

    deliveryState: z
        .string()
        .trim()
        .min(1, 'Delivery state is required'),

    deliveryPostalCode: z
        .string()
        .trim()
        .min(1, 'Delivery postal code is required'),

    deliveryCountry: z
        .string()
        .trim()
        .min(1, 'Delivery country is required'),

    accountHolderName: z
        .string()
        .trim()
        .min(1, 'Account holder name is required'),

    accountNumber: z
        .string()
        .trim()
        .min(1, 'Account number is required'),

    swiftCode: z
        .string()
        .trim()
        .min(1, 'SWIFT code is required'),

    ibanCode: z
        .string()
        .trim()
        .min(1, 'IBAN code is required'),

    bankName: z
        .string()
        .trim()
        .min(1, 'Bank name is required'),
});

type OnboardingDetailsFormData = z.infer<typeof onboardingDetailsSchema>;

interface OnboardingDetailsSidebarComponentPropsType {
    isOpen: boolean;
    onClose: () => void;
    onSubmitSuccess?: () => void;
}

export default function AddOnboardingDetailsSidebarComponent({isOpen, onClose, onSubmitSuccess, }: OnboardingDetailsSidebarComponentPropsType) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const userEmail = sessionStorage.getItem('userEmail');

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<OnboardingDetailsFormData>({
        resolver: zodResolver(onboardingDetailsSchema),
        mode: 'onTouched',
        reValidateMode: 'onChange',
        defaultValues: {
            billingLine1: '',
            billingLine2: '',
            billingCity: '',
            billingState: '',
            billingPostalCode: '',
            billingCountry: '',

            deliveryLine1: '',
            deliveryLine2: '',
            deliveryCity: '',
            deliveryState: '',
            deliveryPostalCode: '',
            deliveryCountry: '',

            accountHolderName: '',
            accountNumber: '',
            swiftCode: '',
            ibanCode: '',
            bankName: '',
        },
    });

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

    const handleFormSubmit: SubmitHandler<OnboardingDetailsFormData> = async (
        formData,
    ) => {
        if (!userEmail) {
            return;
        }

        try {
            setIsSubmitting(true);

            /*
             * TODO:
             * Add useCreateUserOnboardingMutation here.
             *
             * const payload = {
             *     address_details: {
             *         email: userEmail,
             *         billing_address: {...},
             *         delivery_address: {...},
             *     },
             *     bank_details: {
             *         email: userEmail,
             *         account_holder_name: formData.accountHolderName,
             *         account_number: formData.accountNumber,
             *         swift_code: formData.swiftCode,
             *         iban_code: formData.ibanCode,
             *         bank_name: formData.bankName,
             *         is_verified: false,
             *     },
             * };
             *
             * await createUserOnboarding(payload).unwrap();
             */

            console.log('Onboarding form data', {
                address_details: {
                    email: userEmail,
                    billing_address: {
                        line1: formData.billingLine1,
                        line2: formData.billingLine2,
                        city: formData.billingCity,
                        state: formData.billingState,
                        postal_code: formData.billingPostalCode,
                        country: formData.billingCountry,
                        type: 'Billing',
                    },
                    delivery_address: {
                        line1: formData.deliveryLine1,
                        line2: formData.deliveryLine2,
                        city: formData.deliveryCity,
                        state: formData.deliveryState,
                        postal_code: formData.deliveryPostalCode,
                        country: formData.deliveryCountry,
                        type: 'Delivery',
                    },
                },
                bank_details: {
                    email: userEmail,
                    account_holder_name: formData.accountHolderName,
                    account_number: formData.accountNumber,
                    swift_code: formData.swiftCode,
                    iban_code: formData.ibanCode,
                    bank_name: formData.bankName,
                    is_verified: false,
                },
            });

            onSubmitSuccess?.();
            reset();
            onClose();
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (isSubmitting) {
            return;
        }

        reset();
        onClose();
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-xs"
                onClick={handleClose}
            />

            {/* Drawer */}
            <div className="relative z-10 w-full max-w-xl h-full bg-[var(--bg-surface)] border-l border-[var(--line)] shadow-2xl flex flex-col overflow-hidden animate-[slideInRight_0.25s_ease-out]">
                <style>{`
                    @keyframes slideInRight {
                        from {
                            transform: translateX(100%);
                        }
                        to {
                            transform: translateX(0);
                        }
                    }
                `}</style>

                {/* Header */}
                <div className="shrink-0 p-6! border-b border-[var(--line)] bg-[var(--bg-subtle)] flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-[var(--ink)]">
                            Add Onboarding Details
                        </h3>

                        <p className="text-xs text-[var(--mute)] mt-1!">
                            Add your address and banking information.
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
                    id="userDetailsPage-onboarding-form"
                    noValidate
                    onSubmit={handleSubmit(handleFormSubmit)}
                    className="flex-1 overflow-y-auto p-6! sm:p-8! space-y-8"
                >
                    {/* ADDRESS */}
                    <section className="space-y-5">
                        <div>
                            <h4 className="text-sm font-semibold text-[var(--ink)]">
                                Billing Address
                            </h4>
                            <p className="text-xs text-[var(--mute)] mt-1!">
                                Enter your billing address details.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <CustomInputComponent
                                id="onboarding-billing-line1"
                                label="Address Line 1"
                                placeholder="Enter address line 1"
                                required
                                error={errors.billingLine1?.message}
                                {...register('billingLine1')}
                            />

                            <CustomInputComponent
                                id="onboarding-billing-line2"
                                label="Address Line 2"
                                placeholder="Enter address line 2"
                                error={errors.billingLine2?.message}
                                {...register('billingLine2')}
                            />

                            <CustomInputComponent
                                id="onboarding-billing-city"
                                label="City"
                                placeholder="Enter city"
                                required
                                error={errors.billingCity?.message}
                                {...register('billingCity')}
                            />

                            <CustomInputComponent
                                id="onboarding-billing-state"
                                label="State"
                                placeholder="Enter state"
                                required
                                error={errors.billingState?.message}
                                {...register('billingState')}
                            />

                            <CustomInputComponent
                                id="onboarding-billing-postal-code"
                                label="Postal Code"
                                placeholder="Enter postal code"
                                required
                                error={errors.billingPostalCode?.message}
                                {...register('billingPostalCode')}
                            />

                            <CustomInputComponent
                                id="onboarding-billing-country"
                                label="Country"
                                placeholder="Enter country"
                                required
                                error={errors.billingCountry?.message}
                                {...register('billingCountry')}
                            />
                        </div>
                    </section>

                    {/* DELIVERY */}
                    <section className="space-y-5">
                        <div>
                            <h4 className="text-sm font-semibold text-[var(--ink)]">
                                Delivery Address
                            </h4>
                            <p className="text-xs text-[var(--mute)] mt-1!">
                                Enter your delivery address details.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <CustomInputComponent
                                id="onboarding-delivery-line1"
                                label="Address Line 1"
                                placeholder="Enter address line 1"
                                required
                                error={errors.deliveryLine1?.message}
                                {...register('deliveryLine1')}
                            />

                            <CustomInputComponent
                                id="onboarding-delivery-line2"
                                label="Address Line 2"
                                placeholder="Enter address line 2"
                                error={errors.deliveryLine2?.message}
                                {...register('deliveryLine2')}
                            />

                            <CustomInputComponent
                                id="onboarding-delivery-city"
                                label="City"
                                placeholder="Enter city"
                                required
                                error={errors.deliveryCity?.message}
                                {...register('deliveryCity')}
                            />

                            <CustomInputComponent
                                id="onboarding-delivery-state"
                                label="State"
                                placeholder="Enter state"
                                required
                                error={errors.deliveryState?.message}
                                {...register('deliveryState')}
                            />

                            <CustomInputComponent
                                id="onboarding-delivery-postal-code"
                                label="Postal Code"
                                placeholder="Enter postal code"
                                required
                                error={errors.deliveryPostalCode?.message}
                                {...register('deliveryPostalCode')}
                            />

                            <CustomInputComponent
                                id="onboarding-delivery-country"
                                label="Country"
                                placeholder="Enter country"
                                required
                                error={errors.deliveryCountry?.message}
                                {...register('deliveryCountry')}
                            />
                        </div>
                    </section>

                    {/* BANK */}
                    <section className="space-y-5">
                        <div>
                            <h4 className="text-sm font-semibold text-[var(--ink)]">
                                Bank Details
                            </h4>
                            <p className="text-xs text-[var(--mute)] mt-1!">
                                Enter the bank account details linked to your account.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <CustomInputComponent
                                id="onboarding-account-holder-name"
                                label="Account Holder Name"
                                placeholder="Enter account holder name"
                                required
                                error={errors.accountHolderName?.message}
                                {...register('accountHolderName')}
                            />

                            <CustomInputComponent
                                id="onboarding-account-number"
                                label="Account Number"
                                placeholder="Enter account number"
                                required
                                error={errors.accountNumber?.message}
                                {...register('accountNumber')}
                            />

                            <CustomInputComponent
                                id="onboarding-swift-code"
                                label="SWIFT Code"
                                placeholder="Enter SWIFT code"
                                required
                                error={errors.swiftCode?.message}
                                {...register('swiftCode')}
                            />

                            <CustomInputComponent
                                id="onboarding-iban-code"
                                label="IBAN"
                                placeholder="Enter IBAN"
                                required
                                error={errors.ibanCode?.message}
                                {...register('ibanCode')}
                            />

                            <CustomInputComponent
                                id="onboarding-bank-name"
                                label="Bank Name"
                                placeholder="Enter bank name"
                                required
                                error={errors.bankName?.message}
                                {...register('bankName')}
                            />
                        </div>
                    </section>
                </form>

                {/* Footer */}
                <div className="shrink-0 p-6! border-t border-[var(--line)] bg-[var(--bg-subtle)] flex items-center justify-end gap-3">
                    <div className="w-[100px] h-[38px]">
                        <CustomButtonComponent
                            id="userDetailsPage-onboarding-cancel-btn"
                            label="Cancel"
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="w-[160px] h-[38px]">
                        <CustomButtonComponent
                            id="userDetailsPage-onboarding-submit-btn"
                            label="Save Details"
                            type="submit"
                            form="userDetailsPage-onboarding-form"
                            variant="navy"
                            showButtonLoader={isSubmitting}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}