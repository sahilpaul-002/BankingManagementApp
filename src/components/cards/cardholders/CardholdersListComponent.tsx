import { useState, useMemo } from 'react';
import { Search, ChevronRight, Users } from 'lucide-react';
import {
    useTable,
    tableFeatures,
    rowPaginationFeature,
    columnVisibilityFeature,
    type ColumnDef,
    type PaginationState,
} from '@tanstack/react-table';
import type { CardholderItemType } from '@/types/cards/cardholders/cardholderTypes';
import RingSpinnerLoaderComponent from '@/components/common/loaders/RingSpinnerLoaderComponent';

// ── Table feature bundle ──────────────────────────────────────────────────────
const cardholdersTableFeatures = tableFeatures({
    rowPaginationFeature,
    columnVisibilityFeature,
});

// ── Status badge helpers ──────────────────────────────────────────────────────
const KYC_STATUS_STYLES: Record<string, string> = {
    PENDING:      'bg-yellow-100 text-yellow-700',
    'IN-PROGRESS': 'bg-blue-100 text-blue-700',
    RFI:          'bg-orange-100 text-orange-700',
    COMPLETED:    'bg-green-100 text-green-700',
};

const STATUS_STYLES: Record<string, string> = {
    DISABLED:       'bg-red-100 text-red-700',
    'PRE-VERIFIED': 'bg-yellow-100 text-yellow-700',
    VERIFIED:       'bg-blue-100 text-blue-700',
    ACTIVE:         'bg-green-100 text-green-700',
};

const formatDate = (iso: string) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

// ── Props ─────────────────────────────────────────────────────────────────────
interface CardholdersListComponentPropsType {
    cardholders: CardholderItemType[];
    onSelectCardholder: (cardholder: CardholderItemType) => void;
    cardholdersNotFound?: boolean | undefined;
    getCardholdersIsFetching: boolean;
    totalCount: number;
    pagination: PaginationState;
    setPagination: React.Dispatch<React.SetStateAction<PaginationState>>;
}

