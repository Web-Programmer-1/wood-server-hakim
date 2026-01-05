
 export type CheckoutPayload = {
  paymentMethod:  "SSLCOMMARZE" | "BKASH" | "COD" | "ONLINE";
  customerName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city?: string;
  area?: string;
  note?: string;
};