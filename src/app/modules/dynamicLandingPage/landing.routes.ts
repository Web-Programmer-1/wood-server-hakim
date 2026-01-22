import express from "express";
import { LandingController } from "./landing.controller";

import { authGuard } from "../../middlewares/auth";
import { UserRole } from "@prisma/client";
import { uploadCompanyLogo, uploadHeroMedia } from "../../../config/uploadDynamic";

const router = express.Router();

router.post(
  "/hero",
  authGuard(UserRole.ADMIN), 
  

  uploadHeroMedia.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'image', maxCount: 1 },
    { name: 'video', maxCount: 1 }
  ]),
  
  LandingController.createHeroSlide
);

router.get("/hero", LandingController.getHeroSlides);
router.delete("/hero/:id", authGuard(UserRole.ADMIN), LandingController.deleteHeroSlide);



// ====================  Company Scroller Logo Apis ==================== //



router.post(
  "/company-logo",
  authGuard(UserRole.ADMIN),
  uploadCompanyLogo.single("image"), 
  LandingController.createCompanyLogo
);

router.get("/company-logo", LandingController.getAllCompanyLogos);


router.delete("/company-logo/:id", authGuard(UserRole.ADMIN), LandingController.deleteCompanyLogo);





// ====================  Footer Apis ==================== //




/* ============ FOOTER ============ */
router.get("/footer", LandingController.getFooter);

router.post(
  "/footer",
  uploadCompanyLogo.single("logo"),
  LandingController.upsertFooter
);

router.patch(
  "/footer/:id",
  uploadCompanyLogo.single("logo"), // optional
  LandingController.updateFooter
);

router.delete("/footer/:id", LandingController.deleteFooter);

/* ============ OFFICE ============ */
router.post("/office", LandingController.createOffice);
router.get("/office", LandingController.getOffices);
router.patch("/office/:id", LandingController.updateOffice);
router.delete("/office/:id", LandingController.deleteOffice);







export const LandingRoutes = router;