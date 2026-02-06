import { Router } from "express";
import { InventoryController } from "./inventory.controller";
import { authGuard } from "../../middlewares/auth";
import { UserRole } from "@prisma/client";

const router = Router();

// Dashboard
router.get(
  "/dashboard",
  authGuard(UserRole.ADMIN),
  InventoryController.getDashboard,
);

router.get("/products", 
    authGuard(UserRole.ADMIN),
    InventoryController.getInventoryList);

router.get("/products/export",
    authGuard(UserRole.ADMIN),
    InventoryController.exportInventoryCSV);

    router.get(
  "/products/:productId",
  authGuard(UserRole.ADMIN),
  InventoryController.getInventoryDetails
);


// get Recent Movements for a product

router.get("/movements",

    authGuard(UserRole.ADMIN),
    InventoryController.getRecentMovements);

router.get(
  "/movements/:productId",
  authGuard(UserRole.ADMIN),
  InventoryController.getMovementHistory
);

router.post(
  "/movement",
  authGuard(UserRole.ADMIN),
  InventoryController.createMovement
);



router.get(
  "/analytics/summary",
  InventoryController.getAnalyticsSummary
);

router.get(
  "/analytics/movement",
  InventoryController.getMovementAnalytics
);

router.get(
  "/reports/stock",
  InventoryController.getStockReport
);



// Create product (with inventory)
router.post(
  "/product",
  authGuard(UserRole.ADMIN),
  InventoryController.createProduct
);

// Update product (basic + inventory fields)
router.put(
  "/products/:productId",
  authGuard(UserRole.ADMIN),
  InventoryController.updateProduct
);


// inventory.route.ts
router.delete(
  "/products/:productId",
  authGuard(UserRole.ADMIN),
  InventoryController.deleteInventoryProduct
);


router.post(
  "/adjustment",
  authGuard(UserRole.ADMIN),
  InventoryController.adjustInventory
);






export const InventoryRoutes = router;
