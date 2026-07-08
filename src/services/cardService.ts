import type { Request } from "express";
import { userWalletDetailsModel as user_wallet_details } from "../models/user_wallet_details.js";
import { userCardDetailsModel as user_card_details } from "../models/user_card_details.js";
import logger from "../utils/logger.js";
import { AppErrorClass, BadRequestError, InvalidRequestBodyError, InvalidRequestQueryError, NotFoundError, ServiceError, UnauthorizedError } from "../utils/AppErrorClass.js";
import type { userDetailsSchemaTypes, walletDetailsType, } from "../types/schemaTypes.js";
import type { successResponseJson } from "../types/responseJson.js";
import checkMongoDbCollectionExist from "../utils/checkMongoDbCollectionExist.js";
import type { ParsedQs } from "qs";
import checkStringBody from "../utils/checkStringBody.js";
import { userDetailsModel as user_details } from "../models/user_details.js";
import userCardCreationValidation from "../validations/userCardCreationValidation.js";
import type { SafeParseResult } from "../types/zodTypes.js";
import z from "zod";
import type { Schema } from "mongoose";
import userCreateCardTransaction from "../mongoDbTransactions/userCreateCardTransaction.js";
import checkStringQueryParams from "../utils/checkStringQueryParams.js";

// ----------------------------------- CREATE CARD SERVICE ----------------------------------- \\
export const createCardService = async (requestSession: Request["session"], aesDecryptedBodyData: Record<string, string> | undefined): Promise<successResponseJson> => {
    try {
        if (!aesDecryptedBodyData) {
            throw new BadRequestError("Invalid query data");
        }

        // Check collection
        const isCollectionPresent = await checkMongoDbCollectionExist("user_wallet_transactions");

        if (isCollectionPresent.status !== "SUCCESS") {
            throw new NotFoundError("Required collection does not exist");
        }

        // Validate session cardholderId
        if (!requestSession?.cardholderId) {
            throw new UnauthorizedError("Unauthorized access detected - cardholderId not found in session");
        }

        // Wallet id
        const cardholderId = checkStringBody(aesDecryptedBodyData, "cardholder_id");

        // Validate cardholderId
        if (cardholderId !== requestSession?.cardholderId) {
            throw new UnauthorizedError("Unauthorized access detected - invalid cardholderId provided")
        }

        const userId = requestSession?.userId;

        // Verify cardholder id
        const userDetailsDoc: userDetailsSchemaTypes | null = await user_details.findOne({ cardholder_id: cardholderId }).select("_id").lean();
        if (!userDetailsDoc || (userDetailsDoc?._id.toString() !== userId)) {
            throw new UnauthorizedError("Unauthorized access detected - invalid cardholderId provided");
        }

        // Validate user usd wallet existance
        const userUsdWalletDetailsDoc = await user_wallet_details.findOne(
            {
                user_id: userId,
                "wallets_details.wallet_currency": "USD"
            },
            {
                wallet_id: 1,
                user_id: 1,
                wallets_details: {
                    $elemMatch: {
                        wallet_currency: "USD"
                    }
                }
            }
        ).lean();
        if (!userUsdWalletDetailsDoc?.wallets_details?.length || !userUsdWalletDetailsDoc?.wallets_details?.[0]) {
            throw new NotFoundError("User USD wallet not found");
        }
        const userUsdWallet: walletDetailsType = userUsdWalletDetailsDoc.wallets_details[0];

        // Check usd wallet amount
        if ((userUsdWallet?.account_balance ?? 0) <= 5) {
            throw new BadRequestError(
                "Issuficient balance in USD wallet"
            );
        }


        // Check Validations
        const validationResult: SafeParseResult<z.infer<typeof userCardCreationValidation>> = userCardCreationValidation.safeParse(aesDecryptedBodyData);
        if (!validationResult.success) {
            // return res.status(400).json({
            //     status: "SERVICE_ERROR",
            //     message: "Invalid request body",
            //     // errors: validationResult.error.issues.map(issue => issue.message)
            //     // errors: validationResult.error.issues.map(issue => ({
            //     //     [issue.path.join(".")]: issue.message
            //     // }))
            //     errors: z.flattenError(validationResult.error)
            // });
            throw new ServiceError("Invalid request", z.flattenError(validationResult.error));
        }

        const walletId = userUsdWalletDetailsDoc?.wallet_id

        // Create card transaction
        const cardCreationTransactionResult = await userCreateCardTransaction(userId, userUsdWallet, cardholderId, validationResult, walletId)

        if (cardCreationTransactionResult?.status !== "SUCCESS") {
            throw new ServiceError("Create card service is facing issue - failed to create user card")
        }

        const cardDetails = {
            cardholderId: cardCreationTransactionResult?.data?.cardholder_id,
            cardId: cardCreationTransactionResult?.data?.card_id,
            cardNumber: cardCreationTransactionResult?.data?.card_number,
            nameOnCard: cardCreationTransactionResult?.data?.name_on_card,
            cardStatus: cardCreationTransactionResult?.data?.card_status,
            cardLimits: cardCreationTransactionResult?.data?.card_limits,
            issueDate: cardCreationTransactionResult?.data?.issued_date,
            validDate: cardCreationTransactionResult?.data?.valid_date,
            cardType: cardCreationTransactionResult?.data?.card_type,
            cardCurrency: cardCreationTransactionResult?.data?.card_currency,
        };

        return { status: "SUCCESS", message: "Card created successfully", data: cardDetails };
    }
    catch (err) {
        const error = err as any;

        logger.error(error, { serviceName: "CreateCardService" });

        if (error instanceof AppErrorClass) {
            throw error;
        }

        throw new ServiceError(`CreateCardService facing issue: ${error.message}`, error);

    }
};
// ---------------------------------- XXXXXXXXXXXXXXXXXXXXXXXXXXXX ---------------------------------- \\ 


