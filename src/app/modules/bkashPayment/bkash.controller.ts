import { Request, Response } from "express";
import { BkashService } from "./bkash.service";

// পেমেন্ট সফল বা বিফল হওয়ার পর বিকাশ এখানে হিট করবে
const bkashCallback = async (req: Request, res: Response) => {
  const { paymentID, status } = req.query;

  try {
    const result = await BkashService.executeBkashPayment(
      paymentID as string,
      status as string
    ) as { status: string; data: any };;

    if (result.status === 'success') {
      // পেমেন্ট সফল হলে ফ্রন্টএন্ডের সাকসেস পেজে রিডাইরেক্ট
      return res.redirect(`${process.env.SSLCOMMERZ_FRONTEND_SUCCESS}?orderId=${result.data?.merchantInvoiceNumber}&trxId=${result.data?.trxID}`);
    } else {
      // পেমেন্ট ফেইল হলে ফেইল পেজে রিডাইরেক্ট
      return res.redirect(process.env.SSLCOMMERZ_FRONTEND_FAIL!);
    }
  } catch (error) {
    console.error("bKash Callback Error:", error);
    return res.redirect(process.env.SSLCOMMERZ_FRONTEND_FAIL!);
  }
};

export const PaymentController = {
  // তোমার আগের SSLCOMMERZ কন্ট্রোলারগুলো এখানে থাকবে
  bkashCallback,
  // ... অন্যান্য ফাংশন
};