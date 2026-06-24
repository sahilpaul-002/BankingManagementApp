export interface StableCoin {
  code: string;
  name: string;
  type: 'fiat' | 'stablecoin';
}

export interface AccountBalance {
  currency: string;
  balance: number;
}

export interface RecentRamp {
  id: string;
  type: 'buy' | 'sell';
  fromCurrency: string;
  toCurrency: string;
  date: string;
  status: 'Settled';
  fromAmount: number;
  toAmount: number;
}

export const STABLECOINS: StableCoin[] = [
  { code: 'USD', name: 'US Dollar', type: 'fiat' },
  { code: 'EUR', name: 'Euro', type: 'fiat' },
  { code: 'GBP', name: 'British Pound', type: 'fiat' },
  { code: 'SGD', name: 'Singapore Dollar', type: 'fiat' },
  { code: 'USDT', name: 'Tether', type: 'stablecoin' },
  { code: 'USDC', name: 'USD Coin', type: 'stablecoin' },
  { code: 'EURC', name: 'Euro Coin', type: 'stablecoin' },
];

export const STABLECOIN_BALANCES: AccountBalance[] = [
  { currency: 'USD', balance: 248914.5 },
  { currency: 'EUR', balance: 156230.8 },
  { currency: 'GBP', balance: 95876.25 },
  { currency: 'SGD', balance: 335420.0 },
  { currency: 'USDT', balance: 985420.75 },
  { currency: 'USDC', balance: 1250000.0 },
  { currency: 'EURC', balance: 542100.0 },
];

export const RECENT_RAMPS: RecentRamp[] = [
  {
    id: '1',
    type: 'buy',
    fromCurrency: 'USD',
    toCurrency: 'USDT',
    date: 'May 14',
    status: 'Settled',
    fromAmount: -100000,
    toAmount: 99800,
  },
  {
    id: '2',
    type: 'buy',
    fromCurrency: 'EUR',
    toCurrency: 'EURC',
    date: 'May 12',
    status: 'Settled',
    fromAmount: -50000,
    toAmount: 49900,
  },
  {
    id: '3',
    type: 'sell',
    fromCurrency: 'USDC',
    toCurrency: 'GBP',
    date: 'May 09',
    status: 'Settled',
    fromAmount: -25000,
    toAmount: 19672.5,
  },
  {
    id: '4',
    type: 'buy',
    fromCurrency: 'SGD',
    toCurrency: 'USDT',
    date: 'May 04',
    status: 'Settled',
    fromAmount: -200000,
    toAmount: 148530,
  },
  {
    id: '5',
    type: 'sell',
    fromCurrency: 'USDT',
    toCurrency: 'USD',
    date: 'Apr 28',
    status: 'Settled',
    fromAmount: -12000,
    toAmount: 11976,
  },
];

export const STABLECOIN_EXCHANGE_RATES: Record<string, Record<string, number>> = {
  USD: { USDT: 1.0, USDC: 1.0, EURC: 0.921 },
  EUR: { USDT: 1.086, USDC: 1.086, EURC: 1.0 },
  GBP: { USDT: 1.267, USDC: 1.267, EURC: 1.167 },
  SGD: { USDT: 0.743, USDC: 0.743, EURC: 0.684 },
  USDT: { USD: 0.9996, EUR: 0.920, GBP: 0.789, SGD: 1.346 },
  USDC: { USD: 1.0, EUR: 0.921, GBP: 0.789, SGD: 1.346 },
  EURC: { USD: 1.086, EUR: 1.0, GBP: 0.857, SGD: 1.461 },
};
