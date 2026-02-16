import express from "express";
import type { Router } from "express";
import { getDnsConfig, getEncryptionKey, getPublicKey } from "../controllers/configController.js";

const router: Router = express.Router();


router.get("/getDnsConfig", getDnsConfig);
router.get("/getEncryptionKey", getEncryptionKey);
router.get("/getPublicKey", getPublicKey);

export default router;