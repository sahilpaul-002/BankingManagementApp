import mongoose, { Document, Types } from "mongoose";
import type { MERCHANT_CATEGORIES } from "../configs/configConstants.js";
import type { BeneficieriesFiatCurrencyType } from "./beneficiariesFiatCurrency.js";

// Type for Domain API Key Model Schema
export interface dnsXApiKeySchemaTypes {
    domain_name: string;
    x_api_key: string;
}

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
    createdAt: Date;
    updatedAt: Date;
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
    cardholder_id?: Types.ObjectId | null;
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
    createdAt: Date;
    updatedAt: Date;
}

// Type for creating User Details document
export interface userDetailsDocumentType {
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
    kyc_status?: "PENDING" | "IN-PROGRESS" | "COMPLETED";
    risk_category?: "LOW" | "MEDIUM" | "HIGH";
    cardholder_id?: string | null;
    status?: "DISABLED" | "PRE-VERIFIED" | "VERIFIED" | "ACTIVE";
    is_admin?: "Y" | "N";
    is_master_admin?: "Y" | "N";
    is_active?: "Y" | "N";
    is_email_verified?: "Y" | "N";
    is_phone_verified?: "Y" | "N";
    is_2fa_enabled?: "Y" | "N";
    two_fa_type?: "SMS-OTP" | "EMAIL-OTP" | "TOTP" | null;
    authenticator_secret?: string | null;
    last_login_at?: Date;
    createdAt: Date;
    updatedAt: Date;
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
    createdAt: Date;
    updatedAt: Date;
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
    createdAt: Date;
    updatedAt: Date;
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
    createdAt: Date;
    updatedAt: Date;
}

