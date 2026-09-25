export type WalletCurrencyType = 'USD' | 'SGD' | 'EUR' | 'USDT' | 'USDC';
export type WalletCategoryType = 'FIAT' | 'CRYPTO';
export type WalletStatusType = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface WalletBalanceItemType {
    _id: string;
    wallet_status: WalletStatusType;
    account_balance: string;
    available_balance: string;
    holding_amount: string;
    wallet_type: WalletCategoryType;
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