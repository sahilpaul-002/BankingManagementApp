import express from "express"
import type { Router } from "express";
import { addBeneficiary, getBeneficiariesList, getBeneficiaryDetails } from "../controllers/beneficiariesController.js";

const router: Router = express.Router()

router.get("/", getBeneficiariesList)
router.post("/add", addBeneficiary)


router.get("/:id", getBeneficiaryDetails)  // Dynamic router lower in heirarchy to that it does not overplay specific routes
// If this route above other then anything after / in url will treated as id in req.params


export default router