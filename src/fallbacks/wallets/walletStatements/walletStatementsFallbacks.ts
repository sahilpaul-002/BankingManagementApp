// ─── Types ───────────────────────────────────────────────────────────────────

export interface WalletTransactionWalletDetails {
    wallet_type: string;
    wallet_currency: string;
}

export interface WalletTransactionDecimal {
    $numberDecimal: string;
}

export interface WalletTransactionItem {
    _id: string;
    transaction_id: string;
    transaction_type: string;
    transaction_status: string;
    wallet_details: WalletTransactionWalletDetails;
    amount: WalletTransactionDecimal;
    fee: WalletTransactionDecimal;
    balance_after: WalletTransactionDecimal;
    remarks: string;
    createdAt: string;
}

export interface WalletTransactionsPagination {
    current_page: number;
    page_size: number;
    total_records: number;
    total_pages: number;
    has_next_page: boolean;
    has_previous_page: boolean;
}

export interface WalletTransactionsListResponseData {
    walletId: string;
    pagination: WalletTransactionsPagination;
    transactions: WalletTransactionItem[];
}

export interface WalletTransactionsListResponse {
    status: string;
    message: string;
    data: WalletTransactionsListResponseData;
}

// ─── Transaction Details ──────────────────────────────────────────────────────

export interface WalletTransactionDetailsItem {
    _id: string;
    transaction_id: string;
    transaction_type: string;
    transaction_status: string;
    wallet_details: WalletTransactionWalletDetails;
    amount: WalletTransactionDecimal;
    balance_after: WalletTransactionDecimal;
    createdAt: string;
}

export interface WalletTransactionDetailsResponseData {
    walletId: string;
    transaction: WalletTransactionDetailsItem;
}

export interface WalletTransactionDetailsResponse {
    status: string;
    message: string;
    data: WalletTransactionDetailsResponseData;
}

// ─── Fallback Data ────────────────────────────────────────────────────────────

export const WALLET_TRANSACTIONS_LIST_FALLBACK: WalletTransactionItem[] = [
    {
        _id: '6ab53b819c09270d70f8f016',
        transaction_id: '6ab53b819c09270d70f8f015',
        transaction_type: 'LOAD',
        transaction_status: 'SUCCESS',
        wallet_details: {
            wallet_type: 'FIAT',
            wallet_currency: 'SGD',
        },
        amount: { $numberDecimal: '12.2880' },
        fee: { $numberDecimal: '0.4000' },
        balance_after: { $numberDecimal: '1016.8640' },
        remarks: 'Currency conversion from USD to SGD. FX rate: 1.28000000',
        createdAt: '2026-09-24T15:02:25.561Z',
    },
    {
        _id: '6ab53b739c09270d70f8f00e',
        transaction_id: '6ab53b739c09270d70f8f00d',
        transaction_type: 'WITHDRAW',
        transaction_status: 'SUCCESS',
        wallet_details: {
            wallet_type: 'FIAT',
            wallet_currency: 'USD',
        },
        amount: { $numberDecimal: '10.0000' },
        fee: { $numberDecimal: '0' },
        balance_after: { $numberDecimal: '627.6528' },
        remarks: 'Currency conversion from USD to SGD',
        createdAt: '2026-09-24T15:02:11.827Z',
    },
    {
        _id: '6aa68deb7c65f7a9f987bc3a',
        transaction_id: '6aa68deb7c65f7a9f987bc39',
        transaction_type: 'WITHDRAW',
        transaction_status: 'SUCCESS',
        wallet_details: {
            wallet_type: 'FIAT',
            wallet_currency: 'USD',
        },
        amount: { $numberDecimal: '100.0000' },
        fee: { $numberDecimal: '0' },
        balance_after: { $numberDecimal: '637.6528' },
        remarks: 'Payout successfully completed and wallet amount debited',
        createdAt: '2026-09-13T11:50:03.335Z',
    },
    {
        _id: '6a9ba791532687ae16e00e1d',
        transaction_id: '6a9ba791532687ae16e00e1c',
        transaction_type: 'RELEASE',
        transaction_status: 'SUCCESS',
        wallet_details: {
            wallet_type: 'FIAT',
            wallet_currency: 'USD',
        },
        amount: { $numberDecimal: '10.0000' },
        fee: { $numberDecimal: '0' },
        balance_after: { $numberDecimal: '737.6528' },
        remarks:
            'Currency conversion quote expired. 10.0000 USD released from holding balance and returned to available balance. Conversion to SGD was not executed.',
        createdAt: '2026-09-05T05:24:33.914Z',
    },
    {
        _id: '6a9ba73d532687ae16e00e0c',
        transaction_id: '6a9ba73d532687ae16e00e0b',
        transaction_type: 'LOAD',
        transaction_status: 'SUCCESS',
        wallet_details: {
            wallet_type: 'FIAT',
            wallet_currency: 'SGD',
        },
        amount: { $numberDecimal: '12.2880' },
        fee: { $numberDecimal: '0.4000' },
        balance_after: { $numberDecimal: '1004.5760' },
        remarks: 'Currency conversion from USD to SGD. FX rate: 1.28000000',
        createdAt: '2026-09-05T05:23:09.433Z',
    },
    {
        _id: '6a9a80290f284fea6c4b3103',
        transaction_id: '6a9a80290f284fea6c4b3102',
        transaction_type: 'WITHDRAW',
        transaction_status: 'SUCCESS',
        wallet_details: {
            wallet_type: 'FIAT',
            wallet_currency: 'USD',
        },
        amount: { $numberDecimal: '100.0000' },
        fee: { $numberDecimal: '0' },
        balance_after: { $numberDecimal: '847.6528' },
        remarks: 'Payout successfully completed and wallet amount debited',
        createdAt: '2026-09-04T08:24:09.883Z',
    },
];

export const WALLET_TRANSACTION_DETAILS_FALLBACK: WalletTransactionDetailsItem = {
    _id: '6ab53b819c09270d70f8f016',
    transaction_id: '6ab53b819c09270d70f8f015',
    transaction_type: 'LOAD',
    transaction_status: 'SUCCESS',
    wallet_details: {
        wallet_type: 'FIAT',
        wallet_currency: 'SGD',
    },
    amount: { $numberDecimal: '12.2880' },
    balance_after: { $numberDecimal: '1016.8640' },
    createdAt: '2026-09-24T15:02:25.561Z',
};
