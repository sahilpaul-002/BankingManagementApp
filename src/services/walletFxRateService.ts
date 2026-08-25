import type { walletCurrencyType } from "../types/schemaTypes.js";
import { USD_BASE_WALLET_FX_RATES } from "../types/usdBasedFaxRates.js";
import { AppErrorClass, ServiceError } from "../utils/AppErrorClass.js";
import logger from "../utils/logger.js";
import sanitizeApiError from "../utils/sanitizeApiError.js";

interface WalletFxRateResponse {
    source_currency: walletCurrencyType;
    destination_currency: walletCurrencyType;
    exchange_rate: number;
}

const getWalletFxRate = async (
    sourceCurrency: string,
    destinationCurrency: string
): Promise<WalletFxRateResponse> => {

    try {

        const source = sourceCurrency.trim().toUpperCase() as walletCurrencyType;
        const destination = destinationCurrency.trim().toUpperCase() as walletCurrencyType;

        // Same currency
        if (source === destination) {
            return {
                source_currency: source,
                destination_currency: destination,
                exchange_rate: 1,
            };
        }

        const sourceRate = USD_BASE_WALLET_FX_RATES[source];

        const destinationRate = USD_BASE_WALLET_FX_RATES[destination];

        if (sourceRate === undefined) {
            throw new ServiceError(
                `FX rate not available for source currency: ${source}`
            );
        }

        if (destinationRate === undefined) {
            throw new ServiceError(
                `FX rate not available for destination currency: ${destination}`
            );
        }

        /*
         * USD_BASE_WALLET_FX_RATES represents:
         *
         * 1 USD = X currency
         *
         * Therefore:
         *
         * source → destination
         *
         * destination rate / source rate
         */

        const exchangeRate =
            destinationRate / sourceRate;

        return {
            source_currency: source,
            destination_currency: destination,
            exchange_rate: exchangeRate,
        };

    }
    catch (err) {

        const error = err as any;

        const errorStatus =
            error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "GetWalletFxRate",
        });

        const sanitizedError = sanitizeApiError(error);

        if (error instanceof AppErrorClass) {
            throw error;
        }

        throw new ServiceError(
            `Unable to retrieve wallet FX rate`,
            sanitizedError
        );
    }
};

export default getWalletFxRate;