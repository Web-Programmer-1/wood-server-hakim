// import { Request, Response } from "express";

// import { prisma } from "../../shared/prisma";


// export const paperflyTrackController = async (req: Request, res: Response) => {
//   try {
//     const { referenceNumber } = req.body;

//     if (!referenceNumber) {
//       return res.status(400).json({
//         success: false,
//         message: "referenceNumber is required",
//       });
//     }

//     const data = await trackPaperflyOrder(referenceNumber);

//     return res.status(200).json({
//       success: true,
//       message: "Tracking fetched successfully",
//       data,
//     });
//   } catch (err: any) {
//     const status = err?.response?.status || 500;
//     return res.status(status).json({
//       success: false,
//       message: err?.response?.data || err?.message || "Paperfly tracking failed",
//     });
//   }
// };





// export const getMyOrderTracking = async (req: Request, res: Response) => {
//   const userId = req.user!.id;
//   const { orderId } = req.params;

//   const order = await prisma.order.findFirst({
//     where: { id: orderId, userId },
//     select: { trackingToken: true, courierName: true },
//   });

//   if (!order?.trackingToken) {
//     return res.status(404).json({
//       success: false,
//       message: "Tracking not available",
//     });
//   }

//   const tracking = await trackPaperflyOrder(order.trackingToken);

//   res.json({
//     success: true,
//     data: tracking.data,
//   });
// };