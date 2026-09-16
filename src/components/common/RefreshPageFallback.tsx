import { RefreshCw, ShieldAlert } from "lucide-react";
import { createPortal } from "react-dom";
import CustomButtonComponent from "./CustomButtonComponent";
import clsx from "clsx";

export interface RefreshPageFallbackProps {
    visible: boolean; // Whether the blocking overlay should be rendered
    onRetry: () => void;
    isLoading: boolean;
    title?: string;
    description?: string;
}

export default function RefreshPageFallback({
    visible,
    onRetry,
    isLoading,
    title = "Some Services Are Unavailable",
    description = "We couldn't load some of the required portal services. Please refresh the page or try again later.",
}: RefreshPageFallbackProps) {
    if (!visible) return null;

    const handleRefresh = () => {
        window.location.reload();
    };

    return createPortal(
        <div
            role="alertdialog"
            aria-modal="true"
            aria-label={title}
            className="fixed inset-0 z-[999998] flex items-center justify-center px-4!"
            style={{ backgroundColor: "rgba(15, 18, 25, 0.6)", backdropFilter: "blur(3px)" }}
        >
            <div
                className="rounded-lg border p-8! flex flex-col items-center text-center gap-4 max-w-md w-full shadow-xl"
                style={{
                    backgroundColor: "var(--bg-surface)",
                    borderColor: "var(--danger)",
                    borderLeftWidth: "4px",
                }}
            >
                <div
                    className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "var(--danger)" }}
                >
                    <ShieldAlert className="w-7 h-7" style={{ color: "var(--bg-surface)" }} />
                </div>
                <div>
                    <h4 className="text-lg font-semibold mb-1!" style={{ color: "var(--ink)" }}>
                        {title}
                    </h4>
                    <p className="text-sm" style={{ color: "var(--mute)" }}>
                        {description}
                    </p>
                </div>
                <div className="flex gap-2.5 mt-1">
                    <CustomButtonComponent
                        variant="outline"
                        onClick={onRetry}
                        disabled={isLoading}
                        className="whitespace-nowrap"
                    >
                        <RefreshCw className={clsx("h-3.5 w-3.5", isLoading && "animate-spin")} />
                        Refresh Page
                    </CustomButtonComponent>

                    {/* <CustomButton
                        variant="banking"
                        size="sm"
                        onClick={handleRefresh}
                        className="whitespace-nowrap cursor-pointer"
                    >
                        Refresh Page
                    </CustomButton> */}
                </div>
            </div>
        </div>,
        document.body
    );
}
