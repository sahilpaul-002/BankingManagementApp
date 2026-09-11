import React, { useState, useMemo } from 'react';
import { Search, ChevronRight } from 'lucide-react';
import type { BeneficiaryItem } from '@/fallbacks/payables/beneficiaries/beneficiariesFallbacks';

interface BeneficiariesListComponentProps {
    beneficiaries: BeneficiaryItem[];
    onSelectBeneficiary: (beneficiary: BeneficiaryItem) => void;
}

export default function BeneficiariesListComponent({
    beneficiaries,
    onSelectBeneficiary,
}: BeneficiariesListComponentProps) {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredBeneficiaries = useMemo(() => {
        if (!searchQuery.trim()) return beneficiaries;
        const query = searchQuery.toLowerCase().trim();
        return beneficiaries.filter((item) => {
            return (
                item.account_holder_name.toLowerCase().includes(query) ||
                item.bank_name.toLowerCase().includes(query) ||
                (item.account_currency && item.account_currency.toLowerCase().includes(query)) ||
                (item.country && item.country.toLowerCase().includes(query)) ||
                (item.payment_method && item.payment_method.toLowerCase().includes(query)) ||
                (item.status && item.status.toLowerCase().includes(query)) ||
                item.account_number.includes(query) ||
                item.swift_code.toLowerCase().includes(query)
            );
        });
    }, [beneficiaries, searchQuery]);

    const getInitials = (name: string) => {
        if (!name) return 'B';
        const parts = name.trim().split(' ');
        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        }
        return name.slice(0, 2).toUpperCase();
    };

    const deriveCountry = (item: BeneficiaryItem) => {
        if (item.country) return item.country;
        if (item.iban_code && /^[A-Za-z]{2}/.test(item.iban_code)) {
            return item.iban_code.slice(0, 2).toUpperCase();
        }
        if (item.swift_code && item.swift_code.length >= 6) {
            return item.swift_code.slice(4, 6).toUpperCase();
        }
        return 'US';
    };

    return (
        <div className="w-full flex flex-col gap-5">
            {/* Search Filter Bar */}
            <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--mute)]">
                    <Search className="w-4 h-4" />
                </div>
                <input
                    id="beneficiariesList-search-input"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter by name, currency, country, payment method, or status..."
                    className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-surface)] border border-[var(--line)] rounded-xl text-sm text-[var(--ink)] placeholder:text-[var(--mute)] focus:outline-hidden focus:border-[var(--line-strong)] focus:ring-1 focus:ring-[var(--line-strong)] transition-all"
                />
            </div>

            {/* Table Card Container */}
            <div className="w-full bg-[var(--bg-surface)] border border-[var(--line)] rounded-xl shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                            <tr className="border-b border-[var(--line)] bg-[var(--bg-subtle)] text-[11px] font-semibold text-[var(--mute)] uppercase tracking-wider">
                                <th className="py-3.5! px-6!">Name</th>
                                <th className="py-3.5! px-4!">Type</th>
                                <th className="py-3.5! px-4!">Currency</th>
                                <th className="py-3.5! px-4!">Country</th>
                                <th className="py-3.5! px-4!">Payment Method</th>
                                <th className="py-3.5! px-4!">Status</th>
                                <th className="py-3.5! px-4!">Created At ▲</th>
                                <th className="py-3.5! px-4! w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--line)] text-sm text-[var(--ink)]">
                            {filteredBeneficiaries.length > 0 ? (
                                filteredBeneficiaries.map((item) => (
                                    <tr
                                        key={item._id}
                                        onClick={() => onSelectBeneficiary(item)}
                                        className="hover:bg-[var(--bg-hover)] transition-colors cursor-pointer group"
                                    >
                                        {/* NAME */}
                                        <td className="py-4! px-6!">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-[var(--bg-subtle)] border border-[var(--line)] flex items-center justify-center font-medium text-xs text-[var(--ink)] shrink-0">
                                                    {getInitials(item.account_holder_name)}
                                                </div>
                                                <span className="font-semibold text-[var(--ink)]">
                                                    {item.account_holder_name}
                                                </span>
                                            </div>
                                        </td>

                                        {/* TYPE */}
                                        <td className="py-4! px-4! font-medium text-xs text-[var(--ink-soft)] uppercase tracking-wide">
                                            {item.type || 'INDIVIDUAL'}
                                        </td>

                                        {/* CURRENCY */}
                                        <td className="py-4! px-4! font-medium text-xs text-[var(--ink)]">
                                            {item.account_currency || 'USD'}
                                        </td>

                                        {/* COUNTRY */}
                                        <td className="py-4! px-4! text-xs text-[var(--mute)]">
                                            {deriveCountry(item)}
                                        </td>

                                        {/* PAYMENT METHOD */}
                                        <td className="py-4! px-4!">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide bg-[#e8f0fd] text-[#2a6fdb]">
                                                {item.payment_method || (item.swift_code ? 'SWIFT' : 'LOCAL')}
                                            </span>
                                        </td>

                                        {/* STATUS */}
                                        <td className="py-4! px-4!">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--ok-bg)] text-[var(--ok)]">
                                                <span className="w-1.5 h-1.5 rounded-full bg-[var(--ok)]"></span>
                                                {item.status || 'ACTIVE'}
                                            </span>
                                        </td>

                                        {/* CREATED AT */}
                                        <td className="py-4! px-4! text-xs text-[var(--mute)]">
                                            {item.created_at || '09 Sept 2026'}
                                        </td>

                                        {/* ACTION CHEVRON */}
                                        <td className="py-4! px-4! text-right">
                                            <ChevronRight className="w-4 h-4 text-[var(--mute)] group-hover:text-[var(--ink)] transition-colors inline-block" />
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={8} className="py-12 text-center text-[var(--mute)]">
                                        No beneficiaries found matching your filter.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
