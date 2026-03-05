import { Router } from "express";
import { ServiceSectionController } from "./services.controller";
import { uploadServiceSectionBanner } from "../../middlewares/UploadServicesBanner";

const router = Router();


router.post(
  "/",
  uploadServiceSectionBanner, 
  ServiceSectionController.create
);




router.get("/", ServiceSectionController.getAll);

// GET SINGLE
router.get("/:id", ServiceSectionController.getById);

// UPDATE (banner optional)
router.patch("/:id", uploadServiceSectionBanner, ServiceSectionController.update);

// DELETE
router.delete("/:id", ServiceSectionController.delete);




export const ServiceSectionRoutes = router;