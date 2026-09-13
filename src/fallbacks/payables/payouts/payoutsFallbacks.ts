import type { BeneficiaryItem } from '@/fallbacks/payables/beneficiaries/beneficiariesFallbacks';

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

// ── 2. Purpose of Payments Hardcoded Fallback Values ────────────────────────
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

// ── 3. Create Payout Quote API Response Data Fallback ────────────────────────
export const CREATE_PAYOUT_QUOTE_FALLBACK: PayoutQuoteData = {
    quote_id: "6aa68d9f7c65f7a9f987bc32",
    beneficiary: {
        beneficiary_id: "6a994f40ea3940d9bc444b0b",
        account_holder_name: "John Doe",
        account_number: "123456789012",
        account_currency: "USD",
        bank_name: "Bank of America"
    },
    source: {
        currency: "USD",
        amount: "100.0000"
    },
    destination: {
        currency: "USD",
        gross_amount: "100.0000",
        amount: "92.0000"
    },
    exchange_rate: "1.00000000",
    fee: {
        currency: "USD",
        amount: "8.0000"
    },
    total_debit: {
        currency: "USD",
        amount: "100.0000"
    },
    quote_status: "ACTIVE",
    expires_at: "2026-09-13T11:50:47.585Z"
};

// ── 4. Execute Payout Quote API Response Data Fallback ───────────────────────
export const EXECUTE_PAYOUT_QUOTE_FALLBACK: ExecutePayoutQuoteData = {
    payout_transaction_id: "6aa68deb7c65f7a9f987bc38",
    wallet_transaction_id: "6aa68deb7c65f7a9f987bc39",
    wallet_id: "6a96a677131080273ade1fb5",
    source_currency: "USD",
    source_amount: {
        $numberDecimal: "100.0000"
    },
    destination_currency: "USD",
    destination_amount: {
        $numberDecimal: "92.0000"
    },
    status: "PENDING"
};

// ── 5. Payout Transaction Item Interface ──────────────────────────────────────
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

// ── 6. Payout Transactions List Fallback Data ───────────────────────────────
export const PAYOUT_TRANSACTIONS_LIST_FALLBACK: PayoutTransactionItem[] = [
    {
        _id: "6aa68deb7c65f7a9f987bc38",
        quote_id: "6aa68d9f7c65f7a9f987bc32",
        beneficiary_id: "6a994f40ea3940d9bc444b0b",
        source_currency: "USD",
        source_amount: {
            $numberDecimal: "100.0000"
        },
        destination_currency: "USD",
        destination_amount: {
            $numberDecimal: "92.0000"
        },
        exchange_rate: {
            $numberDecimal: "1.00000000"
        },
        fee_amount: {
            $numberDecimal: "8.0000"
        },
        status: "PROCESSING",
        processing_started_at: "2026-09-13T12:00:00.100Z",
        completed_at: null,
        provider_reference: "MOCK-BANK-98434c99-1557-4ee7-8ff2-d0d784c71404",
        remarks: "Payout submitted to mock external bank and is being processed"
    },
    {
        _id: "6a9a903c0cedff87fc991393",
        quote_id: "6a9a90370cedff87fc99138d",
        beneficiary_id: "6a994f40ea3940d9bc444b0b",
        source_currency: "USD",
        source_amount: {
            $numberDecimal: "100.0000"
        },
        destination_currency: "USD",
        destination_amount: {
            $numberDecimal: "92.0000"
        },
        exchange_rate: {
            $numberDecimal: "1.00000000"
        },
        fee_amount: {
            $numberDecimal: "8.0000"
        },
        status: "SUCCESS",
        processing_started_at: "2026-09-04T09:34:00.046Z",
        completed_at: "2026-09-04T09:50:00.200Z",
        provider_reference: "MOCK-BANK-67d574aa-f33d-4e08-8ba1-1cdb812a6e68",
        remarks: "Payout successfully completed by mock external bank"
    },
    {
        _id: "6a9a80290f284fea6c4b3101",
        quote_id: "6a9a80210f284fea6c4b30fb",
        beneficiary_id: "6a994f40ea3940d9bc444b0b",
        source_currency: "USD",
        source_amount: {
            $numberDecimal: "100.0000"
        },
        destination_currency: "USD",
        destination_amount: {
            $numberDecimal: "92.0000"
        },
        exchange_rate: {
            $numberDecimal: "1.00000000"
        },
        fee_amount: {
            $numberDecimal: "8.0000"
        },
        status: "SUCCESS",
        processing_started_at: "2026-09-04T08:30:00.063Z",
        completed_at: "2026-09-04T09:26:42.379Z",
        provider_reference: "MOCK-BANK-227359b3-07cb-4f4e-acdb-4000517c3ba1",
        remarks: "Payout successfully completed by mock external bank"
    }
];

// ── 7. Payout Transaction Details Fallback Data ─────────────────────────────
export const PAYOUT_TRANSACTION_DETAILS_FALLBACK: PayoutTransactionItem = {
    _id: "6a9a903c0cedff87fc991393",
    quote_id: "6a9a90370cedff87fc99138d",
    beneficiary_id: "6a994f40ea3940d9bc444b0b",
    source_currency: "USD",
    source_amount: {
        $numberDecimal: "100.0000"
    },
    destination_currency: "USD",
    destination_amount: {
        $numberDecimal: "92.0000"
    },
    exchange_rate: {
        $numberDecimal: "1.00000000"
    },
    fee_amount: {
        $numberDecimal: "8.0000"
    },
    status: "SUCCESS",
    processing_started_at: "2026-09-04T09:34:00.046Z",
    completed_at: "2026-09-04T09:50:00.200Z",
    provider_reference: "MOCK-BANK-67d574aa-f33d-4e08-8ba1-1cdb812a6e68",
    remarks: "Payout successfully completed by mock external bank",
    __v: 0
};
