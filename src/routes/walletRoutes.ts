import express from "express"
import type { Router } from "express";
import { createWallet, getWallet, getWalletTransactions, loadWallet, withdrAawWallet } from "../controllers/walletController.js";

const router: Router = express.Router()

router.get("/", getWallet)
router.post("/create", createWallet)
router.post("/load", loadWallet)
router.post("/withdraw", withdrAawWallet)
router.get("/transactions", getWalletTransactions);
router.get("/transaction/:id", getWalletTransactions);

export default router