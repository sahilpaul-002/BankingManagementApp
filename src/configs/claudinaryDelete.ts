import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import logger from "../utils/logger.js";
import { AppErrorClass, ForbiddenError, InvalidSessionError, NotFoundError, ServiceError, UnauthenticatedError, UnauthorizedError } from "../utils/AppErrorClass.js";
import sanitizeApiError from "../utils/sanitizeApiError.js";

dotenv.config();

interface DeleteFromCloudinaryResponse {
    success: boolean;
    message: string;
    deletedFile: unknown | null;
}

const deleteFromCloudinary = async (
    publicId: string
): Promise<DeleteFromCloudinaryResponse> => {
    const cloudinaryName = process.env.COULDINARY_NAME;
    const cloudinaryApiKey = process.env.COULDINARY_API_KEY;
    const cloudinaryApiSecret = process.env.COULDINARY_API_SECRET;

    try {
        // Validate environment variables
        if (!cloudinaryName || !cloudinaryApiKey || !cloudinaryApiSecret) {
            throw new Error("Cloudinary environment variables are missing");
        }

        // Configure Cloudinary
        cloudinary.config({
            cloud_name: cloudinaryName,
            api_key: cloudinaryApiKey,
            api_secret: cloudinaryApiSecret,
        });

        // Validate public id
        if (!publicId) {
            // return {
            //     success: false,
            //    message: "Public-id not found",
            //     deletedFile: null,
            // }; 
            throw new NotFoundError("Public-Id not found in the request for deletion")
        }

        // Delete file
        const destroyedFile = await cloudinary.uploader.destroy(publicId);

        return {
            success: true,
            message: "File deletion successful",
            deletedFile: destroyedFile,
        };
    }
    catch (err) {
        const error = err as any;
        // const url = req?.path || "UNKNOWN_URL";
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "DeleteClaudinaryConfigService",
            // url: req.path,
            // method: req.method
        });

        const sanitizedError = sanitizeApiError(error);

        if (error instanceof AppErrorClass) {
            throw error
        }
        throw new ServiceError(`DeleteClaudinaryConfigService facing issue`, sanitizedError);
    }
};

export default deleteFromCloudinary;