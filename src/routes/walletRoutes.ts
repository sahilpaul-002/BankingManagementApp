import express from "express"
import type { Router } from "express";
import { createWallet, getWallet } from "../controllers/walletController.js";

const router: Router = express.Router()

router.get("/", getWallet)
router.post("/create", createWallet)

export default router