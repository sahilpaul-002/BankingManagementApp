import { ArrowUpRight, ArrowDownRight, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CustomButtonComponent from '../common/CustomButtonComponent';

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

export default function RecentTransactionsSection() {
  const navigate = useNavigate();

  return (
    <div className="recentTransactions-container w-full h-full px-2! py-4! bg-[var(--bg-surface)] border border-[var(--line)] rounded-lg shadow-[var(--shadow-sm)]">
      <div className="recentTransactions-texts-container flex items-center justify-between mb-4!">
        <h2 className="text-xs sm:text-sm text-[var(--ink-soft)] tracking-widest font-semibold uppercase">
          Recent Transactions
        </h2>
        <div className="recentTransactions-allTransactions-button-container">
          <CustomButtonComponent id={"recentTransactions-allTransactions-button"} label={<>View statements<ChevronRight className="w-3.5 h-3.5" /></>} type="button" variant={"link"} onClick={() => navigate('/statements')} />
        </div>
      </div>

      <div className="recentTransactions-transactionList-container space-y-1!">
        {activities.map((activity, index) => (
          <div key={activity.id} className={`recentTransactions-transactionList flex items-center justify-between py-1! cursor-pointer transition-colors hover:bg-opacity-50`}>
            <div className="flex items-center gap-3 flex-1">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${activity.amount > 0 ? "bg-[var(--ok-bg)]" : "bg-[var(--bg-subtle)]"}`}>
                {activity.amount > 0 ? (
                  <ArrowDownRight className="w-5 h-5 text-[var(--ok)]"/>
                ) : (
                  <ArrowUpRight className="w-5 h-5 text-[var(--ink-soft)]"/>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-xs text-[var(--ink)] mb-0.5!">
                  {activity.type}
                </div>
                <div className="text-xs text-[var(--mute)]">
                  {activity.date} · {activity.desc}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className={`font-semibold text-sm ${activity.amount > 0 ? "text-[var(--ok)" : "text-[var(--ink)]"}`}>
                  {activity.amount > 0 ? '+' : ''}{activity.amount.toLocaleString('en-US')}
                  <span className="text-xs text-[var(--mute)] font-medium ml-1!">
                    {activity.currency}
                  </span>
                </div>
              </div>
              <span
                className={`inline-flex px-2.5 p-1! rounded-md text-xs font-semibold uppercase`}
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
