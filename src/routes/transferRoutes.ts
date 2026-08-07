import express from "express"
import type { Router } from "express";
import { createPayoutQuote } from "../controllers/transferController.js";

const router: Router = express.Router()

router.post("/payoutQuote", createPayoutQuote)


export default router