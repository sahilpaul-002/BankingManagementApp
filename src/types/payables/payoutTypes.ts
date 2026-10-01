
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
export interface PurposeOptionItem {
    value: string;
    label: string;
}

export interface CreatePayoutQuoteRequestBody {
    beneficiary_id: string;
    source_currency: string;
    amount: string | number;
    purpose_of_payment: string;
    memo?: string | undefined;
}

export interface PayoutQuoteBeneficiaryData {
    beneficiary_id: string;
    account_holder_name: string;
    account_number: string;
    account_currency: string;
    bank_name: string;
}

export interface PayoutQuoteCurrencyAmount {
    currency: string;
    amount: string;
}

export interface PayoutQuoteDestinationData {
    currency: string;
    gross_amount: string;
    amount: string;
}

export interface PayoutQuoteData {
    quote_id: string;
    beneficiary: PayoutQuoteBeneficiaryData;
    source: PayoutQuoteCurrencyAmount;
    destination: PayoutQuoteDestinationData;
    exchange_rate: string;
    fee: PayoutQuoteCurrencyAmount;
    total_debit: PayoutQuoteCurrencyAmount;
    quote_status: string;
    expires_at: string;
}

export interface CreatePayoutQuoteResponse {
    status: string;
    message: string;
    data: PayoutQuoteData;
}

export interface ExecutePayoutQuoteRequestBody {
    quote_id: string;
    documents?: FileList | File[] | File | undefined;
    memo?: string | undefined;
}

export interface ExecutePayoutQuoteData {
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

export interface ExecutePayoutQuoteResponse {
    status: string;
    message: string;
    data: ExecutePayoutQuoteData;
}

// ── Purpose of Payments Hardcoded Fallback Values ────────────────────────
export const PURPOSE_OF_PAYMENTS_FALLBACK: PurposeOptionItem[] = [
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