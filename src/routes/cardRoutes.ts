import express from "express"
import type { Router } from "express";
import { createCard, getCardDetails, getCardsList, updateCardLimits, updateCardStatus } from "../controllers/cardController.js";

const router: Router = express.Router()

router.post("/create", createCard)
router.get("/", getCardsList)
router.patch("/updateStatus/:id", updateCardStatus)
router.patch("/updateLimits/:id", updateCardLimits)

router.get("/:id", getCardDetails) // Dynamic router lower in heirarchy to that it does not overplay specific routes
// If this route above other then anything after / in url will treated as currencyType in req.params

export default router