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
import type { BeneficiaryItemType } from '@/types/payables/beneficiariesTypes';
import RingSpinnerLoaderComponent from '@/components/common/loaders/RingSpinnerLoaderComponent';

const beneficiariesTableFeatures = tableFeatures({
    rowPaginationFeature,
    columnVisibilityFeature,
});

interface BeneficiariesListComponentPropsType {
    beneficiaries: BeneficiaryItemType[];
    onSelectBeneficiary: (beneficiary: BeneficiaryItemType) => void;
    beneficiariesNotFound?: boolean | undefined;
    getBeneficiariesIsFetching: boolean;
    totalCount: number;
    pagination: PaginationState;
    setPagination: React.Dispatch<React.SetStateAction<PaginationState>>;
}

export default function BeneficiariesListComponent({
    beneficiaries,
    onSelectBeneficiary,
    beneficiariesNotFound,
    getBeneficiariesIsFetching,
    totalCount,
    pagination,
    setPagination,
}: BeneficiariesListComponentPropsType) {
    const [searchQuery, setSearchQuery] = useState('');

    // Filter beneficiaries locally by search query
    const filteredBeneficiaries = useMemo(() => {
        if (!searchQuery.trim()) {
            return beneficiaries;
        }

        const query = searchQuery.toLowerCase().trim();

        return beneficiaries.filter((item) => {
            return (
                item.account_holder_name.toLowerCase().includes(query) ||
                item.bank_name.toLowerCase().includes(query) ||
                (item.account_currency && item.account_currency.toLowerCase().includes(query)) ||
                item.account_number.includes(query) ||
                item.swift_code.toLowerCase().includes(query)
            );
        });
    }, [beneficiaries, searchQuery]);

    const maskAccountNumber = (accNo: string) => {
        if (!accNo) return '****';
        if (accNo.length <= 4) return accNo;
        return `****${accNo.slice(-4)}`;
    };

    // Columns Definition
    const columns = useMemo<ColumnDef<typeof beneficiariesTableFeatures, BeneficiaryItemType>[]>(
        () => [
            {
                id: 'name',
                header: 'Name',
                accessorKey: 'account_holder_name',
                cell: ({ row }) => {
                    const item = row.original;
                    return (
                        <div className="flex items-center gap-3">
                            <span className="font-semibold text-[var(--ink)]">
                                {item.account_holder_name || "-"}
                            </span>
                        </div>
                    );
                },
            },
            {
                id: 'bank_name',
                header: 'Bank',
                accessorKey: 'bank_name',
                cell: ({ row }) => (
                    <span className="text-xs text-[var(--ink)]">
                        {row.original.bank_name || '-'}
                    </span>
                ),
            },
            {
                id: 'account_number',
                header: 'Account No.',
                accessorKey: 'account_number',
                cell: ({ row }) => (
                    <span className="font-mono text-xs text-[var(--ink)]">
                        {maskAccountNumber(row.original.account_number)}
                    </span>
                ),
            },
            {
                id: 'account_currency',
                header: 'Currency',
                accessorKey: 'account_currency',
                cell: ({ row }) => (
                    <span className="font-medium text-xs text-[var(--ink)]">
                        {row.original.account_currency || '-'}
                    </span>
                ),
            },
            {
                id: 'created_at',
                header: 'Created At ▲',
                accessorKey: 'createdAt',
                cell: ({ row }) => (
                    <span className="text-xs text-[var(--mute)]">
                        {row.original.createdAt || '—'}
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

    const totalPages = Math.ceil(totalCount / pagination.pageSize);
    const startRecord = totalCount === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1;
    const endRecord = Math.min((pagination.pageIndex + 1) * pagination.pageSize, totalCount);

    const table = useTable({
        features: beneficiariesTableFeatures,
        data: beneficiaries,
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
                    id="beneficiariesList-search-input"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter by name, currency, account number, or SWIFT code..."
                    className="w-full pl-10! pr-4! py-2.5! bg-[var(--bg-surface)] border border-[var(--line)] rounded-xl text-sm text-[var(--ink)] placeholder:text-[var(--mute)] focus:outline-hidden focus:border-[var(--line-strong)] focus:ring-1 focus:ring-[var(--line-strong)] transition-all"
                />
            </div>

            {/* Table Card Container */}
            <div className="w-full bg-[var(--bg-surface)] border border-[var(--line)] rounded-xl shadow-xs overflow-hidden">
                <div className={getBeneficiariesIsFetching || beneficiariesNotFound ? '' : 'overflow-x-auto'}>
                    <table className={`w-full text-left border-collapse ${getBeneficiariesIsFetching || beneficiariesNotFound ? '' : 'min-w-[700px]'}`}>
                        <thead>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <tr
                                    key={headerGroup.id}
                                    className="border-b border-[var(--line)] bg-[var(--bg-subtle)] text-[11px] font-semibold text-[var(--mute)] uppercase tracking-wider"
                                >
                                    {headerGroup.headers.map((header) => (
                                        <th
                                            key={header.id}
                                            className={`py-3.5! ${header.id === 'name'
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
                            {getBeneficiariesIsFetching ? (
                                <tr>
                                    <td colSpan={columns.length} className="py-12!">
                                        <div className="w-full flex items-center justify-center py-6!">
                                            <RingSpinnerLoaderComponent
                                                visible={getBeneficiariesIsFetching}
                                                size={30}
                                                color={getComputedStyle(
                                                    document.documentElement
                                                )
                                                    .getPropertyValue('--nav-bg')
                                                    .trim()}
                                            />
                                        </div>
                                    </td>
                                </tr>
                            ) : beneficiariesNotFound ? (
                                <tr>
                                    <td colSpan={columns.length} className="py-12!">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <Users
                                                className="w-8 h-8 text-[var(--ink-soft)]"
                                                strokeWidth={1.5}
                                            />

                                            <div className="flex flex-col items-center text-center gap-1">
                                                <p className="text-sm font-semibold text-[var(--ink)]">
                                                    No beneficiaries found
                                                </p>

                                                <p className="text-xs text-[var(--ink-soft)] max-w-[260px] leading-relaxed">
                                                    Beneficiaries will appear here once they are available.
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : table.getRowModel().rows.length > 0 ? (
                                table.getRowModel().rows.map((row) => (
                                    <tr
                                        key={row.id}
                                        onClick={() => onSelectBeneficiary(row.original)}
                                        className="hover:bg-[var(--bg-hover)] transition-colors cursor-pointer group"
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <td
                                                key={cell.id}
                                                className={`py-4! ${cell.column.id === 'name'
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
                                        No beneficiaries found matching your filter.
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
                            <span className="text-[var(--ink)] font-medium">
                                {startRecord}
                            </span>
                            {' - '}
                            <span className="text-[var(--ink)] font-medium">
                                {endRecord}
                            </span>
                            {' of '}
                            <span className="text-[var(--ink)] font-medium">
                                {totalCount}
                            </span>
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

