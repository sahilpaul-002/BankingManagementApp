import express from "express"
import type { Router } from "express";
import { createCard, getCardDetails, getCardsList } from "../controllers/cardController.js";

const router: Router = express.Router()

router.get("/", getCardsList)
router.post("/create", createCard)

router.get("/:id", getCardDetails)

export default router