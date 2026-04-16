import express from "express";
import type { Router } from "express";
import { getDnsConfig, getEncryptionKey, getMobileCountryCodes, getPublicKey } from "../controllers/configController.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router: Router = express.Router();


router.get("/getDnsConfig", asyncHandler(getDnsConfig));
router.get("/getEncryptionKey", getEncryptionKey);
router.get("/getPublicKey", getPublicKey);
router.get("/getMobileCountryCodes", getMobileCountryCodes);

export default router;