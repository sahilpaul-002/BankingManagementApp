export function isKycApproved(kycDetails: any): boolean {
    if (!kycDetails) return false;

    const status = kycDetails?.kyc_status?.toUpperCase?.();

    return status === "COMPLETED";
}