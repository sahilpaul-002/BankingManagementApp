export interface KycNotAvailableFallbackType {
    title: string;
    message: string;
    actionLabel: string;
}

export const KYC_NOT_AVAILABLE_FALLBACK: KycNotAvailableFallbackType = {
    title: "KYC Verification Not Available",
    message: "Your KYC verification details are currently not available. Please upload your Proof of Address (POA) and Proof of Identity (POI) documents to initiate verification.",
    actionLabel: "Upload Kyc",
};
