import type { WalletBalanceItemType } from "@/types/dashboard/allWalletsBalancesSectionTypes";

export default function CryptoSummaryCard({ wallets }: { wallets: WalletBalanceItemType[] }) {
    const cryptoWallets = wallets.filter(
        (w) => w.wallet_currency === 'USDT' || w.wallet_currency === 'USDC'
    );

    return (
        <div className="w-full bg-[var(--bg-surface)] rounded-xl border border-[var(--line)] p-5! shadow-xs flex flex-col gap-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-soft)]">
                Crypto Wallets
            </h3>

            {cryptoWallets.length === 0 ? (
                <p className="text-xs text-[var(--mute)]">No crypto wallets found.</p>
            ) : (
                <div className="flex flex-col gap-3">
                    {cryptoWallets.map((w) => (
                        <div
                            key={w._id}
                            className="flex items-center justify-between p-3! rounded-lg bg-[var(--bg-subtle)] border border-[var(--line)]"
                        >
                            <div className="flex flex-col gap-0.5">
                                <span className="text-xs font-semibold text-[var(--ink)]">{w.wallet_currency}</span>
                                <span className="text-[11px] text-[var(--mute)]">
                                    {w.wallet_type}
                                </span>
                            </div>
                            <div className="text-right">
                                <span className="text-sm font-bold text-[var(--ink)]">
                                    {parseFloat(w.available_balance).toFixed(2)}
                                </span>
                                <span className="text-[11px] text-[var(--mute)] ml-1">{w.wallet_currency}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="pt-3 border-t border-[var(--line)]">
                <p className="text-[11px] text-[var(--mute)] leading-relaxed">
                    Supported networks: <strong className="text-[var(--ink-soft)]">Ethereum</strong> &{' '}
                    <strong className="text-[var(--ink-soft)]">Polygon</strong>
                </p>
            </div>
        </div>
    );
}