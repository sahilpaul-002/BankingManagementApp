import { ChevronRight, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CustomButtonComponent from '../common/CustomButtonComponent';

interface Card {
  id: string;
  last4: string;
  holder: string;
  company: string;
  currency: string;
  limit: number;
  used: number;
}

interface TopCardsSectionProps {
  cards: Card[];
}

export default function TopCardsSection({ cards }: TopCardsSectionProps) {
  const navigate = useNavigate();

  return (
    <div className="cardsSection-container w-full h-full px-2! py-4! bg-[var(--bg-surface)] border border-[var(--line)] rounded-lg shadow-[var(--shadow-sm)]">
      <div className="flex items-center justify-between mb-2!">
        <h3
          className="text-xs sm:text-sm text-[var(--ink-soft)] font-semibold tracking-widest uppercase flex items-center gap-2.5">
          <span className='text-[var(--gold)]'>—</span>
          Top Cards · This Month
        </h3>
        <div className="cardsSection-allCards-button-container">
          <CustomButtonComponent id={"cardsSection-allCards-button"} label={<>All cards<ChevronRight className="w-4 h-4" /></>} type="button" variant={"link"} onClick={() => navigate('/manage-cards')} />
        </div>
      </div>

      <div className="cardsListSection-container space-y-3">
        {cards.slice(0, 3).map((card) => {
          const usagePercent = (card.used / card.limit) * 100;
          return (
            <div
              key={card.id}
              className="bg-[var(--bg-subtle)] flex items-center gap-4 px-2! rounded-lg hover:bg-opacity-50 cursor-pointer transition-colors">
              <div
                className="w-12 h-8 bg-[var(--nav-bg)] rounded flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-[var(--ink)] font-mono text-xs sm:text-sm font-semibold">
                    •••• {card.last4}
                  </span>
                  <span className="text-xs sm:text-xs text-[var(--mute)] truncate">
                    {card.holder}
                  </span>
                </div>
                <div className="text-xs sm:text-xs text-[var(--mute)] mb-2">
                  {card.company}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-[var(--line)] rounded-full overflow-hidden">
                    <div className={`h-full bg-[var(--gold)] rounded-full transition-all`}
                      style={{ width: `${usagePercent}%` }} />
                  </div>
                    <span className="text-xs text-[var(--ink)] font-medium">
                    {card.currency} {card.used.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
