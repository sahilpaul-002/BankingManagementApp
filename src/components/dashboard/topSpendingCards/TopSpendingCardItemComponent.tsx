import { CreditCard } from 'lucide-react';
import type { TopSpendingCardItemType } from '@/types/dashboard/topSpendingCardsTypes';
import TopSpendingCardProgressBarComponent from './TopSpendingCardProgressBarComponent';
import type { SpendingLimitPeriodType } from './TopSpendingCardLimitToggleComponent';

interface TopSpendingCardItemComponentPropsType {
    card: TopSpendingCardItemType;
    period: SpendingLimitPeriodType;
    onSelectCard?: ((cardId: string) => void) | undefined;
}

const CARD_STATUS_STYLES: Record<string, string> = {
    ACTIVE: 'bg-[var(--ok-bg)] text-[var(--ok)]',
    BLOCKED: 'bg-[var(--danger-bg)] text-[var(--danger)]',
    FROZEN: 'bg-[var(--info-bg)] text-[var(--info)]',
    INACTIVE: 'bg-[var(--bg-subtle)] text-[var(--mute)]',
};

const CARD_TYPE_STYLES: Record<string, string> = {
    VIRTUAL: 'bg-[var(--info-bg)] text-[var(--info)]',
    PHYSICAL: 'bg-[var(--warn-bg)] text-[var(--warn)]',
};

function formatCardNumber(cardNumber: string): string {
    if (!cardNumber) return '•••• •••• •••• ••••';
    const cleaned = cardNumber.replace(/\s+/g, '');
    const firstFour = cleaned.slice(0, 4);
    return `${firstFour} •••• •••• ••••`;
}

export default function TopSpendingCardItemComponent({
    card,
    period,
    onSelectCard,
}: TopSpendingCardItemComponentPropsType) {
    const statusKey = card.card_status?.toUpperCase() || 'INACTIVE';
    const typeKey = card.card_type?.toUpperCase() || 'VIRTUAL';

    return (
        <div
            onClick={() => onSelectCard?.(card._id)}
            className="w-full bg-[var(--bg-subtle)] border border-[var(--line)] hover:border-[var(--line-strong)] rounded-xl p-2! flex flex-col gap-1.5 xl:gap-0.5 transition-all hover:shadow-xs cursor-pointer"
        >
            {/* Top Row */}
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-semibold text-[var(--ink)] tracking-wider shrink-0">
                        {formatCardNumber(card.card_number)}
                    </span>
                </div>

                <div className="flex items-center gap-2 min-w-0">
                    {/* Name on Card */}
                    <span className="text-xs text-[var(--mute)] truncate">
                        {card.name_on_card || '—'}
                    </span>

                    {/* Card Status */}
                    <span
                        className={`text-[8px] uppercase tracking-wide shrink-0 px-1! py-0.5! rounded-sm ${CARD_STATUS_STYLES[statusKey] ?? 'text-[var(--mute)]'
                            }`}
                    >
                        {card.card_status || '—'}
                    </span>
                </div>
            </div>

            {/* Bottom Row: Limit vs Debit Progress Bar */}
            <TopSpendingCardProgressBarComponent
                period={period}
                currency={card.card_currency || 'USD'}
                limits={card.card_limits}
                dailyTransaction={card.daily_transaction}
                monthlyTransaction={card.monthly_transaction}
                yearlyTransaction={card.yearly_transaction}
            />
        </div>
    );
}