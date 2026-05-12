import express from "express";
import type { Router } from "express";
import { send2FaVerificationCode, sendResetPasswordVerificationCode, verify2FaCode, verifyEmail, verifyResetPasswordCode } from "../controllers/twoFaController.js";

const router: Router = express.Router();

router.post("/verifyEmail", verifyEmail);
router.post("/send2FaCode", send2FaVerificationCode);
router.post("/verify2FaCode", verify2FaCode);
router.post("/sendResetPasswordCode", sendResetPasswordVerificationCode);
router.post("/verifyResetPasswrodCode", verifyResetPasswordCode);

export default router;