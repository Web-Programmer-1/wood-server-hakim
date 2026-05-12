// cart.route.ts
import express from "express";
import { CartController } from "./cart.controller";
import { authGuard } from "../../middlewares/auth";
import { UserRole } from "@prisma/client";

const router = express.Router();

router.post("/add", authGuard(UserRole.CUSTOMER, UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SOCIAL_MANAGER), CartController.addToCart);

router.get("/", authGuard(UserRole.CUSTOMER, UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SOCIAL_MANAGER), CartController.getCart);


// cart.route.ts
router.patch("/item/:itemId", authGuard(UserRole.CUSTOMER, UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SOCIAL_MANAGER), CartController.updateQuantity);


router.delete("/item/:itemId", authGuard(UserRole.CUSTOMER, UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SOCIAL_MANAGER), CartController.removeItem);


export const CartRoutes = router;
