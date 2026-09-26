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