// Types for user funding bank details
export interface userFundingBankAccountDetailsSchemaTypes extends Document {
    user_id: Types.ObjectId;
    cardholder_id: Types.ObjectId;
    account_holder_name: string;
    account_number: string;
    account_currency: "USD";
    account_balance: Types.Decimal128;
    swift_code: string;
    iban_code: string;
    bank_name: string;
    is_active: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// Types for user crypto deposit account details
export interface userCryptoDepositAccountDetailsSchemaTypes extends Document {
    user_id: Types.ObjectId;
    cardholder_id: Types.ObjectId;
    network: "ETHEREUM" | "POLYGON";
    asset: "USDT" | "USDC";
    deposit_address: string;
    account_balance: Types.Decimal128;
    is_active: boolean;
    createdAt: Date;
    updatedAt: Date;
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
    createdAt: Date;
    updatedAt: Date;
}

// Types for User Wallet Details Model Schema
export type walletCurrencyType = "USD" | "EUR" | "SGD" | "USDC" | "USDT";
export type walletDetailsType = {
    wallet_status?: "ACTIVE" | "INACTIVE";
    account_balance?: mongoose.Types.Decimal128;
    available_balance?: mongoose.Types.Decimal128;
    holding_amount?: mongoose.Types.Decimal128;
    wallet_type: "FIAT" | "CRYPTO";
    wallet_currency: "USD" | "EUR" | "SGD" | "USDC" | "USDT";
    daily_transaction?: {
        credit: mongoose.Types.Decimal128;
        debit: mongoose.Types.Decimal128;
        date: Date;
    };
    monthly_transaction?: {
        credit: mongoose.Types.Decimal128;
        debit: mongoose.Types.Decimal128;
        month: number;
        year: number;
    };
    yearly_transaction?: {
        credit: mongoose.Types.Decimal128;
        debit: mongoose.Types.Decimal128;
        year: number;
    };
};
export interface userWalletDetailsSchemaTypes extends Document {
    user_id: Types.ObjectId;
    cardholder_id: Types.ObjectId;
    wallets_details: walletDetailsType[],
    createdAt: Date;
    updatedAt: Date;
}

// Types for User Wallet Transactions Model Schema
export interface userWalletTransactionsTypes extends Document {
    cardholder_id: Types.ObjectId;
    wallet_id: Types.ObjectId;
    transaction_id: Types.ObjectId;
    transaction_type: "LOAD" | "WITHDRAW" | "TRANSFER" | "HOLD" | "RELEASE" | "REFUND" | "CARD";
    transaction_status: "PENDING" | "SUCCESS" | "FAILED" | "REVERSED";
    wallet_details: {
        wallet_type: "FIAT" | "CRYPTO";
        wallet_currency: "USD" | "EUR" | "SGD" | "USDC" | "USDT";
    };
    amount: mongoose.Types.Decimal128;
    fee: mongoose.Types.Decimal128;
    balance_before: mongoose.Types.Decimal128;
    balance_after: mongoose.Types.Decimal128;
    reference_id: string | null;
    remarks: string | null;
    createdAt: Date;
    updatedAt: Date;
}

// Type for User Wallet Currency Conversion Quote Model Schema
export interface walletCurrencyConversionQuoteSchemaTypes extends Document {
    user_id: Types.ObjectId;
    cardholder_id: Types.ObjectId;
    wallet_id: Types.ObjectId;
    source_currency: "USD" | "EUR" | "SGD" | "USDC" | "USDT";
    source_amount: mongoose.Types.Decimal128;
    destination_currency: "USD" | "EUR" | "SGD" | "USDC" | "USDT";
    destination_amount: mongoose.Types.Decimal128;
    exchange_rate: mongoose.Types.Decimal128;
    fee_percentage: mongoose.Types.Decimal128;
    fee_amount: mongoose.Types.Decimal128;
    quote_status: "ACTIVE" | "EXECUTED" | "EXPIRED" | "FAILED";
    expires_at: Date;
    executed_at: Date;
    conversion_reference_id: String;
    createdAt: Date;
    updatedAt: Date;
}

// Types for Cardholder Card Details Model Schema
export interface cardLimitsTypes {
    daily_limit: mongoose.Types.Decimal128;
    monthly_limit: mongoose.Types.Decimal128;
    yearly_limit: mongoose.Types.Decimal128;
}
export interface userCardDetailsSchemaTypes extends Document {
    cardholder_id: Types.ObjectId;
    card_number: string;
    card_status: "ACTIVE" | "INACTIVE" | "FROZEN" | "BLOCKED";
    cvv: string;
    issued_date: Date;
    valid_date: Date;
    name_on_card: string;
    card_type: "VIRTUAL" | "PHYSICAL";
    card_currency: "USD";
    card_limits?: cardLimitsTypes;
    valid_merchant_categories: typeof MERCHANT_CATEGORIES;
    daily_transaction?: {
        credit: mongoose.Types.Decimal128;
        debit: mongoose.Types.Decimal128;
        date: Date;
    };
    monthly_transaction?: {
        credit: mongoose.Types.Decimal128;
        debit: mongoose.Types.Decimal128;
        month: number;
        year: number;
    };
    yearly_transaction?: {
        credit: mongoose.Types.Decimal128;
        debit: mongoose.Types.Decimal128;
        year: number;
    };
    createdAt: Date;
    updatedAt: Date;
}

// Types for User Card Transactions Model Schema
export interface userCardTransactionsTypes extends Document {
    cardholder_id: Types.ObjectId;
    card_id: Types.ObjectId;
    transaction_id: Types.ObjectId;
    transaction_type: "PURCHASE" | "REFUND" | "WITHDRAWAL" | "REVERSAL" | "FEE";
    transaction_status: "PENDING" | "SUCCESS" | "FAILED" | "REVERSED";
    authorization_type: "HOLD" | "IMMEDIATE";
    authorization_status: "PENDING" | "AUTHORIZED" | "REJECTED" | "EXPIRED"
    authorization_expires_at: Date;
    authorized_at: Date | null;
    authorized_by: string | null;
    card_number: string;
    currency: "USD";
    name_on_card: string;
    amount: mongoose.Types.Decimal128;
    fee: mongoose.Types.Decimal128;
    card_type: "VIRTUAL" | "PHYSICAL";
    merchant_name: string;
    merchant_category: string;
    merchant_country: string;
    reference_id: string | null;
    remarks: string | null;
    createdAt: Date;
    updatedAt: Date;
}

// Type for Beneficiaries Bank Details Model Schema
export interface beneficiariesBankDetailsSchemaTypes extends Document {
    user_id: Types.ObjectId;
    account_number: string;
    account_currency: BeneficieriesFiatCurrencyType;
    account_holder_name: string;
    swift_code: string;
    iban_code: string;
    bank_name: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface fiatPayoutQuoteSchemaTypes extends Document {
    user_id: string;
    wallet_id: string;
    beneficiary_id: string;
    source_currency: "USD" | "EUR" | "SGD";
    source_amount: Types.Decimal128;
    destination_currency: string;
    destination_amount: Types.Decimal128;
    gross_destination_amount: Types.Decimal128;
    exchange_rate: Types.Decimal128;
    fee_currency: "USD";
    fee_amount: Types.Decimal128;
    total_debit: Types.Decimal128;
    quote_status: "ACTIVE" | "EXECUTED" | "EXPIRED" | "CANCELLED";
    expires_at: Date;
    createdAt: Date;
    updatedAt: Date;
}

// Type for Fiat Payout Transactions Model Schema
export interface fiatPayoutTransactionsSchemaTypes extends Document {
    quote_id: string;
    user_id: string;
    wallet_id: string;
    beneficiary_id: string;
    source_currency: "USD" | "EUR" | "SGD";
    source_amount: Types.Decimal128;
    destination_currency: string;
    destination_amount: Types.Decimal128;
    exchange_rate: Types.Decimal128;
    fee_amount: Types.Decimal128;
    status: "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED" | "CANCELLED";
    processing_started_at?: Date | null;
    completed_at?: Date | null;
    provider_reference?: string | null;
    remarks?: string | null;
    createdAt: Date;
    updatedAt: Date;
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
    currency_conversion: number;
    crypto_currency_conversion: number;
}