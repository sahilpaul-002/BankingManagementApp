import express from "express"
import type { Router } from "express";
import { createPayoutQuote, cryptoBeneficiaryTransfer, executePayoutQuote, getPayoutQuoteTransactionDetails, getPayoutQuoteTransactions, getPayoutsExpenditure } from "../controllers/transferController.js";

const router: Router = express.Router()

router.post("/payoutQuote", createPayoutQuote)
router.post("/executePayout", executePayoutQuote)
router.post("/cryptoBeneficiaryTransfer", cryptoBeneficiaryTransfer)
router.get("/payoutQuote/transactions", getPayoutQuoteTransactions);
router.get("/payoutQuote/transaction/:id", getPayoutQuoteTransactionDetails);
router.get("/allExpenditures", getPayoutsExpenditure);


export default router