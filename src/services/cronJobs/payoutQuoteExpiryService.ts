import cron from "node-cron";
import { fiatPayoutQuoteModel as fiat_payout_quotes } from "../../models/fiat_payout_quotes.js";
import logger from "../../utils/logger.js";


// ------------------------------------- EXPIRE PAYOUT QUOTES SERVICE ------------------------------------- \\
export const expirePayoutQuotesService = async (): Promise<void> => {
    try {

        const currentDate = new Date();

        // Find all ACTIVE payout quotes whose expiry time has passed
        // and update them to EXPIRED.
        const result = await fiat_payout_quotes.updateMany(
            {
                quote_status: "ACTIVE",
                expires_at: {
                    $lte: currentDate,
                },
            },
            {
                $set: {
                    quote_status: "EXPIRED",
                },
            }
        );

        if (result.modifiedCount > 0) {
            logger.info(`Expired payout quote cron job completed successfully.${ result.modifiedCount } payout quote(s) marked as EXPIRED.`);
        } else {
            logger.info("Expired payout quote cron job completed. No expired ACTIVE payout quotes found.");
        }

    } catch (err) {
        const error = err as any;

        logger.error(error, {serviceName: "ExpirePayoutQuotesService failed to update expired payout quotes",});

    }
};


// ------------------------------------- PAYOUT QUOTE EXPIRY CRON JOB ------------------------------------- \\
export const startPayoutQuoteExpiryCronJob = (): void => {
    cron.schedule("*/5 * * * *", async () => {

        logger.info("Expired payout quote cron job started.");

        await expirePayoutQuotesService();

    });

    logger.info(
        "Expired payout quote cron job initialized successfully."
    );
};
// ------------------------------------- XXXXXXXXXXXXXXXXXXXXXXX ------------------------------------- \\