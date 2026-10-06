export const MERCHANT_CATEGORIES = ["GROCERY", "RESTAURANT", "CAFE", "GAS_STATION", "PHARMACY", "HOSPITAL", "HOTEL", "AIRLINE", "PUBLIC_TRANSPORT", "E_COMMERCE", "ELECTRONICS", "CLOTHING", "SUPERMARKET", "ENTERTAINMENT", "GAMING", "EDUCATION", "SUBSCRIPTION", "UTILITIES", "TELECOM", "INSURANCE", "GOVERNMENT", "CHARITY", "BEAUTY", "FITNESS", "PET_SUPPLIES", "JEWELRY", "OFFICE_SUPPLIES", "OTHER"];
export type MerchantCategoryType = typeof MERCHANT_CATEGORIES[number];

// =============================
// CARD DECIMAL VALUE TYPE
// =============================

export interface CardDecimalValueType {
    $numberDecimal: string;
}

// =============================
// CARD LIMITS TYPE
// =============================

export interface CardLimitsType {
    daily_limit: CardDecimalValueType;
    monthly_limit: CardDecimalValueType;
    yearly_limit: CardDecimalValueType;
}

// =============================
// DAILY TRANSACTION TYPE
// =============================

export interface DailyTransactionType {
    credit: CardDecimalValueType;
    debit: CardDecimalValueType;
    date: string;
}

// =============================
// MONTHLY TRANSACTION TYPE
// =============================

export interface MonthlyTransactionType {
    credit: CardDecimalValueType;
    debit: CardDecimalValueType;
    month: number;
    year: number;
}

// =============================
// YEARLY TRANSACTION TYPE
// =============================

export interface YearlyTransactionType {
    credit: CardDecimalValueType;
    debit: CardDecimalValueType;
    year: number;
}

// =============================
// CARD DETAILS TYPE
// =============================

export interface CardDetailsType {
    _id: string;
    card_number: string;
    card_status: string;
    issued_date: string;
    name_on_card: string;
    card_type: string;
    card_currency: string;
    card_limits: CardLimitsType;
    valid_merchant_categories: MerchantCategoryType;
    daily_transaction: DailyTransactionType;
    monthly_transaction: MonthlyTransactionType;
    yearly_transaction: YearlyTransactionType;
}

// =============================
// CARD DETAILS RESPONSE DATA TYPE
// =============================

export interface CardDetailsResponseDataType {
    cardholderId: string;
    cardDetails: CardDetailsType;
}

// =============================
// CARD DETAILS PAYLOAD TYPE
// =============================

export interface CardDetailsPayloadType {
    email: string;
    cardDetails: {
        cardId: string;
        cardholderId: string;
    };
}

// =============================
// CARD TRANSACTION ITEM TYPE
// =============================

export type CardTransactionType = 'PURCHASE' | 'REFUND' | 'HOLD' | 'RELEASE' | string;
export type CardTransactionStatusType = 'SUCCESS' | 'FAILED' | 'REVERSED' | 'PENDING' | 'PROCESSING' | string;
export type CardAuthorizationType = 'HOLD' | 'IMMEDIATE' | string;
export type CardAuthorizationStatusType = 'AUTHORIZED' | 'EXPIRED' | 'REJECTED' | 'PENDING' | string;

export interface CardTransactionItemType {
    _id: string;
    transaction_id: string;
    transaction_type: CardTransactionType;
    transaction_status: CardTransactionStatusType;
    authorization_type: CardAuthorizationType;
    authorization_status: CardAuthorizationStatusType;
    currency: string;
    amount: string | CardDecimalValueType;
    fee: CardDecimalValueType | string;
    card_type: 'VIRTUAL' | 'PHYSICAL' | string;
    merchant_name: string;
    merchant_category: string;
    merchant_country: string;
    reference_id: string;
    createdAt: string;
    updatedAt: string;
}

// =============================
// CARD TRANSACTIONS PAGINATION TYPE
// =============================

export interface CardTransactionsPaginationType {
    current_page: number;
    page_size: number;
    total_records: number;
    total_pages: number;
    has_next_page: boolean;
    has_previous_page: boolean;
}

// =============================
// CARD TRANSACTIONS RESPONSE DATA TYPE
// =============================

export interface CardTransactionsListResponseDataType {
    cardholder_id: string;
    card_id: string;
    pagination: CardTransactionsPaginationType;
    transactions: CardTransactionItemType[];
}