import { useState, useMemo, useEffect } from 'react';
import { Search, X, Check, Tag, Store, CheckSquare, Square } from 'lucide-react';
import { MERCHANT_CATEGORIES } from '@/types/cards/cardDetailsTypes';
import CustomButtonComponent from '@/components/common/CustomButtonComponent';

interface MerchantCategoriesModalComponentPropsType {
    isOpen: boolean;
    onClose: () => void;
    selectedCategories: string[];
    onSelectCategories: (categories: string[]) => void;
}

const formatCategoryLabel = (category: string) => {
    return category
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
};

export default function MerchantCategoriesModalComponent({
    isOpen,
    onClose,
    selectedCategories,
    onSelectCategories,
}: MerchantCategoriesModalComponentPropsType) {
    const [searchQuery, setSearchQuery] = useState('');
    const [tempSelected, setTempSelected] = useState<string[]>(selectedCategories);

    useEffect(() => {
        if (isOpen) {
            setTempSelected(selectedCategories);
            setSearchQuery('');
        }
    }, [isOpen, selectedCategories]);

    const filteredCategories = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return MERCHANT_CATEGORIES;
        return MERCHANT_CATEGORIES.filter((cat) =>
            cat.toLowerCase().replace(/_/g, ' ').includes(query)
        );
    }, [searchQuery]);

    if (!isOpen) return null;

    const handleToggleCategory = (category: string) => {
        if (tempSelected.includes(category)) {
            setTempSelected(tempSelected.filter((c) => c !== category));
        } else {
            setTempSelected([...tempSelected, category]);
        }
    };

    const handleSelectAll = () => {
        setTempSelected([...MERCHANT_CATEGORIES]);
    };

    const handleDeselectAll = () => {
        setTempSelected([]);
    };

    const handleApply = () => {
        onSelectCategories(tempSelected);
        onClose();
    };

    const handleClear = () => {
        setTempSelected([]);
        onSelectCategories([]);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4!">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-[fadeIn_0.2s_ease-out]"
                onClick={onClose}
            />

            {/* Modal Dialog Content */}
            <div className="relative z-10 w-full max-w-xl bg-[var(--bg-surface)] border border-[var(--line)] rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-[scaleIn_0.2s_ease-out]">
                <style>{`
                    @keyframes fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                    @keyframes scaleIn {
                        from { opacity: 0; transform: scale(0.95); }
                        to { opacity: 1; transform: scale(1); }
                    }
                `}</style>

                {/* Modal Header */}
                <div className="p-5! sm:p-6! border-b border-[var(--line)] flex items-center justify-between bg-[var(--bg-surface)]">
                    <div className="flex items-center gap-3">
                        <div className="p-2! rounded-xl bg-[var(--bg-subtle)] border border-[var(--line)] text-[var(--gold)]">
                            <Store className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-lg font-bold text-[var(--ink)]">
                                    Merchant Categories
                                </h3>
                                {tempSelected.length > 0 && (
                                    <span className="px-2! py-0.5! rounded-full text-[11px] font-semibold bg-[var(--nav-bg)] text-white">
                                        {tempSelected.length} selected
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-[var(--mute)]">
                                Select authorized merchant categories for this card (optional)
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        id="merchantCategoriesModal-close-btn"
                        onClick={onClose}
                        className="p-1.5! rounded-lg text-[var(--mute)] hover:text-[var(--ink)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
                        aria-label="Close modal"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Search Header & Quick Actions */}
                <div className="p-4! border-b border-[var(--line)] bg-[var(--bg-subtle)] flex flex-col sm:flex-row gap-3 items-center justify-between">
                    <div className="relative w-full">
                        <div className="absolute inset-y-0 left-0 pl-3.5! flex items-center pointer-events-none text-[var(--mute)]">
                            <Search className="w-4 h-4" />
                        </div>
                        <input
                            id="merchantCategories-search-input"
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search categories (e.g. Grocery, Airline, Telecom)..."
                            className="w-full pl-10! pr-4! py-2! bg-[var(--bg-surface)] border border-[var(--line)] rounded-xl text-xs sm:text-sm text-[var(--ink)] placeholder:text-[var(--mute)] focus:outline-hidden focus:border-[var(--line-strong)] focus:ring-1 focus:ring-[var(--line-strong)] transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                        <button
                            type="button"
                            onClick={handleSelectAll}
                            className="text-xs font-semibold text-[var(--ink-soft)] hover:text-[var(--ink)] hover:underline transition-all cursor-pointer"
                        >
                            Select All
                        </button>
                        <span className="text-[var(--line-strong)]">|</span>
                        <button
                            type="button"
                            onClick={handleDeselectAll}
                            className="text-xs font-semibold text-[var(--mute)] hover:text-[var(--danger)] transition-all cursor-pointer"
                        >
                            Deselect All
                        </button>
                    </div>
                </div>

                {/* Categories Grid List */}
                <div className="p-4! sm:p-5! flex-1 overflow-y-auto max-h-[50vh]">
                    {filteredCategories.length === 0 ? (
                        <div className="py-8! flex flex-col items-center justify-center gap-2 text-center text-[var(--mute)]">
                            <Tag className="w-8 h-8 opacity-40" />
                            <p className="text-xs sm:text-sm">No matching merchant category found</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                            {filteredCategories.map((category) => {
                                const isSelected = tempSelected.includes(category);
                                return (
                                    <button
                                        key={category}
                                        type="button"
                                        id={`merchantCategory-item-${category}`}
                                        onClick={() => handleToggleCategory(category)}
                                        className={`p-3! rounded-xl border text-left flex items-center justify-between gap-2 text-xs font-medium transition-all cursor-pointer ${
                                            isSelected
                                                ? 'bg-[var(--nav-bg)] text-white border-[var(--nav-bg)] shadow-xs'
                                                : 'bg-[var(--bg-surface)] border-[var(--line)] text-[var(--ink)] hover:border-[var(--line-strong)] hover:bg-[var(--bg-hover)]'
                                        }`}
                                    >
                                        <span className="truncate">{formatCategoryLabel(category)}</span>
                                        {isSelected ? (
                                            <Check className="w-3.5 h-3.5 text-[var(--gold-2)] shrink-0" />
                                        ) : (
                                            <Square className="w-3.5 h-3.5 text-[var(--mute)]/50 shrink-0" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="p-4! sm:p-5! border-t border-[var(--line)] bg-[var(--bg-surface)] flex items-center justify-between gap-3">
                    <button
                        type="button"
                        id="merchantCategoriesModal-clear-btn"
                        onClick={handleClear}
                        className="text-xs font-semibold text-[var(--mute)] hover:text-[var(--danger)] transition-colors cursor-pointer"
                    >
                        Clear Selection
                    </button>

                    <div className="flex items-center gap-2">
                        <div className="w-[85px] h-[36px]">
                            <CustomButtonComponent
                                id="merchantCategoriesModal-cancel-btn"
                                label="Cancel"
                                type="button"
                                variant="outline"
                                onClick={onClose}
                            />
                        </div>
                        <div className="w-[110px] h-[36px]">
                            <CustomButtonComponent
                                id="merchantCategoriesModal-apply-btn"
                                label={`Apply (${tempSelected.length})`}
                                type="button"
                                variant="navy"
                                onClick={handleApply}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
