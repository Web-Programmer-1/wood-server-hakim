import express from "express";
import { authGuard } from "../../middlewares/auth";
import { UserRole } from "../../constants/UserRole";
import { inventoryController } from "./inventory.controller";

const router = express.Router();


router.get("/summary",

    authGuard(UserRole.ADMIN),
    inventoryController.getSummary);




export const inventoryRoutes  = router;