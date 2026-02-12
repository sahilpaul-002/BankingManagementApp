import mongoose from "mongoose";
import type { failedResponseJson, successResponseJson } from "../types/responseJson.js";

const checkMongoDbCollectionExist = async (collectionName: string): Promise<successResponseJson | failedResponseJson> => {
    // Connect to db
    const db = mongoose.connection.db;
    // Cehck db connection exists
    if (!db) {
        return { status: "INTERNAL_SERVER_ERROR", message: "MongoDB connection is not established" };
    }

    const collections = db ? await db.listCollections().toArray() : [];
    
        const exists = collections.some(
            (col) => col.name === collectionName
        );

        if (!exists) {
            return { status: "INTERNAL_SERVER_ERROR", message: `Collection ${collectionName} does not exist in MongoDB` };
        }
    
        console.log(`Collection ${collectionName} exists:`, exists); // true or false
        return { status: "SUCCESS", message: `Collection ${collectionName} exists in MongoDB`, data: {isExists: exists} };
}

export default checkMongoDbCollectionExist;