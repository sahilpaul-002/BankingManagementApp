import express from "express"
import type { Router } from "express";
import { getWallet } from "../controllers/walletController.js";

const router: Router = express.Router()

router.get("/getWallet", getWallet)

export default router