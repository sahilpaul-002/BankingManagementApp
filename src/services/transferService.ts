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
import {fiatPayoutQuoteModel as fiat_payout_quote} from "../models/fiat_payout_quote.js";

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
        const isCollectionPresent = await checkMongoDbCollectionExist("fiat_payout_quote");
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

        if (
            requestSession?.userType !== "ADMIN" &&
            requestSession?.userType !== "MASTER_ADMIN"
        ) {
            throw new ForbiddenError("Not authorized to access beneficiaries list");
        }

        const sessionBusinessId = requestSession?.userConfiguration?.businessId;
        const sessionProgramId = requestSession?.userConfiguration?.programId;
        const sessionAgentCode = requestSession?.userConfiguration?.agentCode;
        const sessionSubAgentCode = requestSession?.userConfiguration?.subAgentCode;

        if (
            userConfiguration?.businessId !== sessionBusinessId ||
            userConfiguration?.programId !== sessionProgramId ||
            userConfiguration?.agentCode !== sessionAgentCode ||
            userConfiguration?.subAgentCode !== sessionSubAgentCode
        ) {
            throw new ForbiddenError("User configuration is not valid to access payout quotes");
        }

        // Validate the quote details in the request body
        const validationResult = createFiatPayoutQuoteValidationSchema.safeParse(aesDecryptedBodyData);
        if (!validationResult.success) {
            throw new ServiceError("Invalid request", z.flattenError(validationResult.error));
        }
        const validatedData = validationResult.data;

        // Fetch beneficiaries
        const beneficiaryDetails = await beneficiaries_bank_details.findOne(
            {
                _id: validatedData.beneficiary_id
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
            throw new NotFoundError(
                "Beneficiary details not found"
            );
        }
        const destinationCurrency = beneficiaryDetails.account_currency;

        // Get user id
        const userId = requestSession?.userId;
        if (!userId) {
            throw new UnauthorizedError("Unauthorized session detected - user id not found in session");
        }

        // Get user wallet details
        const userWalletDetails = await user_wallet_details.findOne(
            {
                user_id: userId,
            },
            {
                wallet_id: 1,
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
            throw new BadRequestError("Insufficient wallet balance");
        }

        // Get FX rate for source and destination currencies
        const fxRateDetails = await getFxRate(validatedData.source_wallet_currency, destinationCurrency);
        // Calculate source amount
        const sourceAmount = new Decimal(validatedData.source_amount.toString());
        // Get exchange rate
        const exchangeRate = new Decimal(fxRateDetails?.exchange_rate?.toString() ?? "0");
        if (exchangeRate.lessThanOrEqualTo(0)) {
            throw new ServiceError("Invalid FX rate received");
        }
        // Calculate gross destination amount
        const grossDestinationAmount = sourceAmount.mul(exchangeRate).toDecimalPlaces(2);
        // Calculate payout fee in SOURCE currency
        const feeAmount = sourceAmount.mul(new Decimal(FEE_DETAILS.p2P_percent.toString())).div(100).toDecimalPlaces(2);
        // Convert fee from SOURCE currency to DESTINATION currency
        const destinationFeeAmount = feeAmount.mul(exchangeRate).toDecimalPlaces(2);
        // Calculate amount actually received by beneficiary
        const netDestinationAmount = grossDestinationAmount.minus(destinationFeeAmount).toDecimalPlaces(2);
        // Wallet debit is the original source amount
        const totalDebit = sourceAmount;

        // Create payout quote document
        const expiresAt = new Date(
            Date.now() + 2 * 60 * 1000
        );
        const payoutQuote = await fiat_payout_quote.create({
            user_id: userId,
            wallet_id: userWalletDetails.wallet_id,
            beneficiary_id: validatedData.beneficiary_id,
            // SOURCE
            source_currency: validatedData.source_wallet_currency,
            source_amount: sourceAmount.toFixed(2),
            // DESTINATION
            destination_currency: destinationCurrency,
            gross_destination_amount: grossDestinationAmount.toFixed(2),
            destination_amount: netDestinationAmount.toFixed(2),
            // FX
            exchange_rate: exchangeRate.toFixed(8),
            // FEE
            fee_currency: "USD",
            fee_amount: feeAmount.toFixed(2),
            // WALLET DEBIT
            total_debit: totalDebit.toFixed(2),
            // STATUS
            quote_status: "ACTIVE",
            expires_at: expiresAt,
        });

        return {
            status: "SUCCESS",
            data: {
                quote_id: payoutQuote._id.toString(),
                beneficiary: {
                    beneficiary_id: beneficiaryDetails._id,
                    account_holder_name: beneficiaryDetails.account_holder_name,
                    account_number: beneficiaryDetails.account_number,
                    account_currency: beneficiaryDetails.account_currency,
                    bank_name: beneficiaryDetails.bank_name,
                },
                source: {
                    currency: validatedData.source_wallet_currency,
                    amount: sourceAmount.toFixed(2),
                },
                destination: {
                    currency: destinationCurrency,
                    gross_amount: grossDestinationAmount.toFixed(2),
                    amount: netDestinationAmount.toFixed(2),
                },
                exchange_rate: exchangeRate.toFixed(8),
                fee: {
                    currency: validatedData.source_wallet_currency,
                    amount: feeAmount.toFixed(2),
                },
                total_debit: {
                    currency: validatedData.source_wallet_currency,
                    amount: totalDebit.toFixed(2),
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
            serviceName: "GetPayoutQuoteService"
        });

        if (error instanceof AppErrorClass) {
            throw error;
        }

        throw new ServiceError(
            `GetPayoutQuoteService facing issue: [${errorStatus}] ${error.message}`,
            error?.error ? error.error : error
        );
    }
}
// ------------------------------------- XXXXXXXXXXXXXXXXXXXXXXX ------------------------------------- \\