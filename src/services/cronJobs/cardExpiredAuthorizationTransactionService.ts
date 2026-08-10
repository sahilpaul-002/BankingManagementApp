import cron from "node-cron";
import { userCardTransactionsModel as user_card_transactions } from "../../models/user_card_transaction_details.js";
import expireCardAuthorizationTransaction from "../../mongoDbTransactions/expiredCardAuthorizationTransaction.js";
import logger from "../../utils/logger.js";

const processExpiredCardTransactions = async (): Promise<void> => {

    try {

        const now = new Date();

        // --------------------------------------------------
        // Find expired pending authorizations
        // --------------------------------------------------

        const expiredTransactions = await user_card_transactions.find(
                {
                    authorization_status: "PENDING",

                    authorization_expires_at: {
                        $lte: now,
                    },
                },
                {
                    _id: 1,
                    transaction_id: 1,
                }
            );

        if (expiredTransactions.length === 0) {

            logger.info(
                "No expired card transaction authorizations found"
            );

            return;
        }

        logger.info(
            `Found ${expiredTransactions.length} expired card transaction authorization(s)`
        );

        // --------------------------------------------------
        // Process each expired transaction
        // --------------------------------------------------

        for (const transaction of expiredTransactions) {

            try {

                await expireCardAuthorizationTransaction({
                    transactionId:
                        transaction.transaction_id,
                });

                logger.info(
                    `Card transaction ${transaction.transaction_id} authorization expired successfully`
                );

            } catch (err) {

                const error = err as any;

                logger.error(
                    error,
                    {
                        serviceName:
                            "CardTransactionAuthorizationExpiryCronService",
                        transactionId:
                            transaction.transaction_id,
                    }
                );
            }
        }

    } catch (err) {

        const error = err as any;

        logger.error(
            error,
            {
                serviceName:
                    "CardTransactionAuthorizationExpiryCronService",
            }
        );
    }
};


// --------------------------------------------------
// Start Cron Job
// --------------------------------------------------

export const startCardExpiredAuthorizationTransactionCronJob =
    (): void => {

        cron.schedule(
            "* * * * *",
            async () => {

                logger.info(
                    "Card transaction authorization expiry cron job started"
                );

                await processExpiredCardTransactions();

                logger.info(
                    "Card transaction authorization expiry cron job completed"
                );
            }
        );

        logger.info(
            "Card transaction authorization expiry cron job initialized successfully"
        );
    };