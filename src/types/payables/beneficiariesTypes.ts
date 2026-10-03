export interface BeneficiaryItemType {
    _id: string;
    account_number: string;
    account_currency?: string;
    account_holder_name: string;
    swift_code: string;
    iban_code: string;
    bank_name: string;
    createdAt?: string;
}

export interface BeneficiaryDetailsResponseType {
    status: string;
    message: string;
    data: BeneficiaryItemType;
}

export interface BeneficiariesListPaginationType {
    current_page: number;
    page_size: number;
    total_records: number;
    total_pages: number;
    has_next_page: boolean;
    has_previous_page: boolean;
}

export interface BeneficiariesListResponseDataType {
    pagination: BeneficiariesListPaginationType;
    beneficiaries: BeneficiaryItemType[];
}

export interface BeneficiariesListResponseType {
    status: string;
    message: string;
    data: BeneficiariesListResponseDataType;
}

export interface AddBeneficiaryRequestBody {
    account_number: string;
    account_currency: string;
    account_holder_name: string;
    swift_code: string;
    iban_code: string;
    bank_name: string;
}