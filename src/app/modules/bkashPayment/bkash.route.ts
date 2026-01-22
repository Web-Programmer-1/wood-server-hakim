import express from "express";
import { PaymentController } from "./bkash.controller";


const router = express.Router();

// bKash Callback Route (এটি অবশ্যই Public হতে হবে)
// এটি তোমার .env ফাইলের BKASH_CALLBACK_URL এর সাথে মিল থাকতে হবে
router.get("/bkash/callback", PaymentController.bkashCallback);

// তোমার আগের অন্যান্য রাউট...
// router.post("/ssl/success", PaymentController.sslSuccess);

export const PaymentRoutes = router;