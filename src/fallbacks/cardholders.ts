export type CardholderType = 'INDIVIDUAL' | 'DELEGATE';
export type CardholderStatus = 'PENDING' | 'READY';

export interface Cardholder {
  id: string;
  fullName: string;
  email: string;
  mobile: string;
  type: CardholderType;
  cardsCount: number;
  status: CardholderStatus;
  initials: string;
  dateOfBirth?: string;
  postalAddress?: string;
}

export const CARDHOLDERS: Cardholder[] = [
  {
    id: 'ch-1',
    fullName: 'Usha Cassin',
    email: 'cardholderlivetests01@example.com',
    mobile: '+91 95053039',
    type: 'INDIVIDUAL',
    cardsCount: 0,
    status: 'PENDING',
    initials: 'UC',
    dateOfBirth: '1982-11-02',
    postalAddress: 'Krajcik Neck, Gilbert, SG, SG — 569933',
  },
  {
    id: 'ch-2',
    fullName: 'John Smith',
    email: 'john@example.com',
    mobile: '+61 432100100',
    type: 'INDIVIDUAL',
    cardsCount: 4,
    status: 'READY',
    initials: 'JS',
    dateOfBirth: '1985-03-15',
    postalAddress: '123 Main Street, Sydney, NSW — 2000',
  },
  {
    id: 'ch-3',
    fullName: 'John Smith',
    email: 'john01@example.com',
    mobile: '+61 432100100',
    type: 'INDIVIDUAL',
    cardsCount: 0,
    status: 'PENDING',
    initials: 'JS',
    dateOfBirth: '1990-05-20',
    postalAddress: '456 Oak Avenue, Melbourne, VIC — 3000',
  },
  {
    id: 'ch-4',
    fullName: 'Northwind Capital',
    email: 'corp@northwind.co',
    mobile: '+44 7700 900111',
    type: 'DELEGATE',
    cardsCount: 2,
    status: 'READY',
    initials: 'NC',
    dateOfBirth: '1978-09-10',
    postalAddress: 'Tower Bridge Road, London, UK — EC1A 1BB',
  },
  {
    id: 'ch-5',
    fullName: 'Northwind Capital',
    email: 'test.cardholder03@yopmail.com',
    mobile: '+56 9874589658',
    type: 'DELEGATE',
    cardsCount: 0,
    status: 'READY',
    initials: 'NC',
    dateOfBirth: '1988-12-25',
    postalAddress: '789 Business Park, Santiago, Chile — 8320000',
  },
  {
    id: 'ch-6',
    fullName: 'Northwind Capital',
    email: 'testlive.cardholder01@yopmail.com',
    mobile: '+971 589658475',
    type: 'DELEGATE',
    cardsCount: 0,
    status: 'READY',
    initials: 'NC',
    dateOfBirth: '1992-07-18',
    postalAddress: 'Sheikh Zayed Road, Dubai, UAE — 00000',
  },
  {
    id: 'ch-7',
    fullName: 'John Doe',
    email: 'testlive.cardholder04@yopmail.com',
    mobile: '+971 566658475',
    type: 'INDIVIDUAL',
    cardsCount: 0,
    status: 'PENDING',
    initials: 'JD',
    dateOfBirth: '1995-02-28',
    postalAddress: 'Palm Jumeirah, Dubai, UAE — 00000',
  },
];

export const getCardholdersByType = (type: CardholderType | 'ALL') => {
  if (type === 'ALL') return CARDHOLDERS;
  return CARDHOLDERS.filter((c) => c.type === type);
};

export const getTypeCount = (type: CardholderType | 'ALL'): number => {
  return getCardholdersByType(type).length;
};

export const getCardholderById = (id: string): Cardholder | undefined => {
  return CARDHOLDERS.find((c) => c.id === id);
};
