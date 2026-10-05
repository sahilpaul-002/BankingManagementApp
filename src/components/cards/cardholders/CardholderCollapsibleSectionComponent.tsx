import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface CardholderCollapsibleSectionComponentPropsType {
    title: string;
    defaultOpen?: boolean;
    children: React.ReactNode;
}

export default function CardholderCollapsibleSectionComponent({
    title,
    defaultOpen = false,
    children,
}: CardholderCollapsibleSectionComponentPropsType) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="flex flex-col pt-4! border-t border-[var(--line)]">
            {/* Collapsible Section Header */}
            <button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                className="flex items-center justify-between w-full py-1 text-xs font-semibold text-[var(--mute)] hover:text-[var(--ink)] uppercase tracking-wider transition-colors cursor-pointer group"
                aria-expanded={isOpen}
            >
                <span>{title}</span>
                <ChevronDown
                    className={`w-4 h-4 text-[var(--mute)] group-hover:text-[var(--ink)] transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : 'rotate-0'
                    }`}
                />
            </button>

            {/* Collapsible Section Body */}
            {isOpen && <div className="pt-3 flex flex-col gap-3">{children}</div>}
        </div>
    );
}
