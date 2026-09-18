import { useEffect, useState } from 'react';
import { Controller, useForm, type SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import CustomButtonComponent from '@/components/common/CustomButtonComponent';
import CustomInputComponent from '@/components/common/CustomInputComponent';
import CustomSelectComponent from '@/components/common/CustomSelectComponent';
import mobileCountryCodesLists from '@/utils/mobileCountryCodesList';
import { useUserOnboardingMutation } from '@/redux/features/user/userApi';
import ShowInConsole from '@/utils/ShowInConsole';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router';

const onboardingDetailsSchema = z.object({
    // Billing address
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

    // Delivery address
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

    // Bank details
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

interface AddOnboardingDetailsSidebarComponentPropsType {
    isOpen: boolean;
    onClose: () => void;
}

export default function AddOnboardingDetailsSidebarComponent({ isOpen, onClose }: AddOnboardingDetailsSidebarComponentPropsType) {
    // Configure useNavigate
    const navigate = useNavigate();

    // ----------------------------- Country Codes ----------------------------- \\
    const [mobileCountryCodes, setMobileCountryCodes] = useState<
        Array<{
            id: string;
            label: string;
            value: string;
        }>
    >([]);

    useEffect(() => {
        const listMobileCountryCodes = mobileCountryCodesLists();

        const countryCodes = listMobileCountryCodes.map((item) => ({
            id: item.name,
            label: item.name,
            value: item.country,
        }));

        setMobileCountryCodes(countryCodes);
    }, []);
    // ------------------------------ XXXXXXXXXXXXXXXXX ------------------------------ \\

    // User Onboarding Mutation
    const [triggerUserOnboarding, { isLoading: isSubmitting }] = useUserOnboardingMutation();

    const userEmail = sessionStorage.getItem('userEmail');

    // React Hook Form
    const {
        register,
        handleSubmit,
        control,
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

    // Function to handle form submission
    const handleFormSubmit: SubmitHandler<OnboardingDetailsFormData> = async (formData) => {
        if (!userEmail) {
            return;
        }

        const payload = {
            email: userEmail,

            address_details: {
                email: userEmail,
                billing_address: {
                    line1: formData.billingLine1,
                    line2: formData.billingLine2 ?? '',
                    city: formData.billingCity,
                    state: formData.billingState,
                    postal_code: formData.billingPostalCode,
                    country: formData.billingCountry,
                    type: 'Billing',
                },
                delivery_address: {
                    line1: formData.deliveryLine1,
                    line2: formData.deliveryLine2 ?? '',
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
        };

        try {
            const result = await triggerUserOnboarding(payload).unwrap();
            if (result?.status?.toUpperCase() !== "SUCCESS") {
                toast.error("Add user onboarding service is facing issue. Please try again later.")
                return
            }

            ShowInConsole("Sign in response:", result);

            const normalizedMessage = result?.message?.toUpperCase()

            if (normalizedMessage?.includes("failed to sent user bank verification mail")) {
                toast.success("User onboarding details submitted succesfully but failed to send onboarding verification mail. Please contact admin")
                return
            }


            toast.success("User onboarding details added successfully and onboarding verification mail send to admin")
            reset();
            onClose();
        }
        catch (err: any) {
            ShowInConsole('Add user onboarding details error:', err)

            const errorMessage = Array.isArray(err?.data?.message)
                ? err.data.message[0]
                : err?.data?.message ||
                err?.message ||
                "Add user onboarding service is facing issue. Please try again later.";

            const normalizedMessage = errorMessage.toLowerCase();

            if (normalizedMessage?.includes("user kyc verification has not been submitted")) {
                toast.error("User KYC verification has not been completed. Please submit kyc details before providing onboarding details.")
                setTimeout(() => {
                    navigate("/user/verification")
                }, 1000)
            }
            else if (normalizedMessage?.includes("user kyc verification is under review")) {
                toast.error("User KYC details under review. Please contact admin for furthur information.")
                setTimeout(() => {
                    navigate("/user/verification")
                }, 1000)
            }
            else if (normalizedMessage?.includes("user kyc verification requires additional information or document re-upload")) {
                toast.error("User KYC verification requires additional information or document re-upload. Please complete the required changes before providing onboarding details.")
                setTimeout(() => {
                    navigate("/user/verification")
                }, 1000)
            }
            else if (normalizedMessage?.includes("bank details already exist with the same account number")) {
                toast.error("Bank details already exist with the same account number.")
            }
            else {
                toast.error("Add user onboarding service is facing issue. Please try again later.")
            }
        }
    };

    // Function to handle opening / closing of sidebar
    const handleClose = () => {
        if (isSubmitting) {
            return;
        }

        reset();
        onClose();
    };

    // Lock background scrolling while sidebar is open.
    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : 'unset';

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex justify-end ">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-xs"
                onClick={handleClose}
            />

            {/* Right Sidebar */}
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
                    className="flex-1 overflow-y-auto p-6! sm:p-8! space-y-8!"
                >
                    {/* Billing Address */}
                    <section className="space-y-2!">
                        <div>
                            <h4 className="text-sm font-semibold text-[var(--ink)]">
                                Billing Address
                            </h4>

                            <p className="text-xs text-[var(--mute)] mt-1!">
                                Enter your billing address details.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4!">
                            {/* Billing Address Line 1 */}
                            <CustomInputComponent
                                id="onboarding-billing-line1"
                                label="Address Line 1"
                                type="text"
                                placeholder="Enter address line 1"
                                fieldLabelClassname="text-[var(--ink-soft)]"
                                inputClassname="px-4! text-[var(--ink-2)]"
                                error={errors?.billingLine1?.message}
                                {...register("billingLine1")}
                            />

                            {/* Billing Address Line 2 */}
                            <CustomInputComponent
                                id="onboarding-billing-line2"
                                label="Address Line 2"
                                type="text"
                                placeholder="Enter address line 2"
                                fieldLabelClassname="text-[var(--ink-soft)]"
                                inputClassname="px-4! text-[var(--ink-2)]"
                                error={errors?.billingLine2?.message}
                                {...register("billingLine2")}
                            />

                            {/* Billing City */}
                            <CustomInputComponent
                                id="onboarding-billing-city"
                                label="City"
                                type="text"
                                placeholder="Enter city"
                                fieldLabelClassname="text-[var(--ink-soft)]"
                                inputClassname="px-4! text-[var(--ink-2)]"
                                error={errors?.billingCity?.message}
                                {...register("billingCity")}
                            />

                            {/* Billing State */}
                            <CustomInputComponent
                                id="onboarding-billing-state"
                                label="State"
                                type="text"
                                placeholder="Enter state"
                                fieldLabelClassname="text-[var(--ink-soft)]"
                                inputClassname="px-4! text-[var(--ink-2)]"
                                error={errors?.billingState?.message}
                                {...register("billingState")}
                            />

                            {/* Billing Postal Code */}
                            <CustomInputComponent
                                id="onboarding-billing-postal-code"
                                label="Postal Code"
                                type="text"
                                placeholder="Enter postal code"
                                fieldLabelClassname="text-[var(--ink-soft)]"
                                inputClassname="px-4! text-[var(--ink-2)]"
                                error={errors?.billingPostalCode?.message}
                                {...register("billingPostalCode")}
                            />

                            {/* Billing Country */}
                            <Controller
                                name="billingCountry"
                                control={control}
                                render={({ field }) => (
                                    <div className="w-full h-fit flex flex-col justify-center items-start gap-2">
                                        <span className="text-sm text-[var(--ink-soft)] font-semibold tracking-normal">
                                            Country
                                        </span>

                                        <CustomSelectComponent
                                            id="onboarding-billing-country"
                                            label="Select Country"
                                            labels={mobileCountryCodes}
                                            selectTriggerClassName="w-full h-fit px-4! text-[var(--ink-2)]"
                                            selectGroupClassName="w-full h-fit px-4! text-[var(--ink-2)]"
                                            value={field.value}
                                            onChange={field.onChange}
                                            error={errors?.billingCountry?.message}
                                        />
                                    </div>
                                )}
                            />
                        </div>
                    </section>

                    {/* Separator */}
                    <div className="separator-container w-full h-[2px] bg-[var(--gold-2)] rounded-[100%] mt-3! mb-3!"></div>

                    {/* Delivery Address */}
                    <section className="space-y-5">
                        <div>
                            <h4 className="text-sm font-semibold text-[var(--ink)]">
                                Delivery Address
                            </h4>

                            <p className="text-xs text-[var(--mute)] mt-1!">
                                Enter your delivery address details.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4!">
                            {/* Delivery Address Line 1 */}
                            <CustomInputComponent
                                id="onboarding-delivery-line1"
                                label="Address Line 1"
                                type="text"
                                placeholder="Enter address line 1"
                                fieldLabelClassname="text-[var(--ink-soft)]"
                                inputClassname="px-4! text-[var(--ink-2)]"
                                error={errors?.deliveryLine1?.message}
                                {...register("deliveryLine1")}
                            />

                            {/* Delivery Address Line 2 */}
                            <CustomInputComponent
                                id="onboarding-delivery-line2"
                                label="Address Line 2"
                                type="text"
                                placeholder="Enter address line 2"
                                fieldLabelClassname="text-[var(--ink-soft)]"
                                inputClassname="px-4! text-[var(--ink-2)]"
                                error={errors?.deliveryLine2?.message}
                                {...register("deliveryLine2")}
                            />

                            {/* Delivery City */}
                            <CustomInputComponent
                                id="onboarding-delivery-city"
                                label="City"
                                type="text"
                                placeholder="Enter city"
                                fieldLabelClassname="text-[var(--ink-soft)]"
                                inputClassname="px-4! text-[var(--ink-2)]"
                                error={errors?.deliveryCity?.message}
                                {...register("deliveryCity")}
                            />

                            {/* Delivery State */}
                            <CustomInputComponent
                                id="onboarding-delivery-state"
                                label="State"
                                type="text"
                                placeholder="Enter state"
                                fieldLabelClassname="text-[var(--ink-soft)]"
                                inputClassname="px-4! text-[var(--ink-2)]"
                                error={errors?.deliveryState?.message}
                                {...register("deliveryState")}
                            />

                            {/* Delivery Postal Code */}
                            <CustomInputComponent
                                id="onboarding-delivery-postal-code"
                                label="Postal Code"
                                type="text"
                                placeholder="Enter postal code"
                                fieldLabelClassname="text-[var(--ink-soft)]"
                                inputClassname="px-4! text-[var(--ink-2)]"
                                error={errors?.deliveryPostalCode?.message}
                                {...register("deliveryPostalCode")}
                            />

                            {/* Delivery Country */}
                            <Controller
                                name="deliveryCountry"
                                control={control}
                                render={({ field }) => (
                                    <div className="w-full h-fit flex flex-col justify-center items-start gap-2">
                                        <span className="text-sm text-[var(--ink-soft)] font-semibold tracking-normal">
                                            Country
                                        </span>

                                        <CustomSelectComponent
                                            id="onboarding-delivery-country"
                                            label="Select Country"
                                            labels={mobileCountryCodes}
                                            selectTriggerClassName="w-full h-fit px-4! text-[var(--ink-2)]"
                                            selectGroupClassName="w-full h-fit px-4! text-[var(--ink-2)]"
                                            value={field.value}
                                            onChange={field.onChange}
                                            error={errors?.deliveryCountry?.message}
                                        />
                                    </div>
                                )}
                            />
                        </div>
                    </section>

                    {/* Separator */}
                    <div className="separator-container w-full h-[2px] bg-[var(--gold-2)] rounded-[100%] mt-3! mb-3!"></div>

                    {/* Bank Details */}
                    <section className="space-y-5">
                        <div>
                            <h4 className="text-sm font-semibold text-[var(--ink)]">
                                Bank Details
                            </h4>

                            <p className="text-xs text-[var(--mute)] mt-1!">
                                Enter the bank account details linked to your account.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4!">
                            {/* Account Holder Name */}
                            <CustomInputComponent
                                id="onboarding-account-holder-name"
                                label="Account Holder Name"
                                type="text"
                                placeholder="Enter account holder name"
                                fieldLabelClassname="text-[var(--ink-soft)]"
                                inputClassname="px-4! text-[var(--ink-2)]"
                                error={errors?.accountHolderName?.message}
                                {...register("accountHolderName")}
                            />

                            {/* Account Number */}
                            <CustomInputComponent
                                id="onboarding-account-number"
                                label="Account Number"
                                type="text"
                                placeholder="Enter account number"
                                fieldLabelClassname="text-[var(--ink-soft)]"
                                inputClassname="px-4! text-[var(--ink-2)]"
                                error={errors?.accountNumber?.message}
                                {...register("accountNumber")}
                            />

                            {/* SWIFT Code */}
                            <CustomInputComponent
                                id="onboarding-swift-code"
                                label="SWIFT Code"
                                type="text"
                                placeholder="Enter SWIFT code"
                                fieldLabelClassname="text-[var(--ink-soft)]"
                                inputClassname="px-4! text-[var(--ink-2)]"
                                error={errors?.swiftCode?.message}
                                {...register("swiftCode")}
                            />

                            {/* IBAN */}
                            <CustomInputComponent
                                id="onboarding-iban-code"
                                label="IBAN"
                                type="text"
                                placeholder="Enter IBAN"
                                fieldLabelClassname="text-[var(--ink-soft)]"
                                inputClassname="px-4! text-[var(--ink-2)]"
                                error={errors?.ibanCode?.message}
                                {...register("ibanCode")}
                            />

                            {/* Bank Name */}
                            <CustomInputComponent
                                id="onboarding-bank-name"
                                label="Bank Name"
                                type="text"
                                placeholder="Enter bank name"
                                fieldLabelClassname="text-[var(--ink-soft)]"
                                inputClassname="px-4! text-[var(--ink-2)]"
                                error={errors?.bankName?.message}
                                {...register("bankName")}
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