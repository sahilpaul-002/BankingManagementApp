import express from "express";
import { getDnsConfig, getEncryptionKey } from "../controllers/configController.js";
import { symmetricDecryptionMsg } from "../utils/symmetricEncryptionDecryption.js";

const router = express.Router();


router.get("/getDnsConfig", getDnsConfig);
router.get("/getEncryptionKey", getEncryptionKey);

export default router;