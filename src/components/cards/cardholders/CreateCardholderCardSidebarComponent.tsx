import { useEffect } from 'react';
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Plus } from 'lucide-react';
import { toast } from 'react-toastify';
import CustomInputComponent from '@/components/common/CustomInputComponent';
import CustomSelectComponent from '@/components/common/CustomSelectComponent';
import CustomButtonComponent from '@/components/common/CustomButtonComponent';
import { useCreateCardMutation } from '@/redux/features/card/cardApi';
import { useDispatch } from 'react-redux';
import { setShowInfoBanner } from '@/redux/slice/utility/utilitySlice';
import ShowInConsole from '@/utils/ShowInConsole';
import CardLimitsFieldsComponent from '@/components/cards/createCard/CardLimitsFieldsComponent';
import MerchantCategorySelectorComponent from '@/components/cards/createCard/MerchantCategorySelectorComponent';
import type { CardholderItemType } from '@/types/cards/cardholderTypes';
import type { MerchantCategoryType } from '@/types/cards/cardDetailsTypes';

// ── Zod Validation Schema ──────────────────────────────────────────────────────
const CARD_LIMIT_MIN = 10;

const CARD_LIMIT_MAX = {
    daily: 10000,
    monthly: 50000,
    yearly: 100000,
};

const validateCardLimit = (
    value: string,
    limitType: keyof typeof CARD_LIMIT_MAX
): boolean => {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
        return false;
    }

    // Must contain only a valid positive decimal number
    if (!/^\d+(\.\d{1,4})?$/.test(trimmedValue)) {
        return false;
    }

    const numericValue = Number(trimmedValue);

    if (!Number.isFinite(numericValue)) {
        return false;
    }

    // Minimum validation
    if (numericValue < CARD_LIMIT_MIN) {
        return false;
    }

    // Maximum validation
    if (numericValue > CARD_LIMIT_MAX[limitType]) {
        return false;
    }

    return true;
};

const createCardSchema = z
    .object({
        nameOnCard: z
            .string({
                error: "Name on card is required and must be a string",
            })
            .trim()
            .min(3, "Name on card must be at least 3 characters")
            .max(50, "Name on card cannot exceed 50 characters")
            .regex(
                /^[A-Za-z0-9\s.'-]+$/,
                "Name on card can only contain letters, numbers, spaces, dots (.), apostrophes ('), and hyphens (-)"
            ),

        cardType: z.enum(["VIRTUAL", "PHYSICAL"], {
            error: "Please select a valid card type",
        }),

        cardCurrency: z.literal("USD", {
            error: "Card currency must be USD",
        }),

        cardLimits: z.object({
            dailyLimit: z.string().trim().optional().default(""),
            monthlyLimit: z.string().trim().optional().default(""),
            yearlyLimit: z.string().trim().optional().default(""),
        }),

        merchantCategories: z.array(z.string()).optional().default([]),
    })
    .superRefine((data, ctx) => {
        const {
            dailyLimit,
            monthlyLimit,
            yearlyLimit,
        } = data.cardLimits;

        const hasAnyLimit = Boolean(
            dailyLimit || monthlyLimit || yearlyLimit
        );

        // Card limits are optional.
        if (!hasAnyLimit) {
            return;
        }

        // All three limits required
        if (!dailyLimit) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Daily limit is required when limits are configured",
                path: ["cardLimits", "dailyLimit"],
            });
        }

        if (!monthlyLimit) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Monthly limit is required when limits are configured",
                path: ["cardLimits", "monthlyLimit"],
            });
        }

        if (!yearlyLimit) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Yearly limit is required when limits are configured",
                path: ["cardLimits", "yearlyLimit"],
            });
        }

        // -------------------------------------------------------
        // Daily Limit
        // Minimum: 10
        // Maximum: 10,000
        // Maximum 4 decimal places
        if (dailyLimit && !validateCardLimit(dailyLimit, "daily")) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message:
                    "Daily limit must be between 10 and 10,000 with a maximum of 4 decimal places",
                path: ["cardLimits", "dailyLimit"],
            });
        }

        // -------------------------------------------------------
        // Monthly Limit
        // Minimum: 10
        // Maximum: 50,000
        // Maximum 4 decimal places
        if (monthlyLimit && !validateCardLimit(monthlyLimit, "monthly")) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message:
                    "Monthly limit must be between 10 and 50,000 with a maximum of 4 decimal places",
                path: ["cardLimits", "monthlyLimit"],
            });
        }

        // -------------------------------------------------------
        // Yearly Limit
        // Minimum: 10
        // Maximum: 100,000
        // Maximum 4 decimal places
        if (yearlyLimit && !validateCardLimit(yearlyLimit, "yearly")) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message:
                    "Yearly limit must be between 10 and 100,000 with a maximum of 4 decimal places",
                path: ["cardLimits", "yearlyLimit"],
            });
        }

        // -------------------------------------------------------
        // Daily < Monthly
        if (
            dailyLimit &&
            monthlyLimit &&
            validateCardLimit(dailyLimit, "daily") &&
            validateCardLimit(monthlyLimit, "monthly")
        ) {
            const daily = Number(dailyLimit);
            const monthly = Number(monthlyLimit);

            if (daily >= monthly) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Daily limit must be less than monthly limit",
                    path: ["cardLimits", "dailyLimit"],
                });
            }
        }

        // -------------------------------------------------------
        // Monthly < Yearly
        if (
            monthlyLimit &&
            yearlyLimit &&
            validateCardLimit(monthlyLimit, "monthly") &&
            validateCardLimit(yearlyLimit, "yearly")
        ) {
            const monthly = Number(monthlyLimit);
            const yearly = Number(yearlyLimit);

            if (monthly >= yearly) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Monthly limit must be less than yearly limit",
                    path: ["cardLimits", "monthlyLimit"],
                });
            }
        }
    });

