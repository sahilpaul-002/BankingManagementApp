import { useState, useEffect } from 'react';
import { X, TrendingUp } from 'lucide-react';
import type { WalletItem } from '@/fallbacks/wallets/depositWallets/depositWalletsFallbacks';

type TransactionPeriod = 'daily' | 'monthly' | 'yearly';

const PERIOD_TABS: { id: TransactionPeriod; label: string }[] = [
    { id: 'daily', label: 'Daily' },
    { id: 'monthly', label: 'Monthly' },
    { id: 'yearly', label: 'Yearly' },
];

const STATUS_STYLES: Record<string, string> = {
    ACTIVE: 'bg-[var(--ok-bg)] text-[var(--ok)]',
    INACTIVE: 'bg-[var(--danger-bg)] text-[var(--danger)]',
    SUSPENDED: 'bg-[var(--warn-bg)] text-[var(--warn)]',
};

const STATUS_DOT_STYLES: Record<string, string> = {
    ACTIVE: 'bg-[var(--ok)]',
    INACTIVE: 'bg-[var(--danger)]',
    SUSPENDED: 'bg-[var(--warn)]',
};

interface WalletDetailsSidebarComponentProps {
    isOpen: boolean;
    onClose: () => void;
    wallet: WalletItem | null;
}

// ─── Helper: format decimal string ───────────────────────────────────────────
function fmt(val: string, currency = '') {
    const num = parseFloat(val);
    const formatted = isNaN(num) ? val : num.toFixed(4);
    return currency ? `${formatted} ${currency}` : formatted;
}

// ─── Detail row (read-only label + value) ────────────────────────────────────
function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <>
            <span className="text-[var(--mute)] font-medium">{label}</span>
            <div className="flex justify-end">{children}</div>
        </>
    );
}

