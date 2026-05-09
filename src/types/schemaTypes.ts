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
export interface userDetailsSchemaTypes extends Document{
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
    two_fa_type: "SMS-OTP" | "EMAIL-OTP" | "TOTP" | null
    last_login_at?: Date;
}

export interface userMetaDetailsSchemaTypes extends Document {
    user_id: Types.ObjectId | string;
    device_id: string;
    ip_address: string;
    userAgent?: string;
    login_at?: Date;
    verification_code?: string;
    verification_code_expires_at?: Date;
}

// Type for User Bank Details Model Schema
export interface userBankDetailsSchemaTypes extends Document{
    user_id: Types.ObjectId;
    account_holder_name: string;
    account_number: string;
    ifsc_code: string;
    bank_name: string;
    branch_name?: string | null;
    account_type?: "SAVINGS" | "CURRENT";
    is_verified?: boolean;
}

// TYPE for USER ADDRESS MODEL SCHEMA
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
    type: "Billing";
}
export interface userAddressModelSchemaTypes extends Document {
    user_id: Types.ObjectId;
    billing_address: billingAddressTypes;
    delivery_address: deliveryAddressTypes;
}