import { useState, useEffect } from 'react';
import { ReceiptText, RefreshCw } from 'lucide-react';
import CustomButtonComponent from '@/components/common/CustomButtonComponent';
import type { PaginationState } from '@tanstack/react-table';
import { useGetCardTransactionListQuery } from '@/redux/features/card/cardApi';
import type {
    CardTransactionItemType,
    CardTransactionsListResponseDataType,
} from '@/types/cards/cardDetailsTypes';
import CardTransactionsListComponent from './CardTransactionsListComponent';
import CardTransactionDetailsSidebarComponent from './CardTransactionDetailsSidebarComponent';
import ShowInConsole from '@/utils/ShowInConsole';

const DEFAULT_PAGINATION: PaginationState = {
    pageIndex: 0,
    pageSize: 7,
};

interface CardTransactionsSectionComponentPropsType {
    cardId: string;
    cardholderId: string;
    userEmail: string;
}

export default function CardTransactionsSectionComponent({
    cardId,
    cardholderId,
    userEmail,
}: CardTransactionsSectionComponentPropsType) {
    // Pagination State
    const [pagination, setPagination] = useState<PaginationState>(DEFAULT_PAGINATION);

    // Selected transaction for details drawer
    const [selectedTransaction, setSelectedTransaction] = useState<CardTransactionItemType | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(false);

    // ------------------------------ GET CARD TRANSACTIONS RTK QUERY ------------------------------ \\
    const {
        data: getCardTransactionsData,
        isFetching: getCardTransactionsIsFetching,
        isError: getCardTransactionsIsError,
        error: getCardTransactionsError,
        refetch: refetchCardTransactions,
    } = useGetCardTransactionListQuery(
        {
            email: userEmail,
            cardholderId: cardholderId,
            cardId: cardId,
            pageNumber: pagination.pageIndex + 1,
            pageSize: pagination.pageSize,
        },
        {
            skip: !userEmail || !cardholderId || !cardId,
        }
    );
    const cardTransactionsResponseData = (getCardTransactionsData?.data as CardTransactionsListResponseDataType) ?? {};
    const cardTransactionsList = (cardTransactionsResponseData?.transactions as CardTransactionItemType[]) ?? [];
    const totalTransactionsCount = cardTransactionsResponseData?.pagination?.total_records ?? cardTransactionsList.length ?? 0;
    const isCardTransactionsNotFound =
        getCardTransactionsIsError &&
        getCardTransactionsError &&
        getCardTransactionsError != null &&
        'status' in getCardTransactionsError &&
        getCardTransactionsError?.status === 404 &&
        typeof getCardTransactionsError?.data === 'object' &&
        getCardTransactionsError?.data !== null &&
        'status' in getCardTransactionsError?.data &&
        (getCardTransactionsError?.data as { status: string }).status === 'NOT_FOUND';

    useEffect(() => {
        ShowInConsole(`Card - ${cardId} Transactions List`, cardTransactionsResponseData as object);
    }, [cardId, cardTransactionsResponseData]);
    // ------------------------------- XXXXXXXXXXXXXXXXXXXXXXXX ------------------------------- \\

    const handleSelectTransaction = (transaction: CardTransactionItemType) => {
        setSelectedTransaction(transaction);
        setIsDetailsOpen(true);
    };

    const handleCloseDetails = () => {
        setIsDetailsOpen(false);
        setSelectedTransaction(null);
    };

    return (
        <div className="w-full bg-[var(--bg-surface)] border border-[var(--line)] rounded-3xl p-5! sm:p-6! shadow-xs flex flex-col gap-5">
            {/* Section Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2! rounded-xl bg-[var(--bg-subtle)] border border-[var(--line)] text-[var(--ink)]">
                        <ReceiptText className="w-5 h-5 text-[var(--gold)]" />
                    </div>
                    <div>
                        <h3 className="text-base sm:text-lg font-bold text-[var(--ink)]">
                            Card Transactions
                        </h3>
                        <p className="text-xs text-[var(--mute)]">
                            Real-time records of purchases, authorizations, and settlements for this card
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="w-[38px] h-[38px]">
                        <CustomButtonComponent
                            id="cardTransactionsSection-refresh-btn"
                            label={
                                <RefreshCw
                                    className={`w-4 h-4 ${
                                        getCardTransactionsIsFetching ? 'animate-spin' : ''
                                    }`}
                                />
                            }
                            type="button"
                            variant="outline"
                            size="icon"
                            className="p-0! rounded-xl border-[var(--line)] bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] text-[var(--ink)]"
                            onClick={() => refetchCardTransactions()}
                            disabled={getCardTransactionsIsFetching}
                            showButtonLoader={false}
                            title="Refresh"
                            aria-label="Refresh card transactions"
                        />
                    </div>

                    {totalTransactionsCount > 0 && (
                        <span className="inline-flex items-center gap-1.5 px-3! py-1! rounded-full text-xs font-semibold bg-[var(--bg-subtle)] text-[var(--ink-soft)] border border-[var(--line)]">
                            {totalTransactionsCount} {totalTransactionsCount === 1 ? 'Record' : 'Records'}
                        </span>
                    )}
                </div>
            </div>

            {/* Sub-component: Card Transactions Table List */}
            <CardTransactionsListComponent
                transactions={cardTransactionsList}
                onSelectTransaction={handleSelectTransaction}
                cardTransactionsNotFound={isCardTransactionsNotFound}
                getCardTransactionsIsFetching={getCardTransactionsIsFetching}
                totalCount={totalTransactionsCount}
                pagination={pagination}
                setPagination={setPagination}
            />

            {/* Sub-component: Card Transaction Details Sidebar Drawer */}
            <CardTransactionDetailsSidebarComponent
                isOpen={isDetailsOpen}
                onClose={handleCloseDetails}
                transaction={selectedTransaction}
            />
        </div>
    );
}
