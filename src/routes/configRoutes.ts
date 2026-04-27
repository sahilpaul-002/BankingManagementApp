import express from "express";
import type { Router } from "express";
import { getDnsConfig, getEncryptionKey, getHeaderPublicKey, getMobileCountryCodes, getPublicKey } from "../controllers/configController.js";

const router: Router = express.Router();

router.get("/getDnsConfig", getDnsConfig);
router.get("/getEncryptionKey", getEncryptionKey);
router.get("/getPublicKey", getPublicKey);
router.get("/getHeaderPublicKey", getHeaderPublicKey);
router.get("/getMobileCountryCodes", getMobileCountryCodes);

export default router;