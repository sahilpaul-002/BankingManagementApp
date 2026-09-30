import { useState, useMemo } from 'react';
import { Search, ChevronRight, WalletCards } from 'lucide-react';
import {
    useTable,
    tableFeatures,
    columnVisibilityFeature,
    type ColumnDef,
} from '@tanstack/react-table';
import DepositWalletsTabsComponent from './DepositWalletsTabsComponent';
import type { WalletItemType, WalletType } from '@/types/wallets/depositWalletsTypes';
import RingSpinnerLoaderComponent from '@/components/common/loaders/RingSpinnerLoaderComponent';

const depositWalletsTableFeatures = tableFeatures({
    columnVisibilityFeature,
});

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

interface DepositWalletsListComponentPropsType {
    wallets: WalletItemType[];
    onSelectWallet: (wallet: WalletItemType) => void;
    selectedWalletId?: string | null | undefined;
    walletsDetailsNotFound?: boolean | undefined;
    getWalletsDetailsIsFetching: boolean;
}

export default function DepositWalletsListComponent({
    wallets,
    onSelectWallet,
    selectedWalletId,
    walletsDetailsNotFound,
    getWalletsDetailsIsFetching,
}: DepositWalletsListComponentPropsType) {
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
        return isNaN(num) ? val : num.toFixed(2);
    };

    const columns = useMemo<ColumnDef<typeof depositWalletsTableFeatures, WalletItemType>[]>(
        () => [
            {
                id: 'currency',
                header: 'Currency',
                accessorKey: 'wallet_currency',
                cell: ({ row }) => (
                    <div className="flex items-center gap-3">
                        <span className="font-semibold text-[var(--ink)] uppercase tracking-wide">
                            {row.original.wallet_currency}
                        </span>
                    </div>
                ),
            },
            {
                id: 'type',
                header: 'Type',
                accessorKey: 'wallet_type',
                cell: ({ row }) => (
                    <span
                        className={`inline-flex items-center px-2.5! py-0.5! rounded-full text-[11px] font-semibold tracking-wide ${WALLET_TYPE_STYLES[row.original.wallet_type] ?? ''}`}
                    >
                        {row.original.wallet_type}
                    </span>
                ),
            },
            {
                id: 'status',
                header: 'Status',
                accessorKey: 'wallet_status',
                cell: ({ row }) => (
                    <span
                        className={`inline-flex items-center gap-1.5 px-2.5! py-0.5! rounded-full text-xs font-semibold ${STATUS_STYLES[row.original.wallet_status] ?? 'bg-[var(--bg-subtle)] text-[var(--mute)]'}`}
                    >
                        <span
                            className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT_STYLES[row.original.wallet_status] ?? 'bg-[var(--mute)]'}`}
                        />
                        {row.original.wallet_status}
                    </span>
                ),
            },
            {
                id: 'account_balance',
                header: 'Account Balance',
                cell: ({ row }) => formatDecimal(row.original.account_balance.$numberDecimal),
            },
            {
                id: 'available_balance',
                header: 'Available Balance',
                cell: ({ row }) => formatDecimal(row.original.available_balance.$numberDecimal),
            },
            {
                id: 'holding_amount',
                header: 'Holding Amount',
                cell: ({ row }) => formatDecimal(row.original.holding_amount.$numberDecimal),
            },
            {
                id: 'actions',
                header: () => null,
                cell: () => (
                    <div className="text-right">
                        <ChevronRight className="w-4 h-4 text-[var(--mute)] group-hover:text-[var(--ink)] transition-colors inline-block" />
                    </div>
                ),
            },
        ],
        []
    );

    const table = useTable({
        features: depositWalletsTableFeatures,
        data: filteredWallets,
        columns,
    });

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
                <div className="absolute inset-y-0 left-0 pl-3.5! flex items-center pointer-events-none text-[var(--mute)]">
                    <Search className="w-4 h-4" />
                </div>
                <input
                    id="depositWalletsList-search-input"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter by currency, type, or status..."
                    className="w-full pl-10! pr-4! py-2.5! bg-[var(--bg-surface)] border border-[var(--line)] rounded-xl text-sm text-[var(--ink)] placeholder:text-[var(--mute)] focus:outline-hidden focus:border-[var(--line-strong)] focus:ring-1 focus:ring-[var(--line-strong)] transition-all"
                />
            </div>

            {/* Table Card */}
            <div className="w-full bg-[var(--bg-surface)] border border-[var(--line)] rounded-xl shadow-xs overflow-hidden">
                <div className={getWalletsDetailsIsFetching || walletsDetailsNotFound ? '' : 'overflow-x-auto'}>
                    <table className={`w-full text-left border-collapse ${getWalletsDetailsIsFetching || walletsDetailsNotFound ? '' : 'min-w-[680px]'}`}>
                        <thead>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <tr
                                    key={headerGroup.id}
                                    className="border-b border-[var(--line)] bg-[var(--bg-subtle)] text-[11px] font-semibold text-[var(--mute)] uppercase tracking-wider"
                                >
                                    {headerGroup.headers.map((header) => (
                                        <th
                                            key={header.id}
                                            className={`py-3.5! ${header.id === 'currency'
                                                ? 'px-6!'
                                                : header.id === 'actions'
                                                    ? 'px-4! w-10'
                                                    : 'px-4!'
                                                }`}
                                        >
                                            {header.isPlaceholder ? null : (
                                                <table.FlexRender header={header} />
                                            )}
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>
                        <tbody className="divide-y divide-[var(--line)] text-sm text-[var(--ink)]">
                            {getWalletsDetailsIsFetching ? (
                                <tr>
                                    <td colSpan={columns.length} className="py-12!">
                                        <div className="w-full flex items-center justify-center py-6!">
                                            <RingSpinnerLoaderComponent
                                                visible={getWalletsDetailsIsFetching}
                                                size={30}
                                                color={getComputedStyle(document.documentElement)
                                                    .getPropertyValue('--nav-bg')
                                                    .trim()}
                                            />
                                        </div>
                                    </td>
                                </tr>
                            ) : walletsDetailsNotFound ? (
                                <tr>
                                    <td colSpan={columns.length} className="py-12!">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <WalletCards
                                                className="w-8 h-8 text-[var(--ink-soft)]"
                                                strokeWidth={1.5}
                                            />

                                            <div className="flex flex-col items-center text-center gap-1">
                                                <p className="text-sm font-semibold text-[var(--ink)]">
                                                    No wallets found
                                                </p>

                                                <p className="text-xs text-[var(--ink-soft)] max-w-[240px] leading-relaxed">
                                                    Deposit wallets will appear here once they are available.
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : table.getRowModel().rows.length > 0 ? (
                                table.getRowModel().rows.map((row) => {
                                    const wallet = row.original;
                                    const isSelected = wallet._id === selectedWalletId;
                                    return (
                                        <tr
                                            key={row.id}
                                            onClick={() => onSelectWallet(wallet as unknown as WalletItemType)}
                                            className={`transition-colors cursor-pointer group ${isSelected
                                                ? 'bg-[var(--bg-hover)] border-l-2 border-l-[var(--gold)]'
                                                : 'hover:bg-[var(--bg-hover)]'
                                                }`}
                                        >
                                            {row.getVisibleCells().map((cell) => (
                                                <td
                                                    key={cell.id}
                                                    className={`py-4! ${cell.column.id === 'currency'
                                                        ? 'px-6!'
                                                        : cell.column.id === 'account_balance' || cell.column.id === 'available_balance' || cell.column.id === 'holding_amount'
                                                            ? 'px-4! text-sm font-semibold text-[var(--ink)]'
                                                            : cell.column.id === 'actions'
                                                                ? 'px-4! text-right'
                                                                : 'px-4!'
                                                        }`}
                                                >
                                                    <table.FlexRender cell={cell} />
                                                </td>
                                            ))}
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td
                                        colSpan={columns.length}
                                        className="py-12! text-center text-[var(--mute)] text-sm"
                                    >
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
