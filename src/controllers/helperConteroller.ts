import type { Response, Request } from "express";
import type { failedResponseJson, successResponseJson } from "../types/responseJson.js";
import mongoose from "mongoose";
import checkMongoDbCollectionExist from "../utils/checkMongoDbCollectionExist.js";
import errorHandler from "../utils/errorHandler.js";
import { userDetailsModel } from "../models/user_details.js";
import { userAddressModel } from "../models/user_addresses.js";
import { userBankDetailsModel } from "../models/user_bank_details.js";
import { portalConfigurationsModel } from "../models/portal_configurations.js";
import { AppErrorClass, ForbiddenError, InvalidSessionError, NotFoundError, ServiceError, ServiceUnavailableError, UnauthenticatedError, UnauthorizedError } from "../utils/AppErrorClass.js";
import logger from "../utils/logger.js";

// Health Check
export const healthCheck = (req: Request, res: Response): Response<successResponseJson> | void => {
    try {
        return res.status(200).json({ status: "OK", message: "SERVER IS HEALTHY" });
    }
    catch (err) {
        const error = err as any;
        const url = req.path || "UNKNOWN_URL";
        const errorClassName = error?.constructor?.name || "UnknownErrorClass";

        logger.error({
            serviceName: "InsertDocumentIntoCollection",
            message: error.message,
            stack: error.stack,
            url: url,
            method: req.method
        });

        if (error instanceof AppErrorClass) {
            if (error instanceof UnauthenticatedError || error instanceof UnauthorizedError || error instanceof InvalidSessionError || error instanceof ForbiddenError) {
                throw error
            }
            else {
                throw new ServiceError(
                    `[${errorClassName}] ${error.message}`,
                    error
                );
            }
        }
        throw new ServiceUnavailableError("HealthCheck service is facing unknown issue", error);
    }
}

// Get Session
export const getSession = (req: Request, res: Response): Response<successResponseJson> | void => {
    try {
        if (!req.session || !req.session?.initiated) {
            return res.status(200).json({ status: "ERROR", message: "NO ACTIVE SESSION FOUND" });
        }

        const sessionId = req.sessionID;
        return res.success("SESSION FOUND", { sessionId: sessionId }, 200)
    }
    catch (err) {
        const error = err as any;
        const url = req.path || "UNKNOWN_URL";
        const errorClassName = error?.constructor?.name || "UnknownErrorClass";

        logger.error({
            serviceName: "InsertDocumentIntoCollection",
            message: error.message,
            stack: error.stack,
            url: url,
            method: req.method
        });

        if (error instanceof AppErrorClass) {
            if (error instanceof UnauthenticatedError || error instanceof UnauthorizedError || error instanceof InvalidSessionError || error instanceof ForbiddenError) {
                throw error
            }
            else {
                throw new ServiceError(
                    `[${errorClassName}] ${error.message}`,
                    error
                );
            }
        }
        throw new ServiceUnavailableError("GetSession service is facing unknown issue", error);
    }
}

// Destroy Session
export const destroySession = (req: Request, res: Response): Response<successResponseJson> | void => {
    try {
        if (!req.session) {
            return res.status(404).json({ status: "NOT_FOUND", message: "NO ACTIVE SESSION FOUND" });
        }

        const sessionId = req.sessionID;

        req.session.destroy((err): Response<successResponseJson> | Response<failedResponseJson> => {
            if (err) {
                console.error("Session destroy error:", err);
                return res.status(500).json({ status: "INTERNAL_SERVER_ERROR", message: "FAILED TO DESTROY SESSION", error: err });
            }

            res.clearCookie("BMA_Ausiness_Session");
            res.clearCookie("BMA_Admin_Session");
            res.clearCookie("BMA_User_Session");
            res.clearCookie("authToken");
            res.clearCookie("refreshToken");

            return res.json({ status: "SUCCESS", message: "SESSION DESTROYED SUCCESSFULLY", data: { sessionId: sessionId } });
        });
    }
    catch (err) {
        const error = err as any;
        const url = req.path || "UNKNOWN_URL";
        const errorClassName = error?.constructor?.name || "UnknownErrorClass";

        logger.error({
            serviceName: "InsertDocumentIntoCollection",
            message: error.message,
            stack: error.stack,
            url: url,
            method: req.method
        });

        if (error instanceof AppErrorClass) {
            if (error instanceof UnauthenticatedError || error instanceof UnauthorizedError || error instanceof InvalidSessionError || error instanceof ForbiddenError) {
                throw error
            }
            else {
                throw new ServiceError(
                    `[${errorClassName}] ${error.message}`,
                    error
                );
            }
        }
        throw new ServiceUnavailableError("DestroySession service is facing unknown issue", error);
    }
}

