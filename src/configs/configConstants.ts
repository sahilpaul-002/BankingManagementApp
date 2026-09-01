import type { feeDetailsSchemaTypes } from "../types/schemaTypes.js"

export const MERCHANT_CATEGORIES = ["GROCERY", "RESTAURANT", "CAFE", "GAS_STATION", "PHARMACY", "HOSPITAL", "HOTEL", "AIRLINE", "PUBLIC_TRANSPORT", "E_COMMERCE", "ELECTRONICS", "CLOTHING", "SUPERMARKET", "ENTERTAINMENT", "GAMING", "EDUCATION", "SUBSCRIPTION", "UTILITIES", "TELECOM", "INSURANCE", "GOVERNMENT", "CHARITY", "BEAUTY", "FITNESS", "PET_SUPPLIES", "JEWELRY", "OFFICE_SUPPLIES", "OTHER"];

export const FEE_DETAILS: feeDetailsSchemaTypes = {
    'fee_unit': "PERCENTAGE",
    'load_fiat_wallet_percent': 2,
    'load_crypto_wallet_percent': 2.5,
    'load_card_percent': 3,
    'card_transaction_percent': 1,
    'create_card': 5,
    'm2p_percent': 6,
    'p2P_percent': 8,
    'currency_conversion': 4,
    'crypto_currency_conversion': 10,
}