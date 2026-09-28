import React from 'react';
import { Search } from 'lucide-react';
import DepositWalletsTabsComponent from '@/components/wallets/depositWallets/DepositWalletsTabsComponent';
import CustomDateRangeFilterComponent, { type DateRange, } from '@/components/common/CustomDateRangeFilterComponent';

type WalletTransactionTypeTab = 'ALL' | 'LOAD' | 'WITHDRAW' | 'RELEASE';

const TYPE_TABS: { id: WalletTransactionTypeTab; label: string }[] = [
    { id: 'ALL', label: 'All Types' },
    { id: 'LOAD', label: 'Load' },
    { id: 'WITHDRAW', label: 'Withdraw' },
    { id: 'RELEASE', label: 'Release' },
];

interface WalletStatementsFilterComponentPropsType {
    searchQuery: string;
    onSearchChange: (value: string) => void;
    selectedType: string;
    onTypeChange: (type: string) => void;
    dateRange: DateRange;
    onDateRangeApply: (range: DateRange) => void;
    onDateRangeClear: () => void;
}

export default function WalletStatementsFilterComponent({searchQuery, onSearchChange, selectedType, onTypeChange, dateRange, onDateRangeApply,  onDateRangeClear}: WalletStatementsFilterComponentPropsType) {
    return (
        <div className="w-full flex flex-col gap-4">
            {/* Type Tabs */}
            <DepositWalletsTabsComponent<WalletTransactionTypeTab>
                tabs={TYPE_TABS}
                activeTab={selectedType as WalletTransactionTypeTab}
                onTabChange={onTypeChange}
                idPrefix="walletStatements"
            />

            {/* Search + Date Filter */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                {/* Search Input */}
                <div className="relative w-full">
                    <div className="absolute inset-y-0 left-0 pl-3.5! flex items-center pointer-events-none text-[var(--mute)]">
                        <Search className="w-4 h-4" />
                    </div>

                    <input
                        id="walletStatements-search-input"
                        type="text"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Search by currency, type, or remarks..."
                        className="w-full pl-10! pr-4! py-2.5! bg-[var(--bg-surface)] border border-[var(--line)] rounded-xl text-sm text-[var(--ink)] placeholder:text-[var(--mute)] focus:outline-hidden focus:border-[var(--line-strong)] focus:ring-1 focus:ring-[var(--line-strong)] transition-all"
                    />
                </div>

                {/* Date Range Filter */}
                <CustomDateRangeFilterComponent
                    value={dateRange}
                    onApply={onDateRangeApply}
                    onClear={onDateRangeClear}
                />
            </div>
        </div>
    );
}
