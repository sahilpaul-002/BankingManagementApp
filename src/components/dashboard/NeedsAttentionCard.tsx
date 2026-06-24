import { AlertCircle } from 'lucide-react';

interface AttentionItem {
  id: number;
  type: string;
  title: string;
  action: string;
  priority: string;
}

interface NeedsAttentionCardProps {
  items: AttentionItem[];
}

export default function NeedsAttentionCard({ items }: NeedsAttentionCardProps) {
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
          Needs Attention
        </h3>
        <span
          className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
          style={{ backgroundColor: 'var(--warn)', color: 'white' }}
        >
          {items.length}
        </span>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className={`p-4 rounded-lg ${
              item.priority === 'high'
                ? 'bg-opacity-50'
                : 'bg-opacity-50'
            }`}
            style={{
              backgroundColor: item.priority === 'high' ? 'var(--warn-bg)' : 'var(--info-bg)',
            }}
          >
            <div className="flex items-start gap-3">
              <AlertCircle
                className="w-4 h-4 mt-0.5 flex-shrink-0"
                style={{ color: item.priority === 'high' ? 'var(--warn)' : 'var(--info)' }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm mb-2" style={{ color: 'var(--ink)' }}>
                  {item.title}
                </p>
                <button
                  className="text-xs font-semibold uppercase tracking-wide hover:underline"
                  style={{ color: item.priority === 'high' ? 'var(--warn)' : 'var(--info)' }}
                >
                  {item.action} →
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
