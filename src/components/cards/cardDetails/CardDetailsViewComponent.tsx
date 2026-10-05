import { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    Shield,
    TrendingUp,
    TrendingDown,
    Mail,
    Wifi,
    CheckCircle2,
    AlertCircle,
    Lock,
    ChevronDown,
    SlidersHorizontal,
    Snowflake,
    Ban,
    Sliders,
    RotateCcw,
    Save,
} from 'lucide-react';
import type { CardDetailsType } from '@/types/cards/cardDetailsTypes';
import CustomButtonComponent from '@/components/common/CustomButtonComponent';
import CustomInputComponent from '@/components/common/CustomInputComponent';
import {
    cardApis,
    useCardSensitiveDetailsMutation,
    useUpdateCardStatusMutation,
    useUpdateCardLimitsMutation,
} from '@/redux/features/card/cardApi';
import { useDispatch } from 'react-redux';
import ShowInConsole from '@/utils/ShowInConsole';
import { toast } from 'react-toastify';

interface CardDetailsViewComponentPropsType {
    card: CardDetailsType;
    userEmail: string;
    cardholderId: string;
}

const CARD_STATUS_STYLES: Record<string, string> = {
    ACTIVE: 'bg-[var(--ok-bg)] text-[var(--ok)] border-[var(--ok)]/20',
    INACTIVE: 'bg-[var(--danger-bg)] text-[var(--danger)] border-[var(--danger)]/20',
    SUSPENDED: 'bg-[var(--warn-bg)] text-[var(--warn)] border-[var(--warn)]/20',
    FROZEN: 'bg-[var(--warn-bg)] text-[var(--warn)] border-[var(--warn)]/20',
    BLOCKED: 'bg-[var(--danger-bg)] text-[var(--danger)] border-[var(--danger)]/20',
};

const CARD_STATUS_DOTS: Record<string, string> = {
    ACTIVE: 'bg-[var(--ok)]',
    INACTIVE: 'bg-[var(--danger)]',
    SUSPENDED: 'bg-[var(--warn)]',
    FROZEN: 'bg-[var(--warn)]',
    BLOCKED: 'bg-[var(--danger)]',
};

const formatDecimal = (val?: string) => {
    if (!val) return '0.00';
    const num = parseFloat(val);
    return isNaN(num) ? val : num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatDate = (isoDate?: string) => {
    if (!isoDate) return '—';
    try {
        return new Date(isoDate).toLocaleDateString('en-US', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return isoDate;
    }
};

const formatMonthYear = (month?: number, year?: number) => {
    if (!month || !year) return '—';
    const date = new Date(year, month - 1, 1);
    return date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
};

// ── Validation Rules for Card Limits (Matching Create Card) ────────────────────
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

const updateCardLimitsSchema = z
    .object({
        dailyLimit: z
            .string({
                error: 'Daily limit is required',
            })
            .trim()
            .min(1, 'Daily limit is required'),
        monthlyLimit: z
            .string({
                error: 'Monthly limit is required',
            })
            .trim()
            .min(1, 'Monthly limit is required'),
        yearlyLimit: z
            .string({
                error: 'Yearly limit is required',
            })
            .trim()
            .min(1, 'Yearly limit is required'),
    })
    .superRefine((data, ctx) => {
        const { dailyLimit, monthlyLimit, yearlyLimit } = data;

        // Daily Limit validation: 10 - 10,000, max 4 decimal places
        if (!validateCardLimit(dailyLimit, 'daily')) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Daily limit must be between 10 and 10,000 with a maximum of 4 decimal places',
                path: ['dailyLimit'],
            });
        }

        // Monthly Limit validation: 10 - 50,000, max 4 decimal places
        if (!validateCardLimit(monthlyLimit, 'monthly')) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Monthly limit must be between 10 and 50,000 with a maximum of 4 decimal places',
                path: ['monthlyLimit'],
            });
        }

        // Yearly Limit validation: 10 - 100,000, max 4 decimal places
        if (!validateCardLimit(yearlyLimit, 'yearly')) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Yearly limit must be between 10 and 100,000 with a maximum of 4 decimal places',
                path: ['yearlyLimit'],
            });
        }

        // Daily < Monthly
        if (
            dailyLimit &&
            monthlyLimit &&
            validateCardLimit(dailyLimit, 'daily') &&
            validateCardLimit(monthlyLimit, 'monthly')
        ) {
            const daily = Number(dailyLimit);
            const monthly = Number(monthlyLimit);

            if (daily >= monthly) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'Daily limit must be less than monthly limit',
                    path: ['dailyLimit'],
                });
            }
        }

        // Monthly < Yearly
        if (
            monthlyLimit &&
            yearlyLimit &&
            validateCardLimit(monthlyLimit, 'monthly') &&
            validateCardLimit(yearlyLimit, 'yearly')
        ) {
            const monthly = Number(monthlyLimit);
            const yearly = Number(yearlyLimit);

            if (monthly >= yearly) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'Monthly limit must be less than yearly limit',
                    path: ['monthlyLimit'],
                });
            }
        }
    });

