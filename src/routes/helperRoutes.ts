import express from "express";
import type { Router } from "express";
import { checkTimeoutApi, destroySession, getSession, healthCheck, insertDDocumentIntoCollection } from "../controllers/helperConteroller.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router: Router = express.Router();

// Use asyncHandler when try/catch is not used for async request
router.get("/health", healthCheck);
router.get("/get-session", getSession);
router.get("/destroy-session", destroySession);
router.get("/check-timeout", asyncHandler(checkTimeoutApi));
router.post("/insertDocument", asyncHandler(insertDDocumentIntoCollection));

export default router;