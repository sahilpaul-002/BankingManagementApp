import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Send } from 'lucide-react';
import CustomButtonComponent from '@/components/common/CustomButtonComponent';
import PayoutTransactionsFilterComponent from '@/components/payables/payouts/PayoutTransactionsFilterComponent';
import PayoutTransactionsListComponent from '@/components/payables/payouts/PayoutTransactionsListComponent';
import PayoutTransactionDetailsSidebarComponent from '@/components/payables/payouts/PayoutTransactionDetailsSidebarComponent';
import {
    PAYOUT_TRANSACTIONS_LIST_FALLBACK,
    type PayoutTransactionItem,
} from '@/fallbacks/payables/payouts/payoutsFallbacks';
import { useGetPayoutTransactionsQuery } from '@/redux/features/payables/payablesApi';

export default function PayoutTransactionsPage() {
    const navigate = useNavigate();

    // RTK Query call for get payout transactions list
    const { data: apiResponse } = useGetPayoutTransactionsQuery();

    // Local transactions list state with fallback
    const [transactionsList, setTransactionsList] = useState<PayoutTransactionItem[]>(
        PAYOUT_TRANSACTIONS_LIST_FALLBACK
    );

    // Selected transaction for details drawer
    const [selectedTransaction, setSelectedTransaction] = useState<PayoutTransactionItem | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(false);

    // Filter states
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

    // Sync API data into state when available
    useEffect(() => {
        if (
            apiResponse &&
            apiResponse.data &&
            apiResponse.data.transactions &&
            Array.isArray(apiResponse.data.transactions) &&
            apiResponse.data.transactions.length > 0
        ) {
            setTransactionsList(apiResponse.data.transactions);
        }
    }, [apiResponse]);

    // Filter transactions based on query & status filter
    const filteredTransactions = useMemo(() => {
        return transactionsList.filter((item) => {
            // Status match
            if (selectedStatus !== 'ALL') {
                const itemStatus = (item.status || '').toUpperCase();
                if (itemStatus !== selectedStatus) return false;
            }

            // Search query match
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const quoteMatch = item.quote_id.toLowerCase().includes(q);
                const sourceMatch = item.source_currency.toLowerCase().includes(q);
                const destMatch = item.destination_currency.toLowerCase().includes(q);
                const remarksMatch = item.remarks.toLowerCase().includes(q);
                const providerMatch = item.provider_reference.toLowerCase().includes(q);
                return quoteMatch || sourceMatch || destMatch || remarksMatch || providerMatch;
            }

            return true;
        });
    }, [transactionsList, searchQuery, selectedStatus]);

    const handleSelectTransaction = (item: PayoutTransactionItem) => {
        setSelectedTransaction(item);
        setIsDetailsOpen(true);
    };

    const handleCloseDetails = () => {
        setIsDetailsOpen(false);
        setSelectedTransaction(null);
    };

    const handleNewPayout = () => {
        navigate('/payables/payout');
    };

    return (
        <div className="payoutTransactionsPage-container w-full h-fit flex flex-col justify-start items-stretch gap-6 p-4! sm:p-6!">
            {/* Breadcrumb & Header Section */}
            <div className="flex flex-col gap-3">
                <p className="text-xs text-[var(--mute)] tracking-wide">
                    Payables &gt; <span className="text-[var(--ink-soft)] font-medium">Transactions</span>
                </p>

                <div className="flex items-center justify-between flex-wrap gap-4">
                    <h1 className="text-2xl sm:text-3xl text-[var(--ink)] tracking-normal">
                        <span className="font-serif font-medium">Payout</span>{' '}
                        <span className="font-serif italic font-normal">Transactions</span>
                    </h1>

                    <div className="w-[160px] h-[38px]">
                        <CustomButtonComponent
                            id="payoutTransactionsPage-newPayout-btn"
                            label={
                                <span className="flex items-center justify-center gap-1.5">
                                    <Send className="w-4 h-4" /> Send payout
                                </span>
                            }
                            type="button"
                            variant="navy"
                            onClick={handleNewPayout}
                        />
                    </div>
                </div>
            </div>

            {/* Sub-component 1: Filter & Search Bar */}
            <PayoutTransactionsFilterComponent
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                selectedStatus={selectedStatus}
                onStatusChange={setSelectedStatus}
            />

            {/* Sub-component 2: Transactions Table List */}
            <PayoutTransactionsListComponent
                transactions={filteredTransactions}
                onSelectTransaction={handleSelectTransaction}
            />

            {/* Sub-component 3: Transaction Details Sidebar Drawer */}
            <PayoutTransactionDetailsSidebarComponent
                isOpen={isDetailsOpen}
                onClose={handleCloseDetails}
                transaction={selectedTransaction}
            />
        </div>
    );
}
