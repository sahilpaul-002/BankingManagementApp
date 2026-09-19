import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { toast } from 'react-toastify';

interface PrefundingDetailItemComponentProps {
    id: string;
    label: string;
    value?: string | null;
    // Use `children` for custom content such as badges
    children?: React.ReactNode;
    copyable?: boolean;
    breakAll?: boolean;
    className?: string;
}

export default function PrefundingDetailItemComponent({
    id,
    label,
    value,
    children,
    copyable = false,
    breakAll = false,
    className = '',
}: PrefundingDetailItemComponentProps) {
    const [isCopied, setIsCopied] = useState(false);

    const displayValue = value && value.trim() !== '' ? value : '—';
    const canCopy = copyable && !!value && value.trim() !== '';

    const handleCopy = async () => {
        if (!value) return;

        try {
            await navigator.clipboard.writeText(value);
            setIsCopied(true);
            toast.success(`${label} copied to clipboard.`);
            setTimeout(() => setIsCopied(false), 1500);
        } catch {
            toast.error(`Failed to copy ${label.toLowerCase()}. Please try again.`);
        }
    };

    return (
        <div className={`w-full h-fit flex flex-col justify-center items-start gap-2 ${className}`}>
            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">
                {label}
            </span>

            <div className="w-full min-h-10 flex items-center justify-between gap-3 px-3! py-2! border border-[var(--line)] rounded-md bg-[var(--bg-subtle)]">
                {children ?? (
                    <span
                        id={id}
                        className={`text-sm text-[var(--ink)] ${breakAll ? 'break-all' : 'truncate'}`}
                    >
                        {displayValue}
                    </span>
                )}

                {canCopy && (
                    <button
                        id={`${id}-copy-btn`}
                        type="button"
                        onClick={handleCopy}
                        title={`Copy ${label.toLowerCase()}`}
                        className="shrink-0 p-1! rounded text-[var(--mute)] hover:text-[var(--ink)] transition-colors duration-150 cursor-pointer"
                    >
                        {isCopied ? <Check className="w-4 h-4 text-[var(--ok)]" /> : <Copy className="w-4 h-4" />}
                    </button>
                )}
            </div>
        </div>
    );
}