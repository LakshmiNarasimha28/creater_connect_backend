import { createorder, verifyPayment } from "../controllers/paymentcontroller.js"; 
import express from "express";
import protect from "../middleware/authmiddleware.js";

const router = express.Router();

router.post("/createorder", protect, createorder);
router.post("/verifypayment", protect, verifyPayment);
export default router;