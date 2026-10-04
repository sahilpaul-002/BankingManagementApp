import { useState } from 'react';
import {
    Shield,
    TrendingUp,
    TrendingDown,
    Mail,
    Wifi,
    CheckCircle2,
    AlertCircle,
    Lock,
} from 'lucide-react';
import type { CardDetailsType } from '@/types/cards/cardDetailsTypes';
import CustomButtonComponent from '@/components/common/CustomButtonComponent';
import { useCardSensitiveDetailsMutation } from '@/redux/features/card/cardApi';
import { useDispatch } from 'react-redux';
import { setShowInfoBanner } from '@/redux/slice/utility/utilitySlice';
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
    BLOCKED: 'bg-[var(--danger-bg)] text-[var(--danger)] border-[var(--danger)]/20',
};

const CARD_STATUS_DOTS: Record<string, string> = {
    ACTIVE: 'bg-[var(--ok)]',
    INACTIVE: 'bg-[var(--danger)]',
    SUSPENDED: 'bg-[var(--warn)]',
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

export default function CardDetailsViewComponent({
    card,
    userEmail,
    cardholderId,
}: CardDetailsViewComponentPropsType) {
    const dispatch = useDispatch();
    const [mailSensitiveDetails, { isLoading: isMailingDetails }] = useCardSensitiveDetailsMutation();

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
                toast.success('Card sensitive details sent to your registered cardholder email successfully.')
            } 
            else {
                toast.error('Failed to dispatch card sensitive details. Please try again later.')
            }
        }
        catch (err: any) {
            ShowInConsole('Card sensitive details error:', err);

            const errorMessage =
                Array.isArray(err?.data?.message)
                    ? err.data.message[0]
                    : err?.data?.message ||
                    err?.message ||
                    'Failed to dispatch card sensitive details. Please try again later.';
            const normalizeMessage = errorMessage?.toLowerCase()

            if (normalizeMessage?.includes("card and card details not found")) {
                toast.error("Unable to fetch card sensitive details. Please try again later.")
            }
            else {
                toast.error("Failed to dispatch card sensitive details. Please try again later.");
            }
        }
    };

    const statusKey = card.card_status?.toUpperCase() || 'ACTIVE';

    return (
        <div className="w-full flex flex-col gap-8">
            {/* Top Grid: Interactive Card Visual Mockup & Primary Info Header */}
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

            {/* Spending Limits Section */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 text-[var(--ink)]">
                    <Shield className="w-5 h-5 text-[var(--gold)]" />
                    <h3 className="text-lg font-bold">Card Spending Limits</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Daily Limit */}
                    <div className="bg-[var(--bg-surface)] border border-[var(--line)] rounded-2xl p-5! shadow-xs flex flex-col gap-2">
                        <span className="text-xs font-semibold text-[var(--mute)] uppercase tracking-wider">
                            Daily Limit
                        </span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-xs font-medium text-[var(--mute)]">
                                {card.card_currency}
                            </span>
                            <span className="text-2xl font-bold text-[var(--ink)]">
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
                            <span className="text-2xl font-bold text-[var(--ink)]">
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
                            <span className="text-2xl font-bold text-[var(--ink)]">
                                ${formatDecimal(card.card_limits?.yearly_limit?.$numberDecimal)}
                            </span>
                        </div>
                        <span className="text-[11px] text-[var(--mute)]">Max calendar annual allowance</span>
                    </div>
                </div>
            </div>

            {/* Transactions Summary Breakdown */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 text-[var(--ink)]">
                    <TrendingUp className="w-5 h-5 text-[var(--gold)]" />
                    <h3 className="text-lg font-bold">Transactions Overview</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                                <span className="text-base font-bold text-[var(--ink)]">
                                    ${formatDecimal(card.daily_transaction?.debit?.$numberDecimal)}
                                </span>
                            </div>

                            <div className="flex flex-col gap-0.5">
                                <span className="text-[11px] text-[var(--mute)] font-medium flex items-center gap-1">
                                    <TrendingUp className="w-3 h-3 text-[var(--ok)]" /> Credit
                                </span>
                                <span className="text-base font-bold text-[var(--ink)]">
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
                                <span className="text-base font-bold text-[var(--ink)]">
                                    ${formatDecimal(card.monthly_transaction?.debit?.$numberDecimal)}
                                </span>
                            </div>

                            <div className="flex flex-col gap-0.5">
                                <span className="text-[11px] text-[var(--mute)] font-medium flex items-center gap-1">
                                    <TrendingUp className="w-3 h-3 text-[var(--ok)]" /> Credit
                                </span>
                                <span className="text-base font-bold text-[var(--ink)]">
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
                                <span className="text-base font-bold text-[var(--ink)]">
                                    ${formatDecimal(card.yearly_transaction?.debit?.$numberDecimal)}
                                </span>
                            </div>

                            <div className="flex flex-col gap-0.5">
                                <span className="text-[11px] text-[var(--mute)] font-medium flex items-center gap-1">
                                    <TrendingUp className="w-3 h-3 text-[var(--ok)]" /> Credit
                                </span>
                                <span className="text-base font-bold text-[var(--ink)]">
                                    ${formatDecimal(card.yearly_transaction?.credit?.$numberDecimal)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
