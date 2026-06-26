import express from "express"
import type { Router } from "express";
import { createWallet, getWallet, loadWallet } from "../controllers/walletController.js";

const router: Router = express.Router()

router.get("/", getWallet)
router.post("/create", createWallet)
router.post("/load", loadWallet)

export default router