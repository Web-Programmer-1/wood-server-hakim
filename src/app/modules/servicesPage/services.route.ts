import { Router } from "express";
import { ServiceSectionController } from "./services.controller";
import { uploadServiceSectionBanner } from "../../middlewares/UploadServicesBanner";

const router = Router();


router.post(
  "/",
  uploadServiceSectionBanner, // banner image upload
  ServiceSectionController.create
);
export const ServiceSectionRoutes = router;