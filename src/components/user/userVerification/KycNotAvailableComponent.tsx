import React from 'react';
import { ShieldAlert, UploadCloud } from 'lucide-react';
import CustomButtonComponent from '@/components/common/CustomButtonComponent';

interface KycNotAvailableFallbackType {
    title: string;
    message: string;
    actionLabel: string;
}

const KYC_NOT_AVAILABLE_FALLBACK: KycNotAvailableFallbackType = {
    title: "KYC Verification Not Available",
    message: "Your KYC verification details are currently not available. Please upload your Proof of Address (POA) and Proof of Identity (POI) documents to initiate verification.",
    actionLabel: "Upload Kyc",
};

interface KycNotAvailableComponentProps {
    onOpenSidebar: () => void;
}

export default function KycNotAvailableComponent({ onOpenSidebar }: KycNotAvailableComponentProps) {
    return (
        <div className="kycNotAvailable-container w-full h-fit flex flex-col justify-center items-center gap-6 p-8! border border-[var(--line)] bg-[var(--bg-subtle)] rounded-xl text-center shadow-xs">
            <div className="w-14 h-14 rounded-full bg-[var(--warn-bg)] flex items-center justify-center text-[var(--warn)] shadow-inner">
                <ShieldAlert className="w-7 h-7" />
            </div>

            <div className="max-w-md flex flex-col items-center gap-2">
                <h3 className="text-lg font-semibold text-[var(--ink)] tracking-normal">
                    {KYC_NOT_AVAILABLE_FALLBACK.title}
                </h3>
                <p className="text-sm text-[var(--mute)] leading-relaxed">
                    {KYC_NOT_AVAILABLE_FALLBACK.message}
                </p>
            </div>

            <div className="w-[170px] h-[40px] mt-2!">
                <CustomButtonComponent
                    id="kycNotAvailable-upload-btn"
                    label={
                        <span className="flex items-center gap-2">
                            <UploadCloud className="w-4 h-4" />
                            {KYC_NOT_AVAILABLE_FALLBACK.actionLabel}
                        </span>
                    }
                    type="button"
                    variant="navy"
                    onClick={onOpenSidebar}
                />
            </div>
        </div>
    );
}
