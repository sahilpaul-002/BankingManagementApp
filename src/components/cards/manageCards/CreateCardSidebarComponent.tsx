import { useEffect } from 'react';
import { X, CreditCard, Sparkles } from 'lucide-react';

interface CreateCardSidebarComponentPropsType {
    isOpen: boolean;
    onClose: () => void;
}

export default function CreateCardSidebarComponent({
    isOpen,
    onClose,
}: CreateCardSidebarComponentPropsType) {
    // Lock background scroll when drawer is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-200"
                onClick={onClose}
            />

            {/* Right Drawer Panel */}
            <div className="relative z-10 w-full max-w-md h-full bg-[var(--bg-surface)] border-l border-[var(--line)] shadow-2xl flex flex-col overflow-y-auto animate-[slideInRight_0.25s_ease-out]">
                <style>{`
                    @keyframes slideInRight {
                        from { transform: translateX(100%); }
                        to { transform: translateX(0); }
                    }
                `}</style>

                {/* Sidebar Header */}
                <div className="p-6! border-b border-[var(--line)] flex items-center justify-between bg-[var(--bg-surface)]">
                    <h3 className="text-xl font-normal text-[var(--ink)] tracking-normal">
                        <span className="font-serif font-medium">Create</span>{' '}
                        <span className="font-serif italic font-normal">Card</span>
                    </h3>
                    <button
                        type="button"
                        id="createCardSidebar-close-btn"
                        onClick={onClose}
                        className="p-1.5! rounded-lg text-[var(--mute)] hover:text-[var(--ink)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
                        aria-label="Close create card drawer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content Body */}
                <div className="p-6! flex-1 flex flex-col items-center justify-center gap-4 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--line)] flex items-center justify-center text-[var(--gold)]">
                        <CreditCard className="w-8 h-8" />
                    </div>
                    <div className="flex flex-col gap-1 max-w-xs">
                        <h4 className="text-base font-semibold text-[var(--ink)]">Issue New Card</h4>
                        <p className="text-xs text-[var(--mute)] leading-relaxed">
                            Card creation options and configuration form will be available here.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
