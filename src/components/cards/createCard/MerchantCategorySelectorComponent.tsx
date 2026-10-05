import { useState } from 'react';
import { Tag, Store, X, ChevronRight } from 'lucide-react';
import MerchantCategoriesModalComponent from './MerchantCategoriesModalComponent';

interface MerchantCategorySelectorComponentPropsType {
    value: string[];
    onChange: (categories: string[]) => void;
    error?: string | undefined;
}

const formatCategoryLabel = (category: string) => {
    return category
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
};

export default function MerchantCategorySelectorComponent({
    value = [],
    onChange,
    error,
}: MerchantCategorySelectorComponentPropsType) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleOpenModal = () => setIsModalOpen(true);
    const handleCloseModal = () => setIsModalOpen(false);

    const handleRemoveCategory = (e: React.MouseEvent, categoryToRemove: string) => {
        e.stopPropagation();
        onChange(value.filter((c) => c !== categoryToRemove));
    };

    return (
        <div className="w-full flex flex-col gap-2">
            <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">
                    Merchant Categories <span className="text-[var(--mute)] font-normal lowercase">(optional)</span>
                </span>
                {value.length > 0 && (
                    <span className="text-xs font-medium text-[var(--gold)]">
                        {value.length} selected
                    </span>
                )}
            </div>

            {/* Selector Trigger Card */}
            <div
                id="merchantCategory-selector-trigger"
                onClick={handleOpenModal}
                className="w-full p-3.5! rounded-xl bg-[var(--bg-surface)] border border-[var(--line)] hover:border-[var(--line-strong)] transition-all cursor-pointer flex items-center justify-between gap-3 shadow-2xs group"
            >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="p-2! rounded-lg bg-[var(--bg-subtle)] border border-[var(--line)] text-[var(--gold)] shrink-0">
                        <Store className="w-4 h-4" />
                    </div>

                    {value && value.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-1.5 min-w-0 py-0.5!">
                            {value.slice(0, 2).map((cat) => (
                                <span
                                    key={cat}
                                    className="inline-flex items-center gap-1 px-2! py-0.5! rounded-md bg-[var(--nav-bg)] text-white text-[11px] font-medium"
                                >
                                    <Tag className="w-2.5 h-2.5 text-[var(--gold-2)]" />
                                    <span className="truncate max-w-[90px]">{formatCategoryLabel(cat)}</span>
                                    <button
                                        type="button"
                                        id={`merchantCategory-remove-${cat}`}
                                        onClick={(e) => handleRemoveCategory(e, cat)}
                                        className="p-0.5! ml-0.5! rounded hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
                                        aria-label={`Remove ${cat}`}
                                    >
                                        <X className="w-2.5 h-2.5" />
                                    </button>
                                </span>
                            ))}
                            {value.length > 2 && (
                                <span className="px-2! py-0.5! rounded-md bg-[var(--bg-subtle)] border border-[var(--line)] text-[var(--ink-soft)] text-[11px] font-semibold">
                                    +{value.length - 2} more
                                </span>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            <span className="text-xs font-medium text-[var(--ink)]">
                                All Categories Allowed
                            </span>
                            <span className="text-[11px] text-[var(--mute)]">
                                Click to restrict to specific merchant categories
                            </span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-1 text-[var(--mute)] group-hover:text-[var(--ink)] text-xs font-medium shrink-0 transition-colors">
                    <span>{value && value.length > 0 ? 'Edit' : 'Configure'}</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
            </div>

            {error && <p className="input-error mt-1!">{error}</p>}

            {/* Merchant Categories Modal */}
            <MerchantCategoriesModalComponent
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                selectedCategories={value}
                onSelectCategories={onChange}
            />
        </div>
    );
}
