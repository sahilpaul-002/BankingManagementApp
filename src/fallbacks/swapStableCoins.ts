export interface SwapPair {
  fromCurrency: string;
  toCurrency: string;
}

export interface RecentSwap {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  date: string;
  fromAmount: number;
  toAmount: number;
}

export const SUPPORTED_PAIRS: SwapPair[] = [
  { fromCurrency: 'USDT', toCurrency: 'USDC' },
  { fromCurrency: 'USDC', toCurrency: 'EURC' },
  { fromCurrency: 'USDT', toCurrency: 'EURC' },
];

export const RECENT_SWAPS: RecentSwap[] = [
  {
    id: '1',
    fromCurrency: 'USDT',
    toCurrency: 'USDC',
    date: 'May 14',
    fromAmount: -50000,
    toAmount: 49950,
  },
  {
    id: '2',
    fromCurrency: 'USDC',
    toCurrency: 'EURC',
    date: 'May 10',
    fromAmount: -25000,
    toAmount: 23025,
  },
  {
    id: '3',
    fromCurrency: 'USDT',
    toCurrency: 'EURC',
    date: 'May 04',
    fromAmount: -10000,
    toAmount: 9201,
  },
];

export const SWAP_EXCHANGE_RATES: Record<string, Record<string, number>> = {
  USDT: { USDC: 1.0000, EURC: 0.9201 },
  USDC: { USDT: 1.0000, EURC: 0.9201 },
  EURC: { USDT: 1.0869, USDC: 1.0869 },
};
