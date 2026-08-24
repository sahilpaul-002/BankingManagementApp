// IMPORT NODE DNS CONFIGURATION
import "../configs/nodeDnsConfiguration.js";

import app from "./app.js";
import dbConnection from "../configs/dbConnection.js";
import dotenv from "dotenv";
import { startBankPayoutProcessingCronJob } from "../services/cronJobs/bankPayoutProcessingService.js";
import { startPayoutQuoteExpiryCronJob } from "../services/cronJobs/payoutQuoteExpiryService.js";
import { startCardExpiredAuthorizationTransactionCronJob } from "../services/cronJobs/cardExpiredAuthorizationTransactionService.js";
import { startWalletCurrencyConversionQuoteExpiryCronJob } from "../services/cronJobs/walletCurrencyConversionQuoteExpiryService.js";

// --------------------------------------- Load Environment Variable --------------------------------------- \\
dotenv.config();

const PORT: string | undefined = process.env.PORT;
const DOMAIN: string | undefined = process.env.DOMAIN || "http://localhost";
// --------------------------------------------- XXXXXXXXXXXXXXXXXXXXXXXX --------------------------------------- \\

// Start the server after establishing the database connection
async function startServer(): Promise<void> {

    try {
        await dbConnection();
        app.listen(PORT, () => {
            console.log(`🟢 Server is running on ${DOMAIN}:${PORT}`);
        });

        // Start the cron jobs after the server has started
        startBankPayoutProcessingCronJob();
        startPayoutQuoteExpiryCronJob();
        startCardExpiredAuthorizationTransactionCronJob()
        startWalletCurrencyConversionQuoteExpiryCronJob()
    } catch (error) {
        console.error("❌ Server failed to start:", error);
        process.exit(1);
    }
}

startServer();