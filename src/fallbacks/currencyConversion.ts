export interface Currency {
  code: string;
  name: string;
  icon: string;
  type: 'fiat' | 'crypto';
}

export interface AccountBalance {
  currency: string;
  balance: number;
}

export interface RecentConversion {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  date: string;
  status: 'Settled';
  reference: string;
  fromAmount: number;
  toAmount: number;
}

export const CURRENCIES: Currency[] = [
  { code: 'USD', name: 'US Dollar', icon: 'USD', type: 'fiat' },
  { code: 'SGD', name: 'Singapore Dollar', icon: 'SGD', type: 'fiat' },
  { code: 'GBP', name: 'British Pound', icon: 'GBP', type: 'fiat' },
  { code: 'EUR', name: 'Euro', icon: 'EUR', type: 'fiat' },
  { code: 'AED', name: 'UAE Dirham', icon: 'AED', type: 'fiat' },
  { code: 'USDC', name: 'USD Coin', icon: 'USDC', type: 'crypto' },
  { code: 'USDT', name: 'Tether', icon: 'USDT', type: 'crypto' },
  { code: 'EURC', name: 'Euro Coin', icon: 'EURC', type: 'crypto' },
];

export const ACCOUNT_BALANCES: AccountBalance[] = [
  { currency: 'USD', balance: 248914.5 },
  { currency: 'SGD', balance: 8999936855.23 },
  { currency: 'GBP', balance: 95876.25 },
  { currency: 'EUR', balance: 156230.8 },
  { currency: 'AED', balance: 385920.5 },
  { currency: 'USDC', balance: 1250000.0 },
  { currency: 'USDT', balance: 985420.75 },
  { currency: 'EURC', balance: 542100.0 },
];

export const RECENT_CONVERSIONS: RecentConversion[] = [
  {
    id: '1',
    fromCurrency: 'USD',
    toCurrency: 'SGD',
    date: 'Apr 30',
    status: 'Settled',
    reference: 'Ref C2612340AV4X',
    fromAmount: -99.6,
    toAmount: 114156,
  },
  {
    id: '2',
    fromCurrency: 'USDC',
    toCurrency: 'GBP',
    date: 'Apr 18',
    status: 'Settled',
    reference: 'Ref C2612351AV4X',
    fromAmount: -2500,
    toAmount: 1972.5,
  },
  {
    id: '3',
    fromCurrency: 'EUR',
    toCurrency: 'USD',
    date: 'Apr 02',
    status: 'Settled',
    reference: 'Ref C2612362AV4X',
    fromAmount: -1000,
    toAmount: 1086,
  },
  {
    id: '4',
    fromCurrency: 'USDT',
    toCurrency: 'USD',
    date: 'Mar 28',
    status: 'Settled',
    reference: 'Ref C2612373AV4X',
    fromAmount: -5000,
    toAmount: 4998,
  },
];

export const EXCHANGE_RATES: Record<string, Record<string, number>> = {
  USD: { SGD: 1.346, GBP: 0.789, EUR: 0.921, USDC: 1.0, USDT: 0.9996, AED: 3.673 },
  SGD: { USD: 0.743, GBP: 0.586, EUR: 0.684, USDC: 0.743, USDT: 0.742, AED: 2.729 },
  GBP: { USD: 1.267, SGD: 1.706, EUR: 1.167, USDC: 1.267, USDT: 1.266, AED: 4.652 },
  EUR: { USD: 1.086, SGD: 1.461, GBP: 0.857, USDC: 1.086, USDT: 1.085, AED: 3.987 },
  USDC: { USD: 1.0, SGD: 1.346, GBP: 0.789, EUR: 0.921, USDT: 0.9996, AED: 3.673 },
  USDT: { USD: 1.0004, SGD: 1.347, GBP: 0.790, EUR: 0.922, USDC: 1.0004, AED: 3.675 },
  AED: { USD: 0.272, SGD: 0.366, GBP: 0.215, EUR: 0.251, USDC: 0.272, USDT: 0.272 },
  EURC: { USD: 1.086, SGD: 1.461, GBP: 0.857, EUR: 1.0, USDC: 1.086, USDT: 1.085 },
};
