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


// --------------- CARDHOLDER WALLET TYPES --------------- \\
export interface DecimalValueType {
    $numberDecimal: string;
}

export interface DailyTransactionType {
    credit: DecimalValueType;
    debit: DecimalValueType;
    date: string;
}

export interface MonthlyTransactionType {
    credit: DecimalValueType;
    debit: DecimalValueType;
    month: number;
    year: number;
}

export interface YearlyTransactionType {
    credit: DecimalValueType;
    debit: DecimalValueType;
    year: number;
}

export type WalletType = 'FIAT' | 'CRYPTO';
export type WalletStatusType = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface WalletItemType {
    _id: string;
    wallet_type: WalletType;
    wallet_currency: string;
    wallet_status: WalletStatusType;
    account_balance: DecimalValueType;
    available_balance: DecimalValueType;
    holding_amount: DecimalValueType;
    daily_transaction: DailyTransactionType;
    monthly_transaction: MonthlyTransactionType;
    yearly_transaction: YearlyTransactionType;
}

export interface WalletsDetailsResponseDataType {
    walletId: string;
    wallets_details: WalletItemType[];
}

export interface WalletsListResponseType {
    status: string;
    message: string;
    data: WalletsDetailsResponseDataType
}
// ----------------------- xxxxxxxxxxxxxxxx ----------------------- \\

// ---------------------- CARDHOLDER CARD TYPES ---------------------- \\
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
// ----------------------- XXXXXXXXXXXXXXXXXXX ----------------------- \\

// =============================
// CREATE CARD REQUEST / FORM TYPES
// =============================
export interface CreateCardLimitsPayloadType {
    dailyLimit: string;
    monthlyLimit: string;
    yearlyLimit: string;
}

export interface CreateCardDetailsPayloadType {
    cardholderId: string;
    nameOnCard: string;
    cardType: 'VIRTUAL' | 'PHYSICAL';
    cardCurrency: 'USD';
    cardLimits?: CreateCardLimitsPayloadType;
    merchantCategories?: string[];
}

export interface CreateCardRequestBodyType {
    email: string;
    cardDetails: CreateCardDetailsPayloadType;
}