import express from "express"
import type { Router } from "express";
import { getKyc, uploadKyc } from "../controllers/kycController.js";
import upload from "../middlewares/multer.js";

const router: Router = express.Router()

router.get("/getKyc", getKyc)
router.post("/uploadKyc",
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
)

export default router