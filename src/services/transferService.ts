import type { Request } from "express";
import type { failedResponseJson, successResponseJson } from "../types/responseJson.js";
import { AppErrorClass, BadRequestError, ForbiddenError, InvalidRequestBodyError, InvalidRequestParamsError, InvalidRequestQueryError, NotFoundError, ServiceError, UnauthenticatedError, UnauthorizedError } from "../utils/AppErrorClass.js";
import checkMongoDbCollectionExist from "../utils/checkMongoDbCollectionExist.js";
import logger from "../utils/logger.js";
import type { ParsedQs } from "qs";
import checkStringQueryParams from "../utils/checkStringQueryParams.js";
import { beneficiariesBankDetailsModel as beneficiaries_bank_details } from "../models/beneficiaries_bank_details.js";
import createFiatPayoutQuoteValidationSchema from "../validations/createFiatPayoutQuoteValidation.js";
import z from "zod";
import { userWalletDetailsModel as user_wallet_details } from "../models/user_wallet_details.js";
import { Decimal } from "decimal.js";
import { getFxRate } from "./fxRateService.js";
import { FEE_DETAILS } from "../configs/configConstants.js";
import { fiatPayoutQuoteModel as fiat_payout_quotes } from "../models/fiat_payout_quotes.js";
import executeFiatPayoutTransaction from "../mongoDbTransactions/executePayoutQuoteTransaction.js";
import sanitizeApiError from "../utils/sanitizeApiError.js";
import mongoose, { Types } from "mongoose";
import { fiatPayoutTransactionsModel as fiat_payout_transactions } from "../models/fiat_payout_transactions.js";
import { userDetailsModel as user_details } from "../models/user_details.js"
import getPayoutQuoteTransactionsValidationSchema from "../validations/getPayoutQuoteTransactionsValidation.js";
import type { SafeParseResult } from "../types/zodTypes.js";

type userConfigurationsType = {
    businessId: string;
    programId: string;
    agentCode: string;
    subAgentCode: string;
}

