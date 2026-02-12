import express from "express";
import { insertDDocumentIntoCollection } from "../controllers/helperConteroller.js";

const router = express.Router();

router.post("/insertDocument", insertDDocumentIntoCollection);

export default router;