// ----------------------------------- GET CARDS LIST SERVICE ----------------------------------- \\
export const getCardsListService = async (requestSession: Request["session"], aesDecryptedQueryData: Record<string, string> | ParsedQs | undefined): Promise<successResponseJson> => {
    try {
        if (!aesDecryptedQueryData) {
            throw new BadRequestError("Invalid query data");
        }

        // Check collection
        const isCollectionPresent = await checkMongoDbCollectionExist("user_card_details");
        if (isCollectionPresent.status !== "SUCCESS") {
            throw new NotFoundError("Required collection(card details) does not exist");
        }

        // Validate session cardholderId
        if (!requestSession?.cardholderId) {
            throw new UnauthorizedError("Unauthorized access detected - cardholderId not found in session");
        }

        // Cardholder Id id
        const cardholderId = checkStringQueryParams(aesDecryptedQueryData, "cardholder_id");
        // Validate cardholderId
        if (cardholderId !== requestSession?.cardholderId) {
            throw new UnauthorizedError("Unauthorized access detected - invalid cardholderId provided")
        }

        const userId = requestSession?.userId;

        // Verify cardholder id
        const userDetailsDoc: userDetailsSchemaTypes | null = await user_details.findOne({ cardholder_id: cardholderId }).select("_id").lean();
        if (!userDetailsDoc || (userDetailsDoc?._id.toString() !== userId)) {
            throw new UnauthorizedError("Unauthorized access detected - invalid cardholderId provided");
        }

        // Date range filter
        const dateFilter: Record<string, Date> = {};
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

        // Check page in request
        const requestedPage = Number(aesDecryptedQueryData.page ?? 1);
        if (!Number.isInteger(requestedPage) || requestedPage < 1) {
            throw new BadRequestError("Page must be a positive integer");
        }
        // Cehck page size in request
        const pageSize = Number(aesDecryptedQueryData.page_size ?? 30);
        if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 50) {
            throw new BadRequestError("Page size must be between 1 and 50");
        }

        // Get total matching transactions
        const totalCards = await user_card_details.countDocuments({ cardholder_id: cardholderId })
        // Calculate total pages
        const totalPages = Math.max(1, Math.ceil(totalCards / pageSize));
        // Calculate current page
        const currentPage = Math.min(requestedPage, totalPages);
        // Calculate skip using the corrected page
        const skip = (currentPage - 1) * pageSize; // Skip fetching documents for page number more than 1

        // Fetch Cards List
        const cardsList = await user_card_details.find({ cardholder_id: cardholderId }).select("-cardholder_id -cvv -valid_date -createdAt -updatedAt -__v").sort({ createdAt: -1 }).skip(skip).limit(pageSize).lean()

        if (!Array.isArray(cardsList) || cardsList.length === 0) {
            throw new NotFoundError("No cards associated with this cardholder found")
        }

        return {
            status: "SUCCESS",
            message: "Cards retrieved successfully",
            data: {
                cardholderId: cardholderId,
                pagination: {
                    current_page: currentPage,
                    page_size: pageSize,
                    total_records: totalCards,
                    total_pages: Math.ceil(totalCards / pageSize),
                    has_next_page: currentPage * pageSize < totalCards,
                    has_previous_page: currentPage > 1,
                },
                cards: cardsList,
            },
        };
    }
    catch (err) {
        const error = err as any;

        logger.error(error, { serviceName: "GetCardsListService" });

        if (error instanceof AppErrorClass) {
            throw error;
        }

        throw new ServiceError(`GetCardsListService facing issue: ${error.message}`, error);

    }
};
// ---------------------------------- XXXXXXXXXXXXXXXXXXXXXXXXXXXX ---------------------------------- \\


