// =============================
// CARDHOLDER ITEM TYPE
// =============================
export interface CardholderItemType {
    _id: string;
    full_name: string;
    business_name: string;
    program_type: string;
    email: string;
    mobile_country_code: string;
    mobile_country_name: string;
    phone_number: string;
    date_of_birth: string;
    gender: 'MALE' | 'FEMALE';
    kyc_status: 'PENDING' | 'IN-PROGRESS' | 'RFI' | 'COMPLETED';
    cardholder_id: string | null;
    status: 'DISABLED' | 'PRE-VERIFIED' | 'VERIFIED' | 'ACTIVE';
    is_active: 'Y' | 'N';
    is_email_verified: 'Y' | 'N';
    is_2fa_enabled: 'Y' | 'N';
    two_fa_type: string | null;
    createdAt: string;
}

// =============================
// PAGINATION TYPE
// =============================
export interface CardholdersListPaginationType {
    current_page: number;
    page_size: number;
    total_records: number;
    total_pages: number;
    has_next_page: boolean;
    has_previous_page: boolean;
}

// =============================
// LIST RESPONSE DATA TYPE
// =============================
export interface CardholdersListResponseDataType {
    pagination: CardholdersListPaginationType;
    cardholders: CardholderItemType[];
}

// =============================
// ADD CARDHOLDER REQUEST BODY
// =============================
export interface AddCardholderRequestBodyType {
    email: string;
    fullName: string;
    mobileCountryCode: string;
    mobileCountryName: string;
    phoneNumber: string;
    dateOfBirth: string;
    gender: 'MALE' | 'FEMALE';
}
