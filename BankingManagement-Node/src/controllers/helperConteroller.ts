import type { NextFunction, Response, Request } from "express";
import type { failedResponseJson, successResponseJson } from "../types/responseJson.js";
import mongoose from "mongoose";
import checkMongoDbCollectionExist from "../utils/checkMongoDbCollectionExist.js";

export const insertDDocumentIntoCollection = async (req: Request, res: Response, next: NextFunction): Promise<Response<successResponseJson | failedResponseJson>> => {
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
            return res.status(500).json({ status: "INTERNAL_SERVER_ERROR", message: "Required collection does not exist in MongoDB" });
        }


        // Connect to db
        const db = mongoose.connection.db;
        // Cehck db connection exists
        if (!db) {
            return res.status(500).json({ status: "INTERNAL_SERVER_ERROR", message: "MongoDB connection is not established" });
        }
        // Get collection in db
        const collection = db.collection(collectionNameString);
        // Insert document in collection
        const insertedDocument = await collection.insertOne(document);

        console.log("Document inserted: ", insertedDocument);
        return res.status(200).json({ status: "SUCCESS", message: "Document inserted successfully", data: insertedDocument });
    } catch (error) {
        console.error("Error inserting document into collection:", error);
        return res.status(500).json({ status: "INTERNAL_SERVER_ERROR", message: "Failed to insert document into collection", error: error });
    }
}