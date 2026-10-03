import express from "express"
import type { Router } from "express";
import { addCardholder, getCardholderDetails, getCardholderList } from "../controllers/cardholderController.js";

const router: Router = express.Router()

router.get("/", getCardholderList)
router.post("/add", addCardholder)


router.get("/:id", getCardholderDetails)  // Dynamic router lower in heirarchy to that it does not overplay specific routes
// If this route above other then anything after / in url will treated as id in req.params


export default router