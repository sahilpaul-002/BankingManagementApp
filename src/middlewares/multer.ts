// MULTER USING LOCAL STORAGE MEMORY
// import multer, { type StorageEngine } from "multer";
// import type { Request } from "express";

// // Configure local disk storage
// const storage: StorageEngine = multer.diskStorage({
//     destination: (
//         req: Request,
//         file: Express.Multer.File,
//         cb: (error: Error | null, destination: string) => void
//     ): void => {
//         cb(null, "./uploads");
//     },

//     filename: (
//         req: Request,
//         file: Express.Multer.File,
//         cb: (error: Error | null, filename: string) => void
//     ): void => {
//         cb(null, file.originalname);
//     },
// });

// // Configure multer upload instance
// const upload = multer({
//     storage,
// });

// export default upload;


// MULTER USKNG RAM STORAGE MEMORY
import multer from "multer";

const storage = multer.memoryStorage();

const upload = multer({
    storage,

    limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB
    },

    fileFilter(req, file, cb) {
        const allowedMimeTypes = [
            "image/jpeg",
            "image/png",
            "application/pdf",
        ];

        if (!allowedMimeTypes.includes(file.mimetype)) {
            return cb(new Error("Invalid file type upload detected - Allowed files types [jpeg | png | pdf]"));
        }

        cb(null, true);
    },
});

export default upload;