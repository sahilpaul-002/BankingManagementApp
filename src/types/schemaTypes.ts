import { Document, Types } from "mongoose";

// Type for Portal Configuration Model Schema
export interface portalConfigurationSchemaTypes extends Document {
    domain_name: string;
    agent_code: string;
    subagent_code: string;
    business_id: string;
    dashboard_name: string;
    program_id: string;
    prefund_flag: boolean;
    client_id: string;
    x_api_key: string;
    logo_url?: string | null;
    base_url_api: string;
    nationality_list_url?: string | null;
    mobilecountry_list_url?: string | null;
    country_list_url?: string | null;
    favicon?: string | null;
    add_card_allowed: boolean;
    crypto_allowed: boolean;
    slogan_line_1?: string | null;
    slogan_line_2?: string | null;
    logo?: string | null;
    currency_symbol: string;
    currency_name: string;
    currency_img: string;
    userportal_link?: string | null;
    signup_required: boolean;
    dns_x_api_key: string;
    portal_type: string;
    m2p_allowed: boolean;
    p2p_allowed: boolean;
}

// Type for User Details Model Schema
export interface userDetailsSchemaTypes extends Document {
    full_name: string;
    agent_code: string;
    subagent_code: string;
    program_id: string;
    client_id: string;
    business_id: string;
    email: string;
    password: string;
    mobile_country_code: string;
    mobile_country_name: string;
    phone_number: string;
    date_of_birth: Date;
    gender: "MALE" | "FEMALE" | "OTHER";
    kyc_status: "PENDING" | "IN-PROGRESS" | "COMPLETED";
    risk_category?: "LOW" | "MEDIUM" | "HIGH";
    wallet_id?: string | null;
    status?: "DISABLED" | "PRE-VERIFIED" | "VERIFIED" | "ACTIVE";
    is_admin?: "Y" | "N";
    is_master_admin?: "Y" | "N";
    is_active?: "Y" | "N";
    is_email_verified?: "Y" | "N";
    is_phone_verified?: "Y" | "N";
    is_2fa_enabled?: "Y" | "N";
    two_fa_type: "SMS-OTP" | "EMAIL-OTP" | "TOTP" | null;
    authenticator_secret: string | null;
    last_login_at?: Date;
}

// Type for User Meta Details Model Schema
export interface userMetaDetailsSchemaTypes extends Document {
    user_id: Types.ObjectId | string;
    device_id?: string | null;
    ip_address?: string | null;
    userAgent?: string | null;
    login_at?: Date | null;
    verification_code?: string | null;
    verification_code_expires_at?: Date | null;
}

// Type for User Bank Details Model Schema
export interface userBankDetailsSchemaTypes extends Document {
    user_id: Types.ObjectId;
    account_holder_name: string;
    account_number: string;
    swift_code: string;
    iban_code: string;
    bank_name: string;
    is_verified?: boolean;
}

// Type for User Address Details Types
export interface billingAddressTypes {
    line1: string;
    line2?: string | null;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    type: "Billing";
}
export interface deliveryAddressTypes {
    line1: string;
    line2?: string | null;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    type: "Delivery";
}
export interface userAddressDetailsSchemaTypes extends Document {
    user_id: Types.ObjectId;
    billing_address: billingAddressTypes;
    delivery_address: deliveryAddressTypes;
}

// Types for User Kyc Details Model Schema
export interface userKycDetailsSchemaTypes extends Document {
    user_id: Types.ObjectId;
    kyc_status: "PENDING" | "IN-PROGRESS" | "COMPLETED";
    poi_number: string;
    poa_number: string;
    poi_document: string;
    poa_document: string;
}

// Types for User Wallet Details Model Schema
export interface userWalletDetailsSchemaTypes extends Document {
    user_id: Types.ObjectId;
    wallet_id: string;
    wallet_status: "ACTIVE" | "INACTIVE";
    account_balance: number;
    wallet_type: "FIAT" | "CRYPTO";
    wallet_currency: "USD" | "EUR" | "SGD" | "USDC" | "USDT";
}

// Type for Beneficiaries Bank Details Model Schema
export interface beneficiariesBankDetailsSchemaTypes extends Document {
    account_number: string;
    account_holder_name: string;
    swift_code: string;
    iban_code: string;
    bank_name: string;
    is_verified?: boolean;
}