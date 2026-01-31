import { Request, Response } from "express";
import { InventoryService } from "./inventory.service";

const getSummary = async (req:Request, res:Response) => {
  const result = await InventoryService.getSummary();
  res.json({ success: true, data: result });
};



export const inventoryController = {
    getSummary,
}