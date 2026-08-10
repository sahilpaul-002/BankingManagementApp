import express from "express";
import type { Router } from "express";
import { getDnsConfig, getEncryptionKey, getHeaderPublicKey, getMobileCountryCodes, getPublicKey } from "../controllers/configController.js";

const router: Router = express.Router();

/**
 * @openapi
 * /api/v1/config/getDnsConfig:
 *   get:
 *     tags:
 *       - Configuration
 *     summary: Get DNS configuration
 *     description: Fetches the DNS configuration data.
 *
 *     parameters:
 *       - in: header
 *         name: from-portal
 *         required: false
 *         schema:
 *           type: string
 *           enum:
 *             - "true"
 *             - "false"
 *         description: Indicates whether the request originates from the portal.
 *
 *     responses:
 *       200:
 *         description: DNS configuration fetched successfully
 *
 *       400:
 *         description: Failed to fetch DNS configuration
 */
router.get("/getDnsConfig", getDnsConfig);
router.get("/getDnsConfig", getDnsConfig);
router.get("/getEncryptionKey", getEncryptionKey);
router.get("/getPublicKey", getPublicKey);
router.get("/getHeaderPublicKey", getHeaderPublicKey);
router.get("/getMobileCountryCodes", getMobileCountryCodes);

export default router;