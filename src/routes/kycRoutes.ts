import express from "express"
import type { Router } from "express";
import { getKyc, getKycVerificationWebhook, sendKycVerificationMail, uploadKyc } from "../controllers/kycController.js";
import upload from "../middlewares/multer.js";

const router: Router = express.Router()

router.get("/", getKyc);
router.post("/upload",
    upload.fields([
        {
            name: "poi_document",
            maxCount: 1,
        },
        {
            name: "poa_document",
            maxCount: 1,
        },
    ]),
    uploadKyc
);
router.post("/sendVerificationMail", sendKycVerificationMail);

export default router