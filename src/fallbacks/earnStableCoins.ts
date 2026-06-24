export interface APYTier {
  tier: string;
  balanceRange: string;
  baseAPY: string;
  bonus: string;
  total: string;
  isActive?: boolean;
}

export interface DailyYield {
  date: string;
  amount: number;
}

export interface CommonQuestion {
  question: string;
  answer: string;
}

export interface EarnStats {
  earningBalance: number;
  earnedThisMonth: number;
  lifetimeEarned: number;
  nextPayout: string;
}

export const EARN_STATS: EarnStats = {
  earningBalance: 1456000,
  earnedThisMonth: 1284.4,
  lifetimeEarned: 18472.31,
  nextPayout: 'Tomorrow 00:00 UTC',
};

export const APY_TIERS: APYTier[] = [
  {
    tier: 'Starter',
    balanceRange: '0 — 100K USDT',
    baseAPY: '4.20%',
    bonus: '—',
    total: '4.20%',
  },
  {
    tier: 'Standard',
    balanceRange: '100K — 1M USDT',
    baseAPY: '4.20%',
    bonus: '+0.40%',
    total: '4.60%',
  },
  {
    tier: 'Pro',
    balanceRange: '1M — 5M USDT',
    baseAPY: '4.20%',
    bonus: '+1.22%',
    total: '5.42%',
    isActive: true,
  },
  {
    tier: 'Treasury',
    balanceRange: '> 5M USDT',
    baseAPY: '4.20%',
    bonus: '+1.60%',
    total: '5.80%',
  },
];

export const DAILY_YIELD_DATA: DailyYield[] = [
  { date: 'May 02', amount: 3039.34 },
  { date: 'May 03', amount: 2987.56 },
  { date: 'May 04', amount: 3145.23 },
  { date: 'May 05', amount: 3098.78 },
  { date: 'May 06', amount: 3234.12 },
  { date: 'May 07', amount: 3189.45 },
  { date: 'May 08', amount: 3067.89 },
  { date: 'May 09', amount: 3156.34 },
  { date: 'May 10', amount: 3201.67 },
  { date: 'May 11', amount: 3089.23 },
  { date: 'May 12', amount: 3178.56 },
  { date: 'May 13', amount: 3245.89 },
  { date: 'May 14', amount: 3123.45 },
  { date: 'May 15', amount: 3267.12 },
];

export const COMMON_QUESTIONS: CommonQuestion[] = [
  {
    question: 'Can I withdraw at any time?',
    answer: 'Yes. Auto-yield has no lock-up period. Disable it and your accrual stops the same day. There\'s no exit fee, no lock-up, and no minimum balance.',
  },
  {
    question: 'Does enrolled USDT stay on-chain?',
    answer: 'No. Your USDT main balance never moves. The on-chain address stays the same, and you can still send, swap, or spend at any moment.',
  },
  {
    question: 'Is yield taxable?',
    answer: 'Yield is not risk-free. APY is variable and not guaranteed. Principal is not insured. Past performance is no indicator of future returns.',
  },
];

export const HOW_IT_WORKS_STEPS = [
  {
    number: 1,
    title: 'You hold USDT on HashDT',
    description: 'Your USDT main balance never moves. The on-chain address stays the same, and you can still send, swap, or spend at any moment.',
  },
  {
    number: 2,
    title: 'We allocate the float',
    description: 'Idle USDT across all opted-in customers is pooled and allocated to two strategies: short-duration T-bills (~90%) and over-collateralised stablecoin lending (~10%).',
  },
  {
    number: 3,
    title: 'Yield accrues daily',
    description: 'At 00:00 UTC each day, the blended return is calculated, our spread is taken, and your share is credited as USDT into your main balance.',
  },
  {
    number: 4,
    title: 'You can stop anytime',
    description: 'Disable auto-yield and accrual stops the same day. There\'s no exit fee, no lock-up, and no minimum balance.',
  },
];
