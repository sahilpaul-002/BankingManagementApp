import express from "express"
import type { Router } from "express";
import { createCard } from "../controllers/cardController.js";

const router: Router = express.Router()

router.post("/create", createCard)

export default router