// ----------------------------------- GET CARDS LIST SERVICE ----------------------------------- \\
export const getCardDetailsService = async (requestSession: Request["session"], aesDecryptedQueryData: Record<string, string> | ParsedQs | undefined, cardId?: string): Promise<successResponseJson> => {
    try {
        if (!aesDecryptedQueryData) {
            throw new BadRequestError("Invalid query data");
        }

        // Check collection
        const isCollectionPresent = await checkMongoDbCollectionExist("user_card_details");
        if (isCollectionPresent.status !== "SUCCESS") {
            throw new NotFoundError("Required collection(card details) does not exist");
        }

        // Validate session cardholderId
        if (!requestSession?.cardholderId) {
            throw new UnauthorizedError("Unauthorized access detected - cardholderId not found in session");
        }

        // Cardholder Id id
        const cardholderId = checkStringQueryParams(aesDecryptedQueryData, "cardholder_id");
        // Validate cardholderId
        if (cardholderId !== requestSession?.cardholderId) {
            throw new UnauthorizedError("Unauthorized access detected - invalid cardholderId provided")
        }

        // Validate card id
        if (!cardId) {
            throw new InvalidRequestQueryError("Card id not provided");
        }

        const userId = requestSession?.userId;

        // Verify cardholder id
        const userDetailsDoc: userDetailsSchemaTypes | null = await user_details.findOne({ cardholder_id: cardholderId }).select("_id").lean();
        if (!userDetailsDoc || (userDetailsDoc?._id.toString() !== userId)) {
            throw new UnauthorizedError("Unauthorized access detected - invalid cardholderId provided");
        }

        // Fetch Card Details
        const cardDetails = await user_card_details.findOne({
            cardholder_id: cardholderId,
            card_id: cardId,
        }).select("-cardholder_id -cvv -valid_date -createdAt -updatedAt -__v").lean();

        if (!cardDetails) {
            throw new NotFoundError("Card and card details not found")
        }

        return { status: "SUCCESS", message: "Card details fetched successfully", data: { cardholderId, cardDetails } };
    }
    catch (err) {
        const error = err as any;

        logger.error(error, { serviceName: "GetCardDetailsService" });

        if (error instanceof AppErrorClass) {
            throw error;
        }

        throw new ServiceError(`GetCardDetailsService facing issue: ${error.message}`, error);

    }
};
// ---------------------------------- XXXXXXXXXXXXXXXXXXXXXXXXXXXX ---------------------------------- \\
// // ----------------------------------- GET CARDS LIST SERVICE ----------------------------------- \\
// export const cardsListService = async (requestSession: Request["session"], aesDecryptedQueryData: Record<string, string> | ParsedQs | undefined): Promise<successResponseJson> => {
//     try {
//         if (!aesDecryptedQueryData) {
//             throw new BadRequestError("Invalid query data");
//         }

