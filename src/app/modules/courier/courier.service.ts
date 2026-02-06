import axios from "axios";

const PAPERFLY_BASE_URL = "https://api.paperfly.com.bd";

const auth = {
  username: process.env.PAPERFLY_USERNAME!,
  password: process.env.PAPERFLY_PASSWORD!,
};

const headers = {
  "Content-Type": "application/json",
  paperflykey: process.env.PAPERFLY_KEY!,
};

export const PaperflyService = {
  async createOrder(order: any) {
    const payload = {
      merchantOrderReference: order.id,
      storeName: "Wood Shop",
      productBrief: "Wood Product",
      packagePrice: order.totalAmount,
        weight: String(order.weight || 1),
      customerName: order.customerName,
      customerAddress: [
        order.addressLine1,
        order.addressLine2,
        order.area,
        order.city,
      ]
        .filter(Boolean)
        .join(", "),

      customerPhone: order.phone,
    };

    const res = await axios.post(
      `${PAPERFLY_BASE_URL}/merchant/api/service/new_order_v2.php`,
      payload,
      { auth, headers },
    );

    return res.data.success;
  },






  async track(referenceNumber: string) {
  const res = await axios.post(
    "https://api.paperfly.com.bd/API-Order-Tracking",
    {
      ReferenceNumber: referenceNumber,
    },
    {
      auth: {
        username: process.env.PAPERFLY_USERNAME!,
        password: process.env.PAPERFLY_PASSWORD!,
      },
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  return res.data.success;
}
,







//   async cancel(orderId: string) {
//     const res = await axios.post(
//       `${PAPERFLY_BASE_URL}/api/v1/cancel-order`,
//       { order_id: orderId },
//       { auth, headers },
//     );

//     return res.data.success;
//   },
// };







async cancel(orderId: string) {
  const res = await axios.post(
    "https://api.paperfly.com.bd/api/v1/cancel-order",
    {
      order_id: orderId,
    },
    {
      headers: {
        "Content-Type": "application/json",
        username: process.env.PAPERFLY_USERNAME!,
        password: process.env.PAPERFLY_PASSWORD!,
      },
    }
  );

  return res.data;

}
};
