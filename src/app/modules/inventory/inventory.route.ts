
import { Router } from "express";
import { InventoryController } from "./inventory.controller";
import { authGuard } from "../../middlewares/auth";
import { UserRole } from "@prisma/client";

const router = Router();

router.get(
  "/products",
  authGuard(UserRole.ADMIN),
  InventoryController.getAllProducts
);


router.post(
  "/products/restock",
    authGuard(UserRole.ADMIN),
  InventoryController.restockProduct
);


router.post(
  "/products/reserve",
  InventoryController.reserveProduct
);

router.post(
  "/products/confirm-sale",
  InventoryController.confirmSale
);


router.post(
  "/products/release",
  InventoryController.releaseProduct
);


router.post(
  "/products/damage",
  InventoryController.damageProduct
);



router.get(
  "/low-stock",
  InventoryController.getLowStockProducts
);


// Machine Inventory Management apis 


router.get(
  "/machines",
  InventoryController.getAllMachines
);

router.post(
  "/machines/restock",
  InventoryController.restockMachine
);



router.post(
  "/machines/book",
  InventoryController.bookMachine
);


router.post(
  "/machines/confirm-sale",
  InventoryController.confirmMachineSale
);


router.post(
  "/machines/release",
  InventoryController.releaseMachine
);


router.get(
  "/activity",
  InventoryController.getInventoryActivity
);

router.get("/summary",
  // authGuard(UserRole.ADMIN),
  InventoryController.getInventorySummaryController)




export const InventoryRoutes = router;
