import { Request, Response } from "express";
import { SSLCommerzService } from "./payment.service";
import { MPaymentStatus, PaymentProvider } from "@prisma/client";



// const sslSuccess = async (req: Request, res: Response) => {
//   const result = await SSLCommerzService.handleSuccess(req.body);

//   console.log(result)
//   // frontend redirect (optional)
//   return res.redirect(process.env.SSLCOMMERZ_FRONTEND_SUCCESS!);


// };

// const sslFail = async (req: Request, res: Response) => {
//   await SSLCommerzService.handleFail(req.body);
//   return res.redirect(process.env.SSLCOMMERZ_FRONTEND_FAIL!);
// };

// const sslCancel = async (req: Request, res: Response) => {
//   await SSLCommerzService.handleCancel(req.body);
//   return res.redirect(process.env.SSLCOMMERZ_FRONTEND_CANCEL!);
// };





// SSLCommerz redirects the user's browser here via POST after checkout.
// The redirect to the storefront must always happen — if signature
// verification or the DB update throws, send the user to the FAIL page
// instead of letting the request 500 (which would strand them on a blank
// error screen with no way back to the storefront).
const sslSuccess = async (req: Request, res: Response) => {
  const tranId = req.body?.tran_id ?? "";
  const successUrl = `${process.env.SSLCOMMERZ_FRONTEND_SUCCESS}?tran_id=${encodeURIComponent(tranId)}`;
  const failUrl = `${process.env.SSLCOMMERZ_FRONTEND_FAIL}?tran_id=${encodeURIComponent(tranId)}`;

  try {
    await SSLCommerzService.handleSuccess(req.body);
    return res.redirect(successUrl);
  } catch (err) {
    console.error("SSL success handler failed:", err);
    return res.redirect(failUrl);
  }
};


const getSslReceipt = async (req: Request, res: Response) => {
  try {
    const tranId = req.params.tranId as string;

    const data = await SSLCommerzService.getReceiptByTranId(tranId);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error: any) {
    return res.status(404).json({
      success: false,
      message: error.message || "Receipt not found",
    });
  }
};

const sslFail = async (req: Request, res: Response) => {
  const tranId = req.body?.tran_id ?? "";
  try {
    await SSLCommerzService.handleFail(req.body);
  } catch (err) {
    console.error("SSL fail handler failed:", err);
  }
  return res.redirect(`${process.env.SSLCOMMERZ_FRONTEND_FAIL}?tran_id=${encodeURIComponent(tranId)}`);
};

const sslCancel = async (req: Request, res: Response) => {
  const tranId = req.body?.tran_id ?? "";
  try {
    await SSLCommerzService.handleCancel(req.body);
  } catch (err) {
    console.error("SSL cancel handler failed:", err);
  }
  return res.redirect(`${process.env.SSLCOMMERZ_FRONTEND_CANCEL}?tran_id=${encodeURIComponent(tranId)}`);
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
  const orderId = req.params.orderId as string;

  const result = await SSLCommerzService.getPaymentByOrder(userId, orderId);

  res.status(200).json({
    success: true,
    data: result,
  });
};





// payment.controller.ts
const retryPayment = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const orderId = req.params.orderId as string;

  const result = await SSLCommerzService.retryPayment(userId, orderId);

  res.status(200).json({
    success: true,
    message: "Payment retry initiated",
    data: result,
  });
};




// ----------------------------- Admin Management Api -------------------------------------






const updatePaymentStatus = async (req: Request, res: Response) => {
  const adminId = req.user!.id;
  const paymentId = req.params.paymentId as string;

  const { status, note } = req.body as { status: MPaymentStatus; note?: string };

  const data = await SSLCommerzService.updatePaymentStatusManual({
    paymentId,
    status,
    note,
    updatedBy: adminId,
  });

  return res.status(200).json({
    success: true,
    message: "Payment status updated",
    data,
  });
};







export const PaymentController = {
  sslSuccess,
  sslFail,
  sslCancel,
  sslIpn,
  getMyPayments,
  getPaymentByOrder,
  retryPayment,
  updatePaymentStatus,
  getSslReceipt,
};
