import React, { useEffect, useRef, useState } from 'react';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import type { DateRange as RDPDateRange } from 'react-day-picker';
import { Calendar } from '@/components/ui/calendar';
import CustomButtonComponent from '@/components/common/CustomButtonComponent';

export interface DateRange {
    fromDate: string;
    toDate: string;
}

interface CustomDateRangeFilterPropsType {
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

export default function CustomDateRangeFilter({
    value,
    onApply,
    onClear,
    label = 'Date range',
}: CustomDateRangeFilterPropsType) {
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

    return (
        <div
            ref={containerRef}
            className="relative inline-flex w-auto"
        >
            {/* 
                CustomButtonComponent itself is w-full.
                This wrapper constrains its width to the content.
            */}
            <div className="inline-flex w-auto">
                <CustomButtonComponent
                    type="button"
                    variant="outline"
                    onClick={() =>
                        setIsOpen((previous) => !previous)
                    }
                    className="!w-auto !h-auto min-w-fit whitespace-nowrap px-3! py-2! rounded-lg"
                >
                    <span className="flex items-center gap-2">
                        <CalendarIcon
                            className="w-4 h-4 shrink-0"
                            style={{
                                color: isActive
                                    ? 'var(--gold)'
                                    : 'var(--mute)',
                            }}
                        />

                        <span
                            className="whitespace-nowrap"
                            style={{
                                color: 'var(--ink)',
                            }}
                        >
                            {isActive
                                ? `${formatDisplayDate(
                                    value.fromDate
                                )} - ${formatDisplayDate(
                                    value.toDate
                                )}`
                                : label}
                        </span>

                        {isActive && (
                            <span
                                role="button"
                                tabIndex={0}
                                aria-label="Clear date range"
                                onClick={
                                    handleClearApplied
                                }
                                onKeyDown={(event) => {
                                    if (
                                        event.key ===
                                        'Enter' ||
                                        event.key === ' '
                                    ) {
                                        event.preventDefault();
                                        event.stopPropagation();

                                        onClear();
                                        setDraftRange(
                                            undefined
                                        );
                                    }
                                }}
                                className="ml-1 inline-flex items-center justify-center rounded-full p-0.5 cursor-pointer hover:bg-[var(--bg-hover)]"
                            >
                                <X
                                    className="w-3.5 h-3.5"
                                    style={{
                                        color: 'var(--mute)',
                                    }}
                                />
                            </span>
                        )}
                    </span>
                </CustomButtonComponent>
            </div>

            {isOpen && (
                <div
                    className="absolute right-0 top-full z-50 mt-2 w-max min-w-[420px] overflow-hidden rounded-xl border shadow-lg"
                    style={{
                        backgroundColor:
                            'var(--bg-surface)',
                        borderColor: 'var(--line)',
                    }}
                >
                    <div
                        className="flex items-center justify-between border-b px-4 py-3"
                        style={{
                            borderColor: 'var(--line)',
                        }}
                    >
                        <span
                            className="text-sm font-semibold"
                            style={{
                                color: 'var(--ink)',
                            }}
                        >
                            Select date range
                        </span>

                        <button
                            type="button"
                            onClick={() =>
                                setIsOpen(false)
                            }
                            className="rounded-md p-1 cursor-pointer hover:bg-[var(--bg-hover)]"
                            aria-label="Close"
                        >
                            <X
                                className="h-4 w-4"
                                style={{
                                    color: 'var(--ink-soft)',
                                }}
                            />
                        </button>
                    </div>

                    <div className="space-y-4 p-4">
                        <div className="flex gap-4">
                            <div
                                className="flex w-32 shrink-0 flex-col gap-1 border-r pr-3"
                                style={{
                                    borderColor:
                                        'var(--line)',
                                }}
                            >
                                {PRESETS.map(
                                    (preset) => (
                                        <button
                                            key={
                                                preset.label
                                            }
                                            type="button"
                                            onClick={() =>
                                                handlePresetClick(
                                                    preset.getRange()
                                                )
                                            }
                                            className="rounded-md px-3 py-2 text-left text-xs font-medium cursor-pointer hover:bg-[var(--bg-hover)]"
                                            style={{
                                                color:
                                                    'var(--ink)',
                                            }}
                                        >
                                            {
                                                preset.label
                                            }
                                        </button>
                                    )
                                )}
                            </div>

                            <Calendar
                                mode="range"
                                numberOfMonths={1}
                                selected={
                                    draftRange
                                }
                                onSelect={
                                    setDraftRange
                                }
                                disabled={{
                                    after: new Date(),
                                }}
                                defaultMonth={
                                    draftRange?.from ??
                                    new Date()
                                }
                            />
                        </div>

                        <div
                            className="rounded-md px-3 py-2 text-sm font-medium"
                            style={{
                                backgroundColor:
                                    'var(--bg-subtle)',
                                color: 'var(--ink)',
                            }}
                        >
                            {draftRange?.from
                                ? `${formatDisplayDate(
                                    toIsoDate(
                                        draftRange.from
                                    )
                                )} - ${draftRange.to
                                    ? formatDisplayDate(
                                        toIsoDate(
                                            draftRange.to
                                        )
                                    )
                                    : 'Select end date'
                                }`
                                : 'Select a start and end date'}
                        </div>

                        <div
                            className="flex items-center justify-between border-t pt-3"
                            style={{
                                borderColor:
                                    'var(--line)',
                            }}
                        >
                            <div className="inline-flex w-auto">
                                <CustomButtonComponent
                                    type="button"
                                    variant="outline"
                                    onClick={
                                        handleClearDraft
                                    }
                                    className="!w-auto !h-auto px-4! py-1.5! text-xs"
                                >
                                    Clear
                                </CustomButtonComponent>
                            </div>

                            <div className="inline-flex w-auto">
                                <CustomButtonComponent
                                    type="button"
                                    variant="default"
                                    onClick={
                                        handleApply
                                    }
                                    disabled={
                                        isApplyDisabled
                                    }
                                    className="!w-auto !h-auto px-4! py-1.5! text-xs"
                                >
                                    Apply
                                </CustomButtonComponent>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}