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
// CARD TRANSACTION BREAKDOWN TYPES
// =============================
export interface DailyTransactionType {
    credit: CardDecimalValueType;
    debit: CardDecimalValueType;
    date: string;
}

export interface MonthlyTransactionType {
    credit: CardDecimalValueType;
    debit: CardDecimalValueType;
    month: number;
    year: number;
}

export interface YearlyTransactionType {
    credit: CardDecimalValueType;
    debit: CardDecimalValueType;
    year: number;
}

// =============================
// CARD ITEM TYPE
// =============================
export interface CardItemType {
    _id: string;
    card_number: string;
    card_status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'BLOCKED' | string;
    issued_date: string;
    name_on_card: string;
    card_type: 'VIRTUAL' | 'PHYSICAL' | string;
    card_currency: string;
    card_limits?: CardLimitsType;
    daily_transaction?: DailyTransactionType;
    monthly_transaction?: MonthlyTransactionType;
    yearly_transaction?: YearlyTransactionType;
}

// =============================
// CARDS LIST PAGINATION TYPE
// =============================
export interface CardsListPaginationType {
    current_page: number;
    page_size: number;
    total_records: number;
    total_pages: number;
    has_next_page: boolean;
    has_previous_page: boolean;
}

// =============================
// CARDS LIST RESPONSE DATA TYPE
// =============================
export interface CardsListResponseDataType {
    cardholderId?: string;
    pagination?: CardsListPaginationType;
    cards?: CardItemType[];
}
