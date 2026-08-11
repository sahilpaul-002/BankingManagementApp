import express from "express";
import type { Router } from "express";
import { send2FaVerificationCode, sendResetPasswordVerificationCode, sendVerifyEmailCode, verify2FaCode, verifyEmail, verifyResetPasswordCode } from "../controllers/twoFaController.js";
import jwtAuthTokenValidation from "../utils/jwtAuthTokenValidation.js";

const router: Router = express.Router();

router.post("/sendVerifyEmailCode", sendVerifyEmailCode);
router.post("/verifyEmail", jwtAuthTokenValidation, verifyEmail);
router.post("/send2FaCode", jwtAuthTokenValidation, send2FaVerificationCode);
router.post("/verify2FaCode", jwtAuthTokenValidation, verify2FaCode);
router.post("/sendResetPasswordCode", sendResetPasswordVerificationCode);
router.post("/verifyResetPasswordCode", verifyResetPasswordCode);

export default router;