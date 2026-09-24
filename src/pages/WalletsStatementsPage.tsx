import React, { useState, useEffect, useMemo } from 'react';
import WalletStatementsFilterComponent from '@/components/wallets/walletStatements/WalletStatementsFilterComponent';
import WalletStatementsListComponent from '@/components/wallets/walletStatements/WalletStatementsListComponent';
import WalletTransactionDetailsSidebarComponent from '@/components/wallets/walletStatements/WalletTransactionDetailsSidebarComponent';
import {
    WALLET_TRANSACTIONS_LIST_FALLBACK,
    type WalletTransactionItem,
} from '@/fallbacks/wallets/walletStatements/walletStatementsFallbacks';
import { useGetWalletTransactionsQuery } from '@/redux/features/wallet/walletApis';

export default function WalletsStatementsPage() {
    // Session identifiers
    const userEmail = sessionStorage.getItem('userEmail') ?? '';
    const cardholderId = sessionStorage.getItem('cardholderId') ?? '';

    // RTK Query call for wallet transactions list
    const { data: apiResponse } = useGetWalletTransactionsQuery(
        { email: userEmail, cardholderId },
        { skip: !userEmail || !cardholderId }
    );

    // Local transactions list state with fallback
    const [transactionsList, setTransactionsList] = useState<WalletTransactionItem[]>(
        WALLET_TRANSACTIONS_LIST_FALLBACK
    );

    // Selected transaction for details drawer
    const [selectedTransaction, setSelectedTransaction] = useState<WalletTransactionItem | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(false);

    // Filter states
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [selectedType, setSelectedType] = useState<string>('ALL');

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

    // Sort by createdAt descending and filter by type & search
    const filteredTransactions = useMemo(() => {
        const sorted = [...transactionsList].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        return sorted.filter((item) => {
            // Type filter
            if (selectedType !== 'ALL') {
                if ((item.transaction_type || '').toUpperCase() !== selectedType) return false;
            }

            // Search query match
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const currencyMatch = item.wallet_details.wallet_currency.toLowerCase().includes(q);
                const typeMatch = item.transaction_type.toLowerCase().includes(q);
                const remarksMatch = item.remarks.toLowerCase().includes(q);
                const walletTypeMatch = item.wallet_details.wallet_type.toLowerCase().includes(q);
                return currencyMatch || typeMatch || remarksMatch || walletTypeMatch;
            }

            return true;
        });
    }, [transactionsList, searchQuery, selectedType]);

    const handleSelectTransaction = (item: WalletTransactionItem) => {
        setSelectedTransaction(item);
        setIsDetailsOpen(true);
    };

    const handleCloseDetails = () => {
        setIsDetailsOpen(false);
        setSelectedTransaction(null);
    };

    return (
        <div className="walletsStatementsPage-container w-full h-fit flex flex-col justify-start items-stretch gap-6 p-4! sm:p-6!">
            {/* Breadcrumb & Header Section */}
            <div className="flex flex-col gap-3">
                <p className="text-xs text-[var(--mute)] tracking-wide">
                    Wallets &gt; <span className="text-[var(--ink-soft)] font-medium">Statements</span>
                </p>

                <div className="flex items-center justify-between flex-wrap gap-4">
                    <h1 className="text-2xl sm:text-3xl text-[var(--ink)] tracking-normal">
                        <span className="font-serif font-medium">Wallet</span>{' '}
                        <span className="font-serif italic font-normal">Statements</span>
                    </h1>
                </div>
            </div>

            {/* Sub-component 1: Filter & Search Bar */}
            <WalletStatementsFilterComponent
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                selectedType={selectedType}
                onTypeChange={setSelectedType}
            />

            {/* Sub-component 2: Transactions Table List */}
            <WalletStatementsListComponent
                transactions={filteredTransactions}
                onSelectTransaction={handleSelectTransaction}
            />

            {/* Sub-component 3: Transaction Details Sidebar Drawer */}
            <WalletTransactionDetailsSidebarComponent
                isOpen={isDetailsOpen}
                onClose={handleCloseDetails}
                transaction={selectedTransaction}
            />
        </div>
    );
}
