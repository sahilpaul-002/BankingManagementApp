import { useEffect, useState } from 'react';
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, UserPlus } from 'lucide-react';
import { toast } from 'react-toastify';
import CustomInputComponent from '@/components/common/CustomInputComponent';
import CustomSelectComponent from '@/components/common/CustomSelectComponent';
import CustomButtonComponent from '@/components/common/CustomButtonComponent';
import { useAddCardholderMutation } from '@/redux/features/cardholder/cardholdersApi';
import { useDispatch } from 'react-redux';
import { setShowInfoBanner } from '@/redux/slice/utility/utilitySlice';
import mobileCountryCodesLists from '@/utils/mobileCountryCodesList';
import ShowInConsole from '@/utils/ShowInConsole';

// ── Zod Schema ────────────────────────────────────────────────────────────────
const addCardholderSchema = z.object({
    email: z
        .string('Email is required and must be a string')
        .trim()
        .min(1, 'Email is required')
        .max(100, 'Email cannot exceed 100 characters')
        .email('Invalid email format'),

    fullName: z
        .string('Full name is required and must be a string')
        .trim()
        .min(3, 'Full name must be at least 3 characters')
        .max(100, 'Full name cannot exceed 100 characters')
        .regex(
            /^[A-Za-z0-9\s.'-]+$/,
            "Full name can only contain letters, numbers, spaces, dots (.), apostrophes ('), and hyphens (-)"
        ),

    mobileCountryCode: z
        .string('Mobile country code is required')
        .trim()
        .min(1, 'Mobile country code is required')
        .regex(
            /^\+\d{1,4}$/,
            'Invalid mobile country code (Example: +91)'
        ),

    mobileCountryName: z
        .string('Mobile country name is required')
        .trim()
        .min(2, 'Mobile country name must be at least 2 characters')
        .regex(
            /^[A-Za-z]+$/,
            'Mobile country name can contain only alphabets'
        ),

    phoneNumber: z
        .string('Phone number is required and must be a string')
        .trim()
        .min(4, 'Phone number must be at least 4 digits')
        .max(15, 'Phone number cannot exceed 15 digits')
        .regex(
            /^\d{4,15}$/,
            'Phone number must be 4–15 digits'
        ),

    dateOfBirth: z
        .string({ error: (issue) => issue.input === undefined ? 'Date of birth is required' : 'Invalid date of birth' })
        .trim()
        .min(1, 'Date of birth is required')
        .transform((val) => {
            // Parse as local date (not UTC) to avoid timezone-shift issues
            const [year = NaN, month = NaN, day = NaN] = val.split('-').map(Number);
            return new Date(year, month - 1, day);
        })
        .pipe(
            z.date({ error: (issue) => issue.input === undefined ? 'Date of birth is required' : 'Invalid date of birth' })
                .refine((date) => {
                    const today = new Date();
                    const minDate = new Date(
                        today.getFullYear() - 18,
                        today.getMonth(),
                        today.getDate()
                    );
                    return date <= minDate;
                }, {
                    message: 'You must be at least 18 years old',
                })
        ),

    gender: z.enum(['MALE', 'FEMALE'], {
        error: 'Please select a gender',
    }),
}).strict();


type AddCardholderFormData = z.input<typeof addCardholderSchema>;
type AddCardholderFormOutput = z.output<typeof addCardholderSchema>;

// ── Props ─────────────────────────────────────────────────────────────────────
interface AddCardholderSidebarComponentPropsType {
    isOpen: boolean;
    onClose: () => void;
}

export default function AddCardholderSidebarComponent({
    isOpen,
    onClose,
}: AddCardholderSidebarComponentPropsType) {
    // Configure useDispatch
    const dispatch = useDispatch();

    // ------------------------------- GET EMAIL FROM SESSION STORAGE ---------------------------------- \\
    // Get necessary user details from session storage
    const userEmail = sessionStorage.getItem('userEmail');
    const userId = sessionStorage.getItem('userId');

    useEffect(() => {
        // Validate session storage once
        if (!userEmail || !userId) {
            dispatch(setShowInfoBanner('Application facing issue, necessary user details not present in session storage. Please re-login.'));
            return;
        }
    }, [userEmail, userId]);
    // ---------------------------------- XXXXXXXXXXXXXXXXXXXXXXXXXX ---------------------------------- \\

    // ── Country code lists ────────────────────────────────────────────────────
    const [mobileDialCodes, setMobileDialCodes] = useState<Array<{ label: string; value: string }> | null>(null);
    const [mobileCountryCodes, setMobileCountryCodes] = useState<Array<{ label: string; value: string }> | null>(null);

    useEffect(() => {
        const listMobileCountryCodes = mobileCountryCodesLists();

        const dialCodesList = listMobileCountryCodes.map((item) => ({
            label: item.country,
            value: item.code,
        }));
        setMobileDialCodes(dialCodesList);

        const countryCodes = listMobileCountryCodes.map((item) => ({
            label: item.name,
            value: item.country,
        }));
        setMobileCountryCodes(countryCodes);
    }, []);

    // ── Add Cardholder RTK Mutation ───────────────────────────────────────────
    const [triggerAddCardholder, { isLoading: addCardholderIsLoading }] = useAddCardholderMutation();

    // ── React Hook Form ───────────────────────────────────────────────────────
    const {
        register,
        handleSubmit,
        control,
        reset,
        formState: { errors },
    } = useForm<AddCardholderFormData, any, AddCardholderFormOutput>({
        resolver: zodResolver(addCardholderSchema),
        mode: 'onTouched',
        reValidateMode: 'onChange',
        defaultValues: {
            email: '',
            fullName: '',
            mobileCountryCode: '',
            mobileCountryName: '',
            phoneNumber: '',
            dateOfBirth: '',
            gender: 'MALE',
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

    const handleFormSubmit: SubmitHandler<AddCardholderFormOutput> = async (formData) => {
        try {
            // Call RTK Query mutation
            await triggerAddCardholder({
                email: userEmail!,
                cardholderDetails: {
                    email: formData.email.trim(),
                    fullName: formData.fullName.trim(),
                    mobileCountryCode: formData.mobileCountryCode,
                    mobileCountryName: formData.mobileCountryName,
                    phoneNumber: formData.phoneNumber.trim(),
                    dateOfBirth: formData.dateOfBirth.toISOString(),
                    gender: formData.gender,
                },
            }).unwrap();

            toast.success('Cardholder added successfully.');
            reset();
            onClose();
        } catch (err: any) {
            ShowInConsole('Add cardholder error:', err);

            const errorMessage =
                Array.isArray(err?.data?.message)
                    ? err.data.message[0]
                    : err?.data?.message ||
                    err?.message ||
                    'Failed to add cardholder. Please try again later.';
            const normalizeMessage = errorMessage?.toLowerCase()

            if (normalizeMessage?.includes("cardholder with this email already exists")) {
                toast.error("Cardholder with this email already exists")
            }
            else {
                toast.error('Failed to add cardholder. Please try again later.');
            }
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
                            <span className="font-serif italic font-normal">cardholder</span>
                        </h3>
                        <p className="text-xs text-[var(--mute)] mt-1!">
                            Enter the details below to create a new cardholder.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="p-1.5! rounded-lg text-[var(--mute)] hover:text-[var(--ink)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
                        aria-label="Close sidebar"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form Body */}
                <form
                    id="addCardholderSidebar-form"
                    noValidate
                    onSubmit={handleSubmit(handleFormSubmit)}
                    className="p-6! flex-1 flex flex-col gap-4 overflow-y-auto"
                >
                    {/* Full Name */}
                    <CustomInputComponent
                        id="addCardholder-input-fullName"
                        label="Full Name"
                        type="text"
                        placeholder="e.g. John Doe"
                        fieldLabelClassname="text-[var(--ink-soft)] text-xs font-semibold uppercase tracking-wide"
                        inputClassname="px-4! text-[var(--ink)]"
                        error={errors?.fullName?.message}
                        {...register('fullName')}
                    />

                    {/* Email */}
                    <CustomInputComponent
                        id="addCardholder-input-email"
                        label="Email"
                        type="email"
                        placeholder="e.g. john@example.com"
                        fieldLabelClassname="text-[var(--ink-soft)] text-xs font-semibold uppercase tracking-wide"
                        inputClassname="px-4! text-[var(--ink)]"
                        error={errors?.email?.message}
                        {...register('email')}
                    />

                    {/* Mobile Country Code (Dial Code) */}
                    <Controller
                        name="mobileCountryCode"
                        control={control}
                        render={({ field }) => (
                            <div className="w-full h-fit flex flex-col justify-center items-start gap-2">
                                <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">
                                    Dial Code
                                </span>
                                <CustomSelectComponent
                                    id="addCardholder-select-dialCode"
                                    label="Select Dial Code"
                                    labels={mobileDialCodes}
                                    selectTriggerClassName="w-full px-4! text-[var(--ink)]"
                                    selectGroupClassName="w-full p-2!"
                                    value={field.value}
                                    onChange={field.onChange}
                                    error={errors?.mobileCountryCode?.message}
                                />
                            </div>
                        )}
                    />

                    {/* Mobile Country Name (Country ISO) */}
                    <Controller
                        name="mobileCountryName"
                        control={control}
                        render={({ field }) => (
                            <div className="w-full h-fit flex flex-col justify-center items-start gap-2">
                                <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">
                                    Country
                                </span>
                                <CustomSelectComponent
                                    id="addCardholder-select-countryName"
                                    label="Select Country"
                                    labels={mobileCountryCodes}
                                    selectTriggerClassName="w-full px-4! text-[var(--ink)]"
                                    selectGroupClassName="w-full p-2!"
                                    value={field.value}
                                    onChange={field.onChange}
                                    error={errors?.mobileCountryName?.message}
                                />
                            </div>
                        )}
                    />

                    {/* Phone Number */}
                    <CustomInputComponent
                        id="addCardholder-input-phoneNumber"
                        label="Phone Number"
                        type="tel"
                        placeholder="e.g. 9876543210"
                        fieldLabelClassname="text-[var(--ink-soft)] text-xs font-semibold uppercase tracking-wide"
                        inputClassname="px-4! text-[var(--ink)] font-mono"
                        error={errors?.phoneNumber?.message}
                        {...register('phoneNumber')}
                    />

                    {/* Date of Birth */}
                    <CustomInputComponent
                        id="addCardholder-input-dateOfBirth"
                        label="Date of Birth"
                        type="date"
                        placeholder="YYYY-MM-DD"
                        fieldLabelClassname="text-[var(--ink-soft)] text-xs font-semibold uppercase tracking-wide"
                        inputClassname="px-4! text-[var(--ink)]"
                        error={errors?.dateOfBirth?.message}
                        max={(() => { const d = new Date(); d.setFullYear(d.getFullYear() - 18); return d.toISOString().split('T')[0]; })()}
                        hint="* Must be at least 18 years old"
                        {...register('dateOfBirth')}
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
                                    id="addCardholder-select-gender"
                                    label="Select Gender"
                                    labels={['MALE', 'FEMALE']}
                                    selectTriggerClassName="w-full px-4! text-[var(--ink)]"
                                    selectGroupClassName="w-full p-2!"
                                    value={field.value}
                                    onChange={field.onChange}
                                    error={errors?.gender?.message}
                                />
                            </div>
                        )}
                    />
                </form>

                {/* Form Footer Action Buttons */}
                <div className="p-6! border-t border-[var(--line)] bg-[var(--bg-surface)] flex items-center justify-end gap-3">
                    <div className="w-[100px] h-[38px]">
                        <CustomButtonComponent
                            id="addCardholder-cancel-btn"
                            label="Cancel"
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={addCardholderIsLoading}
                        />
                    </div>
                    <div className="w-[170px] h-[38px]">
                        <CustomButtonComponent
                            id="addCardholder-submit-btn"
                            label={
                                <span className="flex items-center justify-center gap-1.5">
                                    <UserPlus className="w-4 h-4" /> Add cardholder
                                </span>
                            }
                            type="submit"
                            variant="navy"
                            form="addCardholderSidebar-form"
                            showButtonLoader={addCardholderIsLoading}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
