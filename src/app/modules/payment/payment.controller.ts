import { Request, Response } from "express";
import { SSLCommerzService } from "./payment.service";
import { MPaymentStatus, PaymentProvider } from "@prisma/client";



const sslSuccess = async (req: Request, res: Response) => {
  const result = await SSLCommerzService.handleSuccess(req.body);

  console.log(result)
  // frontend redirect (optional)
  return res.redirect(process.env.SSLCOMMERZ_FRONTEND_SUCCESS!);


};

const sslFail = async (req: Request, res: Response) => {
  await SSLCommerzService.handleFail(req.body);
  return res.redirect(process.env.SSLCOMMERZ_FRONTEND_FAIL!);
};

const sslCancel = async (req: Request, res: Response) => {
  await SSLCommerzService.handleCancel(req.body);
  return res.redirect(process.env.SSLCOMMERZ_FRONTEND_CANCEL!);
};


const sslIpn = async (req: Request, res: Response) => {
  try {
    await SSLCommerzService.handleIpn(req.body);

    return res.status(200).json({
      success: true,
      message: "IPN processed",
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};




// --------------------------CUSTOMAR Dashboard Api------------------------------------------------------


const getMyPayments = async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const result = await SSLCommerzService.getMyPayments(userId, {
    page: Number(req.query.page),
    limit: Number(req.query.limit),
    status: req.query.status as MPaymentStatus,
    provider: req.query.provider as PaymentProvider,
    from: req.query.from as string,
    to: req.query.to as string,
  });

  res.status(200).json({
    success: true,
    message: "My payments fetched successfully",
    ...result,
  });
};





const getPaymentByOrder = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { orderId } = req.params;

  const result = await SSLCommerzService.getPaymentByOrder(userId, orderId);

  res.status(200).json({
    success: true,
    data: result,
  });
};






// payment.controller.ts
const retryPayment = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { orderId } = req.params;

  const result = await SSLCommerzService.retryPayment(userId, orderId);

  res.status(200).json({
    success: true,
    message: "Payment retry initiated",
    data: result,
  });
};


// ----------------------------- Admin Management Api -------------------------------------




export const PaymentController = {
  sslSuccess,
  sslFail,
  sslCancel,
  sslIpn,
  getMyPayments,
  getPaymentByOrder,
  retryPayment,
};
