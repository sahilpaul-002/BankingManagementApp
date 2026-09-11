export interface KycUploadSidebarFallbackType {
    title: string;
    description: string;
    poaLabel: string;
    poiLabel: string;
    maxFileSizeMb: number;
    allowedFormats: string[];
}

export const KYC_UPLOAD_SIDEBAR_FALLBACK: KycUploadSidebarFallbackType = {
    title: "KYC Verification Upload",
    description: "Please upload your Proof of Address (POA) and Proof of Identity (POI) documents. Files must be in PDF, PNG, JPG, or JPEG format and under 5 MB.",
    poaLabel: "Proof of Address (POA)",
    poiLabel: "Proof of Identity (POI)",
    maxFileSizeMb: 5,
    allowedFormats: ["PDF", "PNG", "JPG", "JPEG"],
};
