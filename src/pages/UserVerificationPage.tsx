import React, { useState } from 'react';
import KycNotAvailableComponent from '@/components/user/userVerification/KycNotAvailableComponent';
import KycStatusComponent from '@/components/user/userVerification/KycStatusComponent';
import KycUploadSidebarComponent from '@/components/user/userVerification/KycUploadSidebarComponent';
import { KYC_STATUS_FALLBACK, type KycDataType } from '@/fallbacks/user/userVerification/kycStatusFallbacks';

export default function UserVerificationPage() {
    // KYC data state (null represents "Not Available / Not Found" state)
    const [kycData, setKycData] = useState<KycDataType | null>(KYC_STATUS_FALLBACK);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const handleOpenSidebar = () => {
        setIsSidebarOpen(true);
    };

    const handleCloseSidebar = () => {
        setIsSidebarOpen(false);
    };

    const handleUploadSuccess = (data: { poaName: string; poiName: string }) => {
        setKycData((prev) => ({
            email: prev?.email || sessionStorage.getItem('userEmail') || 'bmatest01@yopmail.com',
            kyc_request_id: prev?.kyc_request_id || 'b491418c-9877-4a8c-afed-3de42e6b5a1a',
            kyc_status: 'PENDING',
            poa_document_name: data.poaName,
            poi_document_name: data.poiName,
        }));
    };

    return (
        <div className="userVerificationPage-container w-full h-fit flex flex-col justify-start items-stretch gap-4 p-4! sm:p-6!">
            {/* Page Header */}
            <div className="mb-2! flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-[var(--ink)] tracking-normal">KYC Verification</h1>
                    <p className="text-sm text-[var(--mute)] mt-1!">
                        Manage and track your identity and proof of address document verification status.
                    </p>
                </div>

                {/* State simulator switcher for dev testing */}
                <div className="flex items-center gap-2 text-xs text-[var(--mute)] bg-[var(--bg-surface)] p-2 rounded-lg border border-[var(--line)]">
                    <span className="font-semibold text-[var(--ink-soft)]">Simulate State:</span>
                    <button
                        type="button"
                        onClick={() => setKycData(null)}
                        className={`px-2 py-1 rounded cursor-pointer transition-colors ${
                            kycData === null ? 'bg-[var(--warn-bg)] text-[var(--warn)] font-bold' : 'hover:bg-[var(--bg-hover)]'
                        }`}
                    >
                        Not Available
                    </button>
                    <button
                        type="button"
                        onClick={() => setKycData({ ...KYC_STATUS_FALLBACK, kyc_status: 'PENDING' })}
                        className={`px-2 py-1 rounded cursor-pointer transition-colors ${
                            kycData?.kyc_status === 'PENDING' ? 'bg-[var(--warn-bg)] text-[var(--warn)] font-bold' : 'hover:bg-[var(--bg-hover)]'
                        }`}
                    >
                        Pending
                    </button>
                    <button
                        type="button"
                        onClick={() => setKycData({ ...KYC_STATUS_FALLBACK, kyc_status: 'IN-PROGRESS' })}
                        className={`px-2 py-1 rounded cursor-pointer transition-colors ${
                            kycData?.kyc_status === 'IN-PROGRESS' ? 'bg-[var(--info-bg)] text-[var(--info)] font-bold' : 'hover:bg-[var(--bg-hover)]'
                        }`}
                    >
                        In Progress
                    </button>
                    <button
                        type="button"
                        onClick={() => setKycData({ ...KYC_STATUS_FALLBACK, kyc_status: 'RFI' })}
                        className={`px-2 py-1 rounded cursor-pointer transition-colors ${
                            kycData?.kyc_status === 'RFI' ? 'bg-[var(--warn-bg)] text-[var(--warn)] font-bold' : 'hover:bg-[var(--bg-hover)]'
                        }`}
                    >
                        RFI
                    </button>
                    <button
                        type="button"
                        onClick={() => setKycData({ ...KYC_STATUS_FALLBACK, kyc_status: 'COMPLETED' })}
                        className={`px-2 py-1 rounded cursor-pointer transition-colors ${
                            kycData?.kyc_status === 'COMPLETED' ? 'bg-[var(--ok-bg)] text-[var(--ok)] font-bold' : 'hover:bg-[var(--bg-hover)]'
                        }`}
                    >
                        Completed
                    </button>
                </div>
            </div>

            {/* Main Card */}
            <div className="w-full bg-[var(--bg-surface)] border border-[var(--line)] rounded-xl shadow-sm overflow-hidden p-6! sm:p-8!">
                {kycData === null ? (
                    <KycNotAvailableComponent onOpenSidebar={handleOpenSidebar} />
                ) : (
                    <KycStatusComponent kycData={kycData} onOpenSidebar={handleOpenSidebar} />
                )}
            </div>

            {/* Right Side Upload/Update KYC Drawer Sidebar */}
            <KycUploadSidebarComponent
                isOpen={isSidebarOpen}
                onClose={handleCloseSidebar}
                onUploadSuccess={handleUploadSuccess}
            />
        </div>
    );
}
