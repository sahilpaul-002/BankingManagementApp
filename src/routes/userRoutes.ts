import express from "express";
import type { Router } from "express";
import { getApplicationHeaders, onboarding, sendBankVerificationMail, userLogin, userOnboardingDetails, userSignUp } from "../controllers/userController.js";
import jwtAuthTokenValidation from "../utils/jwtAuthTokenValidation.js";
import validateUniqueRequests from "../middlewares/validateUniqueRequests.js";
import sessionValidation from "../middlewares/sessionValidation.js";
import asyncRequestHandler from "../middlewares/asyncRequestHandler.js";

const router: Router = express.Router();

router.post("/signUp", userSignUp);
router.post("/login", userLogin);
router.get("/applicationHeaders", getApplicationHeaders);
router.get("/onboardingDetails", userOnboardingDetails)
router.post("/onboarding", asyncRequestHandler(jwtAuthTokenValidation), onboarding);
router.post("/sendBankVerificationMail", asyncRequestHandler(jwtAuthTokenValidation), sendBankVerificationMail);

export default router;