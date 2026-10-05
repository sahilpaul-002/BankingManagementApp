import { useState, useEffect, Activity } from 'react';
import { CreditCard, ChevronLeft, ChevronRight } from 'lucide-react';
import type { PaginationState } from '@tanstack/react-table';
import { useGetCardsQuery } from '@/redux/features/card/cardApi';
import type { CardsListResponseDataType, CardItemType } from '@/types/cards/manageCardsTypes';
import RingSpinnerLoaderComponent from '@/components/common/loaders/RingSpinnerLoaderComponent';
import ShowInConsole from '@/utils/ShowInConsole';
import { useDispatch } from 'react-redux';
import { setShowInfoBanner } from '@/redux/slice/utility/utilitySlice';

interface CardholderCardsSectionComponentPropsType {
    cardholderId: string | null | undefined;
    userEmail: string;
}

const DEFAULT_PAGINATION: PaginationState = {
    pageIndex: 0,
    pageSize: 3,
};

const CARD_STATUS_STYLES: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-700',
    INACTIVE: 'bg-rose-100 text-rose-700',
    SUSPENDED: 'bg-amber-100 text-amber-700',
    BLOCKED: 'bg-red-100 text-red-700',
};

const CARD_TYPE_STYLES: Record<string, string> = {
    VIRTUAL: 'bg-blue-100 text-blue-700',
    PHYSICAL: 'bg-amber-100 text-amber-800',
};

const formatCardNumber = (cardNumber: string) => {
    if (!cardNumber) return '•••• •••• •••• ••••';
    const cleaned = cardNumber.replace(/\s+/g, '');
    return `${cleaned.slice(0, 4)} •••• •••• ••••`;
};

