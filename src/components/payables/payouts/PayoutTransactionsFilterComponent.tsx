import React from 'react';
import { RefreshCw, Search } from 'lucide-react';
import CustomButtonComponent from '@/components/common/CustomButtonComponent';
import DepositWalletsTabsComponent from '@/components/wallets/depositWallets/DepositWalletsTabsComponent';
import CustomDateRangeFilterComponent, { type DateRange } from '@/components/common/CustomDateRangeFilterComponent';

type PayoutStatusTab = 'ALL' | 'PROCESSING' | 'SUCCESS' | 'FAILED';

const STATUS_TABS: { id: PayoutStatusTab; label: string }[] = [
    { id: 'ALL', label: 'All Statuses' },
    { id: 'PROCESSING', label: 'Processing' },
    { id: 'SUCCESS', label: 'Success' },
    { id: 'FAILED', label: 'Failed' },
];

interface PayoutTransactionsFilterComponentPropsType {
    searchQuery: string;
    onSearchChange: (value: string) => void;
    selectedStatus: string;
    onStatusChange: (status: string) => void;
    dateRange: DateRange;
    onDateRangeApply: (range: DateRange) => void;
    onDateRangeClear: () => void;
    onRefresh: () => void;
    isRefreshing: boolean;
}

export default function PayoutTransactionsFilterComponent({
    searchQuery,
    onSearchChange,
    selectedStatus,
    onStatusChange,
    dateRange,
    onDateRangeApply,
    onDateRangeClear,
    onRefresh,
    isRefreshing,
}: PayoutTransactionsFilterComponentPropsType) {
    return (
        <div className="w-full flex flex-col gap-4">
            {/* Status Tabs */}
            <DepositWalletsTabsComponent<PayoutStatusTab>
                tabs={STATUS_TABS}
                activeTab={selectedStatus as PayoutStatusTab}
                onTabChange={onStatusChange}
                idPrefix="payoutTransactions"
            />

            {/* Search + Date Filter + Refresh */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                {/* Search Input */}
                <div className="relative w-full">
                    <div className="absolute inset-y-0 left-0 pl-3.5! flex items-center pointer-events-none text-[var(--mute)]">
                        <Search className="w-4 h-4" />
                    </div>

                    <input
                        id="payoutTransactions-search-input"
                        type="text"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Search by quote ID, currency, or remarks..."
                        className="w-full pl-10! pr-4! py-2.5! bg-[var(--bg-surface)] border border-[var(--line)] rounded-xl text-sm text-[var(--ink)] placeholder:text-[var(--mute)] focus:outline-hidden focus:border-[var(--line-strong)] focus:ring-1 focus:ring-[var(--line-strong)] transition-all"
                    />
                </div>

                <div className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-3 shrink-0">
                    {/* Date Range Filter */}
                    <CustomDateRangeFilterComponent
                        value={dateRange}
                        onApply={onDateRangeApply}
                        onClear={onDateRangeClear}
                    />

                    {/* Refresh Button */}
                    <div className="w-[42px] h-[42px] shrink-0">
                        <CustomButtonComponent
                            id="payoutTransactions-refresh-btn"
                            label={
                                <RefreshCw
                                    className={`w-4 h-4 ${
                                        isRefreshing ? 'animate-spin' : ''
                                    }`}
                                />
                            }
                            type="button"
                            variant="outline"
                            size="icon"
                            className="p-0! rounded-xl border-[var(--line)] bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] text-[var(--ink)]"
                            onClick={onRefresh}
                            disabled={isRefreshing}
                            showButtonLoader={false}
                            title="Refresh"
                            aria-label="Refresh payout transactions"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
