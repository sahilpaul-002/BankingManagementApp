import express from "express";
import { checkTimeoutApi, destroySession, getSession, healthCheck, insertDDocumentIntoCollection } from "../controllers/helperConteroller.js";

const router = express.Router();

router.get("/health", healthCheck);
router.get("/get-session", getSession);
router.get("/destroy-session", destroySession);
router.get("/check-timeout", checkTimeoutApi);
router.post("/insertDocument", insertDDocumentIntoCollection);

export default router;