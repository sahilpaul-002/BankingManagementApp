import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import logger from "../utils/logger.js";
import { AppErrorClass, ForbiddenError, InvalidSessionError, NotFoundError, ServiceError, ServiceUnavailableError, UnauthenticatedError, UnauthorizedError } from "../utils/AppErrorClass.js";

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

        if (error instanceof AppErrorClass) {
            if (error instanceof UnauthenticatedError || error instanceof UnauthorizedError || error instanceof InvalidSessionError || error instanceof ForbiddenError) {
                throw error
            }
            else {
                throw new ServiceError(
                    `[${errorStatus}] ${error.message}`,
                    error?.error ? error.error : error
                );
            }
        }
        throw new ServiceUnavailableError("DeleteClaudinaryConfigService is unavailbale as facing unknown issue.", error)
    }
};

export default deleteFromCloudinary;