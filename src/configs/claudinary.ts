import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';
import dotenv from 'dotenv';
import fs from "fs";
import logger from '../utils/logger.js';
import { AppErrorClass, ForbiddenError, InvalidSessionError, NotFoundError, ServiceError, ServiceUnavailableError, UnauthenticatedError, UnauthorizedError } from '../utils/AppErrorClass.js';
import streamifier from "streamifier";

interface UploadCloudinaryResponse {
    status: "SUCCESS";
    secure_url: string;
    message: string;
}

// const uploadOnCloudinary = async (filePath: string, businessId: string, clientId: string, agentCode: string, subAgentCode: string): Promise<UploadCloudinaryResponse> => {
const uploadOnCloudinary = async (file: Express.Multer.File, businessId: string, clientId: string, agentCode: string, subAgentCode: string, userId: string): Promise<UploadCloudinaryResponse> => {
    // Load environment variables from .env file
    dotenv.config();
    const cloudinaryName = process.env.COULDINARY_NAME
    const cloudinaryApiKey = process.env.COULDINARY_API_KEY
    const cloudinaryApiSecret = process.env.COULDINARY_API_SECRET

    if (!cloudinaryName || !cloudinaryApiKey || !cloudinaryApiSecret) {
        throw new ServiceError("Cloudinary environment variables are missing");
    }

    try {
        // Configuration
        cloudinary.config({
            cloud_name: cloudinaryName as string,
            api_key: cloudinaryApiKey as string,
            api_secret: cloudinaryApiSecret as string
        });

        // // Check file exist in the re files and in the local system
        // if (!filePath || !fs.existsSync(filePath)) {
        //     // return { success: false, secure_url: null, message: "File not found" };
        //     throw new NotFoundError("Local file setup not found")
        // }

        // // Upload an image
        // const uploadResult: UploadApiResponse = await cloudinary.uploader
        //     .upload(
        //         filePath, {
        //         folder: `BMA//${businessId}/${clientId}/${agentCode}/${subAgentCode}`,
        //         overwrite: true,
        //         timeout: 60000
        //     }
        //     )

        // // Delete the file from the system after upload
        // if (fs.existsSync(filePath)) {
        //     fs.unlinkSync(filePath);
        // }

        // Claudinary upload using multer buffer storage(memory storage)
        const uploadResult = await new Promise<UploadApiResponse>(
            (resolve, reject) => {

                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        folder: `BMA/${businessId}/${clientId}/${agentCode}/${subAgentCode}/${userId}`,
                        public_id: `${userId}_${file?.fieldname}`,
                        overwrite: true,
                        timeout: 60000,
                    },
                    (error, result) => {

                        if (error) {
                            return reject(error);
                        }

                        if (!result) {
                            return reject(
                                new ServiceError("Cloudinary upload failed")
                            );
                        }

                        resolve(result);
                    }
                );

                streamifier
                    .createReadStream(file.buffer)
                    .pipe(uploadStream);
            }
        );

        return { status: "SUCCESS", secure_url: uploadResult.secure_url, message: "File uploaded to cloud service" };
    }
    catch (err) {
        const error = err as any;
        // const url = req?.path || "UNKNOWN_URL";
        const errorStatus = error?.status || "UnknownErrorStatus";

        logger.error(error, {
            serviceName: "UploadOnClaudinaryConfigService",
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
        throw new ServiceUnavailableError("UploadOnClaudinaryConfigService is unavailbale as facing unknown issue.", error)
    }
}

export default uploadOnCloudinary;  