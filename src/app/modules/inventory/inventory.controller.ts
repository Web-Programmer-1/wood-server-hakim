import { Request, Response } from "express";
import { InventoryService } from "./inventory.service";

function sendSuccess(res: Response, message: string, data: any, status = 200) {
  return res.status(status).json({ success: true, message, data });
}

function sendError(res: Response, err: unknown) {
  // smart + clear error mapping
  if (err instanceof Error) {
    const anyErr = err as any;

    // Custom service errors
    if (anyErr?.statusCode && anyErr?.errorCode) {
      return res.status(anyErr.statusCode).json({
        success: false,
        message: anyErr.message,
        errorCode: anyErr.errorCode,
      });
    }

    // Default
    return res.status(500).json({
      success: false,
      message: err.message || "Something went wrong",
      errorCode: "INTERNAL_ERROR",
    });
  }

  return res.status(500).json({
    success: false,
    message: "Something went wrong",
    errorCode: "INTERNAL_ERROR",
  });
}

export class InventoryController {
  static async getDashboard(req: Request, res: Response) {
    try {
      const data = await InventoryService.getDashboard();
      return sendSuccess(res, "Inventory dashboard loaded", data);
    } catch (err) {
      return sendError(res, err);
    }
  };








  static async getInventoryList(req: Request, res: Response) {
  try {
    const data = await InventoryService.getInventoryList(req.query);
    return res.json({
      success: true,
      message: "Inventory list loaded",
      data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err instanceof Error ? err.message : "Failed to load inventory list",
      errorCode: "INVENTORY_LIST_ERROR",
    });
  }
}

static async exportInventoryCSV(req: Request, res: Response) {
  try {
    const csv = await InventoryService.exportInventoryCSV();
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=inventory.csv");
    return res.send(csv);
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to export inventory",
      errorCode: "EXPORT_FAILED",
    });
  }
}














static async getInventoryDetails(req: Request, res: Response) {
  try {
    const { productId } = req.params;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
        errorCode: "PRODUCT_ID_MISSING",
      });
    }

    const data = await InventoryService.getInventoryDetails(productId);

    return res.json({
      success: true,
      message: "Inventory details loaded",
      data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err instanceof Error ? err.message : "Failed to load inventory details",
      errorCode: "INVENTORY_DETAILS_ERROR",
    });
  }
}



static async getRecentMovements(req: Request, res: Response) {
  try {
    const limit = Number(req.query.limit) || 10;

    const data = await InventoryService.getRecentMovements(limit);

    return res.json({
      success: true,
      message: "Recent stock movements loaded",
      data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to load recent movements",
      errorCode: "RECENT_MOVEMENT_ERROR",
    });
  }
}





static async getMovementHistory(req: Request, res: Response) {
  try {
    const { productId } = req.params;
    const limit = Number(req.query.limit) || 20;

    const data = await InventoryService.getMovementHistory(productId, limit);

    return res.json({
      success: true,
      message: "Stock movement history loaded",
      data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err instanceof Error ? err.message : "Failed to load movements",
      errorCode: "MOVEMENT_HISTORY_ERROR",
    });
  }
}

static async createMovement(req: Request, res: Response) {
  try {
    const result = await InventoryService.createMovement(req.body);

    return res.status(201).json({
      success: true,
      message: "Stock updated successfully",
      data: result,
    });
  } catch (err: any) {
    return res.status(err?.statusCode || 500).json({
      success: false,
      message: err.message || "Stock update failed",
      errorCode: err.errorCode || "STOCK_UPDATE_ERROR",
    });
  }
}






static async getAnalyticsSummary(req: Request, res: Response) {
  try {
    const data = await InventoryService.getAnalyticsSummary();
    return res.json({
      success: true,
      message: "Inventory analytics summary loaded",
      data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to load analytics summary",
      errorCode: "ANALYTICS_SUMMARY_ERROR",
    });
  }
}

static async getMovementAnalytics(req: Request, res: Response) {
  try {
    const days = Number(req.query.days) || 30;
    const data = await InventoryService.getMovementAnalytics(days);

    return res.json({
      success: true,
      message: "Movement analytics loaded",
      data,
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Failed to load movement analytics",
      errorCode: "MOVEMENT_ANALYTICS_ERROR",
    });
  }
}

static async getStockReport(req: Request, res: Response) {
  try {
    const { from, to } = req.query as any;
    const data = await InventoryService.getStockReport(from, to);

    return res.json({
      success: true,
      message: "Stock report generated",
      data,
    });
  } catch {
    return res.status(400).json({
      success: false,
      message: "Invalid date range",
      errorCode: "REPORT_ERROR",
    });
  }
}










static async createProduct(req: Request, res: Response) {
  try {
    const data = await InventoryService.createProduct(req.body);

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      data,
    });
  } catch (err: any) {
    return res.status(err?.statusCode || 500).json({
      success: false,
      message: err.message || "Failed to create product",
      errorCode: err.errorCode || "CREATE_PRODUCT_ERROR",
    });
  }
}

static async updateProduct(req: Request, res: Response) {
  try {
    const { productId } = req.params;
    const data = await InventoryService.updateProduct(productId, req.body);

    return res.json({
      success: true,
      message: "Product updated successfully",
      data,
    });
  } catch (err: any) {
    return res.status(err?.statusCode || 500).json({
      success: false,
      message: err.message || "Failed to update product",
      errorCode: err.errorCode || "UPDATE_PRODUCT_ERROR",
    });
  }
}




static async deleteInventoryProduct(req: Request, res: Response) {
  try {
    const { productId } = req.params;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
        errorCode: "PRODUCT_ID_MISSING",
      });
    }

    await InventoryService.deleteInventoryProduct(
      productId,
      req.user?.id
    );

    return res.json({
      success: true,
      message: "Inventory product removed successfully",
    });
  } catch (err: any) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || "Failed to delete inventory product",
      errorCode: err.errorCode || "INVENTORY_DELETE_ERROR",
    });
  }
}



static async adjustInventory(req: Request, res: Response) {
  const result = await InventoryService.adjustInventory(
    req.body,
    req.user?.id
  );

  res.status(200).json({
    success: true,
    message: "Inventory adjusted successfully",
    data: result,
  });
}






}











