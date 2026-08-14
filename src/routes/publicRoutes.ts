import express from "express"
import type { Router } from "express";
import { getKycVerificationWebhook } from "../controllers/kycController.js";
import { getUserBankVerificationWebhook } from "../controllers/userController.js";
import { createCardTransaction } from "../controllers/cardController.js";


const router: Router = express.Router()

router.get("/kyc/kycVerificationWebhook", getKycVerificationWebhook);
router.get("/user/bankVerificationWebhook", getUserBankVerificationWebhook);
router.post("/card/createTransaction", createCardTransaction)
router.post("/user/prefundFiatAccount")
router.post("/user/prefundCryptoAccount")

export default router