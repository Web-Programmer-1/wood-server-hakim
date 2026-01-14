import { Router } from "express";
import { createEventController, deleteEventController, getDashboardAnalyticsController, getEventBySlugController, getEventsController, updateEventController } from "./event.controller";
import { UserRole } from "@prisma/client";
import { uploadContentImage } from "../../middlewares/upload.blog.image";
import { authGuard } from "../../middlewares/auth";

const router = Router();


router.get(
  "/analytics",
  authGuard(UserRole.ADMIN, UserRole.CUSTOMER),
  getDashboardAnalyticsController
);  

router.post(
  "/",
  authGuard(UserRole.ADMIN, UserRole.CUSTOMER),
  uploadContentImage.single("bannerImage"),
  createEventController
);

router.get("/", getEventsController);

router.get("/:slug", getEventBySlugController);





router.patch(
  "/:id",
  authGuard(UserRole.ADMIN, UserRole.CUSTOMER),
  uploadContentImage.single("bannerImage"),
  updateEventController
);
    

router.delete(
  "/:id",
  authGuard(UserRole.ADMIN, UserRole.CUSTOMER),
  deleteEventController
)



export const EventRoutes = router;
