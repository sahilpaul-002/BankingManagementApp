import React from 'react';
import { Search } from 'lucide-react';

interface PayoutTransactionsFilterComponentProps {
    searchQuery: string;
    onSearchChange: (value: string) => void;
    selectedStatus: string;
    onStatusChange: (status: string) => void;
}

export default function PayoutTransactionsFilterComponent({
    searchQuery,
    onSearchChange,
    selectedStatus,
    onStatusChange,
}: PayoutTransactionsFilterComponentProps) {
    const statusOptions = [
        { label: 'All Statuses', value: 'ALL' },
        { label: 'Processing', value: 'PROCESSING' },
        { label: 'Success', value: 'SUCCESS' },
        { label: 'Failed', value: 'FAILED' },
    ];

    return (
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Search Input Bar */}
            <div className="relative w-full sm:max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--mute)]">
                    <Search className="w-4 h-4" />
                </div>
                <input
                    id="payoutTransactions-search-input"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Search by quote ID, currency, or remarks..."
                    className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-surface)] border border-[var(--line)] rounded-xl text-sm text-[var(--ink)] placeholder:text-[var(--mute)] focus:outline-hidden focus:border-[var(--line-strong)] focus:ring-1 focus:ring-[var(--line-strong)] transition-all"
                />
            </div>

            {/* Status Filter Buttons/Pills */}
            <div className="flex items-center gap-1.5 bg-[var(--bg-surface)] border border-[var(--line)] p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
                {statusOptions.map((opt) => {
                    const isActive = selectedStatus === opt.value;
                    return (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => onStatusChange(opt.value)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                                isActive
                                    ? 'bg-[var(--bg-subtle)] text-[var(--ink)] shadow-2xs'
                                    : 'text-[var(--mute)] hover:text-[var(--ink)] hover:bg-[var(--bg-hover)]'
                            }`}
                        >
                            {opt.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
