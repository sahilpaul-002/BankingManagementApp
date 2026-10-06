export type SpendingLimitPeriodType = 'daily' | 'monthly' | 'yearly';

interface TopSpendingCardLimitToggleComponentPropsType {
    period: SpendingLimitPeriodType;
    onChange: (period: SpendingLimitPeriodType) => void;
}

const PERIOD_OPTIONS: { label: string; value: SpendingLimitPeriodType }[] = [
    { label: 'Daily', value: 'daily' },
    { label: 'Monthly', value: 'monthly' },
    { label: 'Yearly', value: 'yearly' },
];

export default function TopSpendingCardLimitToggleComponent({
    period,
    onChange,
}: TopSpendingCardLimitToggleComponentPropsType) {
    return (
        <div className="topSpendingCard-toggle-container inline-flex items-center p-0.5! bg-[var(--bg-subtle)] border border-[var(--line)] rounded-lg">
            {PERIOD_OPTIONS.map((option) => {
                const isActive = period === option.value;
                return (
                    <button
                        key={option.value}
                        type="button"
                        onClick={() => onChange(option.value)}
                        className={`px-2.5! py-1! text-xs font-medium rounded-md transition-all duration-200 cursor-pointer ${
                            isActive
                                ? 'bg-[var(--nav-bg)] text-white shadow-xs'
                                : 'text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-[var(--bg-hover)]'
                        }`}
                        aria-pressed={isActive}
                    >
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
}