type UpdateLimitsFormData = z.input<typeof updateCardLimitsSchema>;
type UpdateLimitsFormOutput = z.output<typeof updateCardLimitsSchema>;

export default function CardDetailsViewComponent({
    card,
    userEmail,
    cardholderId,
}: CardDetailsViewComponentPropsType) {
    const dispatch = useDispatch();

    // ── Collapsible Accordion States ──────────────────────────────────────────
    const [isActionsOpen, setIsActionsOpen] = useState(true);
    const [isSpendingLimitsOpen, setIsSpendingLimitsOpen] = useState(false);
    const [isTransactionsOpen, setIsTransactionsOpen] = useState(false);
    const [isUpdateLimitsOpen, setIsUpdateLimitsOpen] = useState(false);

    // ── RTK Query Mutations ───────────────────────────────────────────────────
    const [mailSensitiveDetails, { isLoading: isMailingDetails }] = useCardSensitiveDetailsMutation();
    const [triggerUpdateStatus, { isLoading: isUpdatingStatus }] = useUpdateCardStatusMutation();
    const [triggerUpdateLimits, { isLoading: isUpdatingLimits }] = useUpdateCardLimitsMutation();

    const [updatingTargetStatus, setUpdatingTargetStatus] = useState<string | null>(null);

    // ── Status Helpers ────────────────────────────────────────────────────────
    const rawStatus = card.card_status || 'ACTIVE';
    const statusKey = rawStatus.toUpperCase();
    const isActive = statusKey === 'ACTIVE';
    const isInactive = statusKey === 'INACTIVE';
    const isFrozen = statusKey === 'FROZEN' || statusKey === 'SUSPENDED';
    const isBlocked = statusKey === 'BLOCKED' || statusKey === 'BLOCK';

    // ── React Hook Form for Update Limits ─────────────────────────────────────
    const {
        register: registerLimits,
        handleSubmit: handleLimitsSubmit,
        reset: resetLimits,
        formState: { errors: limitsErrors },
    } = useForm<UpdateLimitsFormData, any, UpdateLimitsFormOutput>({
        resolver: zodResolver(updateCardLimitsSchema),
        mode: 'onTouched',
        reValidateMode: 'onChange',
        defaultValues: {
            dailyLimit: card.card_limits?.daily_limit?.$numberDecimal || '',
            monthlyLimit: card.card_limits?.monthly_limit?.$numberDecimal || '',
            yearlyLimit: card.card_limits?.yearly_limit?.$numberDecimal || '',
        },
    });

    // Keep form values in sync when card prop updates
    useEffect(() => {
        resetLimits({
            dailyLimit: card.card_limits?.daily_limit?.$numberDecimal || '',
            monthlyLimit: card.card_limits?.monthly_limit?.$numberDecimal || '',
            yearlyLimit: card.card_limits?.yearly_limit?.$numberDecimal || '',
        });
    }, [card.card_limits, resetLimits]);

    // ── Handlers ──────────────────────────────────────────────────────────────
    const handleSendSensitiveDetails = async () => {
        try {
            const response = await mailSensitiveDetails({
                email: userEmail,
                cardDetails: {
                    cardId: card._id,
                    cardholderId: cardholderId,
                },
            }).unwrap();

            if (response?.status === 'SUCCESS') {
                toast.success('Card sensitive details sent to your registered cardholder email successfully.');
            } else {
                toast.error('Failed to dispatch card sensitive details. Please try again later.');
            }
        } catch (err: any) {
            ShowInConsole('Card sensitive details error:', err);

            const errorMessage =
                Array.isArray(err?.data?.message)
                    ? err.data.message[0]
                    : err?.data?.message ||
                    err?.message ||
                    'Failed to dispatch card sensitive details. Please try again later.';
            const normalizeMessage = errorMessage?.toLowerCase();

            if (normalizeMessage?.includes('card and card details not found')) {
                toast.error('Unable to fetch card sensitive details. Please try again later.');
            } else {
                toast.error('Failed to dispatch card sensitive details. Please try again later.');
            }
        }
    };

    const handleUpdateCardStatus = async (targetStatus: 'ACTIVE' | 'INACTIVE' | 'FROZEN' | 'BLOCKED') => {
        if (!userEmail || !cardholderId || !card._id) {
            toast.error('Missing user or cardholder information. Please re-login.');
            return;
        }

        try {
            setUpdatingTargetStatus(targetStatus);
            const response = await triggerUpdateStatus({
                email: userEmail,
                cardDetails: {
                    cardholderId,
                    cardId: card._id,
                    cardStatus: targetStatus,
                },
            }).unwrap();

            if (response?.status === 'SUCCESS' || response?.status === 'OK' || !response?.error) {
                const actionLabel =
                    targetStatus === 'ACTIVE' && isFrozen
                        ? 'unfrozen'
                        : targetStatus.toLowerCase();
                toast.success(`Card status updated to ${actionLabel} successfully.`);
                dispatch(
                    cardApis.util.invalidateTags([
                        { type: 'Card', id: 'DETAILS' },
                        { type: 'Card', id: 'LIST' },
                    ])
                );
            } else {
                toast.error(response?.message || 'Failed to update card status.');
            }
        }
        catch (err: any) {
            ShowInConsole('Update card status error:', err);
            const errorMessage =
                Array.isArray(err?.data?.message)
                    ? err.data.message[0]
                    : err?.data?.message ||
                    err?.message ||
                    `Failed to update card status. Please try again.`;
            const normalizeMessage = errorMessage?.toLowerCase()
            if (normalizeMessage?.includes("card and card details not found")) {
                toast.error("Unable to fetch card and card details")
            }
            else {
                toast.error(`Failed to update card status. Please try again.`);
            }
        }
        finally {
            setUpdatingTargetStatus(null);
        }
    };

    const handleUpdateLimitsSubmit: SubmitHandler<UpdateLimitsFormOutput> = async (formData) => {
        if (!userEmail || !cardholderId || !card._id) {
            toast.error('Missing user or cardholder information. Please re-login.');
            return;
        }

        try {
            const response = await triggerUpdateLimits({
                email: userEmail,
                cardDetails: {
                    cardholderId,
                    cardId: card._id,
                    cardLimits: {
                        dailyLimit: formData.dailyLimit.trim(),
                        monthlyLimit: formData.monthlyLimit.trim(),
                        yearlyLimit: formData.yearlyLimit.trim(),
                    },
                },
            }).unwrap();

            if (response?.status === 'SUCCESS' || response?.status === 'OK' || !response?.error) {
                toast.success('Card spending limits updated successfully.');
                dispatch(
                    cardApis.util.invalidateTags([
                        { type: 'Card', id: 'DETAILS' },
                        { type: 'Card', id: 'LIST' },
                    ])
                );
            } else {
                toast.error(response?.message || 'Failed to update card limits.');
            }
        } catch (err: any) {
            ShowInConsole('Update card limits error:', err);
            const errorMessage =
                Array.isArray(err?.data?.message)
                    ? err.data.message[0]
                    : err?.data?.message ||
                    err?.message ||
                    'Failed to update card limits. Please try again.';

            const normalizeMessage = errorMessage?.toLowerCase()
            if (normalizeMessage?.includes("card and card details not found")) {
                toast.error("Unable to fetch card and card details")
            }
            else if (normalizeMessage?.includes("card limits can only be updated when the card is active state")) {
                toast.error("Card and card details does not exist")
            }
            else {
                toast.error('Failed to update card limits. Please try again.');
            }
        }
    };

    const handleResetLimitsToCurrent = () => {
        resetLimits({
            dailyLimit: card.card_limits?.daily_limit?.$numberDecimal || '',
            monthlyLimit: card.card_limits?.monthly_limit?.$numberDecimal || '',
            yearlyLimit: card.card_limits?.yearly_limit?.$numberDecimal || '',
        });
    };

    return (
        <div className="w-full flex flex-col gap-6">
            {/* ── Top Grid: Interactive Card Visual Mockup & Primary Info Header ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* Visual Card Display */}
                <div className="lg:col-span-5 flex flex-col justify-between p-6! sm:p-8! rounded-3xl bg-gradient-to-br from-[var(--nav-bg)] via-[#132244] to-[var(--nav-bg-2)] text-white shadow-xl relative overflow-hidden min-h-[260px] border border-[var(--line-strong)]/20">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-[var(--gold)]/20 to-transparent rounded-bl-full pointer-events-none" />
                    <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[var(--info)]/10 rounded-full blur-2xl pointer-events-none" />

                    {/* Card Top Row */}
                    <div className="flex items-center justify-between z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-7 rounded-sm bg-[var(--gold)]/80 opacity-95 shadow-md flex items-center justify-center">
                                <div className="w-6 h-4 border border-black/30 rounded-xs" />
                            </div>
                            <Wifi className="w-5 h-5 text-slate-300 rotate-90" />
                        </div>
                        <span className="text-sm font-semibold tracking-widest text-[var(--gold-2)] uppercase">
                            {card.card_currency || 'USD'}
                        </span>
                    </div>

                    {/* Card Number */}
                    <div className="my-6 z-10">
                        <span className="text-md sm:text-sm lg:text-lg tracking-[0.2em] text-slate-100 font-semibold drop-shadow-sm">
                            {card.card_number
                                ? `${card.card_number.slice(0, 4)} •••• •••• ••••`
                                : '•••• •••• •••• ••••'}
                        </span>
                    </div>

                    {/* Card Bottom Row */}
                    <div className="flex items-end justify-between z-10 text-xs sm:text-sm">
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Cardholder</span>
                            <span className="font-semibold text-slate-100 tracking-wide uppercase">
                                {card.name_on_card || 'Authorized Holder'}
                            </span>
                        </div>
                        <div className="flex flex-col items-end gap-0.5">
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Type</span>
                            <span className="font-semibold text-[var(--gold-2)] uppercase">
                                {card.card_type || '--'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Primary Overview & Sensitive Details Action Card */}
                <div className="lg:col-span-7 bg-[var(--bg-surface)] border border-[var(--line)] rounded-3xl p-6! sm:p-8! shadow-xs flex flex-col justify-between gap-6">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between flex-wrap gap-3">
                            <div>
                                <h2 className="text-xl sm:text-2xl font-bold text-[var(--ink)]">
                                    {card.name_on_card || 'Card Details'}
                                </h2>
                                <p className="text-xs text-[var(--mute)] mt-0.5">
                                    Issued on {formatDate(card.issued_date)}
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <span
                                    className={`inline-flex items-center gap-1.5 px-3! py-1! rounded-full text-xs font-semibold uppercase tracking-wider border ${CARD_STATUS_STYLES[statusKey] ?? 'bg-[var(--bg-subtle)] text-[var(--mute)]'}`}
                                >
                                    <span
                                        className={`w-2 h-2 rounded-full ${CARD_STATUS_DOTS[statusKey] ?? 'bg-[var(--mute)]'}`}
                                    />
                                    {card.card_status || 'ACTIVE'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Sensitive Details Button Action Box */}
                    <div className="p-4! rounded-2xl bg-[var(--bg-subtle)] border border-[var(--line)] flex flex-col xl:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5! rounded-xl bg-[var(--bg-surface)] border border-[var(--line)] text-[var(--ink)]">
                                <Lock className="w-5 h-5 text-[var(--gold)]" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-semibold text-[var(--ink)]">
                                    Card Sensitive Details
                                </span>
                                <span className="text-[11px] text-[var(--mute)]">
                                    Securely receive CVV, PIN, and full PAN via email
                                </span>
                            </div>
                        </div>

                        <div className="w-full sm:w-auto h-[38px] shrink-0">
                            <CustomButtonComponent
                                id="cardDetails-mailSensitiveDetails-btn"
                                type="button"
                                variant="navy"
                                showButtonLoader={isMailingDetails}
                                onClick={handleSendSensitiveDetails}
                                label={
                                    <span className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                                        <Mail className="w-4 h-4" /> Send Sensitive Details
                                    </span>
                                }
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── 1. Collapsible Card Status Actions Section ── */}
            <div className="w-full bg-[var(--bg-surface)] border border-[var(--line)] rounded-3xl p-5! sm:p-6! shadow-xs transition-all">
                <button
                    type="button"
                    onClick={() => setIsActionsOpen((prev) => !prev)}
                    className="w-full flex items-center justify-between gap-4 text-left cursor-pointer select-none group"
                    aria-expanded={isActionsOpen}
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2! rounded-xl bg-[var(--bg-subtle)] border border-[var(--line)] text-[var(--ink)] group-hover:border-[var(--line-strong)] transition-colors">
                            <SlidersHorizontal className="w-5 h-5 text-[var(--gold)]" />
                        </div>
                        <div>
                            <h3 className="text-base sm:text-lg font-bold text-[var(--ink)]">
                                Card Status & Controls
                            </h3>
                            <p className="text-xs text-[var(--mute)]">
                                Manage lifecycle actions, freeze, activate, or permanently block card
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <span
                            className={`hidden sm:inline-flex items-center gap-1.5 px-2.5! py-0.5! rounded-full text-[11px] font-semibold uppercase tracking-wider border ${CARD_STATUS_STYLES[statusKey] ?? 'bg-[var(--bg-subtle)] text-[var(--mute)]'}`}
                        >
                            <span
                                className={`w-1.5 h-1.5 rounded-full ${CARD_STATUS_DOTS[statusKey] ?? 'bg-[var(--mute)]'}`}
                            />
                            {rawStatus}
                        </span>
                        <div
                            className={`p-1.5! rounded-lg bg-[var(--bg-subtle)] text-[var(--mute)] group-hover:text-[var(--ink)] transition-transform duration-200 ${isActionsOpen ? 'rotate-180' : 'rotate-0'
                                }`}
                        >
                            <ChevronDown className="w-4 h-4" />
                        </div>
                    </div>
                </button>

                {isActionsOpen && (
                    <div className="mt-5! pt-5! border-t border-[var(--line)] flex flex-col gap-4 animate-[fadeIn_0.2s_ease-out]">
                        {/* If ACTIVE: Show Freeze & Block */}
                        {isActive && (
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4! rounded-2xl bg-[var(--bg-subtle)] border border-[var(--line)]">
                                <div className="flex flex-col">
                                    <span className="text-xs font-semibold text-[var(--ink)]">
                                        Card is currently Active
                                    </span>
                                    <span className="text-[11px] text-[var(--mute)]">
                                        You can temporarily freeze transactions or permanently block this card.
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 shrink-0 flex-wrap">
                                    <div className="w-full sm:w-[140px] h-[38px]">
                                        <CustomButtonComponent
                                            id="cardDetails-freezeCard-btn"
                                            type="button"
                                            variant="outline"
                                            onClick={() => handleUpdateCardStatus('FROZEN')}
                                            disabled={isUpdatingStatus}
                                            showButtonLoader={isUpdatingStatus && updatingTargetStatus === 'FROZEN'}
                                            label={
                                                <span className="flex items-center justify-center gap-1.5 text-amber-600">
                                                    <Snowflake className="w-4 h-4" /> Freeze Card
                                                </span>
                                            }
                                        />
                                    </div>
                                    <div className="w-full sm:w-[140px] h-[38px]">
                                        <CustomButtonComponent
                                            id="cardDetails-blockCard-btn"
                                            type="button"
                                            variant="destructive"
                                            onClick={() => handleUpdateCardStatus('BLOCKED')}
                                            disabled={isUpdatingStatus}
                                            showButtonLoader={isUpdatingStatus && updatingTargetStatus === 'BLOCKED'}
                                            label={
                                                <span className="flex items-center justify-center gap-1.5">
                                                    <Ban className="w-4 h-4" /> Block Card
                                                </span>
                                            }
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* If INACTIVE: Show Activate */}
                        {isInactive && (
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4! rounded-2xl bg-[var(--bg-subtle)] border border-[var(--line)]">
                                <div className="flex flex-col">
                                    <span className="text-xs font-semibold text-[var(--ink)]">
                                        Card is currently Inactive
                                    </span>
                                    <span className="text-[11px] text-[var(--mute)]">
                                        Activate this card to enable payments and authorization.
                                    </span>
                                </div>
                                <div className="w-full sm:w-[150px] h-[38px] shrink-0">
                                    <CustomButtonComponent
                                        id="cardDetails-activateCard-btn"
                                        type="button"
                                        variant="navy"
                                        onClick={() => handleUpdateCardStatus('ACTIVE')}
                                        disabled={isUpdatingStatus}
                                        showButtonLoader={isUpdatingStatus && updatingTargetStatus === 'ACTIVE'}
                                        label={
                                            <span className="flex items-center justify-center gap-1.5 text-emerald-400">
                                                <CheckCircle2 className="w-4 h-4" /> Activate Card
                                            </span>
                                        }
                                    />
                                </div>
                            </div>
                        )}

                        {/* If FROZEN: Show Unfreeze & Block */}
                        {isFrozen && (
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4! rounded-2xl bg-[var(--bg-subtle)] border border-[var(--line)]">
                                <div className="flex flex-col">
                                    <span className="text-xs font-semibold text-[var(--ink)]">
                                        Card is currently Frozen
                                    </span>
                                    <span className="text-[11px] text-[var(--mute)]">
                                        Unfreeze card to resume transactions, or block permanently.
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 shrink-0 flex-wrap">
                                    <div className="w-full sm:w-[150px] h-[38px]">
                                        <CustomButtonComponent
                                            id="cardDetails-unfreezeCard-btn"
                                            type="button"
                                            variant="navy"
                                            onClick={() => handleUpdateCardStatus('ACTIVE')}
                                            disabled={isUpdatingStatus}
                                            showButtonLoader={isUpdatingStatus && updatingTargetStatus === 'ACTIVE'}
                                            label={
                                                <span className="flex items-center justify-center gap-1.5 text-emerald-400">
                                                    <CheckCircle2 className="w-4 h-4" /> Unfreeze Card
                                                </span>
                                            }
                                        />
                                    </div>
                                    <div className="w-full sm:w-[140px] h-[38px]">
                                        <CustomButtonComponent
                                            id="cardDetails-blockCard-btn"
                                            type="button"
                                            variant="destructive"
                                            onClick={() => handleUpdateCardStatus('BLOCKED')}
                                            disabled={isUpdatingStatus}
                                            showButtonLoader={isUpdatingStatus && updatingTargetStatus === 'BLOCKED'}
                                            label={
                                                <span className="flex items-center justify-center gap-1.5">
                                                    <Ban className="w-4 h-4" /> Block Card
                                                </span>
                                            }
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* If BLOCKED: No actions possible */}
                        {isBlocked && (
                            <div className="flex items-start gap-3 p-4! rounded-2xl bg-[var(--danger-bg)] border border-[var(--danger)]/20 text-[var(--danger)]">
                                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-xs font-bold uppercase tracking-wider">
                                        Card is Permanently Blocked
                                    </span>
                                    <span className="text-xs leading-relaxed">
                                        This card has been blocked and cannot be unblocked, reactivated, or modified.
                                        If you require a replacement, please create a new card from Manage Cards.
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ── 2. Collapsible Spending Limits Section (Default: Collapsed) ── */}
            <div className="w-full bg-[var(--bg-surface)] border border-[var(--line)] rounded-3xl p-5! sm:p-6! shadow-xs transition-all">
                <button
                    type="button"
                    onClick={() => setIsSpendingLimitsOpen((prev) => !prev)}
                    className="w-full flex items-center justify-between gap-4 text-left cursor-pointer select-none group"
                    aria-expanded={isSpendingLimitsOpen}
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2! rounded-xl bg-[var(--bg-subtle)] border border-[var(--line)] text-[var(--ink)] group-hover:border-[var(--line-strong)] transition-colors">
                            <Shield className="w-5 h-5 text-[var(--gold)]" />
                        </div>
                        <div>
                            <h3 className="text-base sm:text-lg font-bold text-[var(--ink)]">
                                Card Spending Limits
                            </h3>
                            <p className="text-xs text-[var(--mute)]">
                                View daily, monthly, and yearly transaction allowances
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="hidden sm:inline-block text-xs font-semibold text-[var(--mute)] font-mono">
                            Daily: ${formatDecimal(card.card_limits?.daily_limit?.$numberDecimal)}
                        </span>
                        <div
                            className={`p-1.5! rounded-lg bg-[var(--bg-subtle)] text-[var(--mute)] group-hover:text-[var(--ink)] transition-transform duration-200 ${isSpendingLimitsOpen ? 'rotate-180' : 'rotate-0'
                                }`}
                        >
                            <ChevronDown className="w-4 h-4" />
                        </div>
                    </div>
                </button>

                {isSpendingLimitsOpen && (
                    <div className="mt-5! pt-5! border-t border-[var(--line)] grid grid-cols-1 md:grid-cols-3 gap-4 animate-[fadeIn_0.2s_ease-out]">
                        {/* Daily Limit */}
                        <div className="bg-[var(--bg-surface)] border border-[var(--line)] rounded-2xl p-5! shadow-xs flex flex-col gap-2">
                            <span className="text-xs font-semibold text-[var(--mute)] uppercase tracking-wider">
                                Daily Limit
                            </span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-xs font-medium text-[var(--mute)]">
                                    {card.card_currency}
                                </span>
                                <span className="text-sm sm:text-lg font-bold text-[var(--ink)]">
                                    ${formatDecimal(card.card_limits?.daily_limit?.$numberDecimal)}
                                </span>
                            </div>
                            <span className="text-[11px] text-[var(--mute)]">Max daily transaction allowance</span>
                        </div>

                        {/* Monthly Limit */}
                        <div className="bg-[var(--bg-surface)] border border-[var(--line)] rounded-2xl p-5! shadow-xs flex flex-col gap-2">
                            <span className="text-xs font-semibold text-[var(--mute)] uppercase tracking-wider">
                                Monthly Limit
                            </span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-xs font-medium text-[var(--mute)]">
                                    {card.card_currency}
                                </span>
                                <span className="text-sm sm:text-lg font-bold text-[var(--ink)]">
                                    ${formatDecimal(card.card_limits?.monthly_limit?.$numberDecimal)}
                                </span>
                            </div>
                            <span className="text-[11px] text-[var(--mute)]">Max calendar monthly allowance</span>
                        </div>

                        {/* Yearly Limit */}
                        <div className="bg-[var(--bg-surface)] border border-[var(--line)] rounded-2xl p-5! shadow-xs flex flex-col gap-2">
                            <span className="text-xs font-semibold text-[var(--mute)] uppercase tracking-wider">
                                Yearly Limit
                            </span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-xs font-medium text-[var(--mute)]">
                                    {card.card_currency}
                                </span>
                                <span className="text-sm sm:text-lg font-bold text-[var(--ink)]">
                                    ${formatDecimal(card.card_limits?.yearly_limit?.$numberDecimal)}
                                </span>
                            </div>
                            <span className="text-[11px] text-[var(--mute)]">Max calendar annual allowance</span>
                        </div>
                    </div>
                )}
            </div>

            {/* ── 3. Collapsible Transactions Summary Breakdown (Default: Collapsed) ── */}
            <div className="w-full bg-[var(--bg-surface)] border border-[var(--line)] rounded-3xl p-5! sm:p-6! shadow-xs transition-all">
                <button
                    type="button"
                    onClick={() => setIsTransactionsOpen((prev) => !prev)}
                    className="w-full flex items-center justify-between gap-4 text-left cursor-pointer select-none group"
                    aria-expanded={isTransactionsOpen}
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2! rounded-xl bg-[var(--bg-subtle)] border border-[var(--line)] text-[var(--ink)] group-hover:border-[var(--line-strong)] transition-colors">
                            <TrendingUp className="w-5 h-5 text-[var(--gold)]" />
                        </div>
                        <div>
                            <h3 className="text-base sm:text-lg font-bold text-[var(--ink)]">
                                Transactions Overview
                            </h3>
                            <p className="text-xs text-[var(--mute)]">
                                Detailed summary of daily, monthly, and annual transactions
                            </p>
                        </div>
                    </div>

                    <div className="p-1.5! rounded-lg bg-[var(--bg-subtle)] text-[var(--mute)] group-hover:text-[var(--ink)] transition-transform duration-200">
                        <div className={isTransactionsOpen ? 'rotate-180' : 'rotate-0'}>
                            <ChevronDown className="w-4 h-4" />
                        </div>
                    </div>
                </button>

                {isTransactionsOpen && (
                    <div className="mt-5! pt-5! border-t border-[var(--line)] grid grid-cols-1 md:grid-cols-3 gap-4 animate-[fadeIn_0.2s_ease-out]">
                        {/* Daily Transaction */}
                        <div className="bg-[var(--bg-surface)] border border-[var(--line)] rounded-2xl p-5! shadow-xs flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-[var(--mute)] uppercase tracking-wider">
                                    Daily Summary
                                </span>
                                <span className="text-[11px] text-[var(--mute)]">
                                    {formatDate(card.daily_transaction?.date)}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-2! border-t border-[var(--line)]">
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[11px] text-[var(--mute)] font-medium flex items-center gap-1">
                                        <TrendingDown className="w-3 h-3 text-[var(--danger)]" /> Debit
                                    </span>
                                    <span className="text-sm font-bold text-[var(--ink)]">
                                        ${formatDecimal(card.daily_transaction?.debit?.$numberDecimal)}
                                    </span>
                                </div>

                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[11px] text-[var(--mute)] font-medium flex items-center gap-1">
                                        <TrendingUp className="w-3 h-3 text-[var(--ok)]" /> Credit
                                    </span>
                                    <span className="text-sm font-bold text-[var(--ink)]">
                                        ${formatDecimal(card.daily_transaction?.credit?.$numberDecimal)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Monthly Transaction */}
                        <div className="bg-[var(--bg-surface)] border border-[var(--line)] rounded-2xl p-5! shadow-xs flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-[var(--mute)] uppercase tracking-wider">
                                    Monthly Summary
                                </span>
                                <span className="text-[11px] text-[var(--mute)] font-medium">
                                    {formatMonthYear(card.monthly_transaction?.month, card.monthly_transaction?.year)}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-2! border-t border-[var(--line)]">
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[11px] text-[var(--mute)] font-medium flex items-center gap-1">
                                        <TrendingDown className="w-3 h-3 text-[var(--danger)]" /> Debit
                                    </span>
                                    <span className="text-sm font-bold text-[var(--ink)]">
                                        ${formatDecimal(card.monthly_transaction?.debit?.$numberDecimal)}
                                    </span>
                                </div>

                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[11px] text-[var(--mute)] font-medium flex items-center gap-1">
                                        <TrendingUp className="w-3 h-3 text-[var(--ok)]" /> Credit
                                    </span>
                                    <span className="text-sm font-bold text-[var(--ink)]">
                                        ${formatDecimal(card.monthly_transaction?.credit?.$numberDecimal)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Yearly Transaction */}
                        <div className="bg-[var(--bg-surface)] border border-[var(--line)] rounded-2xl p-5! shadow-xs flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-[var(--mute)] uppercase tracking-wider">
                                    Yearly Summary
                                </span>
                                <span className="text-[11px] text-[var(--mute)] font-medium">
                                    {card.yearly_transaction?.year || '—'}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-2! border-t border-[var(--line)]">
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[11px] text-[var(--mute)] font-medium flex items-center gap-1">
                                        <TrendingDown className="w-3 h-3 text-[var(--danger)]" /> Debit
                                    </span>
                                    <span className="text-sm font-bold text-[var(--ink)]">
                                        ${formatDecimal(card.yearly_transaction?.debit?.$numberDecimal)}
                                    </span>
                                </div>

                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[11px] text-[var(--mute)] font-medium flex items-center gap-1">
                                        <TrendingUp className="w-3 h-3 text-[var(--ok)]" /> Credit
                                    </span>
                                    <span className="text-sm font-bold text-[var(--ink)]">
                                        ${formatDecimal(card.yearly_transaction?.credit?.$numberDecimal)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ── 4. Collapsible Update Card Limits Section (Default: Collapsed) ── */}
            <div className="w-full bg-[var(--bg-surface)] border border-[var(--line)] rounded-3xl p-5! sm:p-6! shadow-xs transition-all">
                <button
                    type="button"
                    onClick={() => setIsUpdateLimitsOpen((prev) => !prev)}
                    className="w-full flex items-center justify-between gap-4 text-left cursor-pointer select-none group"
                    aria-expanded={isUpdateLimitsOpen}
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2! rounded-xl bg-[var(--bg-subtle)] border border-[var(--line)] text-[var(--ink)] group-hover:border-[var(--line-strong)] transition-colors">
                            <Sliders className="w-5 h-5 text-[var(--gold)]" />
                        </div>
                        <div>
                            <h3 className="text-base sm:text-lg font-bold text-[var(--ink)]">
                                Update Card Limits
                            </h3>
                            <p className="text-xs text-[var(--mute)]">
                                Modify daily, monthly, and yearly transaction thresholds
                            </p>
                        </div>
                    </div>

                    <div className="p-1.5! rounded-lg bg-[var(--bg-subtle)] text-[var(--mute)] group-hover:text-[var(--ink)] transition-transform duration-200">
                        <div className={isUpdateLimitsOpen ? 'rotate-180' : 'rotate-0'}>
                            <ChevronDown className="w-4 h-4" />
                        </div>
                    </div>
                </button>

                {isUpdateLimitsOpen && (
                    <div className="mt-5! pt-5! border-t border-[var(--line)] animate-[fadeIn_0.2s_ease-out]">
                        {isBlocked ? (
                            <div className="flex items-start gap-3 p-4! rounded-2xl bg-[var(--danger-bg)] border border-[var(--danger)]/20 text-[var(--danger)]">
                                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                <span className="text-xs">
                                    Spending limits cannot be updated for blocked cards.
                                </span>
                            </div>
                        ) : (
                            <form
                                id="cardDetails-updateLimits-form"
                                noValidate
                                onSubmit={handleLimitsSubmit(handleUpdateLimitsSubmit)}
                                className="flex flex-col gap-5"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* Daily Limit */}
                                    <CustomInputComponent
                                        id="updateLimits-input-dailyLimit"
                                        label="Daily Limit ($ USD)"
                                        type="text"
                                        placeholder="e.g. 1000.00"
                                        fieldLabelClassname="text-[var(--ink-soft)] text-xs font-semibold uppercase tracking-wide"
                                        inputClassname="px-4! text-[var(--ink)] font-mono"
                                        error={limitsErrors?.dailyLimit?.message}
                                        hint="Min $10 — Max $10,000"
                                        {...registerLimits('dailyLimit')}
                                    />

                                    {/* Monthly Limit */}
                                    <CustomInputComponent
                                        id="updateLimits-input-monthlyLimit"
                                        label="Monthly Limit ($ USD)"
                                        type="text"
                                        placeholder="e.g. 5000.00"
                                        fieldLabelClassname="text-[var(--ink-soft)] text-xs font-semibold uppercase tracking-wide"
                                        inputClassname="px-4! text-[var(--ink)] font-mono"
                                        error={limitsErrors?.monthlyLimit?.message}
                                        hint="Min $10 — Max $50,000 (Daily < Monthly)"
                                        {...registerLimits('monthlyLimit')}
                                    />

                                    {/* Yearly Limit */}
                                    <CustomInputComponent
                                        id="updateLimits-input-yearlyLimit"
                                        label="Yearly Limit ($ USD)"
                                        type="text"
                                        placeholder="e.g. 50000.00"
                                        fieldLabelClassname="text-[var(--ink-soft)] text-xs font-semibold uppercase tracking-wide"
                                        inputClassname="px-4! text-[var(--ink)] font-mono"
                                        error={limitsErrors?.yearlyLimit?.message}
                                        hint="Min $10 — Max $100,000 (Monthly < Yearly)"
                                        {...registerLimits('yearlyLimit')}
                                    />
                                </div>

                                <div className="flex items-center justify-end gap-3 pt-2! border-t border-[var(--line)]">
                                    <div className="w-[120px] h-[38px]">
                                        <CustomButtonComponent
                                            id="updateLimits-reset-btn"
                                            type="button"
                                            variant="outline"
                                            onClick={handleResetLimitsToCurrent}
                                            disabled={isUpdatingLimits}
                                            label={
                                                <span className="flex items-center justify-center gap-1.5">
                                                    <RotateCcw className="w-3.5 h-3.5" /> Reset
                                                </span>
                                            }
                                        />
                                    </div>
                                    <div className="w-[160px] h-[38px]">
                                        <CustomButtonComponent
                                            id="updateLimits-submit-btn"
                                            type="submit"
                                            variant="navy"
                                            showButtonLoader={isUpdatingLimits}
                                            label={
                                                <span className="flex items-center justify-center gap-1.5">
                                                    <Save className="w-4 h-4" /> Save Limits
                                                </span>
                                            }
                                        />
                                    </div>
                                </div>
                            </form>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
