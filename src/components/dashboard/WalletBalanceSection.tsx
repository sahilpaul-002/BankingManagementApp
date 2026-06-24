import { TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Balance {
  id: string;
  label: string;
  token: string;
  network: string;
  number: string | null;
  address: string | null;
  amount: number;
  change: number;
}

interface BalanceHeroSectionProps {
  totalUSD: number;
  changePercent: number;
  lastRefreshed: string;
  balances: Balance[];
}

export default function WalletBalanceSection({
  totalUSD,
  changePercent,
  lastRefreshed,
  balances
}: BalanceHeroSectionProps) {
  const navigate = useNavigate();

  return (
    <div className="w-full h-full p-6! bg-[var(--bg-surface)] border border-[var(--line)] rounded-lg shadow shadow-[var(--shadow-sm)]">
      {/* Treasury Total Section */}
      <div className="w-full h-fit flex items-start justify-between mb-8!">
        <div className='flex flex-col justify-center items-start'>
          <div className="text-sm text-[var(--ink-soft)] font-semibold uppercase flex items-center gap-2.5 mb-1.5!" >
            <span style={{ color: 'var(--gold)' }}>—</span>
            Total treasury · USD equivalent
          </div>
          <div className="text-[var(--ink)] text-4xl font-medium">
            ${totalUSD.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            <span className="text-2xl font-semibold uppercase ml-3!">
              USD
            </span>
          </div>
        </div>

        <div className="text-sm text-[var(--ink-soft)]">
          <span >
            refreshed {lastRefreshed}
          </span>
        </div>
      </div>

      {/* FIAT/CRYPTO Breakdown - Horizontal Layout */}
      <div className="grid grid-cols-2 gap-8">
        {/* FIAT Section */}
        <div className='flex flex-col justify-center items-start gap-1'>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#2a6fdb' }} />
            <span className="text-sm text-[var(--ink-soft)] font-semibold uppercase tracking-wider">
              FIAT
            </span>
          </div>
          <div className="font-medium text-[var(--ink)] mb-3!">
            $370,431
            <span className="font-semibold uppercase ml-20!">
              USDT
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-[12px]">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#10a37f' }} />
              <span style={{ color: 'var(--ink-2)' }}>248,915 USD</span>
            </div>
            <div className="flex items-center gap-2 text-[12px]">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#dc2626' }} />
              <span style={{ color: 'var(--ink-2)' }}>95,876 GBP</span>
            </div>
          </div>
        </div>

        {/* CRYPTO Section */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#f59e0b' }} />
            <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--ink-soft)' }}>
              CRYPTO
            </span>
          </div>
          <div
            className="font-medium tracking-[-0.004em] mb-3"
            style={{
              fontFamily: 'var(--display)',
              fontSize: '28px',
              color: 'var(--ink)',
              fontVariantNumeric: 'tabular-nums'
            }}
          >
            $11,024,215
            <span
              className="font-semibold uppercase ml-1"
              style={{
                fontFamily: 'var(--sans)',
                fontSize: '0.55em',
                color: 'var(--mute)',
                letterSpacing: '0.18em',
                verticalAlign: '0.18em'
              }}
            >
              USD
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-[12px]">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#3b82f6' }} />
              <span style={{ color: 'var(--ink-2)' }}>9,568,215 USDC</span>
            </div>
            <div className="flex items-center gap-2 text-[12px]">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#10b981' }} />
              <span style={{ color: 'var(--ink-2)' }}>1,456,000 USDT</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
