import express from "express";
import type { Router } from "express";
import { check, userLogin, userSignUp } from "../controllers/userController.js";
import jwtAuthTokenValidation from "../utils/jwtAuthTokenValidation.js";
import validateUniqueRequests from "../middlewares/validateUniqueRequests.js";
import sessionValidation from "../middlewares/sessionValidation.js";

const router: Router = express.Router();

router.post("/signUp", userSignUp);
router.post("/login", userLogin);
router.get("/check", validateUniqueRequests, sessionValidation, jwtAuthTokenValidation, check);

export default router;