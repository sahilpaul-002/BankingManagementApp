import express from "express"
import type { Router } from "express";
import { createWallet, getWallet, getWalletTransactionDetails, getWalletTransactions, loadWallet, withdrAawWallet } from "../controllers/walletController.js";

const router: Router = express.Router()

router.get("/", getWallet)
router.post("/create", createWallet)
router.post("/load", loadWallet)
router.post("/withdraw", withdrAawWallet)
router.get("/transactions", getWalletTransactions);
router.get("/transaction/:id", getWalletTransactionDetails);

router.get("/:currencyType", getWallet) // Dynamic router lower in heirarchy to that it does not overplay specific routes
// If this route above other then anything after / in url will treated as currencyType in req.params

export default router