export default function CardholdersListComponent({
    cardholders,
    onSelectCardholder,
    cardholdersNotFound,
    getCardholdersIsFetching,
    totalCount,
    pagination,
    setPagination,
}: CardholdersListComponentPropsType) {
    const [searchQuery, setSearchQuery] = useState('');

    // Filter locally by search query (name, email)
    const filteredCardholders = useMemo(() => {
        if (!searchQuery.trim()) return cardholders;

        const query = searchQuery.toLowerCase().trim();
        return cardholders.filter((item) =>
            item.full_name.toLowerCase().includes(query) ||
            item.email.toLowerCase().includes(query)
        );
    }, [cardholders, searchQuery]);

    // ── Column definitions ────────────────────────────────────────────────────
    const columns = useMemo<ColumnDef<typeof cardholdersTableFeatures, CardholderItemType>[]>(
        () => [
            {
                id: 'full_name',
                header: 'Name',
                accessorKey: 'full_name',
                cell: ({ row }) => (
                    <span className="font-semibold text-[var(--ink)]">
                        {row.original.full_name || '—'}
                    </span>
                ),
            },
            {
                id: 'email',
                header: 'Email',
                accessorKey: 'email',
                cell: ({ row }) => (
                    <span className="text-xs text-[var(--ink)]">
                        {row.original.email || '—'}
                    </span>
                ),
            },
            {
                id: 'kyc_status',
                header: 'KYC Status',
                accessorKey: 'kyc_status',
                cell: ({ row }) => {
                    const status = row.original.kyc_status;
                    return (
                        <span
                            className={`inline-flex items-center px-2! py-0.5! rounded-full text-[10px] font-semibold uppercase tracking-wide ${KYC_STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-600'}`}
                        >
                            {status || '—'}
                        </span>
                    );
                },
            },
            {
                id: 'status',
                header: 'Status',
                accessorKey: 'status',
                cell: ({ row }) => {
                    const status = row.original.status;
                    return (
                        <span
                            className={`inline-flex items-center px-2! py-0.5! rounded-full text-[10px] font-semibold uppercase tracking-wide ${STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-600'}`}
                        >
                            {status || '—'}
                        </span>
                    );
                },
            },
            {
                id: 'createdAt',
                header: 'Created At ▲',
                accessorKey: 'createdAt',
                cell: ({ row }) => (
                    <span className="text-xs text-[var(--mute)]">
                        {formatDate(row.original.createdAt)}
                    </span>
                ),
            },
            {
                id: 'actions',
                header: () => null,
                cell: () => (
                    <div className="text-right">
                        <ChevronRight className="w-4 h-4 text-[var(--mute)] group-hover:text-[var(--ink)] transition-colors inline-block" />
                    </div>
                ),
            },
        ],
        []
    );

    // ── Pagination calculations ───────────────────────────────────────────────
    const totalPages = Math.ceil(totalCount / pagination.pageSize);
    const startRecord = totalCount === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1;
    const endRecord = Math.min((pagination.pageIndex + 1) * pagination.pageSize, totalCount);

    const table = useTable({
        features: cardholdersTableFeatures,
        data: filteredCardholders,
        columns,
    });

    return (
        <div className="w-full flex flex-col gap-5">
            {/* Search Filter Bar */}
            <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-3.5! flex items-center pointer-events-none text-[var(--mute)]">
                    <Search className="w-4 h-4" />
                </div>
                <input
                    id="cardholdersList-search-input"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter by name or email..."
                    className="w-full pl-10! pr-4! py-2.5! bg-[var(--bg-surface)] border border-[var(--line)] rounded-xl text-sm text-[var(--ink)] placeholder:text-[var(--mute)] focus:outline-hidden focus:border-[var(--line-strong)] focus:ring-1 focus:ring-[var(--line-strong)] transition-all"
                />
            </div>

            {/* Table Card Container */}
            <div className="w-full bg-[var(--bg-surface)] border border-[var(--line)] rounded-xl shadow-xs overflow-hidden">
                <div className={getCardholdersIsFetching || cardholdersNotFound ? '' : 'overflow-x-auto'}>
                    <table
                        className={`w-full text-left border-collapse ${getCardholdersIsFetching || cardholdersNotFound ? '' : 'min-w-[750px]'}`}
                    >
                        <thead>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <tr
                                    key={headerGroup.id}
                                    className="border-b border-[var(--line)] bg-[var(--bg-subtle)] text-[11px] font-semibold text-[var(--mute)] uppercase tracking-wider"
                                >
                                    {headerGroup.headers.map((header) => (
                                        <th
                                            key={header.id}
                                            className={`py-3.5! ${header.id === 'full_name'
                                                ? 'px-6!'
                                                : header.id === 'actions'
                                                    ? 'px-4! w-10'
                                                    : 'px-4!'
                                                }`}
                                        >
                                            {header.isPlaceholder ? null : (
                                                <table.FlexRender header={header} />
                                            )}
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>

                        <tbody className="divide-y divide-[var(--line)] text-sm text-[var(--ink)]">
                            {getCardholdersIsFetching ? (
                                <tr>
                                    <td colSpan={columns.length} className="py-12!">
                                        <div className="w-full flex items-center justify-center py-6!">
                                            <RingSpinnerLoaderComponent
                                                visible={getCardholdersIsFetching}
                                                size={30}
                                                color={getComputedStyle(document.documentElement)
                                                    .getPropertyValue('--nav-bg')
                                                    .trim()}
                                            />
                                        </div>
                                    </td>
                                </tr>
                            ) : cardholdersNotFound ? (
                                <tr>
                                    <td colSpan={columns.length} className="py-12!">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <Users
                                                className="w-8 h-8 text-[var(--ink-soft)]"
                                                strokeWidth={1.5}
                                            />
                                            <div className="flex flex-col items-center text-center gap-1">
                                                <p className="text-sm font-semibold text-[var(--ink)]">
                                                    No cardholders found
                                                </p>
                                                <p className="text-xs text-[var(--ink-soft)] max-w-[260px] leading-relaxed">
                                                    Cardholders will appear here once they are available.
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : table.getRowModel().rows.length > 0 ? (
                                table.getRowModel().rows.map((row) => (
                                    <tr
                                        key={row.id}
                                        onClick={() => onSelectCardholder(row.original)}
                                        className="hover:bg-[var(--bg-hover)] transition-colors cursor-pointer group"
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <td
                                                key={cell.id}
                                                className={`py-4! ${cell.column.id === 'full_name'
                                                    ? 'px-6!'
                                                    : 'px-4!'
                                                    }`}
                                            >
                                                <table.FlexRender cell={cell} />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan={columns.length}
                                        className="py-12! text-center text-[var(--mute)] text-sm"
                                    >
                                        No cardholders found matching your filter.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {totalCount > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4! py-3! border-t border-[var(--line)]">
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
                                {[7, 10, 20, 50].map((size) => (
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
                                className="disabled:text-[var(--mute)] disabled:cursor-not-allowed cursor-pointer text-xs sm:text-sm"
                            >
                                Previous
                            </button>

                            {/* Current Page */}
                            <span className="text-xs sm:text-sm text-[var(--mute)] whitespace-nowrap">
                                Page {pagination.pageIndex + 1} of {totalPages}
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
                                className="disabled:text-[var(--mute)] disabled:cursor-not-allowed cursor-pointer text-xs sm:text-sm"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
