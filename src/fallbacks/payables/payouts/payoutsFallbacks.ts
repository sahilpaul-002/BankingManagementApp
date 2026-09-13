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
