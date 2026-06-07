// src/modules/inquiry/inquiry.route.ts
import { Router } from "express";
import { createInquiry, deleteInquiry, getInquiries, getInquiryById, sendQuotationEmail, updateInquiryStatus } from "./inquiry.controller";
import { authGuard } from "../../middlewares/auth";
import { UserRole } from "../../constants/UserRole";
import { uploadInquiryAttachments } from "../../middlewares/uploadInquiryAttachments";

const router = Router();

// Inquiry is part of the OPS scope: SUPER_ADMIN / ADMIN / MANAGER.
const opsGuard = authGuard(
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.MANAGER
);


router.post("/", createInquiry);


router.get("/", opsGuard, getInquiries);

router.get("/:id", opsGuard, getInquiryById);

router.patch("/:id", opsGuard, updateInquiryStatus);


router.post(
  "/:id/send-quotation",
  opsGuard,
  uploadInquiryAttachments,
  sendQuotationEmail
);


router.delete(
  "/:id",
  opsGuard,
  deleteInquiry
);



export const InquiryRoutes = router;