// ------------------------------------- CREATE PAYOUT QUOTE SERVICE -------------------------------------  \\
export const createPayoutQuoteService = async (requestSession: Request["session"], aesDecryptedQueryData: Record<string, string> | ParsedQs | undefined, aesDecryptedBodyData: Record<string, string> | undefined, userConfiguration: userConfigurationsType): Promise<successResponseJson> => {
    try {

        if (!aesDecryptedQueryData) {
            throw new BadRequestError("Invalid query data");
        }
        if (!aesDecryptedBodyData) {
            throw new BadRequestError("Invalid body data");
        }

        // Check if collection exists
        const isCollectionPresent = await checkMongoDbCollectionExist("fiat_payout_quotes");
        if (isCollectionPresent.status !== "SUCCESS") {
            throw new NotFoundError("Payout quotes collection does not exist in MongoDB");
        }

        // Validate User Configuration
        const email = checkStringQueryParams(aesDecryptedQueryData, "email");
        if (!email) {
            throw new InvalidRequestBodyError("Email not found in request query");
        }
        if (email !== requestSession?.userEmail) {
            throw new UnauthorizedError("Unauthorized access detected - invalid email");
        }
        if (requestSession?.userType !== "ADMIN" && requestSession?.userType !== "MASTER_ADMIN") {
            throw new ForbiddenError("Not authorized to access beneficiaries list");
        }
        const sessionBusinessId = requestSession?.userConfiguration?.businessId;
        const sessionProgramId = requestSession?.userConfiguration?.programId;
        const sessionAgentCode = requestSession?.userConfiguration?.agentCode;
        const sessionSubAgentCode = requestSession?.userConfiguration?.subAgentCode;
        if (userConfiguration?.businessId !== sessionBusinessId || userConfiguration?.programId !== sessionProgramId || userConfiguration?.agentCode !== sessionAgentCode || userConfiguration?.subAgentCode !== sessionSubAgentCode) {
            throw new ForbiddenError("User configuration is not valid to access payout quotes");
        }

        // Get user id
        const sessionUserId = requestSession?.userId;
        if (!sessionUserId || !Types.ObjectId.isValid(sessionUserId)) {
            throw new UnauthorizedError("Unauthorized session detected - user id not found in session");
        }
        const userObjectId = new Types.ObjectId(sessionUserId)

        // Calculate source amount
        const sourceAmount = new Decimal(aesDecryptedBodyData.source_amount?.toString() ?? "0");
        // Validate the quote details in the request body
        const validationData = { ...aesDecryptedBodyData, source_amount: sourceAmount };
        const validationResult = createFiatPayoutQuoteValidationSchema.safeParse(validationData);
        if (!validationResult.success) {
            throw new ServiceError("Invalid request", z.flattenError(validationResult.error));
        }
        const validatedData = validationResult.data;
        const beneficiaryObjectId = new Types.ObjectId(validatedData.beneficiary_id)

        // Fetch beneficiaries
        const beneficiaryDetails = await beneficiaries_bank_details.findOne(
            {
                _id: beneficiaryObjectId,
                user_id: userObjectId,
            },
            {
                account_holder_name: 1,
                account_number: 1,
                account_currency: 1,
                swift_code: 1,
                iban_code: 1,
                bank_name: 1
            }
        ).lean();
        if (!beneficiaryDetails) {
            throw new NotFoundError("Beneficiary details not found");
        }
        const destinationCurrency = beneficiaryDetails.account_currency;

        // Get user wallet details
        const userWalletDetails = await user_wallet_details.findOne(
            {
                user_id: userObjectId,
            },
            {
                _id: 1,
                cardholder_id: 1,
                wallets_details: 1,
            }
        ).lean();
        if (!userWalletDetails) {
            throw new NotFoundError("User wallet details not found");
        }
        // Get source wallet details
        const sourceWallet = userWalletDetails.wallets_details.find(
            (wallet) =>
                wallet.wallet_type === "FIAT" &&
                wallet.wallet_currency === validatedData.source_wallet_currency &&
                wallet.wallet_status === "ACTIVE"
        );
        if (!sourceWallet) {
            throw new NotFoundError(`Active ${validatedData.source_wallet_currency} fiat wallet not found`);
        }

        // Validate source wallet balance using Decimal.js for accurate decimal arithmetic
        const accountBalance = new Decimal(sourceWallet?.account_balance?.toString() ?? "0");
        const holdingAmount = new Decimal(sourceWallet?.holding_amount?.toString() ?? "0");
        const availableBalance = accountBalance.minus(holdingAmount);
        if (availableBalance.lessThan(validatedData.source_amount)) {
            throw new ServiceError("Insufficient wallet balance");
        }

        // Get FX rate for source and destination currencies
        const fxRateDetails = await getFxRate(validatedData.source_wallet_currency, destinationCurrency);
        // Get exchange rate
        const exchangeRate = new Decimal(fxRateDetails?.exchange_rate?.toString() ?? "0");
        if (exchangeRate.lessThanOrEqualTo(0)) {
            throw new ServiceError("Invalid FX rate received");
        }
        // Calculate gross destination amount
        const grossDestinationAmount = sourceAmount.mul(exchangeRate).toDecimalPlaces(4);

        // Get FX rate from source currency to USD
        const sourceToUsdFxRateDetails = await getFxRate(validatedData.source_wallet_currency, "USD");
        const sourceToUsdExchangeRate = new Decimal(sourceToUsdFxRateDetails.exchange_rate.toString());
        if (sourceToUsdExchangeRate.lessThanOrEqualTo(0)) {
            throw new ServiceError("Invalid source to USD FX rate received");
        }
        // Convert source amount to USD for fee calculation
        const sourceAmountUsd = sourceAmount.mul(sourceToUsdExchangeRate).toDecimalPlaces(4);
        // Calculate payout fee in USD
        const feeAmountUsd = sourceAmountUsd.mul(new Decimal(FEE_DETAILS.p2P_percent.toString())).div(100).toDecimalPlaces(4);
        // Get FX rate from USD to destination currency
        const usdToDestinationFxRateDetails = await getFxRate("USD", destinationCurrency);
        const usdToDestinationExchangeRate = new Decimal(usdToDestinationFxRateDetails.exchange_rate.toString());
        if (usdToDestinationExchangeRate.lessThanOrEqualTo(0)) {
            throw new ServiceError("Invalid USD to destination FX rate received");
        }
        // Convert USD fee to destination currency
        const destinationFeeAmount = feeAmountUsd.mul(usdToDestinationExchangeRate).toDecimalPlaces(4);

        // Calculate amount actually received by beneficiary
        const netDestinationAmount = grossDestinationAmount.minus(destinationFeeAmount).toDecimalPlaces(4);
        // Wallet debit is the original source amount
        const totalDebit = sourceAmount;

        // Create payout quote document
        const expiresAt = new Date(
            Date.now() + 2 * 60 * 1000
        );

        const payoutQuote = await fiat_payout_quotes.create({
            user_id: userObjectId,
            wallet_id: userWalletDetails._id,
            beneficiary_id: beneficiaryObjectId,
            source_currency: validatedData.source_wallet_currency,
            source_amount: mongoose.Types.Decimal128.fromString(sourceAmount.toFixed(4)),
            destination_currency: destinationCurrency,
            gross_destination_amount: mongoose.Types.Decimal128.fromString(grossDestinationAmount.toFixed(4)),
            destination_amount: mongoose.Types.Decimal128.fromString(netDestinationAmount.toFixed(4)),
            exchange_rate: mongoose.Types.Decimal128.fromString(exchangeRate.toFixed(8)),
            fee_currency: "USD",
            fee_amount: mongoose.Types.Decimal128.fromString(feeAmountUsd.toFixed(4)),
            total_debit: mongoose.Types.Decimal128.fromString(totalDebit.toFixed(4)),
            quote_status: "ACTIVE",
            expires_at: expiresAt,
        });

        return {
            status: "SUCCESS",
            data: {
                quote_id: payoutQuote._id.toString(),
                beneficiary: {
                    beneficiary_id: beneficiaryDetails._id?.toString(),
                    account_holder_name: beneficiaryDetails.account_holder_name,
                    account_number: beneficiaryDetails.account_number,
                    account_currency: beneficiaryDetails.account_currency,
                    bank_name: beneficiaryDetails.bank_name,
                },
                source: {
                    currency: validatedData.source_wallet_currency,
                    amount: sourceAmount.toFixed(4),
                },
                destination: {
                    currency: destinationCurrency,
                    gross_amount: grossDestinationAmount.toFixed(4),
                    amount: netDestinationAmount.toFixed(4),
                },
                exchange_rate: exchangeRate.toFixed(8),
                fee: {
                    currency: "USD",
                    amount: feeAmountUsd.toFixed(4),
                },
                total_debit: {
                    currency: validatedData.source_wallet_currency,
                    amount: totalDebit.toFixed(4),
                },
                quote_status: payoutQuote.quote_status,
                expires_at: payoutQuote.expires_at,
            },
            message: "Payout quote created successfully",
        };

    } catch (err) {

        const error = err as any;
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "CreatePayoutQuoteService"
        });

        const sanitizedError = sanitizeApiError(error);

        if (error instanceof AppErrorClass) {
            throw error;
        }

        throw new ServiceError(
            `CreatePayoutQuoteService facing issue`,
            sanitizedError
        );
    }
}
// ------------------------------------- XXXXXXXXXXXXXXXXXXXXXXX ------------------------------------- \\