export const checkTimeoutApi = async (req: Request, res: Response): Promise<Response<successResponseJson> | void> => {
    await new Promise(resolve => setTimeout(resolve, 6000));
    if (!res.headersSent) {
        return res.status(200).json({ status: "SUCCESS", message: "Request finished" });
    }
}

export const insertDDocumentIntoCollection = async (req: Request, res: Response): Promise<Response<successResponseJson | failedResponseJson> | void> => {
    try {
        // Cehck request body
        if (!req?.body?.collectionName) {
            return res.status(400).json({ status: "BAD_REQUEST", message: "Collection name is required in request body" });
        }
        if (!req?.body?.document) {
            return res.status(400).json({ status: "BAD_REQUEST", message: "Document is required in request body" });
        }

        const collectionNameString: string = req?.body?.collectionName
        const document: object = req?.body?.document;
        // Check if collection exist in MongoDB
        const isCollectionPresent: successResponseJson | failedResponseJson = await checkMongoDbCollectionExist(collectionNameString);
        if (isCollectionPresent.status !== "SUCCESS") {
            // return res.status(500).json({ status: "INTERNAL_SERVER_ERROR", message: "Collection does not exist in MongoDB" });
            throw new NotFoundError("Collection does not exist in MongoDB")
        }


        // // Connect to db
        // const db = mongoose.connection.db;
        // // Cehck db connection exists
        // if (!db) {
        //     return res.status(500).json({ status: "INTERNAL_SERVER_ERROR", message: "MongoDB connection is not established" });
        // }
        // // Get collection in db
        // const collection = db.collection(collectionNameString);

        // All DB Models mapped
        const modelsMap: Record<string, any> = {
            portal_configurations: portalConfigurationsModel,
            user_details: userDetailsModel,
            user_addresses: userAddressModel,
            user_bank_details: userBankDetailsModel
        };
        // Get Model
        const Model = modelsMap[collectionNameString];

        // Check if the model exist
        if (!Model) {
            // return res.status(500).json({ status: "INTERNAL_SERVER_ERROR", message: "Required collection does not exist in MongoDB" });
            throw new NotFoundError("Collection does not exist in MongoDB")
        }

        // Insert document in collection
        // const insertedDocument = await collection.insertOne(document);
        const insertedDocument = await Model.create(document);

        // console.log("Document inserted: ", insertedDocument);
        // return res.status(200).json({ status: "SUCCESS", message: "Document inserted successfully", data: insertedDocument });
        return res.success("Document inserted successfully", insertedDocument, 200)
    }
    catch (err) {
        const error = err as any;
        const url = req.path || "UNKNOWN_URL";
        const errorClassName = error?.constructor?.name || "UnknownErrorClass";

        logger.error({
            serviceName: "InsertDocumentIntoCollection",
            message: error.message,
            stack: error.stack,
            url: url,
            method: req.method
        });

        if (error instanceof AppErrorClass) {
            if (error instanceof UnauthenticatedError || error instanceof UnauthorizedError || error instanceof InvalidSessionError || error instanceof ForbiddenError) {
                throw error
            }
            else {
                throw new ServiceError(
                    `[${errorClassName}] ${error.message}`,
                    error
                );
            }
        }
        throw new ServiceUnavailableError("InsertDocumentIntoCollection service is facing unknown issue", error);
    }
}