export type KycStatusOption = 'PENDING' | 'IN-PROGRESS' | 'RFI' | 'COMPLETED';

export interface KycDetailsType {
    email: string;
    kyc_request_id: string;
    kyc_status: KycStatusOption;
    poa_document_name?: string;
    poi_document_name?: string;
}

export interface KycApiResponseType {
    status: string;
    message: string;
    data: KycDetailsType | null;
}

export interface KycStatusDataType {
    email: string;
    kyc_request_id: string;
    kyc_status: KycStatusOption;
}