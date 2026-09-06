import cron from "node-cron";
import {walletCurrencyConversionQuoteModel as wallet_currency_conversion_quotes} from "../../models/wallet_currency_conversion_quotes.js";
import logger from "../../utils/logger.js";
import expiredWalletCurrencyConversionQuoteTransaction from "../../mongoDbTransactions/expiredWalletCurrencyConversionQuoteTransaction.js";


// ----------------------------- EXPIRE WALLET CURRENCY CONVERSION QUOTES SERVICE ----------------------------- //
export const expireWalletCurrencyConversionQuotesService = async (): Promise<void> => {
    try {

        const currentDate = new Date();

        const expiredQuotes = await wallet_currency_conversion_quotes.find(
                {
                    quote_status: {
                        $in: ["ACTIVE", "EXPIRED"],
                    },

                    expires_at: {
                        $lte: currentDate,
                    },
                },
                {
                    _id: 1,
                }
            ).lean();

        if (expiredQuotes.length === 0) {
            logger.info("Expired wallet currency conversion quote cron job completed. " + "No expired ACTIVE or EXPIRED conversion quotes found.");

            return;
        }

        let successfullyProcessedCount = 0;
        let failedCount = 0;

        for (const quote of expiredQuotes) {
            try {
                await expiredWalletCurrencyConversionQuoteTransaction(quote._id);

                successfullyProcessedCount++;
            }
            catch (err) {
                failedCount++;

                const error = err as any;

                logger.error(
                    error,
                    {
                        serviceName: "ExpireWalletCurrencyConversionQuotesService",
                        quoteId: quote._id.toString(),
                    }
                );
            }
        }

        logger.info(
            `Expired wallet currency conversion quote cron job completed. ` +
            `${successfullyProcessedCount} quote(s) processed successfully. ` +
            `${failedCount} quote(s) failed.`
        );

    }
    catch (err) {

        const error = err as any;

        logger.error(
            error,
            {
                serviceName: "ExpireWalletCurrencyConversionQuotesService failed to find expired quotes",
            }
        );
    }
};
// ---------------------------------- XXXXXXXXXXXXXXXXXXXXXXXXXX ---------------------------------- //


// ----------------------------- WALLET CURRENCY CONVERSION QUOTE EXPIRY CRON JOB ----------------------------- //
export const startWalletCurrencyConversionQuoteExpiryCronJob = (): void => {
    cron.schedule("*/5 * * * *", async () => {

        try {

            logger.info(
                "Expired wallet currency conversion quote cron job started.",
                {
                    serviceName: "ExpireWalletCurrencyConversionQuotesCronJob",
                }
            );

            await expireWalletCurrencyConversionQuotesService();

            logger.info(
                "Expired wallet currency conversion quote cron job completed.",
                {
                    serviceName: "ExpireWalletCurrencyConversionQuotesCronJob",
                }
            );

        }
        catch (err: any) {

            logger.error(
                err,
                {
                    serviceName: "ExpireWalletCurrencyConversionQuotesCronJob",

                    message: "Unexpected error in wallet currency conversion quote expiry cron job",
                }
            );
        }
    });

    logger.info("Wallet currency conversion quote expiry cron job initialized successfully.");
};