import { useMemo } from 'react';
import type {
    CardLimitsType,
    DailyTransactionType,
    MonthlyTransactionType,
    YearlyTransactionType,
} from '@/types/dashboard/topSpendingCardsTypes';
import type { SpendingLimitPeriodType } from './TopSpendingCardLimitToggleComponent';

interface TopSpendingCardProgressBarComponentPropsType {
    period: SpendingLimitPeriodType;
    currency: string;
    limits?: CardLimitsType | undefined;
    dailyTransaction?: DailyTransactionType | undefined;
    monthlyTransaction?: MonthlyTransactionType | undefined;
    yearlyTransaction?: YearlyTransactionType | undefined;
}

function parseDecimal(value?: string): number {
    if (!value) return 0;
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

function formatAmount(value: number): string {
    return value.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

export default function TopSpendingCardProgressBarComponent({
    period,
    currency,
    limits,
    dailyTransaction,
    monthlyTransaction,
    yearlyTransaction,
}: TopSpendingCardProgressBarComponentPropsType) {
    const { debit, limit, usagePercent } = useMemo(() => {
        let debitValue = 0;
        let limitValue = 0;

        switch (period) {
            case 'daily':
                debitValue = parseDecimal(dailyTransaction?.debit?.$numberDecimal);
                limitValue = parseDecimal(limits?.daily_limit?.$numberDecimal);
                break;
            case 'monthly':
                debitValue = parseDecimal(monthlyTransaction?.debit?.$numberDecimal);
                limitValue = parseDecimal(limits?.monthly_limit?.$numberDecimal);
                break;
            case 'yearly':
            default:
                debitValue = parseDecimal(yearlyTransaction?.debit?.$numberDecimal);
                limitValue = parseDecimal(limits?.yearly_limit?.$numberDecimal);
                break;
        }

        const percent = limitValue > 0 ? Math.min(100, Math.max(0, (debitValue / limitValue) * 100)) : 0;

        return {
            debit: debitValue,
            limit: limitValue,
            usagePercent: percent,
        };
    }, [period, limits, dailyTransaction, monthlyTransaction, yearlyTransaction]);

    return (
        <div className="w-full">
            {/* Below xl: Current Layout */}
            <div className="flex xl:hidden flex-col gap-1.5">
                {/* Progress Track and Bar */}
                <div className="w-full flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-[var(--line)] rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-[var(--gold)] to-[var(--gold-2)] rounded-full transition-all duration-300"
                            style={{ width: `${usagePercent}%` }}
                        />
                    </div>

                    <span className="text-[11px] font-mono font-medium text-[var(--ink-soft)] shrink-0">
                        {usagePercent.toFixed(1)}%
                    </span>
                </div>

                {/* Debit vs Limit Info */}
                <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[var(--mute)] capitalize">
                        {period} spend
                    </span>

                    <div className="text-[var(--ink)] font-medium">
                        <span className="text-[var(--ink-2)]">
                            {currency} {formatAmount(debit)}
                        </span>

                        <span className="text-[var(--mute)] mx-1">
                            /
                        </span>

                        <span className="text-[var(--mute)]">
                            {currency} {formatAmount(limit)}
                        </span>
                    </div>
                </div>
            </div>

            {/* LG and Above: Compact Single Row */}
            <div className="hidden xl:flex w-full items-center gap-3">
                {/* Progress Track and Bar */}
                <div className="flex-1 h-0.5 bg-[var(--line)] rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-[var(--gold)] to-[var(--gold-2)] rounded-full transition-all duration-300"
                        style={{ width: `${usagePercent}%` }}
                    />
                </div>

                {/* Percentage */}
                <span className="text-[11px] text-[var(--ink-soft)] shrink-0">
                    {usagePercent.toFixed(1)}%
                </span>

                {/* Debit vs Limit */}
                <div className="font-mono text-[11px] shrink-0 whitespace-nowrap">
                    <span className="text-[var(--ink-2)]">
                        {currency} {formatAmount(debit)}
                    </span>

                    <span className="text-[var(--mute)] mx-1">
                        /
                    </span>

                    <span className="text-[var(--mute)]">
                        {currency} {formatAmount(limit)}
                    </span>
                </div>
            </div>
        </div>
    );
}
