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

interface WalletBalanceSectionProps {
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
}: WalletBalanceSectionProps) {
  const navigate = useNavigate();

  return (
    <div className="walletBalanceSection-container w-full h-full px-2! py-4! bg-[var(--bg-surface)] border border-[var(--line)] rounded-lg shadow-[var(--shadow-sm)]">
      {/* Treasury Total Section */}
      <div className="totalWalletBalanceHeader-container w-full h-fit flex flex-col sm:flex-row items-start justify-between mb-4!">
        <div className='flex flex-col justify-center items-start'>
          <div className="text-xs sm:text-sm text-[var(--ink-soft)] font-semibold tracking-widest uppercase flex items-center gap-2.5 mb-4!" >
            <span className='text-[var(--gold)]'>—</span>
            Total treasury · USD equivalent
          </div>
          <div className="text-[var(--ink)] text-2xl sm:text-4xl font-medium">
            ${totalUSD.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            <span className="text-xl sm:text-2xl font-semibold uppercase ml-3!">
              USD
            </span>
          </div>
        </div>

        <div className="text-xs sm:text-sm text-[var(--ink-soft)]">
          <span >
            refreshed {lastRefreshed}
          </span>
        </div>
      </div>

      {/* FIAT/CRYPTO Breakdown - Horizontal Layout */}
      <div className="individualWEalletBalance-grid-container grid grid-cols-2 gap-8">
        {/* FIAT Section */}
        <div className='fiatSection-container flex flex-col justify-center items-start gap-1'>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#2a6fdb]"/>
            <span className="text-sm text-[var(--ink-soft)] font-semibold uppercase tracking-wider">
              FIAT
            </span>
          </div>
          <div className="font-medium text-[var(--ink)] mb-3!">
            $370,431
            <span className="text-xs font-semibold uppercase ml-2!">
              USD
            </span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-[12px]">
              <div className="w-1 h-1 rounded-full bg-[#10a37f]" />
              <span className='text-[var(--ink-2)]'>248,915 USD</span>
            </div>
            <div className="flex items-center gap-2 text-[12px]">
              <div className="w-1 h-1 rounded-full bg-[#10a37f]" />
              <span className='text[var(--ink-2)]'>95,876 GBP</span>
            </div>
            <div className="flex items-center gap-2 text-[12px]">
              <div className="w-1 h-1 rounded-full bg-[#10a37f]" />
              <span className='text[var(--ink-2)]'>95,876 EUR</span>
            </div>
          </div>
        </div>

        {/* CRYPTO Section */}
        <div className="cryptoSection-container flex flex-col justify-center items-start gap-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#f59e0b]"/>
            <span className="text-sm text-[var(--ink-soft)] font-semibold uppercase tracking-wider">
              CRYPTO
            </span>
          </div>
          <div className="font-medium text-[var(--ink)] mb-3!">
            $11,024,215
            <span className="text-xs font-semibold uppercase ml-2!">
              USDT
            </span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-[12px]">
              <div className="w-1 h-1 rounded-full bg-[#3b82f6]"/>
              <span className='text[var(--ink-2)]'>9,568,215 USDC</span>
            </div>
            <div className="flex items-center gap-2 text-[12px]">
              <div className="w-1 h-1 rounded-full bg-[#3b82f6]" />
              <span className='text[var(--ink-2)]'>1,456,000 USDT</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
