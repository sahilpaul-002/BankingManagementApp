import type { AllWalletBalancesResponseDataType, WalletBalanceItemType } from '@/types/dashboard/allWalletsBalancesSectionTypes';
import { Activity, useMemo } from 'react';
import { Wallet } from 'lucide-react';

interface WalletBalanceSectionPropsType {
  walletsBalances: AllWalletBalancesResponseDataType | [];
  walletsBalancesNotFound?: boolean | undefined;
}

export default function WalletBalanceSection({ walletsBalances, walletsBalancesNotFound = false }: WalletBalanceSectionPropsType) {
  // Check wallets balances not found
  const hasWalletBalances = !walletsBalancesNotFound && !Array.isArray(walletsBalances) && walletsBalances.wallets_details.length > 0;

  // Get fiat wallets
  const fiatWallets = useMemo<WalletBalanceItemType[]>(() => {
    if (!hasWalletBalances || Array.isArray(walletsBalances)) {
      return [];
    }

    return walletsBalances.wallets_details.filter(
      (wallet) => wallet.wallet_type === 'FIAT'
    );
  }, [walletsBalances, hasWalletBalances]);

  // Get crypto wallets
  const cryptoWallets = useMemo<WalletBalanceItemType[]>(() => {
    if (!hasWalletBalances || Array.isArray(walletsBalances)) {
      return [];
    }

    return walletsBalances.wallets_details.filter(
      (wallet) => wallet.wallet_type === 'CRYPTO'
    );
  }, [walletsBalances, hasWalletBalances]);

  // Total USD equivalent wallet balance
  const totalUSD = hasWalletBalances && !Array.isArray(walletsBalances)
    ? walletsBalances.total_usd_equivalent
    : '0';

  // ----------------------- Helpers ----------------------- \\
  const walletGridClass = fiatWallets.length > 0 && cryptoWallets.length > 0
    ? 'grid-cols-2'
    : 'grid-cols-1';

  const formatBalance = (balance: string) => {
    const numericBalance = Number(balance);

    if (!Number.isFinite(numericBalance)) {
      return balance;
    }

    return numericBalance.toLocaleString('en-US', {
      maximumFractionDigits: 2,
    });
  };
  // ------------------------- XXXXXXXXXXXXXX ------------------------- \\

  return (
    <>
      {/* Wallets Balances Not Found */}
      <Activity mode={!hasWalletBalances ? "visible" : "hidden"}>
        <div className="walletBalanceSection-container w-full h-full px-4! py-6! bg-[var(--bg-surface)] border border-[var(--line)] rounded-lg shadow-[var(--shadow-sm)] flex flex-col justify-center items-center text-center gap-3">

          {/* Section label */}
          <div className="text-xs sm:text-sm text-[var(--ink-soft)] font-semibold tracking-widest uppercase flex items-center gap-2 self-start">
            <span className="text-[var(--gold)]">—</span>
            Treasury balance
          </div>

          {/* Icon */}
          <Wallet className="w-7 h-7 text-[var(--ink-soft)] mt-2!" strokeWidth={1.5} />

          {/* Headline */}
          <div className="flex flex-col items-center gap-1">
            <p className="text-sm font-semibold text-[var(--ink)]">
              No wallet balances found
            </p>
            <p className="text-xs text-[var(--ink-soft)] max-w-[200px] leading-relaxed">
              Your treasury data will appear here once wallets are active.
            </p>
          </div>
        </div>
      </Activity>

      {/* Walllets Balances Found */}
      <Activity mode={hasWalletBalances ? "visible" : "hidden"}>
        <div className="walletBalanceSection-container w-full h-full px-2! py-4! bg-[var(--bg-surface)] border border-[var(--line)] rounded-lg shadow-[var(--shadow-sm)]">

          {/* Treasury Total Section */}
          <div className="totalWalletBalanceHeader-container w-full h-fit flex flex-col sm:flex-row items-start justify-between mb-8!">
            <div className="flex flex-col justify-center items-start">

              <div className="text-xs sm:text-sm text-[var(--ink-soft)] font-semibold tracking-widest uppercase flex items-center gap-2.5 mb-4!">
                <span className="text-[var(--gold)]">—</span>
                Total treasury · USD equivalent
              </div>

              <div className="text-[var(--ink)] text-2xl sm:text-4xl font-medium">
                ${formatBalance(totalUSD)}

                <span className="text-xl sm:text-2xl font-semibold uppercase ml-3!">
                  USD
                </span>
              </div>

            </div>
          </div>

          {/* FIAT / CRYPTO Breakdown */}
          <div className={`individualWalletBalance-grid-container grid items-center gap-8 md:gap-20 ${fiatWallets.length > 0 && cryptoWallets.length > 0
              ? 'grid-cols-1 sm:grid-cols-[max-content_2px_max-content]'
              : 'grid-cols-1'
              }`}
          >
            {/* FIAT Section */}
            {fiatWallets.length > 0 && (
              <div className="fiatSection-container w-fit flex flex-col justify-center items-start gap-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[var(--nav-active)]" />

                  <span className="text-sm text-[var(--ink-soft)] font-semibold uppercase tracking-wider">
                    FIAT
                  </span>
                </div>

                <div className="flex items-center gap-3 flex-wrap mt-2!">
                  {fiatWallets.map((wallet) => (
                    <div
                      key={wallet._id}
                      className="flex items-center gap-2 text-[12px]"
                    >
                      <div className="w-1 h-1 rounded-full bg-[var(--nav-active)]" />

                      <span className="text-[var(--ink-2)] font-semibold">
                        {formatBalance(wallet.account_balance)}{' '}
                        {wallet.wallet_currency}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Separator */}
            {fiatWallets.length > 0 && cryptoWallets.length > 0 && (
              <div className="separator-container w-full h-[2px] sm:w-[2px] sm:h-[30px] bg-[var(--mute)] rounded-[100%]" />
            )}

            {/* CRYPTO Section */}
            {cryptoWallets.length > 0 && (
              <div className="cryptoSection-container w-fit flex flex-col justify-center items-start gap-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[var(--gold)]" />

                  <span className="text-sm text-[var(--ink-soft)] font-semibold uppercase tracking-wider">
                    CRYPTO
                  </span>
                </div>

                <div className="flex items-center gap-3 flex-wrap mt-2!">
                  {cryptoWallets.map((wallet) => (
                    <div
                      key={wallet._id}
                      className="flex items-center gap-2 text-[12px]"
                    >
                      <div className="w-1 h-1 rounded-full bg-[var(--gold)]" />

                      <span className="text-[var(--ink-2)] font-semibold">
                        {formatBalance(wallet.account_balance)}{' '}
                        {wallet.wallet_currency}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Activity>
    </>
  );
}