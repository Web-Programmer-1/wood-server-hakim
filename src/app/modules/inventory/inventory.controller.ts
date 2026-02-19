import { Request, Response } from "express";
import { InventoryService } from "./inventory.service";

export const InventoryController = {
  async getAllProducts(req: Request, res: Response) {
    const result = await InventoryService.getAllProducts();

    res.status(200).json({
      success: true,
      data: result,
    });
  },


  async restockProduct(req: Request, res: Response) {
  const result = await InventoryService.restockProduct(
    req.body
  );

  res.status(200).json({
    success: true,
    message: "Product restocked successfully",
    data: result,
  });
},




async reserveProduct(req: Request, res: Response) {
  const result = await InventoryService.reserveProduct(
    req.body
  );

  res.status(200).json({
    success: true,
    message: "Product reserved successfully",
    data: result,
  });
},




async confirmSale(req: Request, res: Response) {
  const result = await InventoryService.confirmSale(
    req.body
  );

  res.status(200).json({
    success: true,
    message: "Sale confirmed successfully",
    data: result,
  });
},





async releaseProduct(req: Request, res: Response) {
  const result = await InventoryService.releaseProduct(
    req.body
  );

  res.status(200).json({
    success: true,
    message: "Reservation released successfully",
    data: result,
  });
},



async damageProduct(req: Request, res: Response) {
  const result = await InventoryService.damageProduct(
    req.body
  );

  res.status(200).json({
    success: true,
    message: "Product marked as damaged",
    data: result,
  });
},





async getLowStockProducts(req: Request, res: Response) {
  const result =
    await InventoryService.getLowStockProducts();

  res.status(200).json({
    success: true,
    data: result,
  });
},







   async getAllMachines(req: Request, res: Response) {
    try {
    
      const page = Number(req.query.page ?? 1);
      const limit = Number(req.query.limit ?? 10);
      const search = String(req.query.search ?? "").trim();

      const safePage = Number.isFinite(page) && page > 0 ? page : 1;
      const safeLimit =
        Number.isFinite(limit) && limit > 0 && limit <= 50
          ? limit
          : 10;

      const result = await InventoryService.getAllMachines({
        page: safePage,
        limit: safeLimit,
        search,
      });

      return res.status(200).json({
        success: true,
        message: "Machine inventory fetched successfully",
        data: result,
      });
    } catch (error: any) {
      console.error("Get Machines Error:", error);

      return res.status(500).json({
        success: false,
        message: error?.message || "Failed to fetch machines",
      });
    }
  },




   async getLowStockMachines(req: Request, res: Response) {
    try {
      const threshold = Math.max(0, Number(req.query.threshold ?? 5));

      const result = await InventoryService.getLowStockMachines(threshold);

      return res.status(200).json({
        success: true,
        message: "Low stock machines fetched successfully",
        data: result,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error?.message || "Failed to fetch low stock machines",
      });
    }
  },








async restockMachine(req:Request, res:Response){
  const body = req.body;
  const result = await InventoryService.restockMachine(body);

  res.status(200).json({
    success: true,
    message: "Machine restocked successfully",
    data: result,
  })

},


  async bookMachine(req: Request, res: Response) {
    const result = await InventoryService.bookMachine(req.body);

    res.status(200).json({
      success: true,
      message: "Machine booked successfully",
      data: result,
    });
  },



  
  async confirmMachineSale(req: Request, res: Response) {
    const result = await InventoryService.confirmMachineSale(req.body);

    res.status(200).json({
      success: true,
      message: "Machine sale confirmed successfully",
      data: result,
    });
  },





    async releaseMachine(req: Request, res: Response) {
    const result = await InventoryService.releaseMachine(req.body);

    res.status(200).json({
      success: true,
      message: "Machine booking released successfully",
      data: result,
    });
  },



  async getInventoryActivity(req: Request, res: Response) {
  const { limit } = req.query;

  const result =
    await InventoryService.getInventoryActivity(
      Number(limit) || 20
    );

  res.status(200).json({
    success: true,
    data: result,
  });
},


  async getInventorySummaryController(req: Request, res: Response) {
 try {
   

    const result = await InventoryService.getInventorySummary();
  res.status(200).json({
    success: true,
    message:"Inventory Summary Data fetch",
    data: result,
  });
 } catch (error) {
  
 }
},
















};
