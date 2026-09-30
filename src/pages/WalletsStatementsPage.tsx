import React, { useState, useEffect, useMemo, Activity } from 'react';
import WalletStatementsFilterComponent from '@/components/wallets/walletStatements/WalletStatementsFilterComponent';
import WalletStatementsListComponent from '@/components/wallets/walletStatements/WalletStatementsListComponent';
import WalletTransactionDetailsSidebarComponent from '@/components/wallets/walletStatements/WalletTransactionDetailsSidebarComponent';
import { useGetWalletTransactionsQuery } from '@/redux/features/wallet/walletApis';
import { setShowInfoBanner } from '@/redux/slice/utility/utilitySlice';
import { useNavigate } from 'react-router';
import { useDispatch } from 'react-redux';
import ShowInConsole from '@/utils/ShowInConsole';
import type { WalletTransactionItemType, WalletTransactionsListResponseDataType } from '@/types/wallets/walletTransactionsTypes';
import PageLoaderComponent from '@/components/common/loaders/PageLoaderComponent';
import type { PaginationState } from '@tanstack/react-table';
import type { DateRange } from '@/components/common/CustomDateRangeFilterComponent';

const DEFAULT_PAGINATION: PaginationState = {
    pageIndex: 0,
    pageSize: 7,
};

export default function WalletsStatementsPage() {
    // Configure useNavigate
    const navigate = useNavigate();

    // Configure useDispatch
    const dispatch = useDispatch();

    // ------------------------------- GET EMAIL FROM SESSION STORAGE ---------------------------------- \\
    // Get necessary user details from session storage
    const userEmail = sessionStorage.getItem('userEmail');
    const userId = sessionStorage.getItem("userId")
    const userCardholderId = sessionStorage.getItem("cardholderId")
    const userWalletId = sessionStorage.getItem('walletId');

    useEffect(() => {
        // Validate email once
        if (!userEmail || !userId || !userCardholderId || !userWalletId) {
            dispatch(setShowInfoBanner("Application facing issue, necessary user details not present in session storage. Please re-login."));
            return;
        }
    }, [userEmail, userId, userCardholderId, userWalletId]);
    // ---------------------------------- XXXXXXXXXXXXXXXXXXXXXXXXXX ---------------------------------- \\

    // Pagination State
    const [pagination, setPagination] = useState<PaginationState>(DEFAULT_PAGINATION);
    // Date Range State
    const [dateRange, setDateRange] = useState<DateRange>({ fromDate: '', toDate: '' });

    // ------------------------------ WALLET TRANSACTION RTK QUERY ------------------------------ \\
    // Wallet Transaction
    const { data: getWalletTransactionsData, isLoading: getWalletTransactionsIsLoading, isFetching: getWalletTransactionsIsFetching, isError: getWalletTransactionsIsError, error: getWalletTransactionsError, refetch: refetchWalletTransactions } = useGetWalletTransactionsQuery({
        email: userEmail!, cardholderId: userCardholderId!, walletId: userWalletId!, pageNumber: pagination.pageIndex + 1,
        pageSize: pagination.pageSize, ...(dateRange.fromDate && { from_date: dateRange.fromDate }), ...(dateRange.toDate && {
            to_date: dateRange.toDate
        })
    }, { skip: !userEmail || !userCardholderId || !userWalletId })
    const userWalletTransactions = getWalletTransactionsData?.data as WalletTransactionsListResponseDataType ?? [];
    const useWalletTransactionsList = userWalletTransactions?.transactions as WalletTransactionItemType[] ?? []
    const totalTransactionCount = userWalletTransactions?.pagination?.total_records ?? 0;
    const isWalletTransactionsNotFound =
        getWalletTransactionsIsError &&
        getWalletTransactionsError &&
        getWalletTransactionsError != null &&
        "status" in getWalletTransactionsError &&
        getWalletTransactionsError?.status === 404 &&
        typeof getWalletTransactionsError?.data === "object" &&
        getWalletTransactionsError?.data !== null &&
        "status" in getWalletTransactionsError?.data &&
        getWalletTransactionsError?.data.status === "NOT_FOUND";

    useEffect(() => {
        ShowInConsole("User Wallets Transactions", userWalletTransactions);
    }, [userWalletTransactions])
    // -------------------------------- XXXXXXXXXXXXXXXXXXXX ------------------------------ \\
    const showPageLoader = getWalletTransactionsData ? getWalletTransactionsIsLoading : getWalletTransactionsIsFetching;

    // Selected transaction for details drawer
    const [selectedTransaction, setSelectedTransaction] = useState<WalletTransactionItemType | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(false);

    // Filter states
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [selectedType, setSelectedType] = useState<string>('ALL');

    // Sort by createdAt descending and filter by type & search
    const filteredTransactions = useMemo(() => {
        const sorted = [...useWalletTransactionsList].sort(
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
    }, [useWalletTransactionsList, searchQuery, selectedType]);

    const handleSelectTransaction = (item: WalletTransactionItemType) => {
        setSelectedTransaction(item);
        setIsDetailsOpen(true);
    };

    const handleCloseDetails = () => {
        setIsDetailsOpen(false);
        setSelectedTransaction(null);
    };

    // ----------------------- Date Range Helpers ----------------------- \\
    const handleDateRangeApply = (range: DateRange) => {
        setDateRange(range);

        setPagination((previous) => ({
            ...previous,
            pageIndex: 0,
        }));
    };

    const handleDateRangeClear = () => {
        setDateRange({
            fromDate: '',
            toDate: '',
        });

        setPagination((previous) => ({
            ...previous,
            pageIndex: 0,
        }));
    };
    // --------------------------- XXXXXXXXXXXXXXXXXX --------------------------- \\

    return (
        <>
            {/* Page Loader */}
            <Activity mode={showPageLoader ? "visible" : "hidden"}>
                <PageLoaderComponent showPageLoader={showPageLoader} />
            </Activity>

            {/* Main Content */}
            <div className="walletsStatementsPage-container w-full h-fit flex flex-col justify-start items-stretch gap-6 p-4! sm:p-6!">
                {/* Header Section */}
                <div className="flex flex-col gap-3">
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
                    dateRange={dateRange}
                    onDateRangeApply={handleDateRangeApply}
                    onDateRangeClear={handleDateRangeClear}
                />

                {/* Sub-component 2: Transactions Table List */}
                <WalletStatementsListComponent
                    transactions={filteredTransactions}
                    onSelectTransaction={handleSelectTransaction}
                    walletTransactionsNotFound={isWalletTransactionsNotFound}
                    getWalletTransactionsIsFetching={getWalletTransactionsIsFetching}
                    totalCount={totalTransactionCount}
                    pagination={pagination}
                    setPagination={setPagination}
                />

                {/* Sub-component 3: Transaction Details Sidebar Drawer */}
                <WalletTransactionDetailsSidebarComponent
                    isOpen={isDetailsOpen}
                    onClose={handleCloseDetails}
                    transaction={selectedTransaction}
                />
            </div>
        </>
    );
}