// ------------------------------------- EXECUTE PAYOUT QUOTE SERVICE -------------------------------------  \\
export const executePayoutQuoteService = async (requestSession: Request["session"], aesDecryptedQueryData: Record<string, string> | ParsedQs | undefined, aesDecryptedBodyData: Record<string, string> | undefined, userConfiguration: userConfigurationsType): Promise<successResponseJson> => {
    try {

        if (!aesDecryptedQueryData) {
            throw new BadRequestError("Invalid query data");
        }
        if (!aesDecryptedBodyData) {
            throw new BadRequestError("Invalid body data");
        }

        // Check if collection exists
        const isCollectionPresent = await checkMongoDbCollectionExist("fiat_payout_quotes");
        if (isCollectionPresent.status !== "SUCCESS") {
            throw new NotFoundError("Payout quotes collection does not exist in MongoDB");
        }

        // Validate User Configuration
        const email = checkStringQueryParams(aesDecryptedQueryData, "email");
        if (!email) {
            throw new InvalidRequestBodyError("Email not found in request query");
        }
        if (email !== requestSession?.userEmail) {
            throw new UnauthorizedError("Unauthorized access detected - invalid email");
        }
        if (requestSession?.userType !== "ADMIN" && requestSession?.userType !== "MASTER_ADMIN") {
            throw new ForbiddenError("Not authorized to access beneficiaries list");
        }
        const sessionBusinessId = requestSession?.userConfiguration?.businessId;
        const sessionProgramId = requestSession?.userConfiguration?.programId;
        const sessionAgentCode = requestSession?.userConfiguration?.agentCode;
        const sessionSubAgentCode = requestSession?.userConfiguration?.subAgentCode;
        if (userConfiguration?.businessId !== sessionBusinessId || userConfiguration?.programId !== sessionProgramId || userConfiguration?.agentCode !== sessionAgentCode || userConfiguration?.subAgentCode !== sessionSubAgentCode) {
            throw new ForbiddenError("User configuration is not valid to access payout quotes");
        }

        // Check quote id
        const quoteId = aesDecryptedBodyData?.quote_id;
        if (!quoteId) {
            throw new InvalidRequestBodyError("Quote ID not found in request body");
        }
        if (!Types.ObjectId.isValid(quoteId)) {
            throw new InvalidRequestBodyError("Invalid quote ID");
        }
        const payoutQuoteObjectId = new Types.ObjectId(quoteId);

        // Get user id
        const sessionUserId = requestSession?.userId;
        if (!sessionUserId || !Types.ObjectId.isValid(sessionUserId)) {
            throw new UnauthorizedError("Unauthorized session detected - user id not found in session");
        }
        const userObjectId = new Types.ObjectId(sessionUserId)

        // Execute payout mongo db transaction
        const transactionResult = await executeFiatPayoutTransaction({ payoutQuoteId: payoutQuoteObjectId, userId: userObjectId });

        return {
            status: "SUCCESS",
            data: transactionResult.data,
            message: "Payout initiated successfully",
        };

    } catch (err) {

        const error = err as any;
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "ExecutePayoutQuoteService"
        });

        const sanitizedError = sanitizeApiError(error);

        if (error instanceof AppErrorClass) {
            throw error;
        }

        throw new ServiceError(
            `ExecutePayoutQuoteService facing issue`,
            sanitizedError
        );
    }
}
// ------------------------------------- XXXXXXXXXXXXXXXXXXXXXXX ------------------------------------- \\


