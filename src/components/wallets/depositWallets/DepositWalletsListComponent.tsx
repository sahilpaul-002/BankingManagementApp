import { useState, useMemo } from 'react';
import { Search, ChevronRight } from 'lucide-react';
import type { WalletItem, WalletType } from '@/fallbacks/wallets/depositWallets/depositWalletsFallbacks';
import PrefundAccountsTabsComponent from '@/components/user/userPrefundAccounts/PrefundAccountTabsComponent';
import DepositWalletsTabsComponent from './DepositWalletsTabsComponent';

type WalletTabId = 'all' | 'fiat' | 'crypto';

const WALLET_TABS: { id: WalletTabId; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'fiat', label: 'Fiat' },
    { id: 'crypto', label: 'Crypto' },
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

const WALLET_TYPE_STYLES: Record<WalletType, string> = {
    FIAT: 'bg-[var(--info-bg)] text-[var(--info)]',
    CRYPTO: 'bg-[var(--gold-soft)] text-[var(--gold)]',
};

interface DepositWalletsListComponentProps {
    wallets: WalletItem[];
    onSelectWallet: (wallet: WalletItem) => void;
    selectedWalletId?: string | null | undefined;
}

export default function DepositWalletsListComponent({
    wallets,
    onSelectWallet,
    selectedWalletId,
}: DepositWalletsListComponentProps) {
    const [activeTab, setActiveTab] = useState<WalletTabId>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredWallets = useMemo(() => {
        let result = wallets;

        // Tab filter
        if (activeTab === 'fiat') {
            result = result.filter((w) => w.wallet_type === 'FIAT');
        } else if (activeTab === 'crypto') {
            result = result.filter((w) => w.wallet_type === 'CRYPTO');
        }

        // Search filter
        const query = searchQuery.toLowerCase().trim();
        if (query) {
            result = result.filter(
                (w) =>
                    w.wallet_currency.toLowerCase().includes(query) ||
                    w.wallet_status.toLowerCase().includes(query) ||
                    w.wallet_type.toLowerCase().includes(query)
            );
        }

        return result;
    }, [wallets, activeTab, searchQuery]);

    const formatDecimal = (val: string) => {
        const num = parseFloat(val);
        return isNaN(num) ? val : num.toFixed(4);
    };

    return (
        <div className="w-full flex flex-col gap-5">
            {/* Tab Navigation */}
            <DepositWalletsTabsComponent
                tabs={WALLET_TABS}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                idPrefix="depositWalletsList"
            />

            {/* Search Filter */}
            <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--mute)]">
                    <Search className="w-4 h-4" />
                </div>
                <input
                    id="depositWalletsList-search-input"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter by currency, type, or status..."
                    className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-surface)] border border-[var(--line)] rounded-xl text-sm text-[var(--ink)] placeholder:text-[var(--mute)] focus:outline-hidden focus:border-[var(--line-strong)] focus:ring-1 focus:ring-[var(--line-strong)] transition-all"
                />
            </div>

            {/* Table Card */}
            <div className="w-full bg-[var(--bg-surface)] border border-[var(--line)] rounded-xl shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[680px]">
                        <thead>
                            <tr className="border-b border-[var(--line)] bg-[var(--bg-subtle)] text-[11px] font-semibold text-[var(--mute)] uppercase tracking-wider">
                                <th className="py-3.5! px-6!">Currency</th>
                                <th className="py-3.5! px-4!">Type</th>
                                <th className="py-3.5! px-4!">Status</th>
                                <th className="py-3.5! px-4!">Account Balance</th>
                                <th className="py-3.5! px-4!">Available Balance</th>
                                <th className="py-3.5! px-4!">Holding Amount</th>
                                <th className="py-3.5! px-4! w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--line)] text-sm text-[var(--ink)]">
                            {filteredWallets.length > 0 ? (
                                filteredWallets.map((wallet) => {
                                    const isSelected = wallet._id === selectedWalletId;
                                    return (
                                        <tr
                                            key={wallet._id}
                                            onClick={() => onSelectWallet(wallet)}
                                            className={`transition-colors cursor-pointer group ${
                                                isSelected
                                                    ? 'bg-[var(--bg-hover)] border-l-2 border-l-[var(--gold)]'
                                                    : 'hover:bg-[var(--bg-hover)]'
                                            }`}
                                        >
                                            {/* CURRENCY */}
                                            <td className="py-4! px-6!">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-[var(--bg-subtle)] border border-[var(--line)] flex items-center justify-center font-bold text-xs text-[var(--ink)] shrink-0">
                                                        {wallet.wallet_currency.slice(0, 2)}
                                                    </div>
                                                    <span className="font-semibold text-[var(--ink)] uppercase tracking-wide">
                                                        {wallet.wallet_currency}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* TYPE */}
                                            <td className="py-4! px-4!">
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide ${WALLET_TYPE_STYLES[wallet.wallet_type] ?? ''}`}
                                                >
                                                    {wallet.wallet_type}
                                                </span>
                                            </td>

                                            {/* STATUS */}
                                            <td className="py-4! px-4!">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 px-2.5! py-0.5! rounded-full text-xs font-semibold ${STATUS_STYLES[wallet.wallet_status] ?? 'bg-[var(--bg-subtle)] text-[var(--mute)]'}`}
                                                >
                                                    <span
                                                        className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT_STYLES[wallet.wallet_status] ?? 'bg-[var(--mute)]'}`}
                                                    />
                                                    {wallet.wallet_status}
                                                </span>
                                            </td>

                                            {/* ACCOUNT BALANCE */}
                                            <td className="py-4! px-4! text-sm font-semibold text-[var(--ink)]">
                                                {formatDecimal(wallet.account_balance.$numberDecimal)}
                                            </td>

                                            {/* AVAILABLE BALANCE */}
                                            <td className="py-4! px-4! text-sm font-semibold text-[var(--ink)]">
                                                {formatDecimal(wallet.available_balance.$numberDecimal)}
                                            </td>

                                            {/* HOLDING AMOUNT */}
                                            <td className="py-4! px-4! text-sm font-semibold text-[var(--ink)]">
                                                {formatDecimal(wallet.holding_amount.$numberDecimal)}
                                            </td>

                                            {/* CHEVRON */}
                                            <td className="py-4! px-4! text-right">
                                                <ChevronRight className="w-4 h-4 text-[var(--mute)] group-hover:text-[var(--ink)] transition-colors inline-block" />
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-[var(--mute)] text-sm">
                                        No wallets found matching your filter.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
