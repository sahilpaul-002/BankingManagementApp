
// ── All Wallets Balances Types ──────────────────────────────────────
export type WalletCurrencyType = 'USD' | 'SGD' | 'EUR' | 'USDT' | 'USDC';
export type WalletCategoryType = 'FIAT' | 'CRYPTO';
export type WalletStatusType = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface WalletBalanceItemType {
    _id: string;
    wallet_status: WalletStatusType;
    account_balance: string;
    available_balance: string;
    holding_amount: string;
    wallet_type: WalletCategoryType;
    wallet_currency: WalletCurrencyType;
    usd_equivalent: string;
}

export interface AllWalletBalancesResponseDataType {
    walletId: string;
    wallets_details: WalletBalanceItemType[];
    total_usd_equivalent: string;
}

export interface AllWalletBalancesResponseType {
    status: string;
    message: string;
    data: AllWalletBalancesResponseDataType;
}

// ── Payout Types ──────────────────────────────────────
export interface PurposeOptionItemType {
    value: string;
    label: string;
}

export interface CreatePayoutQuoteRequestBodyType {
    beneficiary_id: string;
    source_currency: string;
    amount: string | number;
    purpose_of_payment: string;
    memo?: string | undefined;
}

export interface PayoutQuoteBeneficiaryDataType {
    beneficiary_id: string;
    account_holder_name: string;
    account_number: string;
    account_currency: string;
    bank_name: string;
}

export interface PayoutQuoteCurrencyAmountType {
    currency: string;
    amount: string;
}

export interface PayoutQuoteDestinationDataType {
    currency: string;
    gross_amount: string;
    amount: string;
}

export interface PayoutQuoteDataType {
    quote_id: string;
    beneficiary: PayoutQuoteBeneficiaryDataType;
    source: PayoutQuoteCurrencyAmountType;
    destination: PayoutQuoteDestinationDataType;
    exchange_rate: string;
    fee: PayoutQuoteCurrencyAmountType;
    total_debit: PayoutQuoteCurrencyAmountType;
    quote_status: string;
    expires_at: string;
}

export interface CreatePayoutQuoteResponseType {
    status: string;
    message: string;
    data: PayoutQuoteDataType;
}

export interface ExecutePayoutQuoteRequestBodyType {
    quote_id: string;
    documents?: FileList | File[] | File | undefined;
    memo?: string | undefined;
}

export interface ExecutePayoutQuoteDataType {
    payout_transaction_id: string;
    wallet_transaction_id: string;
    wallet_id: string;
    source_currency: string;
    source_amount: {
        $numberDecimal: string;
    };
    destination_currency: string;
    destination_amount: {
        $numberDecimal: string;
    };
    status: string;
}

export interface ExecutePayoutQuoteResponseType {
    status: string;
    message: string;
    data: ExecutePayoutQuoteDataType;
}

export type CryptoTransactionFormDataType = {
    source_wallet_currency: 'USDT' | 'USDC';
    network: 'ETHEREUM' | 'POLYGON';
    destination_address: string;
    amount: string;
};

export type CryptoBeneficiaryTransferResponseDataType = {
    transfer_reference_id: string;
    crypto_wallet_transaction_id: string;
    usd_fee_wallet_transaction_id: string;
    wallet_id: string;
    source_currency: 'USDT' | 'USDC';
    source_amount: string;
    destination_network: 'ETHEREUM' | 'POLYGON';
    destination_address: string;
    source_amount_usd: string;
    fee: {
        currency: 'USD';
        percentage: string;
        amount: string;
    };
    total_source_wallet_debit: {
        currency: 'USDT' | 'USDC';
        amount: string;
    };
    total_usd_wallet_debit: {
        currency: 'USD';
        amount: string;
    };
    status: string;
};

export interface CryptoBeneficiaryTransferResponseType {
    status: string;
    message: string;
    data: CryptoBeneficiaryTransferResponseDataType;
}

// ── Purpose of Payments Hardcoded Fallback Values ────────────────────────
export const PURPOSE_OF_PAYMENTS_FALLBACK: PurposeOptionItemType[] = [
    { value: 'AUDIO_VISUAL_SERVICES', label: 'Audiovisual services' },
    { value: 'BILL_PAYMENT', label: 'Bill payment' },
    { value: 'BUSINESS_EXPENSES', label: 'Business expenses' },
    { value: 'CONSTRUCTION', label: 'Construction' },
    { value: 'DONATION_CHARITABLE_CONTRIBUTION', label: 'Donation/charitable contribution' },
    { value: 'EDUCATION_TRAINING', label: 'Education/training' },
    { value: 'FAMILY_SUPPORT', label: 'Family support' },
    { value: 'FREIGHT', label: 'Freight' },
    { value: 'GOODS_PURCHASED', label: 'Goods purchased' },
    { value: 'INVESTMENT_CAPITAL', label: 'Investment capital' },
    { value: 'INVESTMENT_PROCEEDS', label: 'Investment proceeds' },
    { value: 'LIVING_EXPENSES', label: 'Living expenses' },
    { value: 'LOAN_CREDIT_REPAYMENT', label: 'Loan/credit repayment' },
    { value: 'MEDICAL_SERVICES', label: 'Medical services' },
    { value: 'PENSION', label: 'Pension' },
    { value: 'PERSONAL_REMITTANCE', label: 'Personal remittance' },
    { value: 'PROFESSIONAL_BUSINESS_SERVICES', label: 'Professional/business services' },
    { value: 'REAL_ESTATE', label: 'Real estate' },
    { value: 'TAXES', label: 'Taxes' },
    { value: 'TECHNICAL_SERVICES', label: 'Technical services' },
    { value: 'TRANSFER_TO_OWN_ACCOUNT', label: 'Transfer to own account' },
    { value: 'TRAVEL', label: 'Travel' },
    { value: 'WAGES_SALARY', label: 'Wages/salary' },
];

// ── Payout Transaction Item Interface ──────────────────────────────────────
export interface PayoutTransactionItem {
    _id: string;
    quote_id: string;
    beneficiary_id: string;
    source_currency: string;
    source_amount: {
        $numberDecimal: string;
    };
    destination_currency: string;
    destination_amount: {
        $numberDecimal: string;
    };
    exchange_rate: {
        $numberDecimal: string;
    };
    fee_amount: {
        $numberDecimal: string;
    };
    status: string;
    processing_started_at: string;
    completed_at: string | null;
    provider_reference: string;
    remarks: string;
    __v?: number;
}

export interface PayoutTransactionsPagination {
    current_page: number;
    page_size: number;
    total_records: number;
    total_pages: number;
    has_next_page: boolean;
    has_previous_page: boolean;
}

export interface PayoutTransactionsListResponseData {
    user_id: string;
    pagination: PayoutTransactionsPagination;
    transactions: PayoutTransactionItem[];
}

export interface PayoutTransactionsListResponse {
    status: string;
    message: string;
    data: PayoutTransactionsListResponseData;
}

export interface PayoutTransactionDetailsResponseData {
    transaction: PayoutTransactionItem;
}

export interface PayoutTransactionDetailsResponse {
    status: string;
    message: string;
    data: PayoutTransactionDetailsResponseData;
}