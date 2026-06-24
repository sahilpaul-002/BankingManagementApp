import { ArrowUpRight, ArrowDownRight, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Activity {
  id: string;
  type: string;
  date: string;
  desc: string;
  amount: number;
  currency: string;
  status: 'processing' | 'completed';
}

const activities: Activity[] = [
  { id: '1', type: 'Crypto Withdrawal', date: 'Dec 24, 2025', desc: '0x12bc...a87f', amount: -25000, currency: 'USDC', status: 'processing' },
  { id: '2', type: 'Crypto Withdrawal', date: 'Nov 26, 2025', desc: '0x9a3f...b21d', amount: -12000, currency: 'USDC', status: 'processing' },
  { id: '3', type: 'SWIFT USDC', date: 'Nov 26, 2025', desc: 'From IN', amount: 850000, currency: 'SGD', status: 'completed' },
  { id: '4', type: 'Crypto Withdrawal', date: 'Nov 4, 2025', desc: '0xb44e...d8f1', amount: -4500, currency: 'USDT', status: 'processing' },
  { id: '5', type: 'Crypto Deposit', date: 'Oct 30, 2025', desc: '0x2b75...7869', amount: 200000, currency: 'USDC', status: 'completed' },
  // { id: '6', type: 'USD → SGD', date: 'Oct 22, 2025', desc: 'Internal', amount: -99.6, currency: 'SGD', status: 'completed' },
];

export default function RecentActivitySection() {
  const navigate = useNavigate();

  return (
    <div 
      className="p-6 border mb-6"
      style={{ 
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--line)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 
          className="text-[22px] font-medium tracking-[-0.004em] m-0"
          style={{ color: 'var(--ink)', fontFamily: 'var(--display)' }}
        >
          Recent <em className="italic font-normal" style={{ color: 'var(--ink-soft)' }}>activity</em>
        </h2>
        <button
          onClick={() => navigate('/statements')}
          className="text-[13px] font-medium flex items-center gap-1 transition-colors"
          style={{ color: 'var(--ink)' }}
        >
          View statements
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-0">
        {activities.map((activity, index) => (
          <div
            key={activity.id}
            className="flex items-center justify-between py-4 cursor-pointer transition-colors hover:bg-opacity-50"
            style={{ 
              borderTop: index === 0 ? 'none' : '1px solid var(--line-faint)',
            }}
          >
            <div className="flex items-center gap-3 flex-1">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ 
                  backgroundColor: activity.amount > 0 ? 'var(--ok-bg)' : 'var(--bg-subtle)'
                }}
              >
                {activity.amount > 0 ? (
                  <ArrowDownRight className="w-5 h-5" style={{ color: 'var(--ok)' }} />
                ) : (
                  <ArrowUpRight className="w-5 h-5" style={{ color: 'var(--ink-soft)' }} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-[14px] mb-0.5" style={{ color: 'var(--ink)' }}>
                  {activity.type}
                </div>
                <div className="text-[12px]" style={{ color: 'var(--mute)' }}>
                  {activity.date} · {activity.desc}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div 
                  className="font-semibold text-[14px]"
                  style={{ color: activity.amount > 0 ? 'var(--ok)' : 'var(--ink)' }}
                >
                  {activity.amount > 0 ? '+' : ''}{activity.amount.toLocaleString('en-US')} 
                  <span className="text-[11px] font-medium ml-1" style={{ color: 'var(--mute)' }}>
                    {activity.currency}
                  </span>
                </div>
              </div>
              <span
                className="inline-flex px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider"
                style={{
                  backgroundColor: activity.status === 'completed' ? 'var(--ok-bg)' : 'var(--warn-bg)',
                  color: activity.status === 'completed' ? 'var(--ok)' : 'var(--warn)'
                }}
              >
                {activity.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
