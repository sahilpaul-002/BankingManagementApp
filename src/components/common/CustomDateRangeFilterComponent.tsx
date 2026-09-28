import React, { useEffect, useRef, useState } from 'react';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import type { DateRange as RDPDateRange } from 'react-day-picker';
import { Calendar } from '@/components/ui/calendar';

export interface DateRange {
    fromDate: string;
    toDate: string;
}

interface CustomDateRangeFilterComponentPropsType {
    value: DateRange;
    onApply: (range: DateRange) => void;
    onClear: () => void;
    label?: string;
}

const toIsoDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
};

const parseIsoDate = (
    value: string
): Date | undefined => {
    if (!value) return undefined;

    return new Date(`${value}T00:00:00`);
};

const formatDisplayDate = (dateString: string): string => {
    const date = parseIsoDate(dateString);

    if (!date) return '';

    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

const PRESETS: {
    label: string;
    getRange: () => DateRange;
}[] = [
        {
            label: 'Today',
            getRange: () => {
                const today = toIsoDate(new Date());

                return {
                    fromDate: today,
                    toDate: today,
                };
            },
        },
        {
            label: 'Last 7 days',
            getRange: () => {
                const to = new Date();
                const from = new Date();

                from.setDate(from.getDate() - 6);

                return {
                    fromDate: toIsoDate(from),
                    toDate: toIsoDate(to),
                };
            },
        },
        {
            label: 'Last 30 days',
            getRange: () => {
                const to = new Date();
                const from = new Date();

                from.setDate(from.getDate() - 29);

                return {
                    fromDate: toIsoDate(from),
                    toDate: toIsoDate(to),
                };
            },
        },
        {
            label: 'This month',
            getRange: () => {
                const now = new Date();

                const from = new Date(
                    now.getFullYear(),
                    now.getMonth(),
                    1
                );

                return {
                    fromDate: toIsoDate(from),
                    toDate: toIsoDate(now),
                };
            },
        },
    ];

export default function CustomDateRangeFilterComponent({
    value,
    onApply,
    onClear,
    label = 'Date range',
}: CustomDateRangeFilterComponentPropsType) {
    const [isOpen, setIsOpen] = useState(false);

    const [draftRange, setDraftRange] = useState<
        RDPDateRange | undefined
    >({
        from: parseIsoDate(value.fromDate),
        to: parseIsoDate(value.toDate),
    });

    const containerRef = useRef<HTMLDivElement>(null);

    const isActive =
        Boolean(value.fromDate) &&
        Boolean(value.toDate);

    const isApplyDisabled =
        !draftRange?.from ||
        !draftRange?.to;

    useEffect(() => {
        if (!isOpen) return;

        setDraftRange({
            from: parseIsoDate(value.fromDate),
            to: parseIsoDate(value.toDate),
        });
    }, [
        isOpen,
        value.fromDate,
        value.toDate,
    ]);

    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (
            event: MouseEvent
        ) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(
                    event.target as Node
                )
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener(
            'mousedown',
            handleClickOutside
        );

        return () => {
            document.removeEventListener(
                'mousedown',
                handleClickOutside
            );
        };
    }, [isOpen]);

    const handlePresetClick = (
        range: DateRange
    ) => {
        setDraftRange({
            from: parseIsoDate(range.fromDate),
            to: parseIsoDate(range.toDate),
        });
    };

    const handleApply = () => {
        if (
            !draftRange?.from ||
            !draftRange?.to
        ) {
            return;
        }

        onApply({
            fromDate: toIsoDate(draftRange.from),
            toDate: toIsoDate(draftRange.to),
        });

        setIsOpen(false);
    };

    const handleClearDraft = () => {
        setDraftRange(undefined);
    };

    const handleClearApplied = (
        event: React.MouseEvent<HTMLSpanElement>
    ) => {
        event.stopPropagation();

        onClear();

        setDraftRange(undefined);
    };

    const isPresetActive = (presetRange: DateRange) => {
        if (!draftRange?.from || !draftRange?.to) return false;
        return (
            toIsoDate(draftRange.from) === presetRange.fromDate &&
            toIsoDate(draftRange.to) === presetRange.toDate
        );
    };

    return (
        <div
            ref={containerRef}
            className="relative inline-flex w-full sm:w-auto"
        >
            {/* Filter Trigger Button */}
            <button
                type="button"
                id="custom-date-range-filter-btn"
                onClick={() => setIsOpen((prev) => !prev)}
                className={`w-full sm:w-auto h-[42px] px-3.5! flex items-center justify-between sm:justify-center gap-2.5 rounded-xl border text-sm font-medium transition-all cursor-pointer select-none ${
                    isActive
                        ? 'bg-[var(--bg-surface)] border-[var(--gold)] text-[var(--ink)] shadow-xs ring-1 ring-[var(--gold)]/30'
                        : 'bg-[var(--bg-surface)] border-[var(--line)] text-[var(--ink)] hover:border-[var(--line-strong)] hover:bg-[var(--bg-hover)]'
                }`}
            >
                <div className="flex items-center gap-2">
                    <CalendarIcon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                            isActive
                                ? 'text-[var(--gold)]'
                                : 'text-[var(--mute)]'
                        }`}
                    />

                    <span className="whitespace-nowrap font-medium text-xs sm:text-sm">
                        {isActive
                            ? `${formatDisplayDate(
                                  value.fromDate
                              )} - ${formatDisplayDate(
                                  value.toDate
                              )}`
                            : label}
                    </span>
                </div>

                {isActive && (
                    <span
                        role="button"
                        tabIndex={0}
                        aria-label="Clear date range"
                        onClick={handleClearApplied}
                        onKeyDown={(event) => {
                            if (
                                event.key === 'Enter' ||
                                event.key === ' '
                            ) {
                                event.preventDefault();
                                event.stopPropagation();
                                onClear();
                                setDraftRange(undefined);
                            }
                        }}
                        className="p-0.5! rounded-full text-[var(--mute)] hover:text-[var(--ink)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
                    >
                        <X className="w-3.5 h-3.5" />
                    </span>
                )}
            </button>

            {/* Date Range Dropdown Popover */}
            {isOpen && (
                <div className="absolute left-0 sm:left-auto right-0 top-full z-50 mt-2! w-[calc(100vw-2rem)] sm:w-max min-w-[320px] sm:min-w-[420px] max-w-[92vw] sm:max-w-none bg-[var(--bg-surface)] border border-[var(--line)] rounded-2xl shadow-xl shadow-black/10 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-[var(--line)] px-4! py-3! bg-[var(--bg-subtle)]/60">
                        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-soft)]">
                            Select date range
                        </span>

                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="p-1! rounded-lg text-[var(--mute)] hover:text-[var(--ink)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
                            aria-label="Close"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-4! space-y-4">
                        <div className="flex flex-col sm:flex-row gap-4">
                            {/* Preset Buttons Sidebar */}
                            <div className="flex sm:flex-col gap-1 border-b sm:border-b-0 sm:border-r border-[var(--line)] pb-2! sm:pb-0! sm:pr-3! sm:w-32 shrink-0 overflow-x-auto sm:overflow-x-visible">
                                {PRESETS.map((preset) => {
                                    const presetRange = preset.getRange();
                                    const isCurrent = isPresetActive(presetRange);

                                    return (
                                        <button
                                            key={preset.label}
                                            type="button"
                                            onClick={() =>
                                                handlePresetClick(presetRange)
                                            }
                                            className={`rounded-lg px-3! py-2! text-left text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                                                isCurrent
                                                    ? 'bg-[var(--bg-hover)] text-[var(--ink)] font-semibold border-l-2 border-[var(--gold)] pl-2.5!'
                                                    : 'text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-[var(--bg-hover)]'
                                            }`}
                                        >
                                            {preset.label}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Calendar Picker */}
                            <div className="flex justify-center">
                                <Calendar
                                    mode="range"
                                    numberOfMonths={1}
                                    selected={draftRange}
                                    onSelect={setDraftRange}
                                    disabled={{
                                        after: new Date(),
                                    }}
                                    defaultMonth={
                                        draftRange?.from ?? new Date()
                                    }
                                    className="p-0! bg-transparent"
                                />
                            </div>
                        </div>

                        {/* Selected Range Info Chip */}
                        <div className="rounded-xl px-3.5! py-2.5! bg-[var(--bg-subtle)] border border-[var(--line)] text-xs font-medium text-[var(--ink)] flex items-center justify-between">
                            <span className="text-[var(--mute)]">Range:</span>
                            <span className="font-semibold text-[var(--ink)]">
                                {draftRange?.from
                                    ? `${formatDisplayDate(
                                          toIsoDate(draftRange.from)
                                      )} ${
                                          draftRange.to
                                              ? `→ ${formatDisplayDate(
                                                    toIsoDate(draftRange.to)
                                                )}`
                                              : '→ Select end date'
                                      }`
                                    : 'Select a start and end date'}
                            </span>
                        </div>

                        {/* Footer Actions */}
                        <div className="flex items-center justify-between border-t border-[var(--line)] pt-3!">
                            <button
                                type="button"
                                onClick={handleClearDraft}
                                className="px-3.5! py-1.5! text-xs font-medium rounded-lg text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-[var(--bg-hover)] border border-[var(--line)] transition-colors cursor-pointer"
                            >
                                Clear
                            </button>

                            <button
                                type="button"
                                onClick={handleApply}
                                disabled={isApplyDisabled}
                                className="px-4! py-1.5! text-xs font-semibold rounded-lg transition-all cursor-pointer bg-[var(--nav-bg)] text-[var(--nav-text-strong)] hover:bg-[var(--nav-active)] border border-[var(--gold)]/30 disabled:opacity-40 disabled:pointer-events-none disabled:cursor-not-allowed shadow-xs"
                            >
                                Apply
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}