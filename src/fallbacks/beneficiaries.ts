export type TransferRail = 'SWIFT' | 'SEPA' | 'ON_CHAIN';

export interface Beneficiary {
  id: string;
  receiverName: string;
  accountNumber?: string; // IBAN for SEPA, account number for SWIFT
  swift?: string; // BIC/SWIFT code
  network?: string; // For crypto
  walletAddress?: string; // For crypto
  country: string;
  countryCode: string;
  rail: TransferRail;
  initials: string; // For avatar display
}

export const BENEFICIARIES: Beneficiary[] = [
  // International Wire · SWIFT
  {
    id: 'swift-1',
    receiverName: 'Riley Asteroth',
    accountNumber: '****8901',
    swift: 'BNPAFRPPXXX',
    country: 'France',
    countryCode: 'FR',
    rail: 'SWIFT',
    initials: 'RA',
  },
  {
    id: 'swift-2',
    receiverName: 'John Cena',
    accountNumber: '****3210',
    swift: '—',
    country: 'United States',
    countryCode: 'US',
    rail: 'SWIFT',
    initials: 'JC',
  },
  {
    id: 'swift-3',
    receiverName: 'Marie Dupont',
    accountNumber: 'FR7630056100805012345678906',
    swift: 'BNPAFRPPXXX',
    country: 'France',
    countryCode: 'FR',
    rail: 'SWIFT',
    initials: 'MD',
  },
  // SEPA · Eurozone
  {
    id: 'sepa-1',
    receiverName: 'Bertha Logistik',
    accountNumber: 'DE89370400440532013000',
    swift: 'C0BADEFF915',
    country: 'Germany',
    countryCode: 'DE',
    rail: 'SEPA',
    initials: 'BL',
  },
  // On-chain wallets
  {
    id: 'crypto-1',
    receiverName: 'Vault 21 Holdings',
    network: 'Ethereum',
    walletAddress: '0x9c4f...ee82e1',
    country: '—',
    countryCode: '',
    rail: 'ON_CHAIN',
    initials: 'V2',
  },
];

export const getBeneficiariesByRail = (rail: TransferRail) => {
  return BENEFICIARIES.filter((b) => b.rail === rail);
};

export const getRailLabel = (rail: TransferRail): string => {
  switch (rail) {
    case 'SWIFT':
      return 'International Wire · SWIFT';
    case 'SEPA':
      return 'SEPA · Eurozone';
    case 'ON_CHAIN':
      return 'On-chain wallets';
    default:
      return '';
  }
};

export const getRailCount = (rail: TransferRail): number => {
  return getBeneficiariesByRail(rail).length;
};
