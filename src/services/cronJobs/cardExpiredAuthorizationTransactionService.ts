import cron from "node-cron";
import { userCardTransactionsModel as user_card_transactions } from "../../models/user_card_transaction_details.js";
import expireCardAuthorizationTransaction from "../../mongoDbTransactions/expiredCardAuthorizationTransaction.js";
import logger from "../../utils/logger.js";

// Process Expired Card Transaction Authorizations
const processExpiredCardTransactions = async (): Promise<void> => {
    try {
        const now = new Date();
        // Fetch expired PENDING card transaction authorizations
        const expiredTransactions = await user_card_transactions.find(
            {
                authorization_status: "PENDING",
                transaction_status: "PENDING",
                authorization_type: "HOLD",
                authorization_expires_at: {
                    $lte: now,
                },
            },
            {
                _id: 1,
                transaction_id: 1,
            }
        ).lean();

        // No expired transactions
        if (expiredTransactions.length === 0) {
            logger.info("No expired card transaction authorizations found");
            return;
        }

        // Log number of expired transactions
        logger.info(`Found ${expiredTransactions.length} expired card transaction authorization(s)`);

        // Process expired transactions one by one
        for (const transaction of expiredTransactions) {
            try {
                if (!transaction.transaction_id) {
                    logger.error(
                        "Expired card transaction does not contain transaction_id",
                        {
                            serviceName: "CardTransactionAuthorizationExpiryCronService",
                            transactionDocumentId: transaction._id,
                        }
                    );
                    continue;
                }

                // -------------------------------------------------------------
                // Expire transaction
                //
                // The expiry transaction is responsible for:
                //
                // 1. Re-validating that transaction is still PENDING.
                // 2. Re-validating authorization expiry.
                // 3. Releasing wallet HOLD.
                // 4. Updating wallet transaction to FAILED.
                // 5. Updating card transaction to REJECTED / FAILED.
                // 6. Committing all changes atomically.
                // -------------------------------------------------------------
                const result = await expireCardAuthorizationTransaction({ transactionId: transaction.transaction_id });

                // Log successful processing
                logger.info(`Card transaction ${transaction.transaction_id} authorization expiry processed successfully`,
                    {
                        serviceName: "CardTransactionAuthorizationExpiryCronService",
                        transactionId: transaction.transaction_id,
                        result,
                    }
                );
            }
            catch (err: any) {
                const error = err;

                // One transaction failure must not stop the cron loop
                logger.error(
                    error,
                    {
                        serviceName: "CardTransactionAuthorizationExpiryCronService",
                        transactionId: transaction.transaction_id,
                        message: `Failed to expire card transaction ${transaction.transaction_id}`,
                    }
                );
            }
        }
    }
    catch (err: any) {
        const error = err;

        // Catch unexpected cron-level errors
        logger.error(
            error,
            {
                serviceName: "CardTransactionAuthorizationExpiryCronService",
                message: "Failed to process expired card transaction authorizations",
            }
        );
    }
};


// Start Card Authorization Expiry Cron Job
export const startCardExpiredAuthorizationTransactionCronJob = (): void => {
    cron.schedule("*/5 * * * *", async () => {

        const cronStartedAt = new Date();
        logger.info("Card transaction authorization expiry cron job started",
            {
                serviceName: "CardTransactionAuthorizationExpiryCronService",
                startedAt: cronStartedAt,
            }
        );

        try {
            await processExpiredCardTransactions();
        }
        catch (err: any) {
            const error = err;

            logger.error(
                error,
                {
                    serviceName: "CardTransactionAuthorizationExpiryCronService",
                    message: "Unexpected error in card transaction authorization expiry cron job",
                }
            );
        }
        finally {
            logger.info("Card transaction authorization expiry cron job completed",
                {
                    serviceName: "CardTransactionAuthorizationExpiryCronService",
                    completedAt: new Date(),
                }
            );
        }
    }
    );


    logger.info("Card transaction authorization expiry cron job initialized successfully",);
};