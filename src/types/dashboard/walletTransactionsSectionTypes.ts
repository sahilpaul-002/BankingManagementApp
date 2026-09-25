export type WalletTransactionType =
    | 'LOAD'
    | 'WITHDRAW'
    | 'TRANSFER'
    | 'HOLD'
    | 'RELEASE'
    | 'REFUND'
    | 'CARD';

export type WalletTransactionStatusType =
    | 'PENDING'
    | 'SUCCESS'
    | 'FAILED'
    | 'REVERSED';

export type WalletTransactionWalletType = 'FIAT' | 'CRYPTO';

export type WalletTransactionCurrencyType =
    | 'USD'
    | 'EUR'
    | 'SGD'
    | 'USDC'
    | 'USDT';

export interface WalletTransactionWalletDetailsType {
    wallet_type: WalletTransactionWalletType;
    wallet_currency: WalletTransactionCurrencyType;
}

export interface WalletTransactionDecimalType {
    $numberDecimal: string;
}

export interface WalletTransactionItemType {
    _id: string;
    transaction_id: string;
    transaction_type: WalletTransactionType;
    transaction_status: WalletTransactionStatusType;
    wallet_details: WalletTransactionWalletDetailsType;
    amount: WalletTransactionDecimalType;
    fee: WalletTransactionDecimalType;
    balance_after: WalletTransactionDecimalType;
    remarks: string;
    createdAt: string;
}

export interface WalletTransactionsPaginationType {
    current_page: number;
    page_size: number;
    total_records: number;
    total_pages: number;
    has_next_page: boolean;
    has_previous_page: boolean;
}

export interface WalletTransactionsListResponseDataType {
    walletId: string;
    pagination: WalletTransactionsPaginationType;
    transactions: WalletTransactionItemType[];
}

export interface WalletTransactionsListResponse {
    status: string;
    message: string;
    data: WalletTransactionsListResponseDataType;
}