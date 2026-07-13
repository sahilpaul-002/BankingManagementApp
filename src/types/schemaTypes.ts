import { Document, Types } from "mongoose";
import type { MERCHANT_CATEGORIES } from "../configs/configConstants.js";

// Type for Portal Configuration Model Schema
export interface portalConfigurationSchemaTypes extends Document {
    domain_name: string;
    dashboard_name: string;
    x_api_key: string;
    logo_url?: string | null;
    base_url_api: string;
    favicon?: string | null;
    slogan_line_1?: string | null;
    slogan_line_2?: string | null;
    userportal_link?: string | null;
    signup_required: boolean;
    dns_x_api_key: string;
    portal_type: string;
    m2p_allowed: boolean;
    p2p_allowed: boolean;
    admin_email: string;
}

// Type for User Details Model Schema
export interface userDetailsSchemaTypes extends Document {
    full_name: string;
    program_type: "MASTER" | "VISA";
    business_name: string;
    agent_code: string;
    subagent_code: string;
    program_id: "MBMA010" | "VBMA010";
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
    cardholder_id?: string | null;
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
    cardholder_id?: string;
    account_holder_name: string;
    account_number: string;
    swift_code: string;
    iban_code: string;
    bank_name: string;
    is_verified?: boolean;
    user_bank_request_id: string;
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
    kyc_status: "PENDING" | "IN-PROGRESS" | "RFI" | "COMPLETED";
    poi_document: {
        poi_number: string;
        secure_url: string,
        public_id: string
    },
    poa_document: {
        poa_number: string;
        secure_url: string,
        public_id: string
    },
    kyc_request_id: string;
    deleted_at?: Date;
}

// Types for User Wallet Details Model Schema
export type walletDetailsType = {
    wallet_status?: "ACTIVE" | "INACTIVE";
    account_balance?: number;
    holding_amount?: number;
    wallet_type: "FIAT" | "CRYPTO";
    wallet_currency: "USD" | "EUR" | "SGD" | "USDC" | "USDT";
    daily_transaction?: {
        credit: number;
        debit: number;
        date: Date;
    };
    monthly_transaction?: {
        credit: number;
        debit: number;
        month: number;
        year: number;
    };
    yearly_transaction?: {
        credit: number;
        debit: number;
        year: number;
    };
};
export interface userWalletDetailsSchemaTypes extends Document {
    user_id: Types.ObjectId;
    cardholder_id: string;
    wallet_id: string;
    wallets_details: walletDetailsType[],
}

// Types for User Wallet Transactions Model Schema
export interface userWalletTransactionsTypes extends Document {
    cardholder_id: string;
    wallet_id: string;
    transaction_id: string;
    transaction_type: "LOAD" | "WITHDRAW" | "TRANSFER" | "HOLD" | "RELEASE" | "REFUND" | "CARD";
    transaction_status: "PENDING" | "SUCCESS" | "FAILED" | "REVERSED";
    wallet_details: {
        wallet_type: "FIAT" | "CRYPTO";
        wallet_currency: "USD" | "EUR" | "SGD" | "USDC" | "USDT";
    };
    amount: number;
    balance_before: number;
    balance_after: number;
    reference_id: string | null;
    remarks: string | null;
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

// Types for Cardholder Card Details Model Schema
export interface cardLimitsTypes {
    daily_limit: string;
    monthly_limit: string;
    yearly_limit: string;
}
export interface userCardDetailsSchemaTypes extends Document {
    cardholder_id: string;
    card_id: string;
    card_number: string;
    card_status: "ACTIVE" | "INACTIVE" | "FROZEN" | "BLOCKED";
    cvv: string;
    issued_date: Date;
    valid_date: Date;
    name_on_card: string;
    card_type: "VIRTUAL" | "PHYSICAL";
    card_currency: "USD";
    card_limits?: cardLimitsTypes,
    valid_merchant_categories: typeof MERCHANT_CATEGORIES, 
    daily_transaction?: {
        credit: number;
        debit: number;
        date: Date;
    };
    monthly_transaction?: {
        credit: number;
        debit: number;
        month: number;
        year: number;
    };
    yearly_transaction?: {
        credit: number;
        debit: number;
        year: number;
    };
}

// Types for User Card Transactions Model Schema
export interface userCardTransactionsTypes extends Document {
    cardholder_id: string;
    card_id: string;
    transaction_id: string;
    transaction_type: "PURCHASE" | "REFUND" | "WITHDRAWAL" | "REVERSAL" | "FEE";
    transaction_status: "PENDING" | "SUCCESS" | "FAILED" | "REVERSED";
    card_number: string;
    currency: "USD";
    name_on_card: string;
    amount: number;
    card_type: "VIRTUAL" | "PHYSICAL";
    merchant_name: string;
    merchant_category: string;
    merchant_country: string;
    reference_id: string | null;
    remarks: string | null;
}

// Types for Fee Details Model Schema
export interface feeDetailsSchemaTypes {
    fee_unit: "PERCENTAGE";
    load_fiat_wallet_percent: number;
    load_crypto_wallet_percent: number;
    load_card_percent: number;
    card_transaction_percent: number;
    create_card: number
    m2p_percent: number;
    p2P_percent: number;
}