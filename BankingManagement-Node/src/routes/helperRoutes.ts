import express from "express";
import { destroySession, getSession, healthCheck, insertDDocumentIntoCollection } from "../controllers/helperConteroller.js";

const router = express.Router();

router.get("/health", healthCheck);
router.get("/get-session", getSession);
router.get("/destroy-session", destroySession);
router.post("/insertDocument", insertDDocumentIntoCollection);

export default router;