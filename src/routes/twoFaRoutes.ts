import express from "express";
import type { Router } from "express";
import { verifyEmail } from "../controllers/twoFaController.js";

const router: Router = express.Router();

router.post("/verifyEmail", verifyEmail);

export default router;