export default function WalletDetailsSidebarComponent({
    isOpen,
    onClose,
    wallet,
}: WalletDetailsSidebarComponentProps) {
    const [activePeriod, setActivePeriod] = useState<TransactionPeriod>('daily');

    // Lock body scroll when open
    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : 'unset';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    // Reset period tab when a different wallet is selected
    useEffect(() => {
        if (isOpen) setActivePeriod('daily');
    }, [wallet?._id, isOpen]);

    if (!isOpen || !wallet) return null;

    const txData = {
        daily: wallet.daily_transaction,
        monthly: wallet.monthly_transaction,
        yearly: wallet.yearly_transaction,
    };

    const activeTx = txData[activePeriod];

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-200"
                onClick={onClose}
            />

            {/* Drawer */}
            <div className="relative z-10 w-full max-w-md h-full bg-[var(--bg-surface)] border-l border-[var(--line)] shadow-2xl flex flex-col overflow-y-auto animate-[slideInRight_0.25s_ease-out]">
                <style>{`
                    @keyframes slideInRight {
                        from { transform: translateX(100%); }
                        to   { transform: translateX(0); }
                    }
                `}</style>

                {/* Header */}
                <div className="p-6! border-b border-[var(--line)] flex items-center justify-between bg-[var(--bg-surface)] shrink-0">
                    <h3 className="text-xl font-normal text-[var(--ink)] tracking-normal">
                        <span className="font-serif font-medium">Wallet</span>{' '}
                        <span className="font-serif italic font-normal">details</span>
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-[var(--mute)] hover:text-[var(--ink)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
                        aria-label="Close wallet details"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6! flex-1 flex flex-col gap-6 overflow-y-auto">

                    {/* Top identity block */}
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-[var(--bg-subtle)] border border-[var(--line)] flex items-center justify-center font-bold text-base text-[var(--ink)] shrink-0">
                                {wallet.wallet_currency.slice(0, 2)}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-[var(--ink)] uppercase tracking-wide">
                                    {wallet.wallet_currency}
                                </h2>
                                <p className="text-xs text-[var(--mute)] mt-0.5">
                                    {wallet.wallet_type === 'FIAT' ? 'Fiat Currency Wallet' : 'Crypto Currency Wallet'}
                                </p>
                            </div>
                        </div>
                        <div className="mt-1 flex items-center">
                            <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[wallet.wallet_status] ?? 'bg-[var(--bg-subtle)] text-[var(--mute)]'}`}
                            >
                                <span
                                    className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT_STYLES[wallet.wallet_status] ?? 'bg-[var(--mute)]'}`}
                                />
                                {wallet.wallet_status}
                            </span>
                        </div>
                    </div>

                    {/* Section: WALLET INFO */}
                    <div className="flex flex-col gap-3 pt-4 border-t border-[var(--line)]">
                        <div className="text-xs font-semibold text-[var(--mute)] uppercase tracking-wider">
                            — WALLET INFO
                        </div>
                        <div className="grid grid-cols-2 gap-y-3 text-xs">
                            <DetailRow label="Wallet type">
                                <span className="font-semibold text-[var(--ink)] uppercase">
                                    {wallet.wallet_type}
                                </span>
                            </DetailRow>

                            <DetailRow label="Currency">
                                <span className="font-semibold text-[var(--ink)] uppercase">
                                    {wallet.wallet_currency}
                                </span>
                            </DetailRow>

                            <DetailRow label="Account balance">
                                <span className="font-semibold text-[var(--ink)]">
                                    {fmt(wallet.account_balance.$numberDecimal, wallet.wallet_currency)}
                                </span>
                            </DetailRow>

                            <DetailRow label="Available balance">
                                <span className="font-semibold text-[var(--ok)]">
                                    {fmt(wallet.available_balance.$numberDecimal, wallet.wallet_currency)}
                                </span>
                            </DetailRow>

                            <DetailRow label="Holding amount">
                                <span className="font-semibold text-[var(--warn)]">
                                    {fmt(wallet.holding_amount.$numberDecimal, wallet.wallet_currency)}
                                </span>
                            </DetailRow>
                        </div>
                    </div>

                    {/* Section: TRANSACTIONS */}
                    <div className="flex flex-col gap-4 pt-4 border-t border-[var(--line)]">
                        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--mute)] uppercase tracking-wider">
                            <TrendingUp className="w-3.5 h-3.5" />
                            <span>— TRANSACTIONS</span>
                        </div>

                        {/* Period toggle buttons */}
                        <div className="flex items-center gap-2 p-1 bg-[var(--bg-subtle)] rounded-xl border border-[var(--line)]">
                            {PERIOD_TABS.map((tab) => {
                                const isActive = activePeriod === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        id={`walletDetails-txPeriod-${tab.id}-btn`}
                                        type="button"
                                        onClick={() => setActivePeriod(tab.id)}
                                        className={`flex-1 py-2! px-3! text-xs font-semibold rounded-lg transition-all duration-150 cursor-pointer ${
                                            isActive
                                                ? 'bg-[var(--bg-surface)] text-[var(--ink)] shadow-xs border border-[var(--line)]'
                                                : 'text-[var(--mute)] hover:text-[var(--ink-soft)]'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Period meta info */}
                        {'date' in activeTx && (
                            <p className="text-[11px] text-[var(--mute)]">
                                Date:{' '}
                                <span className="font-medium text-[var(--ink-soft)]">
                                    {new Date(activeTx.date).toLocaleDateString('en-GB', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric',
                                    })}
                                </span>
                            </p>
                        )}
                        {'month' in activeTx && (
                            <p className="text-[11px] text-[var(--mute)]">
                                Period:{' '}
                                <span className="font-medium text-[var(--ink-soft)]">
                                    {new Date(activeTx.year, activeTx.month - 1).toLocaleDateString('en-GB', {
                                        month: 'long',
                                        year: 'numeric',
                                    })}
                                </span>
                            </p>
                        )}
                        {'year' in activeTx && !('month' in activeTx) && (
                            <p className="text-[11px] text-[var(--mute)]">
                                Year:{' '}
                                <span className="font-medium text-[var(--ink-soft)]">
                                    {activeTx.year}
                                </span>
                            </p>
                        )}

                        {/* Credit / Debit display */}
                        <div className="grid grid-cols-2 gap-3">
                            {/* Credit card */}
                            <div className="flex flex-col gap-1.5 p-4! rounded-xl bg-[var(--ok-bg)] border border-[var(--ok-bg)]">
                                <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ok)]">
                                    Credit
                                </span>
                                <span className="text-base font-bold text-[var(--ok)] leading-tight break-all">
                                    {fmt(activeTx.credit.$numberDecimal)}
                                </span>
                                <span className="text-[10px] text-[var(--ok)] opacity-75 uppercase">
                                    {wallet.wallet_currency}
                                </span>
                            </div>

                            {/* Debit card */}
                            <div className="flex flex-col gap-1.5 p-4! rounded-xl bg-[var(--danger-bg)] border border-[var(--danger-bg)]">
                                <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--danger)]">
                                    Debit
                                </span>
                                <span className="text-base font-bold text-[var(--danger)] leading-tight break-all">
                                    {fmt(activeTx.debit.$numberDecimal)}
                                </span>
                                <span className="text-[10px] text-[var(--danger)] opacity-75 uppercase">
                                    {wallet.wallet_currency}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
