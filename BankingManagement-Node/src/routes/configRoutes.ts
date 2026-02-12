import express from "express";
import { getDnsConfig } from "../controllers/configController.js";

const router = express.Router();


router.get("/getDnsConfig", getDnsConfig);

export default router;