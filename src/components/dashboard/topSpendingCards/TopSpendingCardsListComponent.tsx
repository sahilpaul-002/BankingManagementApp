import type { TopSpendingCardItemType } from '@/types/dashboard/topSpendingCardsTypes';
import TopSpendingCardItemComponent from './TopSpendingCardItemComponent';
import type { SpendingLimitPeriodType } from './TopSpendingCardLimitToggleComponent';

interface TopSpendingCardsListComponentPropsType {
    cards: TopSpendingCardItemType[];
    period: SpendingLimitPeriodType;
    onSelectCard?: ((cardId: string) => void) | undefined;
}

export default function TopSpendingCardsListComponent({
    cards,
    period,
    onSelectCard,
}: TopSpendingCardsListComponentPropsType) {
    return (
        <div className="topSpendingCardsList-container flex flex-col gap-3 xl:gap-1.5">
            {cards.map((card) => (
                <TopSpendingCardItemComponent
                    key={card._id}
                    card={card}
                    period={period}
                    onSelectCard={onSelectCard}
                />
            ))}
        </div>
    );
}
