import express from "express"
import type { Router } from "express";
import { getWalletTransactions } from "../controllers/walletTransactionController.js";

const router: Router = express.Router()

router.get("/", getWalletTransactions)

export default router