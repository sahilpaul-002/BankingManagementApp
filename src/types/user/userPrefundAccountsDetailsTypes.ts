// ── Mongo Decimal ────────────────────────────────────────────────────────────
export type NumberDecimalType = {
    $numberDecimal: string;
};

// ── Fiat ─────────────────────────────────────────────────────────────────────
// API may return fiat as `{}`, so every field is optional.
export type PrefundFiatAccountType = {
    account_id?: string;
    account_number?: string;
    account_currency?: string;
    account_balance?: NumberDecimalType;
    is_active?: boolean;
};

// ── Crypto ───────────────────────────────────────────────────────────────────
export type PrefundCryptoAccountType = {
    account_id: string;
    network: string;
    asset: string;
    deposit_address: string;
    balance?: NumberDecimalType;
};

// Grouped by network => { ETHEREUM: [...], POLYGON: [...] }
export type CryptoAccountsByNetworkType = Record<string, PrefundCryptoAccountType[]>;

// ── API Response (`data`) ────────────────────────────────────────────────────
export type UserPrefundAccountsDetailsType = {
    fiat?: PrefundFiatAccountType | null;
    crypto?: PrefundCryptoAccountType[] | null;
};