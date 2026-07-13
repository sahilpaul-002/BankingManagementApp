import type { feeDetailsSchemaTypes } from "../types/schemaTypes.js"

export const DNS_CONFIG_X_API_KEYS: Record<string, string> = {
    'business.banking.management.com': "9f4c2a7d8e1b3c6f5a2d9e7c4b1f8a6d3c0e2f9"
}

export const MERCHANT_CATEGORIES = ["GROCERY", "RESTAURANT", "CAFE", "GAS_STATION", "PHARMACY", "HOSPITAL", "HOTEL", "AIRLINE", "PUBLIC_TRANSPORT", "E_COMMERCE", "ELECTRONICS", "CLOTHING", "SUPERMARKET", "ENTERTAINMENT", "GAMING", "EDUCATION", "SUBSCRIPTION", "UTILITIES", "TELECOM", "INSURANCE", "GOVERNMENT", "CHARITY", "BEAUTY", "FITNESS", "HOME_IMPROVEMENT", "PET_SUPPLIES", "JEWELRY", "OFFICE_SUPPLIES", "OTHER"];

export const FEE_DETAILS: feeDetailsSchemaTypes = {
    'fee_unit': "PERCENTAGE",
    'load_fiat_wallet_percent': 1.2,
    'load_crypto_wallet_percent': 1.5,
    'load_card_percent': 2,
    'card_transaction_percent': 0.5,
    'create_card': 5,
    'm2p_percent': 1.4,
    'p2P_percent': 1
}