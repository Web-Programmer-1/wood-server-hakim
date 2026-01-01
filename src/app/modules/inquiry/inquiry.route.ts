// src/modules/inquiry/inquiry.route.ts
import { Router } from "express";
import { createInquiry, getInquiries, getInquiryById, sendQuotationEmail, updateInquiryStatus } from "./inquiry.controller";
import { authGuard } from "../../middlewares/auth";
import { UserRole } from "@prisma/client";

const router = Router();


router.post("/", createInquiry);


router.get("/", getInquiries);

router.get("/:id", getInquiryById);

router.patch("/:id", updateInquiryStatus);


router.post(
  "/:id/send-quotation",
   authGuard(UserRole.ADMIN, UserRole.CUSTOMER),
  sendQuotationEmail
);



export const InquiryRoutes = router;
