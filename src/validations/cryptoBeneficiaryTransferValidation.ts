import { Decimal } from "decimal.js";
import z from "zod";

const SOURCE_CRYPTO_WALLET_CURRENCIES = ["USDT", "USDC"] as const;
const CRYPTO_NETWORKS = ["ETHEREUM", "POLYGON"] as const;

const cryptoBeneficiaryTransferValidationSchema = z.object({
    source_currency: z
        .string("Source currency is required")
        .trim()
        .toUpperCase()
        .pipe(
            z.enum(
                SOURCE_CRYPTO_WALLET_CURRENCIES,
                "Invalid source crypto currency"
            )
        ),

    destination_network: z
        .string("Destination network is required")
        .trim()
        .toUpperCase()
        .pipe(
            z.enum(CRYPTO_NETWORKS, "Invalid destination network")
        ),

    destination_address: z
        .string("Destination address is required")
        .trim()
        .min(1, "Destination address is required")
        .max(255, "Destination address is too long"),

    amount: z
        .instanceof(Decimal)
        .refine(
            (value) => value.greaterThan(0),
            "Transfer amount must be greater than 0"
        ),
}).strict();

export default cryptoBeneficiaryTransferValidationSchema;