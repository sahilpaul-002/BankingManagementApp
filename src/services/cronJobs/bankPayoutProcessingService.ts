import cron from "node-cron";
import { fiatPayoutTransactionsModel as fiat_payout_transactions } from "../../models/fiat_payout_transactions.js";
import bankPayoutProcessingTransaction from "../../mongoDbTransactions/bankPayoutProcessingTransaction.js";
import logger from "../../utils/logger.js";


const processPayoutTransactions = async (): Promise<void> => {

    try {

        const now = new Date();

        // Move PENDING payouts to PROCESSING
        const pendingPayouts = await fiat_payout_transactions.find(
                {
                    status: "PENDING",
                },
                {
                    _id: 1,
                    transaction_id: 1,
                }
            );

        for (const payout of pendingPayouts) {

            const processingStartedAt = new Date();

            const result = await fiat_payout_transactions.updateOne(
                    {
                        _id: payout._id,
                        status: "PENDING",
                    },
                    {
                        $set: {
                            status: "PROCESSING",
                            processing_started_at: processingStartedAt,
                            provider_reference: `MOCK-BANK-${crypto.randomUUID()}`,
                            remarks: "Payout submitted to mock external bank and is being processed",
                        },
                    }
                );

            if (result.modifiedCount === 1) {

                logger.info(
                    `Payout transaction ${payout._id?.toString()} moved from PENDING to PROCESSING`
                );

            }
        }


        // Find PROCESSING payouts that have been processing
        // for at least 15 minutes
        const processingThreshold = new Date(
            now.getTime() - 15 * 60 * 1000
        );

        const processingPayouts = await fiat_payout_transactions.find(
                {
                    status: "PROCESSING",
                    processing_started_at: {
                        $lte: processingThreshold,
                    },
                },
                {
                    _id: 1,
                    transaction_id: 1,
                }
            );


        for (const payout of processingPayouts) {

            try {

                const result = await bankPayoutProcessingTransaction({
                        payoutTransactionId: payout._id?.toString() as string,
                    });

                logger.info(
                    `Payout transaction ${payout._id?.toString()} completed successfully`
                );

            } catch (err) {

                const error = err as any;

                logger.error(
                    error,
                    {
                        serviceName: `PayoutProcessingCronService failed to process payout transaction ${payout._id?.toString()}`,
                    }
                );

            }
        }

    } catch (err) {

        const error = err as any;

        logger.error(
            error,
            {
                serviceName: "PayoutProcessingCronService",
            }
        );
    }
};


export const startBankPayoutProcessingCronJob = (): void => {

    // 30 minute interval cron job to process PENDING and PROCESSING payout transactions
    cron.schedule("*/30 * * * *", async () => {

            logger.info(
                "Payout processing cron job started"
            );

            await processPayoutTransactions();

            logger.info(
                "Payout processing cron job completed"
            );
        }
    );

    logger.info("Payout processing cron job initialized successfully");
};