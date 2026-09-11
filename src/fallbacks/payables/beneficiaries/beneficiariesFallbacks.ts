export interface BeneficiaryItem {
    _id: string;
    account_number: string;
    account_currency?: string;
    account_holder_name: string;
    swift_code: string;
    iban_code: string;
    bank_name: string;
    type?: string;
    payment_method?: string;
    country?: string;
    status?: string;
    created_at?: string;
    email?: string;
}

export interface BeneficiaryDetailsResponse {
    status: string;
    message: string;
    data: BeneficiaryItem;
}

export interface BeneficiariesListResponse {
    status: string;
    message: string;
    data: BeneficiaryItem[];
}

export interface AddBeneficiaryRequestBody {
    account_number: string;
    account_currency: string;
    account_holder_name: string;
    swift_code: string;
    iban_code: string;
    bank_name: string;
}

export const BENEFICIARIES_LIST_FALLBACK: BeneficiaryItem[] = [
    {
        _id: "6a994f40ea3940d9bc444b0b",
        account_number: "123456789012",
        account_currency: "USD",
        account_holder_name: "Jade Doe",
        swift_code: "BOFAUS3N",
        iban_code: "GB29NWBK60161331926819",
        bank_name: "Bank of America",
        type: "INDIVIDUAL",
        payment_method: "SWIFT",
        country: "SG",
        status: "ACTIVE",
        created_at: "09 Sept 2026",
        email: "jane.doe02@example.com"
    },
    {
        _id: "6a994f40ea3940d9bc444b0c",
        account_number: "987654321098",
        account_currency: "USD",
        account_holder_name: "Jane Doe",
        swift_code: "BOFAUS3N",
        iban_code: "GB29NWBK60161331926820",
        bank_name: "Bank of America",
        type: "INDIVIDUAL",
        payment_method: "SWIFT",
        country: "US",
        status: "ACTIVE",
        created_at: "10 Sept 2026",
        email: "jane.doe02@example.com"
    },
    {
        _id: "6a994f40ea3940d9bc444b0d",
        account_number: "456789012345",
        account_currency: "USD",
        account_holder_name: "Jane Doe",
        swift_code: "BOFAUS3N",
        iban_code: "GB29NWBK60161331926821",
        bank_name: "Bank of America",
        type: "INDIVIDUAL",
        payment_method: "SWIFT",
        country: "US",
        status: "ACTIVE",
        created_at: "11 Sept 2026",
        email: "jane.doe02@example.com"
    },
    {
        _id: "6a994f40ea3940d9bc444b0e",
        account_number: "789012345678",
        account_currency: "SGD",
        account_holder_name: "Jane Doe",
        swift_code: "BOFAUS3N",
        iban_code: "GB29NWBK60161331926822",
        bank_name: "Bank of America",
        type: "INDIVIDUAL",
        payment_method: "SWIFT",
        country: "SG",
        status: "ACTIVE",
        created_at: "11 Sept 2026",
        email: "jane.doe02@example.com"
    }
];

export const BENEFICIARY_DETAILS_FALLBACK: BeneficiaryItem = {
    _id: "6a994f40ea3940d9bc444b0b",
    account_number: "123456789012",
    account_currency: "USD",
    account_holder_name: "Jade Doe",
    swift_code: "BOFAUS3N",
    iban_code: "GB29NWBK60161331926819",
    bank_name: "Bank of America",
    type: "INDIVIDUAL",
    payment_method: "SWIFT",
    country: "US",
    status: "ACTIVE",
    created_at: "09 Sept 2026",
    email: "jane.doe02@example.com"
};

export const ADD_BENEFICIARY_INITIAL_VALUES: AddBeneficiaryRequestBody = {
    account_number: "",
    account_currency: "USD",
    account_holder_name: "",
    swift_code: "",
    iban_code: "",
    bank_name: ""
};
