export interface UserDetailsType {
    _id: string;
    full_name: string;
    business_name: string;
    program_type: 'MASTER' | 'VISA';
    email: string;
    mobile_country_code: string;
    mobile_country_name: string;
    phone_number: string;
    date_of_birth: string;
    gender: string;
    is_admin: 'Y' | 'N';
    cardholder_id: string;
    status: string;
    is_active: 'Y' | 'N';
    is_email_verified: 'Y' | 'N';
    two_fa_type : "SMS-OTP" | "EMAIL-OTP" | "TOTP"
}

export interface AddressDetailsType {
    _id: string;
    user_id: string;
    billing_address: AddressType;
    delivery_address: AddressType;
}

export interface AddressType {
    line1: string;
    line2: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    type: 'Billing' | 'Delivery';
}

export interface BankDetailsType {
    _id: string;
    user_id: string;
    account_holder_name: string;
    account_number: string;
    swift_code: string;
    iban_code: string;
    bank_name: string;
    is_verified: boolean;
}

export interface UserOnboardingDetailsType {
    userId: string;
    addressDetails: AddressDetailsType;
    bankDetails: BankDetailsType;
}