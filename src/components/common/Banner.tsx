import { BadgeInfo, CircleX } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

export type BannerVariant = "ERROR" | "INFO";

export interface BannerProps {
    message: string;
    variant: BannerVariant;
    visible: boolean;
    onDismiss?: () => void;
    autoDismissMs?: number;
}
type VariantConfig = {
    wrapper: string;
    icon: ReactNode;
    label: string;
};

const VARIANT_CONFIG: Record<BannerVariant, VariantConfig> = {
    ERROR: {
        wrapper: "bg-red-50 border-b border-red-200 text-red-800",
        // icon: "✖",
        icon: <CircleX size={18}/>,
        label: "Error",
    },
    INFO: {
        wrapper: "bg-yellow-50 border-b border-yellow-200 text-yellow-800",
        // icon: "ℹ",
        icon: <BadgeInfo size={18}/>,
        label: "Info",
    },
};


export default function Banner({
    message,
    variant,
    visible,
    onDismiss,
    autoDismissMs,
}: BannerProps) {
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const { wrapper, icon, label } = VARIANT_CONFIG[variant];

    useEffect(() => {
        if (visible && autoDismissMs && onDismiss) {
            timerRef.current = setTimeout(onDismiss, autoDismissMs);
        }
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [visible, autoDismissMs, onDismiss]);

    if (!visible) return null;

    return createPortal(
        <div
            role="alert"
            aria-live="assertive"
            aria-label={`${label}: ${message}`}
            className={`
        fixed top-0 left-0 right-0 z-[9999]
        flex items-center gap-3 px-5! py-1!
        text-sm font-medium shadow-sm
        animate-[bannerSlideDown_0.25s_ease]
        ${wrapper}
      `}
        >
            <style>{`
        @keyframes bannerSlideDown {
          from { transform: translateY(-100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>

            <span className="shrink-0 text-base leading-none" aria-hidden="true">
                {icon}
            </span>

            <span className="flex-1">{message}</span>

            {onDismiss && (
                <button
                    onClick={onDismiss}
                    aria-label="Dismiss banner"
                    className="
            shrink-0 rounded px-1.5 py-0.5
            text-base leading-none opacity-60
            hover:opacity-100 hover:bg-black/10
            transition-all duration-150
            cursor-pointer border-none bg-transparent text-inherit
          "
                >
                    ✕
                </button>
            )}
        </div>,
        document.body
    );
}