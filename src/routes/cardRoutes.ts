import express from "express"
import type { Router } from "express";
import { createCard, getCardDetails, getCardsExpenditure, getCardsList, getCardTransactionDetails, getCardTransactions, getTopSpendingCards, mailCardSensetiveDetails, updateCardLimits, updateCardStatus } from "../controllers/cardController.js";

const router: Router = express.Router()

router.post("/create", createCard)
router.get("/", getCardsList)
router.get("/topSpendingCards", getTopSpendingCards)
router.patch("/updateStatus/:id", updateCardStatus)
router.patch("/updateLimits/:id", updateCardLimits)
router.get("/transactions", getCardTransactions);
router.get("/transaction/:id", getCardTransactionDetails);
router.get("/allExpenditures", getCardsExpenditure);

router.get("/:id", getCardDetails) // Dynamic router lower in heirarchy to that it does not overplay specific routes
// If this route above other then anything after / in url will treated as currencyType in req.params
router.post("/mailCardSensitiveDetails/:id", mailCardSensetiveDetails);

export default router