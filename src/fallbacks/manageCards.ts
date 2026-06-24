export type CardStatus = 'ACTIVE' | 'FROZEN' | 'PENDING' | 'CLOSED';
export type CardType = 'PHYSICAL' | 'VIRTUAL';

export interface Card {
  id: string;
  cardNumber: string;
  type: CardType;
  currency: string;
  holder: string;
  holderCompany: string;
  purpose: string;
  status: CardStatus;
  spent: number;
  limit: number;
}

export const CARDS: Card[] = [
  {
    id: 'card-1',
    cardNumber: '3594',
    type: 'PHYSICAL',
    currency: 'USD',
    holder: 'John Smith',
    holderCompany: '',
    purpose: 'Travel & expenses',
    status: 'PENDING',
    spent: 0,
    limit: 5000,
  },
  {
    id: 'card-2',
    cardNumber: '6114',
    type: 'VIRTUAL',
    currency: 'SGD',
    holder: 'Northwind Capital',
    holderCompany: 'Northwind Capital Ltd.',
    purpose: 'Subscriptions',
    status: 'ACTIVE',
    spent: 1199,
    limit: 3000,
  },
  {
    id: 'card-3',
    cardNumber: '1668',
    type: 'VIRTUAL',
    currency: 'USD',
    holder: 'John Smith',
    holderCompany: 'Northwind Capital Ltd.',
    purpose: 'Business expenses',
    status: 'ACTIVE',
    spent: 2842,
    limit: 10000,
  },
  {
    id: 'card-4',
    cardNumber: '5265',
    type: 'VIRTUAL',
    currency: 'GBP',
    holder: 'Northwind Capital',
    holderCompany: 'Northwind Capital Ltd.',
    purpose: 'Office supplies',
    status: 'ACTIVE',
    spent: 520,
    limit: 2000,
  },
  {
    id: 'card-5',
    cardNumber: '8885',
    type: 'VIRTUAL',
    currency: 'EUR',
    holder: 'Northwind Capital',
    holderCompany: '',
    purpose: 'Vendor payments',
    status: 'CLOSED',
    spent: 0,
    limit: 0,
  },
  {
    id: 'card-6',
    cardNumber: '2341',
    type: 'PHYSICAL',
    currency: 'USD',
    holder: 'Sarah Johnson',
    holderCompany: 'Northwind Capital Ltd.',
    purpose: 'Marketing expenses',
    status: 'FROZEN',
    spent: 1500,
    limit: 4000,
  },
  {
    id: 'card-7',
    cardNumber: '7892',
    type: 'VIRTUAL',
    currency: 'SGD',
    holder: 'Michael Chen',
    holderCompany: '',
    purpose: 'Software subscriptions',
    status: 'ACTIVE',
    spent: 800,
    limit: 2500,
  },
];

export const getCardsByStatus = (status: CardStatus | 'ALL') => {
  if (status === 'ALL') return CARDS;
  return CARDS.filter((card) => card.status === status);
};

export const getStatusCount = (status: CardStatus | 'ALL'): number => {
  return getCardsByStatus(status).length;
};

export const getCardById = (id: string): Card | undefined => {
  return CARDS.find((card) => card.id === id);
};

// Calculate aggregate spend for the month
export const getMonthlySpend = (): { spent: number; limit: number } => {
  const activeCards = CARDS.filter((card) => card.status === 'ACTIVE' || card.status === 'FROZEN');
  const spent = activeCards.reduce((sum, card) => sum + card.spent, 0);
  const limit = activeCards.reduce((sum, card) => sum + card.limit, 0);
  return { spent, limit };
};
