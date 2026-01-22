import axios from "axios";
import { prisma } from "../../shared/prisma";
import { MPaymentStatus } from "@prisma/client";
import { getBkashToken, bkashHeaders } from "../../../utils/bkash";

const createBkashPayment = async (userId: string, orderId: string, amount: number) => {
  const idToken = await getBkashToken();

  // bKash Create API call
  const { data } = await axios.post(
    `${process.env.BKASH_BASE_URL}/tokenized/checkout/create`,
    {
      mode: "0011",
      payerReference: userId,
      callbackURL: process.env.BKASH_CALLBACK_URL,
      amount: amount,
      currency: "BDT",
      intent: "sale",
      merchantInvoiceNumber: orderId, // এটি অর্ডারের রেফারেন্স হিসেবে থাকবে
    },
    {
      headers: await bkashHeaders(idToken),
    }
  );

  return data; // এটি bkashURL এবং paymentID রিটার্ন করবে
};

const executeBkashPayment = async (paymentID: string, status: string) => {
  if (status !== 'success') {
    await prisma.payment.updateMany({
      where: { transactionId: paymentID },
      data: { status: MPaymentStatus.FAILED }
    });
    return { status: 'failed' };
  }

  const idToken = await getBkashToken();

  const { data } = await axios.post(
    `${process.env.BKASH_BASE_URL}/tokenized/checkout/execute`,
    { paymentID },
    { headers: await bkashHeaders(idToken) }
  );

  if (data && data.statusCode === '0000') {
    return await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findFirst({ where: { transactionId: paymentID } });
      
      if (payment) {
        await tx.payment.update({
          where: { id: payment.id },
          data: { status: MPaymentStatus.PAID, gatewayRef: data.trxID, rawResponse: data }
        });

        await tx.order.update({
          where: { id: payment.orderId },
          data: { paymentStatus: 'PAID', status: 'CONFIRMED' }
        });
      }
      return { status: 'success', data };
    });
  }
  
  throw new Error("bKash Execution Failed");
};

export const BkashService = { createBkashPayment, executeBkashPayment };