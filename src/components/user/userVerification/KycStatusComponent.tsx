import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, RefreshCw, Mail } from 'lucide-react';
import CustomButtonComponent from '@/components/common/CustomButtonComponent';
import { type KycDataType, type KycStatusOption } from '@/fallbacks/user/userVerification/kycStatusFallbacks';

interface KycStatusComponentProps {
    kycData: KycDataType;
    onOpenSidebar: () => void;
}

// ── KYC Status Badge ────────────────────────────────────────────────────────
function KycStatusBadge({ status }: { status: KycStatusOption }) {
    switch (status) {
        case 'COMPLETED':
            return (
                <span className="inline-flex items-center gap-1.5 px-3.5! py-1.5! rounded-full text-xs font-semibold tracking-wide bg-[var(--ok-bg)] text-[var(--ok)] border border-[var(--ok)]/20">
                    <CheckCircle2 className="w-4 h-4" />
                    Kyc verification completed
                </span>
            );
        case 'IN-PROGRESS':
            return (
                <span className="inline-flex items-center gap-1.5 px-3.5! py-1.5! rounded-full text-xs font-semibold tracking-wide bg-[var(--info-bg)] text-[var(--info)] border border-[var(--info)]/20">
                    <Clock className="w-4 h-4 animate-spin-slow" />
                    Kyc verification in progress
                </span>
            );
        case 'RFI':
            return (
                <span className="inline-flex items-center gap-1.5 px-3.5! py-1.5! rounded-full text-xs font-semibold tracking-wide bg-[var(--warn-bg)] text-[var(--warn)] border border-[var(--warn)]/20">
                    <AlertTriangle className="w-4 h-4" />
                    RFI - Information Required
                </span>
            );
        case 'PENDING':
        default:
            return (
                <span className="inline-flex items-center gap-1.5 px-3.5! py-1.5! rounded-full text-xs font-semibold tracking-wide bg-[var(--warn-bg)] text-[var(--warn)] border border-[var(--warn)]/20">
                    <Clock className="w-4 h-4" />
                    Pending Verification
                </span>
            );
    }
}

export default function KycStatusComponent({ kycData, onOpenSidebar }: KycStatusComponentProps) {
    const isCompleted = kycData.kyc_status === 'COMPLETED';
    const isInProgress = kycData.kyc_status === 'IN-PROGRESS';
    const canUpdateKyc = kycData.kyc_status === 'PENDING' || kycData.kyc_status === 'RFI';

    return (
        <div className="kycStatus-wrapper w-full h-fit flex flex-col gap-6">
            {/* Main Status Information Display Box (Non-form UI) */}
            <div className="w-full p-6! border border-[var(--line)] bg-[var(--bg-subtle)] rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xs">
                <div className="flex flex-col gap-3">
                    {/* User Email */}
                    <div className="flex items-center gap-2 text-sm text-[var(--ink-soft)]">
                        <Mail className="w-4 h-4 text-[var(--mute)] shrink-0" />
                        <span className="font-medium text-[var(--ink)]">{kycData.email}</span>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--mute)]">
                            KYC Status:
                        </span>
                        <KycStatusBadge status={kycData.kyc_status} />
                    </div>
                </div>

                {/* Action Button (Update KYC for PENDING & RFI) */}
                {canUpdateKyc && (
                    <div className="w-full md:w-[160px] h-[40px] shrink-0">
                        <CustomButtonComponent
                            id="kycStatus-update-btn"
                            label={
                                <span className="flex items-center justify-center gap-2">
                                    <RefreshCw className="w-4 h-4" />
                                    Update Kyc
                                </span>
                            }
                            type="button"
                            variant="navy"
                            onClick={onOpenSidebar}
                        />
                    </div>
                )}
            </div>

            {/* Status Informational Callout Messages */}
            {isInProgress && (
                <div className="p-4 rounded-lg bg-[var(--info-bg)] border border-[var(--info)]/20 text-xs text-[var(--info)] leading-relaxed">
                    <strong>Note:</strong> Your KYC documents are currently under review by our compliance team. You will not be able to update or upload new documents while verification is in progress.
                </div>
            )}
            {isCompleted && (
                <div className="p-4 rounded-lg bg-[var(--ok-bg)] border border-[var(--ok)]/20 text-xs text-[var(--ok)] leading-relaxed">
                    <strong>Verified:</strong> Your identity and address documents have been successfully verified and approved.
                </div>
            )}
            {canUpdateKyc && (
                <div className="p-4 rounded-lg bg-[var(--warn-bg)] border border-[var(--warn)]/20 text-xs text-[var(--warn)] leading-relaxed">
                    <strong>Action Required:</strong> Please click the <strong>Update Kyc</strong> button above to resubmit or update your Proof of Address (POA) and Proof of Identity (POI) documents.
                </div>
            )}
        </div>
    );
}
