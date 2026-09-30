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

export interface BeneficiariesListResponseType {
    status: string;
    message: string;
    data: BeneficiaryItemType[];
}

export interface AddBeneficiaryRequestBody {
    account_number: string;
    account_currency: string;
    account_holder_name: string;
    swift_code: string;
    iban_code: string;
    bank_name: string;
}