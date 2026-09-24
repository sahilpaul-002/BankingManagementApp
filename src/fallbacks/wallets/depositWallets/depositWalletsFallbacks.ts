// ─── Types ───────────────────────────────────────────────────────────────────

export interface DecimalValue {
    $numberDecimal: string;
}

export interface DailyTransaction {
    credit: DecimalValue;
    debit: DecimalValue;
    date: string;
}

export interface MonthlyTransaction {
    credit: DecimalValue;
    debit: DecimalValue;
    month: number;
    year: number;
}

export interface YearlyTransaction {
    credit: DecimalValue;
    debit: DecimalValue;
    year: number;
}

export type WalletType = 'FIAT' | 'CRYPTO';
export type WalletStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface WalletItem {
    _id: string;
    wallet_type: WalletType;
    wallet_currency: string;
    wallet_status: WalletStatus;
    account_balance: DecimalValue;
    available_balance: DecimalValue;
    holding_amount: DecimalValue;
    daily_transaction: DailyTransaction;
    monthly_transaction: MonthlyTransaction;
    yearly_transaction: YearlyTransaction;
}

export interface WalletsListResponse {
    status: string;
    message: string;
    data: {
        walletId: string;
        wallets_details: WalletItem[];
    };
}

// ─── Fallback data ────────────────────────────────────────────────────────────

export const DEPOSIT_WALLETS_LIST_FALLBACK: WalletItem[] = [
    {
        _id: '6a96a677131080273ade1fb6',
        wallet_type: 'FIAT',
        wallet_currency: 'USD',
        wallet_status: 'ACTIVE',
        account_balance: { $numberDecimal: '637.6528' },
        available_balance: { $numberDecimal: '637.3528' },
        holding_amount: { $numberDecimal: '0.3000' },
        daily_transaction: {
            credit: { $numberDecimal: '1044.1628' },
            debit: { $numberDecimal: '100.0000' },
            date: '2026-09-13T12:30:00.436Z',
        },
        monthly_transaction: {
            credit: { $numberDecimal: '1044.1628' },
            debit: { $numberDecimal: '420' },
            month: 9,
            year: 2026,
        },
        yearly_transaction: {
            credit: { $numberDecimal: '1044.1628' },
            debit: { $numberDecimal: '420' },
            year: 2026,
        },
    },
    {
        _id: '6a96a684131080273ade1fb8',
        wallet_type: 'FIAT',
        wallet_currency: 'EUR',
        wallet_status: 'ACTIVE',
        account_balance: { $numberDecimal: '998.2560' },
        available_balance: { $numberDecimal: '998.2560' },
        holding_amount: { $numberDecimal: '0.0000' },
        daily_transaction: {
            credit: { $numberDecimal: '1008.256' },
            debit: { $numberDecimal: '10' },
            date: '2026-09-01T10:18:44.164Z',
        },
        monthly_transaction: {
            credit: { $numberDecimal: '1008.256' },
            debit: { $numberDecimal: '10' },
            month: 9,
            year: 2026,
        },
        yearly_transaction: {
            credit: { $numberDecimal: '1008.256' },
            debit: { $numberDecimal: '10' },
            year: 2026,
        },
    },
    {
        _id: '6a96a68f131080273ade1fbb',
        wallet_type: 'FIAT',
        wallet_currency: 'SGD',
        wallet_status: 'ACTIVE',
        account_balance: { $numberDecimal: '1004.5760' },
        available_balance: { $numberDecimal: '1004.5760' },
        holding_amount: { $numberDecimal: '0.0000' },
        daily_transaction: {
            credit: { $numberDecimal: '12.288' },
            debit: { $numberDecimal: '20' },
            date: '2026-09-05T05:23:09.047Z',
        },
        monthly_transaction: {
            credit: { $numberDecimal: '1024.576' },
            debit: { $numberDecimal: '20' },
            month: 9,
            year: 2026,
        },
        yearly_transaction: {
            credit: { $numberDecimal: '1024.576' },
            debit: { $numberDecimal: '20' },
            year: 2026,
        },
    },
    {
        _id: '6a96a69c131080273ade1fbf',
        wallet_type: 'CRYPTO',
        wallet_currency: 'USDT',
        wallet_status: 'ACTIVE',
        account_balance: { $numberDecimal: '999.0000' },
        available_balance: { $numberDecimal: '999.0000' },
        holding_amount: { $numberDecimal: '0.0000' },
        daily_transaction: {
            credit: { $numberDecimal: '1009' },
            debit: { $numberDecimal: '10' },
            date: '2026-09-01T10:19:08.544Z',
        },
        monthly_transaction: {
            credit: { $numberDecimal: '1009' },
            debit: { $numberDecimal: '10' },
            month: 9,
            year: 2026,
        },
        yearly_transaction: {
            credit: { $numberDecimal: '1009' },
            debit: { $numberDecimal: '10' },
            year: 2026,
        },
    },
    {
        _id: '6a96a6a4131080273ade1fc4',
        wallet_type: 'CRYPTO',
        wallet_currency: 'USDC',
        wallet_status: 'ACTIVE',
        account_balance: { $numberDecimal: '1199.0000' },
        available_balance: { $numberDecimal: '1199.0000' },
        holding_amount: { $numberDecimal: '0.0000' },
        daily_transaction: {
            credit: { $numberDecimal: '1209' },
            debit: { $numberDecimal: '10' },
            date: '2026-09-01T10:19:16.930Z',
        },
        monthly_transaction: {
            credit: { $numberDecimal: '1209' },
            debit: { $numberDecimal: '10' },
            month: 9,
            year: 2026,
        },
        yearly_transaction: {
            credit: { $numberDecimal: '1209' },
            debit: { $numberDecimal: '10' },
            year: 2026,
        },
    },
];