// ----------------------------------- GET PAYOUT QUOTE TRANSACTIONS ----------------------------------- \\
export const getPayoutQuoteTransactionsService = async (requestSession: Request["session"], aesDecryptedQueryData: Record<string, string> | ParsedQs | undefined, userConfiguration: userConfigurationsType): Promise<successResponseJson | failedResponseJson> => {
    try {
        if (!aesDecryptedQueryData) {
            throw new BadRequestError("Invalid query data");
        }

        // Check Validations
        const validationResult: SafeParseResult<z.infer<typeof getPayoutQuoteTransactionsValidationSchema>> = getPayoutQuoteTransactionsValidationSchema.safeParse(aesDecryptedQueryData);
        if (!validationResult.success) {
            throw new ServiceError("Invalid request", z.flattenError(validationResult.error));
        }
        const validatedData = validationResult.data;

        // Check collection
        const isCollectionPresent = await checkMongoDbCollectionExist("fiat_payout_transactions");

        if (isCollectionPresent.status !== "SUCCESS") {
            throw new NotFoundError("Required collection does not exist");
        }

        // Validate Email & Wallet Id
        const email = checkStringQueryParams(aesDecryptedQueryData, "email");
        if (!email) {
            throw new InvalidRequestBodyError("Email not found in request request body")
        }
        if (email !== requestSession?.userEmail) {
            throw new UnauthorizedError("Unauthorized access detected - invalid email provided")
        }
        const sessionBusinessId = requestSession?.userConfiguration?.businessId
        const sessionProgramId = requestSession?.userConfiguration?.programId
        const sessionAgentCode = requestSession?.userConfiguration?.agentCode
        const sessionSubAgentCode = requestSession?.userConfiguration?.subAgentCode
        if (userConfiguration?.businessId !== sessionBusinessId || userConfiguration?.programId !== sessionProgramId || userConfiguration?.agentCode !== sessionAgentCode || userConfiguration?.subAgentCode !== sessionSubAgentCode) {
            throw new ForbiddenError("User configuration is not valid to access payout quote transactions")
        }
        const userId = checkStringQueryParams(aesDecryptedQueryData, "user_id");
        if (userId !== requestSession.userId) {
            throw new UnauthorizedError("Unauthorized access detected - invalid user id provided")
        }
        if (!userId || !Types.ObjectId.isValid(userId)) {
            throw new InvalidRequestBodyError("User-id not found or invalid user-id in request request body")
        }
        const userObjectId = new Types.ObjectId(userId)
        const userDetails = await user_details.findOne({ _id: userObjectId, business_id: sessionBusinessId, program_id: sessionProgramId, agent_code: sessionAgentCode }).select("email").lean();
        if (!userDetails) {
            throw new ServiceError("Invalid user-id previded in the request params")
        }
        if (email !== userDetails.email) {
            throw new ServiceError("Invalid email provided in the request params")
        }
        // Check Admin Access
        if (requestSession?.userType !== "ADMIN" && requestSession?.userType !== "MASTER_ADMIN") {
            throw new ForbiddenError("Not authorized to create wallet")
        }

        // Date range filter
        const dateFilter: {
            $gte?: Date;
            $lte?: Date;
        } = {};
        let fromDate: string | null;
        let toDate: string | null;

        if (aesDecryptedQueryData.from_date) {
            fromDate = checkStringQueryParams(aesDecryptedQueryData, "from_date");
            if (!fromDate) {
                throw new InvalidRequestQueryError("From date parameter is not present");
            }
            dateFilter.$gte = new Date(fromDate);
        }

        if (aesDecryptedQueryData.to_date) {
            toDate = checkStringQueryParams(aesDecryptedQueryData, "to_date");
            if (!toDate) {
                throw new InvalidRequestQueryError("To date parameter is not present");
            }

            const endDate = new Date(toDate);
            endDate.setHours(23, 59, 59, 999);

            dateFilter.$lte = endDate;
        }

        // Get page in request
        const requestedPage = validationResult?.data?.page;
        // Get page size in request
        const pageSize = validationResult?.data?.page_size;

        // Query filters
        const query: Record<string, any> = {
            user_id: userId,
        };
        if (validatedData.beneficiary_id) {
            query.beneficiary_id = validatedData.beneficiary_id;
        }
        if (validatedData.source_currency) {
            query.source_currency = validatedData.source_currency;
        }
        if (validatedData.destination_currency) {
            query.destination_currency = validatedData.destination_currency;
        }
        if (validatedData.status) {
            query.status = validatedData.status;
        }
        if (Object.keys(dateFilter).length > 0) {
            query.createdAt = dateFilter;
        }

        // Get total matching transactions
        const totalTransactions = await fiat_payout_transactions.countDocuments(query);
        // Calculate total pages
        const totalPages = Math.max(1, Math.ceil(totalTransactions / pageSize));
        // Calculate current page
        const currentPage = Math.min(requestedPage, totalPages);
        // Calculate skip using the corrected page
        const skip = (currentPage - 1) * pageSize; // Skip fetching documents for page number more than 1

        // Query Selects
        const querySelect = {
            quote_id: 1,
            beneficiary_id: 1,
            source_currency: 1,
            source_amount: 1,
            destination_currency: 1,
            destination_amount: 1,
            exchange_rate: 1,
            fee_amount: 1,
            status: 1,
            processing_started_at: 1,
            completed_at: 1,
            provider_reference: 1,
            remarks: 1,
        };

        // Fetch transactions
        const transactions = await fiat_payout_transactions.find(query).sort({ createdAt: -1 }).skip(skip).limit(pageSize).select(querySelect).lean();

        if (!Array.isArray(transactions) || transactions.length === 0) {
            throw new NotFoundError("Payout quote transactions not found");
        }

        return {
            status: "SUCCESS",
            message: "Payout quote transactions fetched successfully",
            data: {
                user_id: userId,
                pagination: {
                    current_page: currentPage,
                    page_size: pageSize,
                    total_records: totalTransactions,
                    total_pages: totalPages,
                    has_next_page: currentPage * pageSize < totalTransactions,
                    has_previous_page: currentPage > 1,
                },
                transactions,
            },
        };
    }
    catch (err) {
        const error = err as any;

        logger.error(error, { serviceName: "GetPayoutQuoteTransactionsService" });

        const sanitizedError = sanitizeApiError(error);

        if (error instanceof AppErrorClass) {
            throw error;
        }

        throw new ServiceError(`GetPayoutQuoteTransactionsService facing issue`, sanitizedError);
    }

};
// ---------------------------------- XXXXXXXXXXXXXXXXXXXXXXXXXXXX ---------------------------------- \\ 


