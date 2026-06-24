export type WalletProvider = 'MetaMask' | 'WalletConnect';
export type FundingVia = 'Binance' | 'Coinbase' | 'OKX' | 'Kraken' | 'Self-custody';
export type Network = 'Ethereum' | 'Polygon' | 'BSC';

export interface DefaultAccount {
  id: string;
  name: string;
  description: string;
  type: 'HASHDT_ACCOUNT';
  isDefault: boolean;
}

export interface ExternalWallet {
  id: string;
  provider: WalletProvider;
  fundingVia: FundingVia;
  network: Network;
  address: string;
  status: 'ACTIVE' | 'REVOKED';
  dailySpendingCap: number;
  todaySpend: number;
  connectedAt: string;
}

export type FundingSource = DefaultAccount | ExternalWallet;

// Default HashDT account data
export const DEFAULT_ACCOUNT: DefaultAccount = {
  id: 'default-account-1',
  name: 'HashDT account balance',
  description: 'All cards fall back to your HashDT fiat & stablecoin balances. Always-on.',
  type: 'HASHDT_ACCOUNT',
  isDefault: true,
};

// Mock external wallets data
export const EXTERNAL_WALLETS: ExternalWallet[] = [
  // Uncomment to show example wallets:
  // {
  //   id: 'wallet-1',
  //   provider: 'MetaMask',
  //   fundingVia: 'Coinbase',
  //   network: 'Ethereum',
  //   address: '0xbddc...6f4c',
  //   status: 'ACTIVE',
  //   dailySpendingCap: 2500,
  //   todaySpend: 0,
  //   connectedAt: '2026-06-11',
  // },
  // {
  //   id: 'wallet-2',
  //   provider: 'WalletConnect',
  //   fundingVia: 'Kraken',
  //   network: 'Ethereum',
  //   address: '0x3921...4719',
  //   status: 'ACTIVE',
  //   dailySpendingCap: 24500,
  //   todaySpend: 0,
  //   connectedAt: '2026-06-11',
  // },
];

// Helper functions
export const getDefaultAccount = (): DefaultAccount => DEFAULT_ACCOUNT;

export const getExternalWallets = (): ExternalWallet[] => EXTERNAL_WALLETS;

export const hasExternalWallets = (): boolean => EXTERNAL_WALLETS.length > 0;

export const getAllFundingSources = (): FundingSource[] => {
  return [DEFAULT_ACCOUNT, ...EXTERNAL_WALLETS];
};
