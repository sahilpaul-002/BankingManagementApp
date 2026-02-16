import { Document, Types } from "mongoose";

// Type for Portal Configuration Model Schema
export interface portalConfigurationSchema extends Document {
    domain_name: string;
    agent_code: string;
    subagent_code: string;
    businessId: string;
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
export interface userDetailsSchema extends Document{
    full_name: string;
    email: string;
    mobile_country_code: string;
    phone_number: string;
    date_of_birth: Date;
    gender: "MALE" | "FEMALE" | "OTHER";
    kyc_status: "PENDING" | "VERIFIED" | "REJECTED";
    risk_category?: "LOW" | "MEDIUM" | "HIGH";
    wallet_id?: string | null;
    status?: "ACTIVE" | "DISABLED" | "BLOCKED";
    is_active?: boolean;
    is_email_verified?: boolean;
    is_phone_verified?: boolean;
    is_2fa_enabled?: "AUTHENTICATOR" | "EMAIL" | "SMS" | "DISABLED" | null;
    last_login_at?: Date;
}

// Type for User Bank Details Model Schema
export interface userBankDetailsSchema extends Document{
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
export interface BillingAddress {
    line1: string;
    line2?: string | null;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    type: "Billing";
}
export interface DeliveryAddress {
    line1: string;
    line2?: string | null;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    type: "Billing";
}
export interface UserAddressModelSchema extends Document {
    user_id: Types.ObjectId;
    billing_address: BillingAddress;
    delivery_address: DeliveryAddress;
}