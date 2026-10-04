import { useState, useMemo, Activity } from 'react';
import { Search, CreditCard, Calendar, ChevronRight, Wifi } from 'lucide-react';
import type { PaginationState } from '@tanstack/react-table';
import type { CardItemType } from '@/types/cards/manageCardsTypes';
import RingSpinnerLoaderComponent from '@/components/common/loaders/RingSpinnerLoaderComponent';

type CardFilterTab = 'all' | 'virtual' | 'physical';

const CARD_TABS: { id: CardFilterTab; label: string }[] = [
    { id: 'all', label: 'All Cards' },
    { id: 'virtual', label: 'Virtual' },
    { id: 'physical', label: 'Physical' },
];

const CARD_STATUS_IN_CARD_STYLES: Record<string, string> = {
    ACTIVE: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    INACTIVE: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    SUSPENDED: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    BLOCKED: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
};

const CARD_STATUS_DOTS: Record<string, string> = {
    ACTIVE: 'bg-emerald-400',
    INACTIVE: 'bg-rose-400',
    SUSPENDED: 'bg-amber-400',
    BLOCKED: 'bg-rose-400',
};

const CARD_TYPE_STYLES: Record<string, string> = {
    VIRTUAL: 'bg-[var(--info-bg)] text-[var(--info)] border-[var(--info)]/20',
    PHYSICAL: 'bg-[var(--gold-soft)] text-[var(--gold)] border-[var(--gold)]/20',
};

const formatCardNumber = (cardNumber: string) => {
    if (!cardNumber) return '•••• •••• •••• ••••';
    const cleaned = cardNumber.replace(/\s+/g, '');
    if (cleaned.length < 16) {
        return `•••• •••• •••• ${cleaned.slice(-4)}`;
    }
    return `${cleaned.slice(0, 4)} •••• •••• ${cleaned.slice(-4)}`;
};

