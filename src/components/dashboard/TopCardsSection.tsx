import { ChevronRight, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
    <div 
      className="p-5 border"
      style={{ 
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--line)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 
          className="text-[10.5px] font-semibold tracking-[0.28em] uppercase flex items-center gap-2.5"
          style={{ color: 'var(--ink-soft)' }}
        >
          <span style={{ color: 'var(--gold)' }}>—</span>
          Top Cards · This Month
        </h3>
        <button
          onClick={() => navigate('/manage-cards')}
          className="text-sm font-medium flex items-center gap-1 hover:underline"
          style={{ color: 'var(--ink)' }}
        >
          All cards
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        {cards.slice(0, 3).map((card) => {
          const usagePercent = (card.used / card.limit) * 100;
          return (
            <div
              key={card.id}
              className="flex items-center gap-4 p-3 rounded-lg hover:bg-opacity-50 cursor-pointer transition-colors"
              style={{ backgroundColor: 'var(--bg-subtle)' }}
            >
              <div
                className="w-12 h-8 rounded flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: 'var(--nav-bg)' }}
              >
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="font-mono text-sm font-semibold" style={{ color: 'var(--ink)' }}>
                    •••• {card.last4}
                  </span>
                  <span className="text-xs truncate" style={{ color: 'var(--mute)' }}>
                    {card.holder}
                  </span>
                </div>
                <div className="text-xs mb-2" style={{ color: 'var(--mute)' }}>
                  {card.company}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--line)' }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${usagePercent}%`,
                        backgroundColor: 'var(--gold)'
                      }}
                    />
                  </div>
                  <span className="text-xs font-medium" style={{ color: 'var(--ink)' }}>
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
