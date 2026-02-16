import express from "express";
import type { Router } from "express";
import { userSignUp } from "../controllers/userController.js";

const router: Router = express.Router();

router.post("/signUp", userSignUp)

export default router;