const formatDate = (isoDate: string) => {
    if (!isoDate) return '—';
    try {
        return new Date(isoDate).toLocaleDateString('en-US', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    } catch {
        return isoDate;
    }
};

interface ManageCardsListComponentPropsType {
    cards: CardItemType[];
    onSelectCard: (card: CardItemType) => void;
    cardsNotFound?: boolean;
    getCardsIsFetching: boolean;
    totalCount: number;
    pagination: PaginationState;
    setPagination: React.Dispatch<React.SetStateAction<PaginationState>>;
}

export default function ManageCardsListComponent({
    cards,
    onSelectCard,
    cardsNotFound,
    getCardsIsFetching,
    totalCount,
    pagination,
    setPagination,
}: ManageCardsListComponentPropsType) {
    const [activeTab, setActiveTab] = useState<CardFilterTab>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Filter cards locally by tab and search
    const filteredCards = useMemo(() => {
        let result = cards;

        if (activeTab === 'virtual') {
            result = result.filter((c) => c.card_type?.toUpperCase() === 'VIRTUAL');
        } else if (activeTab === 'physical') {
            result = result.filter((c) => c.card_type?.toUpperCase() === 'PHYSICAL');
        }

        const query = searchQuery.toLowerCase().trim();
        if (query) {
            result = result.filter(
                (c) =>
                    c.card_number?.toLowerCase().includes(query) ||
                    c.name_on_card?.toLowerCase().includes(query) ||
                    c.card_currency?.toLowerCase().includes(query) ||
                    c.card_status?.toLowerCase().includes(query) ||
                    c.card_type?.toLowerCase().includes(query)
            );
        }

        return result;
    }, [cards, activeTab, searchQuery]);

    const totalPages = Math.ceil(totalCount / pagination.pageSize);
    const startRecord = totalCount === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1;
    const endRecord = Math.min((pagination.pageIndex + 1) * pagination.pageSize, totalCount);

    const isCardGridVisible = !getCardsIsFetching && !cardsNotFound && filteredCards.length > 0;
    const isNoFilteredCards = !getCardsIsFetching && !cardsNotFound && filteredCards.length === 0;
    const isNotFoundVisible = !getCardsIsFetching && Boolean(cardsNotFound);

    return (
        <div className="w-full flex flex-col gap-6">
            {/* Header Controls: 1st Line Search Bar, 2nd Line Tabs */}
            <div className="w-full flex flex-col gap-3">
                {/* 1st Line: Search Bar */}
                <div className="relative w-full">
                    <div className="absolute inset-y-0 left-0 pl-3.5! flex items-center pointer-events-none text-[var(--mute)]">
                        <Search className="w-4 h-4" />
                    </div>
                    <input
                        id="manageCards-search-input"
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by card number, name, type, currency, or status..."
                        className="w-full pl-10! pr-4! py-2.5! bg-[var(--bg-surface)] border border-[var(--line)] rounded-xl text-sm text-[var(--ink)] placeholder:text-[var(--mute)] focus:outline-hidden focus:border-[var(--line-strong)] focus:ring-1 focus:ring-[var(--line-strong)] transition-all"
                    />
                </div>

                {/* 2nd Line: Tab Navigation */}
                <div className="inline-flex p-1 bg-[var(--bg-surface)] border border-[var(--line)] rounded-xl self-start">
                    {CARD_TABS.map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                id={`manageCards-tab-${tab.id}`}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4! py-1.5! rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                                    isActive
                                        ? 'bg-[var(--nav-bg)] text-white shadow-xs'
                                        : 'text-[var(--mute)] hover:text-[var(--ink)] hover:bg-[var(--bg-hover)]'
                                }`}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Loading State via Activity */}
            <Activity mode={getCardsIsFetching ? 'visible' : 'hidden'}>
                <div className="w-full min-h-[300px] flex items-center justify-center bg-[var(--bg-surface)] border border-[var(--line)] rounded-2xl p-12">
                    <RingSpinnerLoaderComponent
                        visible={getCardsIsFetching}
                        size={36}
                        color={
                            getComputedStyle(document.documentElement)
                                .getPropertyValue('--nav-bg')
                                .trim() || '#0c1830'
                        }
                    />
                </div>
            </Activity>

            {/* Cards Not Found State via Activity */}
            <Activity mode={isNotFoundVisible ? 'visible' : 'hidden'}>
                <div className="w-full min-h-[300px] flex flex-col items-center justify-center gap-3 bg-[var(--bg-surface)] border border-[var(--line)] rounded-2xl p-12">
                    <CreditCard className="w-10 h-10 text-[var(--ink-soft)]" strokeWidth={1.5} />
                    <div className="flex flex-col items-center text-center gap-1">
                        <p className="text-base font-semibold text-[var(--ink)]">No cards found</p>
                        <p className="text-xs text-[var(--ink-soft)] max-w-[280px] leading-relaxed">
                            Cards will appear here once they are issued for your cardholder account.
                        </p>
                    </div>
                </div>
            </Activity>

            {/* Filter Empty State via Activity */}
            <Activity mode={isNoFilteredCards ? 'visible' : 'hidden'}>
                <div className="w-full min-h-[220px] flex flex-col items-center justify-center gap-2 bg-[var(--bg-surface)] border border-[var(--line)] rounded-2xl p-8 text-center">
                    <p className="text-sm font-semibold text-[var(--ink)]">No matching cards</p>
                    <p className="text-xs text-[var(--mute)]">
                        No cards match the selected filter or search criteria.
                    </p>
                </div>
            </Activity>

            {/* Cards Grid UI via Activity */}
            <Activity mode={isCardGridVisible ? 'visible' : 'hidden'}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredCards.map((card) => {
                        const statusKey = card.card_status?.toUpperCase() || 'ACTIVE';
                        const typeKey = card.card_type?.toUpperCase() || 'VIRTUAL';

                        return (
                            <div
                                key={card._id}
                                id={`manageCards-card-${card._id}`}
                                onClick={() => onSelectCard(card)}
                                className="group relative bg-[var(--bg-surface)] border border-[var(--line)] hover:border-[var(--line-strong)] rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between gap-4 overflow-hidden"
                            >
                                {/* Decorative Gradient Accents */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[var(--gold)]/10 to-transparent rounded-bl-full pointer-events-none transition-opacity group-hover:opacity-100 opacity-60" />

                                {/* Outer Top Header: Card Type & Wifi */}
                                <div className="flex items-center justify-between gap-2 z-10">
                                    <span
                                        className={`inline-flex items-center px-2.5! py-0.5! rounded-full text-[11px] font-semibold uppercase tracking-wider border ${CARD_TYPE_STYLES[typeKey] ?? 'bg-[var(--bg-subtle)] text-[var(--ink)] border-transparent'}`}
                                    >
                                        {card.card_type || 'VIRTUAL'}
                                    </span>

                                    <div className="flex items-center gap-1.5 text-[var(--mute)]">
                                        <Wifi className="w-4 h-4 rotate-90" />
                                    </div>
                                </div>

                                {/* Center: Card Graphic with Integrated Status */}
                                <div className="p-4! rounded-xl bg-gradient-to-br from-[var(--nav-bg)] via-[#16264a] to-[var(--nav-bg-2)] text-white shadow-inner flex flex-col justify-between min-h-[148px] z-10 transition-transform duration-200 group-hover:scale-[1.01]">
                                    {/* Card Top: Chip, Currency & Integrated Status */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-6 rounded-sm bg-[var(--gold)]/80 opacity-90 shadow-xs flex items-center justify-center">
                                                <div className="w-5 h-3.5 border border-black/30 rounded-xs" />
                                            </div>
                                            <span className="text-xs font-semibold tracking-wider text-[var(--gold-2)] uppercase">
                                                {card.card_currency || 'USD'}
                                            </span>
                                        </div>

                                        {/* Status Badge inside Card */}
                                        <span
                                            className={`inline-flex items-center gap-1.5 px-2! py-0.5! rounded-full text-[10px] font-semibold uppercase tracking-wider border ${CARD_STATUS_IN_CARD_STYLES[statusKey] ?? 'bg-white/10 text-white/80 border-white/20'}`}
                                        >
                                            <span
                                                className={`w-1.5 h-1.5 rounded-full ${CARD_STATUS_DOTS[statusKey] ?? 'bg-white'}`}
                                            />
                                            {card.card_status || 'ACTIVE'}
                                        </span>
                                    </div>

                                    {/* Card Number */}
                                    <div className="py-2.5">
                                        <span className="font-mono text-base sm:text-lg tracking-widest text-slate-100 font-medium">
                                            {formatCardNumber(card.card_number)}
                                        </span>
                                    </div>

                                    {/* Card Bottom: Holder Name & Type */}
                                    <div className="flex items-center justify-between text-xs text-slate-300">
                                        <span className="font-medium tracking-wide uppercase truncate max-w-[170px]">
                                            {card.name_on_card || 'Cardholder'}
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-mono uppercase">
                                            {card.card_type}
                                        </span>
                                    </div>
                                </div>

                                {/* Bottom Metadata Row */}
                                <div className="flex items-center justify-between pt-2 border-t border-[var(--line)] text-xs text-[var(--mute)] z-10">
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5 text-[var(--mute)]" />
                                        <span>Issued: {formatDate(card.issued_date)}</span>
                                    </div>

                                    <div className="inline-flex items-center gap-1 font-semibold text-[var(--ink)] group-hover:text-[var(--gold)] transition-colors">
                                        <span>Details</span>
                                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Activity>

            {/* Pagination Controls via Activity */}
            <Activity mode={totalCount > 0 ? 'visible' : 'hidden'}>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4! py-3.5! bg-[var(--bg-surface)] border border-[var(--line)] rounded-xl">
                    <div className="text-xs sm:text-sm text-[var(--mute)]">
                        Showing{' '}
                        <span className="text-[var(--ink)] font-medium">{startRecord}</span>
                        {' - '}
                        <span className="text-[var(--ink)] font-medium">{endRecord}</span>
                        {' of '}
                        <span className="text-[var(--ink)] font-medium">{totalCount}</span>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Page Size */}
                        <select
                            value={pagination.pageSize}
                            onChange={(event) => {
                                setPagination({
                                    pageIndex: 0,
                                    pageSize: Number(event.target.value),
                                });
                            }}
                            className="h-9 rounded-md border border-[var(--line)] bg-[var(--bg-surface)] px-2! text-xs sm:text-sm text-[var(--ink)]"
                        >
                            {[6, 9, 12, 24].map((size) => (
                                <option key={size} value={size}>
                                    Show {size}
                                </option>
                            ))}
                        </select>

                        {/* Previous */}
                        <button
                            type="button"
                            disabled={pagination.pageIndex === 0}
                            onClick={() => {
                                setPagination((previous) => ({
                                    ...previous,
                                    pageIndex: previous.pageIndex - 1,
                                }));
                            }}
                            className="disabled:text-[var(--mute)] disabled:cursor-not-allowed cursor-pointer text-xs sm:text-sm px-2 py-1"
                        >
                            Previous
                        </button>

                        {/* Current Page */}
                        <span className="text-xs sm:text-sm text-[var(--mute)] whitespace-nowrap">
                            Page {pagination.pageIndex + 1} of {Math.max(1, totalPages)}
                        </span>

                        {/* Next */}
                        <button
                            type="button"
                            disabled={pagination.pageIndex >= totalPages - 1}
                            onClick={() => {
                                setPagination((previous) => ({
                                    ...previous,
                                    pageIndex: previous.pageIndex + 1,
                                }));
                            }}
                            className="disabled:text-[var(--mute)] disabled:cursor-not-allowed cursor-pointer text-xs sm:text-sm px-2 py-1"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </Activity>
        </div>
    );
}