type CreateCardFormData = z.input<typeof createCardSchema>;
type CreateCardFormOutput = z.output<typeof createCardSchema>;

// ── Props ─────────────────────────────────────────────────────────────────────
interface CreateCardholderCardSidebarComponentPropsType {
    isOpen: boolean;
    onClose: () => void;
    cardholder: CardholderItemType | null;
}

const CARD_TYPE_OPTIONS = ['VIRTUAL', 'PHYSICAL'];

export default function CreateCardholderCardSidebarComponent({
    isOpen,
    onClose,
    cardholder,
}: CreateCardholderCardSidebarComponentPropsType) {
    const dispatch = useDispatch();

    // ── RTK Query Mutation ────────────────────────────────────────────────────
    const [triggerCreateCard, { isLoading: isCreatingCard }] = useCreateCardMutation();

    // ── React Hook Form ───────────────────────────────────────────────────────
    const {
        register,
        handleSubmit,
        control,
        reset,
        formState: { errors },
    } = useForm<CreateCardFormData, any, CreateCardFormOutput>({
        resolver: zodResolver(createCardSchema),
        mode: 'onTouched',
        reValidateMode: 'onChange',
        defaultValues: {
            nameOnCard: '',
            cardType: 'VIRTUAL',
            cardCurrency: 'USD',
            cardLimits: {
                dailyLimit: '',
                monthlyLimit: '',
                yearlyLimit: '',
            },
            merchantCategories: [],
        },
    });

    // Sync form values when drawer opens or cardholder changes
    useEffect(() => {
        if (isOpen && cardholder) {
            reset({
                nameOnCard: cardholder.full_name || '',
                cardType: 'VIRTUAL',
                cardCurrency: 'USD',
                cardLimits: {
                    dailyLimit: '',
                    monthlyLimit: '',
                    yearlyLimit: '',
                },
                merchantCategories: [],
            });
        }
    }, [isOpen, cardholder, reset]);

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

    const handleFormSubmit: SubmitHandler<CreateCardFormOutput> = async (formData) => {
        const userEmail = sessionStorage.getItem('userEmail') || cardholder?.email || '';
        const targetCardholderId = cardholder?.cardholder_id;

        if (!userEmail || !targetCardholderId) {
            dispatch(
                setShowInfoBanner(
                    'Application facing issue, necessary cardholder details not present. Please re-login or try again.'
                )
            );
            toast.error('Missing cardholder ID or user email. Please try again.');
            return;
        }

        // Daily / Monthly / Yearly Limits
        const dailyLimit = formData.cardLimits.dailyLimit?.trim();
        const monthlyLimit = formData.cardLimits.monthlyLimit?.trim();
        const yearlyLimit = formData.cardLimits.yearlyLimit?.trim();
        const hasCardLimits = Boolean(
            dailyLimit || monthlyLimit || yearlyLimit
        );

        // Merchant Categories
        const merchantCategories = formData.merchantCategories ?? [];
        const hasMerchantCategories = merchantCategories.length > 0;

        try {
            await triggerCreateCard({
                email: userEmail,
                cardDetails: {
                    cardholderId: targetCardholderId,
                    nameOnCard: formData.nameOnCard.trim(),
                    cardType: formData.cardType,
                    cardCurrency: 'USD',
                    ...(hasCardLimits && {
                        cardLimits: {
                            dailyLimit: dailyLimit!,
                            monthlyLimit: monthlyLimit!,
                            yearlyLimit: yearlyLimit!,
                        },
                    }),
                    ...(hasMerchantCategories && {
                        merchantCategories: merchantCategories as MerchantCategoryType[],
                    }),
                },
            }).unwrap();

            toast.success('Card created successfully.');
            reset();
            onClose();
        } catch (err: any) {
            ShowInConsole('Create card error:', err);

            const errorMessage =
                Array.isArray(err?.data?.message)
                    ? err.data.message[0]
                    : err?.data?.message ||
                    err?.message ||
                    'Failed to create card. Please try again later.';

            const normalizeMessage = errorMessage?.toLowerCase();

            if (normalizeMessage?.includes('user usd wallet not found') || normalizeMessage?.includes('usd wallet does not exist')) {
                toast.error('USD wallet does not exist. Please create USD wallet first and try again.');
            } else if (normalizeMessage?.includes('insufficient available balance in usd wallet') || normalizeMessage?.includes('insufficient usd wallet')) {
                toast.error('Insufficient USD wallet available balance. Please add funds to USD wallet first and try again.');
            } else {
                toast.error('Failed to create card. Please try again later.');
            }
        }
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-60 flex justify-end">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-200"
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
                <div className="p-6! border-b border-[var(--line)] flex items-center justify-between bg-[var(--bg-surface)] shrink-0">
                    <div>
                        <h3 className="text-xl font-normal text-[var(--ink)] tracking-normal">
                            <span className="font-serif font-medium">Create</span>{' '}
                            <span className="font-serif italic font-normal">Card</span>
                        </h3>
                        <p className="text-xs text-[var(--mute)] mt-1!">
                            Configure card attributes and issuance options for cardholder.
                        </p>
                    </div>
                    <button
                        type="button"
                        id="createCardholderCardSidebar-close-btn"
                        onClick={handleClose}
                        className="p-1.5! rounded-lg text-[var(--mute)] hover:text-[var(--ink)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
                        aria-label="Close create card drawer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form Body */}
                <form
                    id="createCardholderCardSidebar-form"
                    noValidate
                    onSubmit={handleSubmit(handleFormSubmit)}
                    className="p-6! flex-1 flex flex-col gap-4 overflow-y-auto"
                >
                    {/* Cardholder Summary Info */}
                    {cardholder && (
                        <div className="p-4! rounded-xl bg-[var(--bg-subtle)] border border-[var(--line)] space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-[var(--mute)] uppercase tracking-wider">
                                    Cardholder
                                </span>
                                <span className="text-[10px] font-bold text-[var(--gold)] uppercase bg-[var(--bg-surface)] px-2! py-0.5! rounded border border-[var(--line)]">
                                    {cardholder.cardholder_id ?? '—'}
                                </span>
                            </div>
                            <div className="text-sm font-bold text-[var(--ink)]">
                                {cardholder.full_name}
                            </div>
                            <div className="text-xs text-[var(--mute)]">
                                {cardholder.email}
                            </div>
                        </div>
                    )}

                    {/* Name On Card */}
                    <CustomInputComponent
                        id="createCardholderCard-input-nameOnCard"
                        label="Name on Card"
                        type="text"
                        placeholder="e.g. John Doe"
                        fieldLabelClassname="text-[var(--ink-soft)] text-xs font-semibold uppercase tracking-wide"
                        inputClassname="px-4! text-[var(--ink)]"
                        error={errors?.nameOnCard?.message}
                        {...register('nameOnCard')}
                    />

                    {/* Card Type Dropdown */}
                    <Controller
                        name="cardType"
                        control={control}
                        render={({ field }) => (
                            <div className="w-full h-fit flex flex-col justify-center items-start gap-2">
                                <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">
                                    Card Type
                                </span>
                                <CustomSelectComponent
                                    id="createCardholderCard-select-cardType"
                                    label="Select Card Type"
                                    labels={CARD_TYPE_OPTIONS}
                                    selectTriggerClassName="w-full px-4! text-[var(--ink)]"
                                    selectGroupClassName="w-full p-2!"
                                    value={field.value}
                                    onChange={field.onChange}
                                    error={errors?.cardType?.message}
                                />
                            </div>
                        )}
                    />

                    {/* Card Currency (Default USD, Non-editable) */}
                    <CustomInputComponent
                        id="createCardholderCard-input-cardCurrency"
                        label="Card Currency"
                        type="text"
                        value="USD"
                        disabled
                        readOnly
                        placeholder="USD"
                        fieldLabelClassname="text-[var(--ink-soft)] text-xs font-semibold uppercase tracking-wide"
                        inputClassname="px-4! text-[var(--mute)] bg-[var(--bg-subtle)] font-mono cursor-not-allowed"
                        hint="* Card currency must be USD"
                    />

                    {/* Spending Limits Subcomponent */}
                    <CardLimitsFieldsComponent
                        register={register}
                        errors={errors}
                    />

                    {/* Merchant Categories Subcomponent */}
                    <Controller
                        name="merchantCategories"
                        control={control}
                        render={({ field }) => (
                            <MerchantCategorySelectorComponent
                                value={field.value ?? []}
                                onChange={field.onChange}
                                error={errors?.merchantCategories?.message}
                            />
                        )}
                    />
                </form>

                {/* Form Footer Action Buttons */}
                <div className="p-6! border-t border-[var(--line)] bg-[var(--bg-surface)] flex items-center justify-end gap-3 shrink-0">
                    <div className="w-[100px] h-[38px]">
                        <CustomButtonComponent
                            id="createCardholderCard-cancel-btn"
                            label="Cancel"
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={isCreatingCard}
                        />
                    </div>
                    <div className="w-[150px] h-[38px]">
                        <CustomButtonComponent
                            id="createCardholderCard-submit-btn"
                            label={
                                <span className="flex items-center justify-center gap-1.5">
                                    <Plus className="w-4 h-4" /> Create Card
                                </span>
                            }
                            type="submit"
                            variant="navy"
                            form="createCardholderCardSidebar-form"
                            showButtonLoader={isCreatingCard}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
