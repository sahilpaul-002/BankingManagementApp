import type { feeDetailsSchemaTypes } from "../types/schemaTypes.js"

export const DNS_CONFIG_X_API_KEYS: Record<string, string> = {
    'business.banking-management.com': "9f4c2a7d8e1b3c6f5a2d9e7c4b1f8a6d3c0e2f9"
}

export const FEE_DETAILS: feeDetailsSchemaTypes = {
    'fee_unit': "PERCENTAGE",
    'load_fiat_wallet': 0.2,
    'load_crypto_wallet': 0.5,
    'load_card': 0.3,
    'card_transaction': 0.1,
    'm2p': 0.4,
    'p2P': 0.3
}