export default function CardholderCardsSectionComponent({
    cardholderId,
    userEmail,
}: CardholderCardsSectionComponentPropsType) {
    // Configure useDispatch
    const dispatch = useDispatch();
    useEffect(() => {
        // Validate session storage once
        if (!cardholderId) {
            dispatch(setShowInfoBanner('Application facing issue, necessary cardholder(cardholder_id) details not present.'));
            return;
        }
    }, [cardholderId]);

    // Pagination state
    const [pagination, setPagination] = useState<PaginationState>(DEFAULT_PAGINATION);

    // ------------------------------ GET CARDS RTK QUERY ------------------------------ \\
    // Cards List
    const { data: getCardsData, isLoading: getCardsIsLoading, isFetching: getCardsIsFetching, isError: getCardsIsError, error: getCardsError } = useGetCardsQuery({ email: userEmail!, cardholderId: cardholderId!, pageNumber: pagination.pageIndex + 1, pageSize: pagination.pageSize }, { skip: !userEmail || !cardholderId });
    const cardsResponseData = (getCardsData?.data as CardsListResponseDataType) ?? {};
    const cardsList: CardItemType[] = (cardsResponseData?.cards as CardItemType[]) ?? [];
    const totalCardsCount = cardsResponseData?.pagination?.total_records ?? cardsList.length ?? 0;
    const isCardsNotFound =
        getCardsIsError &&
        getCardsError &&
        getCardsError != null &&
        'status' in getCardsError &&
        getCardsError?.status === 404 &&
        typeof getCardsError?.data === 'object' &&
        getCardsError?.data !== null &&
        'status' in getCardsError?.data &&
        (getCardsError?.data as { status: string }).status === 'NOT_FOUND';

    useEffect(() => {
        ShowInConsole(`Cardholder - ${cardholderId} Cards List`, cardsResponseData as object);
    }, [cardholderId, cardsResponseData]);
    // ------------------------------- XXXXXXXXXXXXXXXXXXXXXXXX ------------------------------- \\

    const isFetching = getCardsIsLoading || getCardsIsFetching;
    const totalPages = Math.ceil(totalCardsCount / pagination.pageSize);
    const startRecord = totalCardsCount === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1;
    const endRecord = Math.min((pagination.pageIndex + 1) * pagination.pageSize, totalCardsCount);

    return (
        <div className="flex flex-col gap-3 pt-4! border-t border-[var(--line)]">
            {/* Section Header */}
            <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-[var(--mute)] uppercase tracking-wider flex items-center gap-1.5">
                    <span>— CARDS</span>
                </div>
                {totalCardsCount > 0 && (
                    <span className="text-[11px] font-semibold text-[var(--mute)]">
                        {totalCardsCount} {totalCardsCount === 1 ? 'Card' : 'Cards'}
                    </span>
                )}
            </div>

            {/* Loading State */}
            <Activity mode={isFetching ? 'visible' : 'hidden'}>
                <div className="w-full min-h-[120px] flex items-center justify-center bg-[var(--bg-subtle)] border border-[var(--line)] rounded-xl p-6!">
                    <RingSpinnerLoaderComponent
                        visible={isFetching}
                        size={28}
                        color={
                            getComputedStyle(document.documentElement)
                                .getPropertyValue('--nav-bg')
                                .trim() || '#0c1830'
                        }
                    />
                </div>
            </Activity>

            {/* Not Found / Empty State */}
            <Activity
                mode={!isFetching && (isCardsNotFound || cardsList.length === 0) ? 'visible' : 'hidden'}
            >
                <div className="w-full min-h-[90px] flex flex-col items-center justify-center gap-1.5 bg-[var(--bg-subtle)] border border-[var(--line)] rounded-xl p-4! text-center">
                    <CreditCard className="w-5 h-5 text-[var(--mute)]" strokeWidth={1.5} />
                    <p className="text-xs font-medium text-[var(--ink)]">No cards found</p>
                    <p className="text-[11px] text-[var(--mute)]">
                        No cards have been issued for this cardholder yet.
                    </p>
                </div>
            </Activity>

            {/* Cards List Items */}
            <Activity
                mode={!isFetching && !isCardsNotFound && cardsList.length > 0 ? 'visible' : 'hidden'}
            >
                <div className="flex flex-col gap-2.5">
                    {cardsList.map((card) => {
                        const statusKey = card.card_status?.toUpperCase() || 'INACTIVE';
                        const typeKey = card.card_type?.toUpperCase() || 'VIRTUAL';

                        return (
                            <div
                                key={card._id}
                                className="w-full bg-[var(--bg-subtle)] border border-[var(--line)] hover:border-[var(--line-strong)] rounded-xl p-3! flex flex-col gap-2 transition-all shadow-xs"
                            >
                                {/* Row 1: Card Number & Status */}
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-xs sm:text-sm font-semibold text-[var(--ink)] tracking-wider">
                                        {formatCardNumber(card.card_number)}
                                    </span>
                                    <span
                                        className={`inline-flex items-center px-2! py-0.5! rounded-full text-[10px] font-semibold uppercase tracking-wide shrink-0 ${CARD_STATUS_STYLES[statusKey] ?? 'bg-gray-100 text-gray-600'
                                            }`}
                                    >
                                        {card.card_status || 'UNKNOWN'}
                                    </span>
                                </div>

                                {/* Row 2: Name on Card, Type & Currency */}
                                <div className="flex items-center justify-between text-xs pt-1.5! border-t border-[var(--line-faint)]">
                                    <span className="text-[var(--mute)] font-medium truncate max-w-[140px]">
                                        {card.name_on_card || '—'}
                                    </span>

                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <span
                                            className={`inline-flex items-center px-1.5! py-0.5! rounded text-[10px] font-semibold uppercase tracking-wide ${CARD_TYPE_STYLES[typeKey] ?? 'bg-gray-100 text-gray-700'
                                                }`}
                                        >
                                            {card.card_type || 'VIRTUAL'}
                                        </span>
                                        <span className="text-[10px] font-bold text-[var(--gold)] uppercase bg-[var(--bg-surface)] px-1.5! py-0.5! rounded border border-[var(--line)]">
                                            {card.card_currency || 'USD'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Pagination Controls */}
                {totalCardsCount > 0 && (
                    <div className="flex items-center justify-between gap-2 pt-2! border-t border-[var(--line)] text-xs text-[var(--mute)]">
                        <div>
                            <span>
                                {startRecord}-{endRecord} of {totalCardsCount}
                            </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                            {/* Page size select */}
                            <select
                                value={pagination.pageSize}
                                onChange={(event) => {
                                    setPagination({
                                        pageIndex: 0,
                                        pageSize: Number(event.target.value),
                                    });
                                }}
                                className="h-7 rounded border border-[var(--line)] bg-[var(--bg-surface)] px-1! text-[11px] text-[var(--ink)]"
                            >
                                {[3, 5, 10].map((size) => (
                                    <option key={size} value={size}>
                                        {size}/pg
                                    </option>
                                ))}
                            </select>

                            {/* Previous Button */}
                            <button
                                type="button"
                                disabled={pagination.pageIndex === 0}
                                onClick={() =>
                                    setPagination((prev) => ({
                                        ...prev,
                                        pageIndex: Math.max(0, prev.pageIndex - 1),
                                    }))
                                }
                                className="p-1! rounded hover:bg-[var(--bg-hover)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-[var(--ink)] transition-colors"
                                aria-label="Previous page"
                            >
                                <ChevronLeft className="w-3.5 h-3.5" />
                            </button>

                            {/* Page Indicator */}
                            <span className="text-[11px] font-medium text-[var(--ink)] px-1!">
                                {pagination.pageIndex + 1}/{Math.max(1, totalPages)}
                            </span>

                            {/* Next Button */}
                            <button
                                type="button"
                                disabled={pagination.pageIndex >= totalPages - 1}
                                onClick={() =>
                                    setPagination((prev) => ({
                                        ...prev,
                                        pageIndex: prev.pageIndex + 1,
                                    }))
                                }
                                className="p-1 rounded hover:bg-[var(--bg-hover)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-[var(--ink)] transition-colors"
                                aria-label="Next page"
                            >
                                <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                )}
            </Activity>
        </div>
    );
}
