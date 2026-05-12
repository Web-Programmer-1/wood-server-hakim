
import { Router } from "express";
import { InventoryController } from "./inventory.controller";
import { authGuard } from "../../middlewares/auth";
import { UserRole } from "@prisma/client";

const router = Router();

// Inventory is part of the OPS scope: SUPER_ADMIN / ADMIN / MANAGER.
const opsGuard = authGuard(
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.MANAGER
);

router.get(
  "/products",
  opsGuard,
  InventoryController.getAllProducts
);


router.post(
  "/products/restock",
  opsGuard,
  InventoryController.restockProduct
);


router.post(
  "/products/reserve",
  opsGuard,
  InventoryController.reserveProduct
);

router.post(
  "/products/confirm-sale",
  opsGuard,
  InventoryController.confirmSale
);


router.post(
  "/products/release",
  opsGuard,
  InventoryController.releaseProduct
);


router.post(
  "/products/damage",
  opsGuard,
  InventoryController.damageProduct
);



router.get(
  "/low-stock",
  opsGuard,
  InventoryController.getLowStockProducts
);


// Machine Inventory Management apis


router.get(
  "/machines",
  opsGuard,
  InventoryController.getAllMachines
);

router.get(
  "/machines/low-stock",
  opsGuard,
  InventoryController.getLowStockMachines
);


router.post(
  "/machines/restock",
  opsGuard,
  InventoryController.restockMachine
);



router.post(
  "/machines/book",
  opsGuard,
  InventoryController.bookMachine
);


router.post(
  "/machines/confirm-sale",
  opsGuard,
  InventoryController.confirmMachineSale
);


router.post(
  "/machines/release",
  opsGuard,
  InventoryController.releaseMachine
);


router.get(
  "/activity",
  opsGuard,
  InventoryController.getInventoryActivity
);

router.get(
  "/summary",
  opsGuard,
  InventoryController.getInventorySummaryController
);




export const InventoryRoutes = router;
