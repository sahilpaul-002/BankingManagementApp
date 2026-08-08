import express from "express"
import type { Router } from "express";
import { createPayoutQuote, executePayoutQuote } from "../controllers/transferController.js";

const router: Router = express.Router()

router.post("/payoutQuote", createPayoutQuote)
router.post("/executePayout", executePayoutQuote)


export default router