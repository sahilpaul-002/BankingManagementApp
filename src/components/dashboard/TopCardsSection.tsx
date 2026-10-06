import { useState, Activity } from 'react';
import { ChevronRight, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CustomButtonComponent from '../common/CustomButtonComponent';
import type { TopSpendingCardItemType } from '@/types/dashboard/topSpendingCardsTypes';
import TopSpendingCardsListComponent from './topSpendingCards/TopSpendingCardsListComponent';
import TopSpendingCardLimitToggleComponent, {
  type SpendingLimitPeriodType,
} from './topSpendingCards/TopSpendingCardLimitToggleComponent';

interface TopCardsSectionPropsType {
  cardsList: TopSpendingCardItemType[] | [];
  cardsListNotFound?: boolean | undefined;
}

export default function TopCardsSection({
  cardsList,
  cardsListNotFound = false,
}: TopCardsSectionPropsType) {
  const navigate = useNavigate();

  // Limit period toggle state: default to 'yearly'
  const [period, setPeriod] = useState<SpendingLimitPeriodType>('yearly');

  // Data availability check
  const hasCards =
    !cardsListNotFound &&
    Array.isArray(cardsList) &&
    cardsList.length > 0;

  const handleSelectCard = (cardId: string) => {
    navigate(`/cards/manageCards/${cardId}`);
  };

  return (
    <>
      {/* Top Cards Not Found / Empty State */}
      <Activity mode={!hasCards ? 'visible' : 'hidden'}>
        <div className="cardsSection-container w-full h-full px-4! py-4! bg-[var(--bg-surface)] border border-[var(--line)] rounded-lg shadow-[var(--shadow-sm)] flex flex-col justify-between">
          {/* Header */}
          <div className="flex items-center justify-between mb-4!">
            <h3 className="text-xs sm:text-sm text-[var(--ink-soft)] font-semibold tracking-widest uppercase flex items-center gap-2.5">
              <span className="text-[var(--gold)]">—</span>
              Top Spending Cards
            </h3>
            <div className="cardsSection-allCards-button-container">
              <CustomButtonComponent
                id="cardsSection-allCards-button-empty"
                label={
                  <>
                    All cards
                    <ChevronRight className="w-4 h-4" />
                  </>
                }
                type="button"
                variant="link"
                onClick={() => navigate('/cards/manageCards')}
              />
            </div>
          </div>

          {/* Empty State */}
          <div className="flex flex-col items-center justify-center gap-3 flex-1 py-8!">
            <CreditCard
              className="w-7 h-7 text-[var(--ink-soft)]"
              strokeWidth={1.5}
            />
            <div className="flex flex-col items-center text-center gap-1">
              <p className="text-sm font-semibold text-[var(--ink)]">
                No top spending cards found
              </p>
              <p className="text-xs text-[var(--ink-soft)] max-w-[220px] leading-relaxed">
                Your top spending cards will appear here once cards are active.
              </p>
            </div>
          </div>
        </div>
      </Activity>

      {/* Top Cards Found State */}
      <Activity mode={hasCards ? 'visible' : 'hidden'}>
        <div className="cardsSection-container w-full h-full px-2! py-4! bg-[var(--bg-surface)] border border-[var(--line)] rounded-lg shadow-[var(--shadow-sm)] flex flex-col">
          {/* Header with Title, Period Toggle, and All Cards Button */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4!">
            <h3 className="text-xs sm:text-sm text-[var(--ink-soft)] font-semibold tracking-widest uppercase flex items-center gap-2.5">
              <span className="text-[var(--gold)]">—</span>
              Top Spending Cards
            </h3>

            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              {/* Toggle Button for Daily, Monthly, Yearly */}
              <TopSpendingCardLimitToggleComponent
                period={period}
                onChange={setPeriod}
              />
            </div>
          </div>

          {/* Cards List */}
          <div className="cardsListSection-container flex-1">
            <TopSpendingCardsListComponent
              cards={cardsList}
              period={period}
              onSelectCard={handleSelectCard}
            />
          </div>
        </div>
      </Activity>
    </>
  );
}
