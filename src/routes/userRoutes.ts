import express from "express";
import type { Router } from "express";
import { check, userLogin, userSignUp } from "../controllers/userController.js";

const router: Router = express.Router();

router.post("/signUp", userSignUp);
router.post("/login", userLogin);
router.get("/check", check);

export default router;