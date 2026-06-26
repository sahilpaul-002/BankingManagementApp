import express from "express"
import type { Router } from "express";
import { createWallet, getWallet, loadWallet, withdrAawWallet } from "../controllers/walletController.js";

const router: Router = express.Router()

router.get("/", getWallet)
router.post("/create", createWallet)
router.post("/load", loadWallet)
router.post("/withdraw", withdrAawWallet)

export default router