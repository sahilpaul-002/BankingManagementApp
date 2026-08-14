import { USD_BASE_FX_RATES } from "../types/usdBasedFaxRates.js";
import { AppErrorClass, ServiceError } from "../utils/AppErrorClass.js";
import logger from "../utils/logger.js";

interface FxRateResponse {
    source_currency: string;
    destination_currency: string;
    exchange_rate: number;
}

export const getFxRate = async (sourceCurrency: string, destinationCurrency: string): Promise<FxRateResponse> => {

    try {

        const source = sourceCurrency.trim().toUpperCase();
        const destination = destinationCurrency.trim().toUpperCase();


        // Same currency
        if (source === destination) {
            return {
                source_currency: source,
                destination_currency: destination,
                exchange_rate: 1,
            };
        }


        const sourceRate = USD_BASE_FX_RATES[source as keyof typeof USD_BASE_FX_RATES];
        const destinationRate = USD_BASE_FX_RATES[destination as keyof typeof USD_BASE_FX_RATES];


        if (sourceRate === undefined) {
            throw new ServiceError(`FX rate not available for source currency: ${source}`);
        }


        if (destinationRate === undefined) {
            throw new ServiceError(`FX rate not available for destination currency: ${destination}`);
        }


        /*
         * FX_RATES represents:
         *
         * 1 USD = X currency
         *
         * Therefore:
         *
         * source → destination
         *
         * destination rate / source rate
         */

        const exchangeRate = destinationRate / sourceRate;


        return {
            source_currency: source,
            destination_currency: destination,
            exchange_rate: exchangeRate,
        };

    }
    catch (err) {

        const error = err as any;
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "FxRateService"
        });

        if (error instanceof AppErrorClass) {
            throw error;
        }

        throw new ServiceError(
            `Unable to retrieve FX rate: [${errorStatus}] ${error.message}`,
            error?.error ? error.error : error
        );
    }
};