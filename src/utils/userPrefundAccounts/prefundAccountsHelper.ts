import type { CryptoAccountsByNetworkType, NumberDecimalType, PrefundCryptoAccountType, PrefundFiatAccountType } from "@/types/user/userPrefundAccountsDetailsTypes";


/**
 * Groups the flat crypto accounts array by network.
 * [{network: 'ETHEREUM', asset: 'USDT'}, ...] => { ETHEREUM: [{...}, {...}], POLYGON: [{...}] }
 * Safe for `undefined`, `null` and `[]`.
 */
export function groupCryptoAccountsByNetwork(
    cryptoAccounts?: PrefundCryptoAccountType[] | null
): CryptoAccountsByNetworkType {
    if (!Array.isArray(cryptoAccounts)) return {};

    return cryptoAccounts.reduce<CryptoAccountsByNetworkType>((acc, account) => {
        if (!account?.network) return acc;

        if (!acc[account.network]) {
            acc[account.network] = [];
        }

        acc[account.network]!.push(account);
        return acc;
    }, {});
}

/**
 * Formats `{ $numberDecimal: "1234.50" }` (or a plain string / number) => "1,234.50".
 * Keeps the decimal part as-is so crypto precision is never lost.
 */
export function formatNumberDecimal(value?: NumberDecimalType | string | number | null): string {
    const raw = typeof value === 'object' && value !== null ? value.$numberDecimal : value;

    if (raw === undefined || raw === null || raw === '') return '0';

    const str = String(raw).trim();
    if (!/^-?\d+(\.\d+)?$/.test(str)) return str;

    const [integerPart = '', decimalPart] = str.split('.');
    const withCommas = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    return decimalPart ? `${withCommas}.${decimalPart}` : withCommas;
}

/**
 * Fiat can come back as `{}`, `null` or `undefined`.
 * A fiat account is considered available only if it has an account number.
 */
export function hasFiatAccount(fiat?: PrefundFiatAccountType | null): fiat is PrefundFiatAccountType {
    return !!fiat && typeof fiat === 'object' && !!fiat.account_number;
}