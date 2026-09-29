export type WalletCurrencyType = 'USD' | 'SGD' | 'EUR' | 'USDT' | 'USDC';
export type WalletTypeCategory = 'FIAT' | 'CRYPTO';
export type WalletStatusType = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface WalletBalanceItemType {
    _id: string;
    wallet_status: WalletStatusType;
    account_balance: string;
    available_balance: string;
    holding_amount: string;
    wallet_type: WalletTypeCategory;
    wallet_currency: WalletCurrencyType;
    usd_equivalent: string;
}

export interface AllWalletBalancesResponseDataType {
    walletId: string;
    wallets_details: WalletBalanceItemType[];
    total_usd_equivalent: string;
}

export interface AllWalletBalancesResponseType {
    status: string;
    message: string;
    data: AllWalletBalancesResponseDataType;
}

// ─── Currency Conversion Quote ────────────────────────────────────────────────

export interface ConversionCurrencyAmountType {
    currency: string;
    amount: string;
}

export interface ConversionFeeType {
    currency: string;
    percentage: string;
    amount: string;
}

export interface CurrencyConversionQuoteDataType {
    quote_id: string;
    source: ConversionCurrencyAmountType;
    destination: ConversionCurrencyAmountType;
    exchange_rate: string;
    fee: ConversionFeeType;
    total_debit: ConversionCurrencyAmountType;
    quote_status: string;
    expires_at: string;
}

export interface CreateConversionQuoteResponseType {
    status: string;
    message: string;
    data: CurrencyConversionQuoteDataType;
}

// ─── Execute Currency Conversion ──────────────────────────────────────────────

export interface ExecuteConversionRequestBodyType {
    quote_id: string;
}

export interface ExecuteConversionDataType {
    conversion_reference_id: string;
    source_currency: string;
    destination_currency: string;
    source_amount: string;
    conversion_fee: string;
    amount_after_fee: string;
    exchange_rate: string;
    destination_amount: string;
    source_balance_before: string;
    source_balance_after: string;
    destination_balance_before: string;
    destination_balance_after: string;
    source_transaction_id: string;
    destination_transaction_id: string;
    quote_id: string;
    quote_status: string;
}

export interface ExecuteConversionResponseType {
    status: string;
    message: string;
    data: ExecuteConversionDataType;
}