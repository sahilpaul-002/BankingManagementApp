import { ShieldAlert } from "lucide-react";
import CustomButtonComponent from "@/components/common/CustomButtonComponent";

interface VerificationRequiredBannerProps {
    title: string;
    description: string;
    buttonText: string;
    onAction: () => void;
}

export default function VerificationRequiredBanner({
    title,
    description,
    buttonText,
    onAction,
}: VerificationRequiredBannerProps) {
    return (
        <div
            className="mb-6! rounded-xl border p-6!"
            style={{
                backgroundColor: "var(--warn-bg)",
                borderColor: "var(--warn)",
                borderLeftWidth: "5px",
            }}
        >
            <div className="flex justify-center items-start gap-4">
                <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
                    style={{
                        backgroundColor: "var(--warn)",
                    }}
                >
                    <ShieldAlert
                        className="h-6 w-6"
                        style={{ color: "var(--bg-surface)" }}
                    />
                </div>

                <div className="flex flex-col justify-center itmes-start gap-5">
                    <div>
                        <h2
                            className="mb-2! text-lg font-semibold"
                            style={{ color: "var(--ink)" }}
                        >
                            {title}
                        </h2>

                        <p
                            className="max-w-3xl text-sm leading-6"
                            style={{ color: "var(--mute)" }}
                        >
                            {description}
                        </p>
                    </div>

                    <div className="w-fit h-fit">
                        <CustomButtonComponent
                            variant="navy"
                            onClick={onAction}
                            className="whitespace-nowrap"
                        >
                            {buttonText}
                        </CustomButtonComponent>
                    </div>
                </div>
            </div>
        </div>
    );
}