export type KycStatusOption = 'PENDING' | 'IN-PROGRESS' | 'RFI' | 'COMPLETED';

export interface KycDataType {
    email: string;
    kyc_request_id: string;
    kyc_status: KycStatusOption;
    poa_document_name?: string;
    poi_document_name?: string;
}

export interface KycApiResponseType {
    status: string;
    message: string;
    data: KycDataType | null;
}

export const KYC_STATUS_FALLBACK: KycDataType = {
    email: "bmatest01@yopmail.com",
    kyc_request_id: "b491418c-9877-4a8c-afed-3de42e6b5a1a",
    kyc_status: "COMPLETED",
    poa_document_name: "proof_of_address.pdf",
    poi_document_name: "proof_of_identity.pdf",
};
