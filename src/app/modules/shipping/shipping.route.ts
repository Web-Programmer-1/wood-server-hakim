import express from "express";
import { ShippingRateController } from "./shipping.controller";
import { authGuard } from "../../middlewares/auth";
import { UserRole } from "../../constants/UserRole";


const router = express.Router();


router.post("/", authGuard(UserRole.ADMIN, UserRole.CUSTOMER), ShippingRateController.upsertRate);
router.get("/", ShippingRateController.getAllRates);
router.patch("/:id/toggle", ShippingRateController.toggleRate);

export const ShippingRateRoutes = router;
