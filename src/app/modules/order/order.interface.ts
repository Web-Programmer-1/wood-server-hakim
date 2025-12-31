
 export type CheckoutPayload = {
  paymentMethod: "ONLINE" | "COD";
  customerName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city?: string;
  area?: string;
  note?: string;
};