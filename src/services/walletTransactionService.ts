import type { Request } from "express";
import { userWalletDetailsModel as user_wallet_details } from "../models/user_wallet_details.js";
import { userWalletTransactionsModel as user_wallet_transactions } from "../models/user_wallet_transaction_details.js";
import logger from "../utils/logger.js";
import { AppErrorClass, BadRequestError, InvalidRequestBodyError, InvalidRequestQueryError, NotFoundError, ServiceError } from "../utils/AppErrorClass.js";
import type { userWalletDetailsSchemaTypes, } from "../types/schemaTypes.js";
import type { successResponseJson } from "../types/responseJson.js";
import checkMongoDbCollectionExist from "../utils/checkMongoDbCollectionExist.js";
import type { ParsedQs } from "qs";
import checkStringQueryParams from "../utils/checkStringQueryParams.js";

// ----------------------------------- GET WALLET TRANSACTIONS ----------------------------------- \\
export const getWalletTransactionService = async (requestSession: Request["session"], aesDecryptedQueryData: Record<string, string> | ParsedQs | undefined): Promise<successResponseJson> => {
    try {
        if (!aesDecryptedQueryData) {
            throw new BadRequestError("Invalid query data");
        }

        // Check collection
        const isCollectionPresent = await checkMongoDbCollectionExist("user_wallet_transactions");

        if (isCollectionPresent.status !== "SUCCESS") {
            throw new NotFoundError("Required collection does not exist");
        }

        // Wallet id
        const walletId = checkStringQueryParams(aesDecryptedQueryData, "wallet_id");

        if (!walletId) {
            throw new InvalidRequestQueryError("Wallet id not present");
        }

        const userId = requestSession?.userId;

        // Verify wallet
        const wallet: userWalletDetailsSchemaTypes | null = await user_wallet_details.findOne({wallet_id: walletId}).lean();

        if (!wallet) {
            throw new NotFoundError("Wallet not found");
        }

        // Ownership
        if (wallet.user_id.toString() !== String(userId)) {
            throw new BadRequestError("Unauthorized wallet access - ivalid wallet id provided");
        }

        // Optional filters
        const query: Record<string, unknown> = {wallet_id: walletId};

        if (aesDecryptedQueryData?.wallet_type) {
            query["wallet_details.wallet_type"] = aesDecryptedQueryData.wallet_type;
        }

        if (aesDecryptedQueryData?.wallet_currency) {
            query["wallet_details.wallet_currency"] = aesDecryptedQueryData.wallet_currency;
        }

        if (aesDecryptedQueryData?.transaction_type) {
            query["transaction_type"] = aesDecryptedQueryData.transaction_type;
        }

        // Fetch transactions
        const transactions = await user_wallet_transactions.find(query).sort({createdAt:-1}).lean();

        return {status: "SUCCESS", message: "Wallet transactions fetched successfully", data: {walletId, totalTransactions: transactions.length, transactions}};

    }

    catch (err) {

        const error =
            err as any;

        logger.error(
            error,
            {
                serviceName:
                    "GetWalletTransactionService",
            }
        );

        if (
            error instanceof
            AppErrorClass
        ) {
            throw error;
        }

        throw new ServiceError(
            `GetWalletTransactionService facing issue: ${error.message
            }`,
            error
        );

    }

};
// ---------------------------------- XXXXXXXXXXXXXXXXXXXXXXXXXXXX ---------------------------------- \\ 