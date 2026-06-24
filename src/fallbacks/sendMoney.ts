export interface Wallet {
  id: string;
  name: string;
  currency: string;
  balance: number;
  network?: string;
}

export interface PaymentPurpose {
  value: string;
  label: string;
}

export interface TransactionFormData {
  fromWallet: string;
  beneficiary: string;
  sendAmount: string;
  destinationCurrency: string;
  purpose: string;
  memo: string;
  attachedFile?: File | null;
}

export interface TransactionQuote {
  sendAmount: number;
  sendCurrency: string;
  fee: number;
  feeCurrency: string;
  exchangeRate: number;
  receiveAmount: number;
  receiveCurrency: string;
  quoteId: string;
  expiresIn: string;
  settlementTime: string;
}

export const WALLETS: Wallet[] = [
  {
    id: 'usdc-eth',
    name: 'USDC Wallet',
    currency: 'USDC',
    balance: 9568215.32,
    network: 'Ethereum',
  },
  {
    id: 'usdt-eth',
    name: 'USDT Wallet',
    currency: 'USDT',
    balance: 2450000.00,
    network: 'Ethereum',
  },
  {
    id: 'eurc-eth',
    name: 'EURC Wallet',
    currency: 'EURC',
    balance: 1250000.00,
    network: 'Ethereum',
  },
];

export const DESTINATION_CURRENCIES = [
  { code: 'USD', name: 'US Dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'SGD', name: 'Singapore Dollar' },
];

export const PAYMENT_PURPOSES: PaymentPurpose[] = [
  { value: 'vendor_payment', label: 'Vendor payment' },
  { value: 'salary', label: 'Salary' },
  { value: 'invoice_payment', label: 'Invoice payment' },
  { value: 'loan_repayment', label: 'Loan repayment' },
  { value: 'personal_transfer', label: 'Personal transfer' },
  { value: 'business_services', label: 'Business services' },
  { value: 'other', label: 'Other' },
];

export const MOCK_BENEFICIARIES = [
  { id: 'swift-1', name: 'Riley Asteroth', rail: 'SWIFT', details: '****8901' },
  { id: 'swift-2', name: 'John Cena', rail: 'SWIFT', details: '****3210' },
  { id: 'sepa-1', name: 'Bertha Logistik', rail: 'SEPA', details: 'DE89370400440532013000' },
];

export const generateQuote = (formData: TransactionFormData): TransactionQuote => {
  const sendAmount = parseFloat(formData.sendAmount.replace(/,/g, '')) || 0;
  const fee = 2.50;
  const exchangeRate = 1.0000;
  const receiveAmount = sendAmount * exchangeRate;

  return {
    sendAmount,
    sendCurrency: 'USDC',
    fee,
    feeCurrency: 'USDC',
    exchangeRate,
    receiveAmount,
    receiveCurrency: formData.destinationCurrency,
    quoteId: `MOCK_QUOTE_${Math.random().toString(36).substring(2, 11).toUpperCase()}`,
    expiresIn: '4 min 12 sec',
    settlementTime: '1 business day',
  };
};
