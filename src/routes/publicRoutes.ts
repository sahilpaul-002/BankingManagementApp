import express from "express"
import type { Router } from "express";
import { getKycVerificationWebhook } from "../controllers/kycController.js";
import { getUserBankVerificationWebhook, publicGetUserFundingAccountsBalances, prefundUserCryptoFundingAccount, prefundUserFiatFundingAccount } from "../controllers/userController.js";
import { cardTransactionSettlementWebhook, createCardTransaction } from "../controllers/cardController.js";


const router: Router = express.Router()

router.get("/kyc/kycVerificationWebhook", getKycVerificationWebhook);
router.get("/user/bankVerificationWebhook", getUserBankVerificationWebhook);
router.post("/card/createTransaction", createCardTransaction)
router.get("/card/cardTransactionAuthorizationWebhook", cardTransactionSettlementWebhook)
router.post("/user/prefundFiatAccount", prefundUserFiatFundingAccount)
router.post("/user/prefundCryptoAccount", prefundUserCryptoFundingAccount)
router.get("/user/accountsBalances", publicGetUserFundingAccountsBalances)

export default router