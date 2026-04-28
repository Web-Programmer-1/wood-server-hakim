// controllers/admin.payment.controller.ts
import { Request, Response } from "express";
import { AdminPaymentService } from "./adminPayment.service";

const getPayments = async (req: Request, res: Response) => {
  const result = await AdminPaymentService.getPayments(req.query);

  res.status(200).json({
    success: true,
    meta: result.meta,
    data: result.data,
  });
};





const getPaymentDetailsAdmin = async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const data = await AdminPaymentService.getAdminPaymentDetails(id);

  res.status(200).json({
    success: true,
    data,
  });
};





const getOrderPaymentsAdmin = async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const data = await AdminPaymentService.getPaymentsByOrderIdAdmin(id);

  res.status(200).json({
    success: true,
    data,
  });
};



const markPaymentFailed = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { reason } = req.body;
  const adminId = req.user!.id;

  const result = await AdminPaymentService.markPaymentFailed(
    id,
    adminId,
    reason
  );

  res.status(200).json({
    success: true,
    message: "Payment marked as FAILED successfully",
    data: result,
  });
};




const markPaymentPaid = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { reason } = req.body;
  const adminId = req.user!.id;

  const result = await AdminPaymentService.markPaymentPaid(
    id,
    adminId,
    reason
  );

  res.status(200).json({
    success: true,
    message: "Payment marked as PAID successfully",
    data: result,
  });
};









const getPaymentsSummary = async (req: Request, res: Response) => {
  const { from, to } = req.query as { from?: string; to?: string };

  const data = await AdminPaymentService.getPaymentsSummary({ from, to });

  res.status(200).json({
    success: true,
    data,
  });
};








const getPaymentAudit = async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const result = await AdminPaymentService.getPaymentAudit(id);

  res.status(200).json({
    success: true,
    data: result,
  });
};








export const AdminPaymentController = {
  getPayments,
  getPaymentDetailsAdmin,
  getOrderPaymentsAdmin,
  markPaymentFailed,
  markPaymentPaid,
  getPaymentsSummary,
  getPaymentAudit,
};
