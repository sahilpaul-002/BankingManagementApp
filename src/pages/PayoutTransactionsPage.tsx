import { useState, useEffect, useMemo, Activity } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send } from 'lucide-react';
import { useDispatch } from 'react-redux';
import CustomButtonComponent from '@/components/common/CustomButtonComponent';
import PayoutTransactionsFilterComponent from '@/components/payables/payouts/PayoutTransactionsFilterComponent';
import PayoutTransactionsListComponent from '@/components/payables/payouts/PayoutTransactionsListComponent';
import PayoutTransactionDetailsSidebarComponent from '@/components/payables/payouts/PayoutTransactionDetailsSidebarComponent';
import { useGetPayoutQuoteTransactionsQuery } from '@/redux/features/transfer/transferApis';
import { setShowInfoBanner } from '@/redux/slice/utility/utilitySlice';
import type { PayoutTransactionItem, PayoutTransactionsListResponseData } from '@/types/payables/payoutTypes';
import ShowInConsole from '@/utils/ShowInConsole';
import PageLoaderComponent from '@/components/common/loaders/PageLoaderComponent';
import type { PaginationState } from '@tanstack/react-table';
import type { DateRange } from '@/components/common/CustomDateRangeFilterComponent';

const DEFAULT_PAGINATION: PaginationState = {
    pageIndex: 0,
    pageSize: 7,
};

export default function PayoutTransactionsPage() {
    // Configure useNavigate
    const navigate = useNavigate();

    // Configure useDispatch
    const dispatch = useDispatch();

    // ------------------------------- GET USER DETAILS FROM SESSION STORAGE ---------------------------------- \\
    // Get necessary user details from session storage
    const userEmail = sessionStorage.getItem('userEmail');
    const userId = sessionStorage.getItem('userId');

    useEffect(() => {
        // Validate session details once
        if (!userEmail || !userId) {
            dispatch(setShowInfoBanner("Application facing issue, necessary user details not present in session storage. Please re-login."));
            return;
        }
    }, [userEmail, userId]);
    // ---------------------------------- XXXXXXXXXXXXXXXXXXXXXXXXXX ---------------------------------- \\

    // Pagination State
    const [pagination, setPagination] = useState<PaginationState>(DEFAULT_PAGINATION);
    // Date Range State
    const [dateRange, setDateRange] = useState<DateRange>({ fromDate: '', toDate: '' });

    // ------------------------------ PAYOUT TRANSACTIONS RTK QUERY ------------------------------ \\
    // Payout Transactions List
    const { data: getPayoutTransactionsData, isLoading: getPayoutTransactionsIsLoading, isFetching: getPayoutTransactionsIsFetching, isError: getPayoutTransactionsIsError, error: getPayoutTransactionsError, refetch: refetchPayoutTransactions } = useGetPayoutQuoteTransactionsQuery({
        email: userEmail!, userId: userId!, pageNumber: pagination.pageIndex + 1,
        pageSize: pagination.pageSize, ...(dateRange.fromDate && { from_date: dateRange.fromDate }), ...(dateRange.toDate && {
            to_date: dateRange.toDate
        })
    }, { skip: !userEmail || !userId });
    const payoutTransactionsResponseData = getPayoutTransactionsData?.data as PayoutTransactionsListResponseData ?? {};
    const payoutTransactionsList = payoutTransactionsResponseData?.transactions as PayoutTransactionItem[] ?? [];
    const totalTransactionCount = payoutTransactionsResponseData?.pagination?.total_records ?? 0;
    const isPayoutTransactionsNotFound =
        getPayoutTransactionsIsError &&
        getPayoutTransactionsError &&
        getPayoutTransactionsError != null &&
        "status" in getPayoutTransactionsError &&
        getPayoutTransactionsError?.status === 404 &&
        typeof getPayoutTransactionsError?.data === "object" &&
        getPayoutTransactionsError?.data !== null &&
        "status" in getPayoutTransactionsError?.data &&
        getPayoutTransactionsError?.data.status === "NOT_FOUND";

    useEffect(() => {
        ShowInConsole("Payout Transactions", payoutTransactionsResponseData);
    }, [payoutTransactionsResponseData]);
    // -------------------------------- XXXXXXXXXXXXXXXXXXXX ------------------------------ \\
    const showPageLoader = getPayoutTransactionsData ? getPayoutTransactionsIsLoading : getPayoutTransactionsIsFetching;

    // Selected transaction for details drawer
    const [selectedTransaction, setSelectedTransaction] = useState<PayoutTransactionItem | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(false);

    // Filter states
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

    // Sort by processing_started_at descending and filter by status & search
    const filteredTransactions = useMemo(() => {
        const sorted = [...payoutTransactionsList].sort(
            (a, b) => new Date(b.processing_started_at).getTime() - new Date(a.processing_started_at).getTime()
        );

        return sorted.filter((item) => {
            // Status filter
            if (selectedStatus !== 'ALL') {
                if ((item.status || '').toUpperCase() !== selectedStatus) return false;
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
    }, [payoutTransactionsList, searchQuery, selectedStatus]);

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
            <div className="payoutTransactionsPage-container w-full h-fit flex flex-col justify-start items-stretch gap-6 p-4! sm:p-6!">
                {/* Breadcrumb & Header Section */}
                <div className="flex flex-col gap-3">
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
                    dateRange={dateRange}
                    onDateRangeApply={handleDateRangeApply}
                    onDateRangeClear={handleDateRangeClear}
                />

                {/* Sub-component 2: Transactions Table List */}
                <PayoutTransactionsListComponent
                    transactions={filteredTransactions}
                    onSelectTransaction={handleSelectTransaction}
                    payoutTransactionsNotFound={isPayoutTransactionsNotFound}
                    getPayoutTransactionsIsFetching={getPayoutTransactionsIsFetching}
                    totalCount={totalTransactionCount}
                    pagination={pagination}
                    setPagination={setPagination}
                />

                {/* Sub-component 3: Transaction Details Sidebar Drawer */}
                <PayoutTransactionDetailsSidebarComponent
                    isOpen={isDetailsOpen}
                    onClose={handleCloseDetails}
                    transaction={selectedTransaction}
                />
            </div>
        </>
    );
}
