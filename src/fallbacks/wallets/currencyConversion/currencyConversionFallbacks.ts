// ─── Types ───────────────────────────────────────────────────────────────────

export type WalletCurrencyType = 'USD' | 'SGD' | 'EUR' | 'USDT' | 'USDC';
export type WalletTypeCategory = 'FIAT' | 'CRYPTO';
export type WalletStatusType = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface WalletBalanceItem {
    _id: string;
    wallet_status: WalletStatusType;
    account_balance: string;
    available_balance: string;
    holding_amount: string;
    wallet_type: WalletTypeCategory;
    wallet_currency: WalletCurrencyType;
    usd_equivalent: string;
}

export interface AllWalletBalancesResponseData {
    walletId: string;
    wallets_details: WalletBalanceItem[];
    total_usd_equivalent: string;
}

export interface AllWalletBalancesResponse {
    status: string;
    message: string;
    data: AllWalletBalancesResponseData;
}

// ─── Currency Conversion Quote ────────────────────────────────────────────────

export interface ConversionCurrencyAmount {
    currency: string;
    amount: string;
}

export interface ConversionFee {
    currency: string;
    percentage: string;
    amount: string;
}

export interface CurrencyConversionQuoteData {
    quote_id: string;
    source: ConversionCurrencyAmount;
    destination: ConversionCurrencyAmount;
    exchange_rate: string;
    fee: ConversionFee;
    total_debit: ConversionCurrencyAmount;
    quote_status: string;
    expires_at: string;
}

export interface CreateConversionQuoteRequestBody {
    source_currency: string;
    destination_currency: string;
    amount: string;
}

export interface CreateConversionQuoteResponse {
    status: string;
    message: string;
    data: CurrencyConversionQuoteData;
}

// ─── Execute Currency Conversion ──────────────────────────────────────────────

export interface ExecuteConversionRequestBody {
    quote_id: string;
}

export interface ExecuteConversionData {
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

export interface ExecuteConversionResponse {
    status: string;
    message: string;
    data: ExecuteConversionData;
}

// ─── Fallback Data ────────────────────────────────────────────────────────────

export const ALL_WALLET_BALANCES_FALLBACK: WalletBalanceItem[] = [
    {
        _id: '6a96a677131080273ade1fb6',
        wallet_status: 'ACTIVE',
        account_balance: '627.6528',
        available_balance: '627.3528',
        holding_amount: '0.3000',
        wallet_type: 'FIAT',
        wallet_currency: 'USD',
        usd_equivalent: '627.6528',
    },
    {
        _id: '6a96a684131080273ade1fb8',
        wallet_status: 'ACTIVE',
        account_balance: '998.2560',
        available_balance: '998.2560',
        holding_amount: '0.0000',
        wallet_type: 'FIAT',
        wallet_currency: 'EUR',
        usd_equivalent: '1160.7628',
    },
    {
        _id: '6a96a68f131080273ade1fbb',
        wallet_status: 'ACTIVE',
        account_balance: '1016.8640',
        available_balance: '1016.8640',
        holding_amount: '0.0000',
        wallet_type: 'FIAT',
        wallet_currency: 'SGD',
        usd_equivalent: '794.4250',
    },
    {
        _id: '6a96a69c131080273ade1fbf',
        wallet_status: 'ACTIVE',
        account_balance: '999.0000',
        available_balance: '999.0000',
        holding_amount: '0.0000',
        wallet_type: 'CRYPTO',
        wallet_currency: 'USDT',
        usd_equivalent: '999.0000',
    },
    {
        _id: '6a96a6a4131080273ade1fc4',
        wallet_status: 'ACTIVE',
        account_balance: '1199.0000',
        available_balance: '1199.0000',
        holding_amount: '0.0000',
        wallet_type: 'CRYPTO',
        wallet_currency: 'USDC',
        usd_equivalent: '1199.0000',
    },
];

export const CREATE_CONVERSION_QUOTE_FALLBACK: CurrencyConversionQuoteData = {
    quote_id: '6ab53b749c09270d70f8f00f',
    source: {
        currency: 'USD',
        amount: '10.0000',
    },
    destination: {
        currency: 'SGD',
        amount: '12.2880',
    },
    exchange_rate: '1.28000000',
    fee: {
        currency: 'USD',
        percentage: '4.0000',
        amount: '0.4000',
    },
    total_debit: {
        currency: 'USD',
        amount: '10.0000',
    },
    quote_status: 'ACTIVE',
    expires_at: '2026-09-24T15:04:11.491Z',
};

export const EXECUTE_CONVERSION_FALLBACK: ExecuteConversionData = {
    conversion_reference_id: '29c807e1-0022-4e3b-8d80-19ac76cac4f9',
    source_currency: 'USD',
    destination_currency: 'SGD',
    source_amount: '10.0000',
    conversion_fee: '0.4000',
    amount_after_fee: '9.6000',
    exchange_rate: '1.28000000',
    destination_amount: '12.2880',
    source_balance_before: '637.6528',
    source_balance_after: '627.6528',
    destination_balance_before: '1004.5760',
    destination_balance_after: '1016.8640',
    source_transaction_id: '6ab53b739c09270d70f8f00d',
    destination_transaction_id: '6ab53b819c09270d70f8f015',
    quote_id: '6ab53b749c09270d70f8f00f',
    quote_status: 'EXECUTED',
};
