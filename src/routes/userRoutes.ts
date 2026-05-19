import express from "express";
import type { Router } from "express";
import { onboarding, sendBankVerificationMail, userLogin, userSignUp } from "../controllers/userController.js";
import jwtAuthTokenValidation from "../utils/jwtAuthTokenValidation.js";
import validateUniqueRequests from "../middlewares/validateUniqueRequests.js";
import sessionValidation from "../middlewares/sessionValidation.js";

const router: Router = express.Router();

router.post("/signUp", userSignUp);
router.post("/login", userLogin);
router.get("/onboarding", jwtAuthTokenValidation, onboarding);
router.post("/sendBankVerificationMail", jwtAuthTokenValidation, sendBankVerificationMail);

export default router;