//         // Check collection
//         const isCollectionPresent = await checkMongoDbCollectionExist("user_card_details");
//         if (isCollectionPresent.status !== "SUCCESS") {
//             throw new NotFoundError("Required collection(card details) does not exist");
//         }

//         // Pagination Logic
//         const page = Number(aesDecryptedQueryData.page ?? 1);
//         const pageSize = Number(aesDecryptedQueryData.page_size ?? 30);
//         if (!Number.isInteger(page) || page < 1) {
//             throw new BadRequestError("Page must be a positive integer");
//         }
//         if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
//             throw new BadRequestError("Page size must be between 1 and 100");
//         }
//         const skip = (page - 1) * pageSize; // Skip fetching documents for page number more than 1

//         // Validate session cardholderId
//         if (!requestSession?.cardholderId) {
//             throw new UnauthorizedError("Unauthorized access detected - cardholderId not found in session");
//         }

//         // Cardholder Id id
//         const cardholderId = checkStringBody(aesDecryptedQueryData, "cardholder_id");

//         // Validate cardholderId
//         if (cardholderId !== requestSession?.cardholderId) {
//             throw new UnauthorizedError("Unauthorized access detected - invalid cardholderId provided")
//         }

//         const userId = requestSession?.userId;

//         // Verify cardholder id
//         const userDetailsDoc: userDetailsSchemaTypes | null = await user_details.findOne({ cardholder_id: cardholderId }).select("_id").lean();
//         if (!userDetailsDoc || (userDetailsDoc?._id.toString() !== userId)) {
//             throw new UnauthorizedError("Unauthorized access detected - invalid cardholderId provided");
//         }

//         // Get Cards List
//         const [totalCards, cardsList] = await Promise.all([
//             user_card_details.countDocuments({
//                 cardholder_id: cardholderId,
//             }),
//             user_card_details
//                 .find({ cardholder_id: cardholderId })
//                 .select("-cardholder_id")
//                 .sort({ createdAt: -1 })
//                 .skip(skip)
//                 .limit(pageSize)
//                 .lean(),
//         ]);

//         if (!cardsList || !Array.isArray(cardsList) || cardsList.length === 0) {
//             throw new NotFoundError("Cards list not found")
//         }

//         return {
//             status: "SUCCESS",
//             message: "Cards retrieved successfully",
//             data: {
//                 cards: cardsList,
//                 pagination: {
//                     current_page: page,
//                     page_size: pageSize,
//                     total_records: totalCards,
//                     total_pages: Math.ceil(totalCards / pageSize),
//                     has_next_page: page < Math.ceil(totalCards / pageSize),
//                     has_previous_page: page > 1,
//                 },
//             },
//         };
//     }
//     catch (err) {
//         const error = err as any;

//         logger.error(error, { serviceName: "CardsListService" });

//         if (error instanceof AppErrorClass) {
//             throw error;
//         }

//         throw new ServiceError(`CardsListService facing issue: ${error.message}`, error);

//     }
// };
// // ---------------------------------- XXXXXXXXXXXXXXXXXXXXXXXXXXXX ---------------------------------- \\ 