// ----------------------------------- GET PATOUT QUOTE TRANSACTION DETAILS ----------------------------------- \\
export const getPayoutQuoteTransactionDetailsService = async (requestSession: Request["session"], aesDecryptedQueryData: Record<string, string> | ParsedQs | undefined, userConfiguration: userConfigurationsType, quoteId?: string): Promise<successResponseJson | failedResponseJson> => {
    try {
        if (!aesDecryptedQueryData) {
            throw new BadRequestError("Invalid query data");
        }

        // Check collection
        const isCollectionPresent = await checkMongoDbCollectionExist("fiat_payout_transactions");

        if (isCollectionPresent.status !== "SUCCESS") {
            throw new NotFoundError("Required collection does not exist");
        }

        // Validate Email & Wallet Id
        const email = checkStringQueryParams(aesDecryptedQueryData, "email");
        if (!email) {
            throw new InvalidRequestBodyError("Email not found in request request body")
        }
        if (email !== requestSession?.userEmail) {
            throw new UnauthorizedError("Unauthorized access detected - invalid email provided")
        }
        const sessionBusinessId = requestSession?.userConfiguration?.businessId
        const sessionProgramId = requestSession?.userConfiguration?.programId
        const sessionAgentCode = requestSession?.userConfiguration?.agentCode
        const sessionSubAgentCode = requestSession?.userConfiguration?.subAgentCode
        if (userConfiguration?.businessId !== sessionBusinessId || userConfiguration?.programId !== sessionProgramId || userConfiguration?.agentCode !== sessionAgentCode || userConfiguration?.subAgentCode !== sessionSubAgentCode) {
            throw new ForbiddenError("User configuration is not valid to access payout quote transactions")
        }
        const userId = checkStringQueryParams(aesDecryptedQueryData, "user_id");
        if (userId !== requestSession.userId) {
            throw new UnauthorizedError("Unauthorized access detected - invalid user id provided")
        }
        if (!userId || !Types.ObjectId.isValid(userId)) {
            throw new InvalidRequestBodyError("User-id not found or invalid user-id in request request body")
        }
        const userObjectId = new Types.ObjectId(userId)
        const userDetails = await user_details.findOne({ _id: userObjectId, business_id: sessionBusinessId, program_id: sessionProgramId, agent_code: sessionAgentCode }).select("email").lean();
        if (!userDetails) {
            throw new ServiceError("Invalid user-id previded in the request params")
        }
        if (email !== userDetails.email) {
            throw new ServiceError("Invalid email provided in the request params")
        }
        // Check Admin Access
        if (requestSession?.userType !== "ADMIN" && requestSession?.userType !== "MASTER_ADMIN") {
            throw new ForbiddenError("Not authorized to create wallet")
        }

        // Validate Quote Id
        if (!quoteId) {
            throw new InvalidRequestParamsError("Quote id is not present");
        }
        if (!Types.ObjectId.isValid(quoteId)) {
            throw new InvalidRequestParamsError("Invalid quote id provided");
        }
        const quoteObjectId = new Types.ObjectId(quoteId);

        // Get Payout Quote Transaction Details
        const transaction = await fiat_payout_transactions.findOne({quote_id: quoteObjectId, user_id: userObjectId})
        .select("-_id -user_id -wallet_id -createdAt -updatedAt").lean();
        if (!transaction) {
            throw new NotFoundError("Payout quote transaction not found");
        }

        return {
            status: "SUCCESS",
            message: "Payout quote transaction details fetched successfully",
            data: {transaction},
        };
    }
    catch (err) {
        const error = err as any;

        logger.error(error, { serviceName: "GetPayoutQuoteTransactionDetailsService" });

        const sanitizedError = sanitizeApiError(error);

        if (error instanceof AppErrorClass) {
            throw error;
        }

        throw new ServiceError(`GetPayoutQuoteTransactionDetailsService facing issue`, sanitizedError);
    }
};
// ---------------------------------- XXXXXXXXXXXXXXXXXXXXXXXXXXXX ---------------------------------- \\