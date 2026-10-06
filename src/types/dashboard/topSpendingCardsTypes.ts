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
// TOP SPENDING CARD ITEM TYPE
// =============================

export interface TopSpendingCardItemType {
    _id: string;
    card_number: string;
    card_status:
    | 'ACTIVE'
    | 'INACTIVE'
    | 'FROZEN'
    | 'BLOCKED'
    | string;
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
// TOP THREE SPENDING CARDS RESPONSE DATA TYPE
// =============================

export interface TopSpendingCardsResponseDataType {
    cardholderId: string;
    cards: TopSpendingCardItemType[];
}

// =============================
// TOP THREE SPENDING CARDS RESPONSE TYPE
// =============================

export interface TopSpendingCardsResponseType {
    status: 'SUCCESS' | 'FAILED' | string;
    message: string;
    data: TopSpendingCardsResponseDataType;
}