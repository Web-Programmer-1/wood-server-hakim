import express from "express";
import { LandingController } from "./landing.controller";

import { authGuard } from "../../middlewares/auth";
import { UserRole } from "../../constants/UserRole";
import { uploadCompanyLogo, uploadGalleryImages, uploadHeroMedia, uploadLandingSlider, uploadLandingVideo } from "../../../config/uploadDynamic";

const router = express.Router();

router.post(
  "/hero",
  authGuard(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SOCIAL_MANAGER), 
  

  uploadHeroMedia.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'image', maxCount: 1 },
    { name: 'video', maxCount: 1 }
  ]),
  
  LandingController.createHeroSlide
);

router.get("/hero", LandingController.getHeroSlides);
router.delete("/hero/:id", authGuard(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SOCIAL_MANAGER), LandingController.deleteHeroSlide);



// ====================  Company Scroller Logo Apis ==================== //



router.post(
  "/company-logo",
  authGuard(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SOCIAL_MANAGER),
  uploadCompanyLogo.single("image"), 
  LandingController.createCompanyLogo
);

router.get("/company-logo", LandingController.getAllCompanyLogos);


router.delete("/company-logo/:id", authGuard(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SOCIAL_MANAGER), LandingController.deleteCompanyLogo);





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




// ====================  Mega Offer Apis ==================== //


/* ============ MEGA OFFER ============ */

router.get(
  "/mega-offer",
  LandingController.getMegaOffers
);


router.post(
  "/mega-offer",
  authGuard(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SOCIAL_MANAGER),
  uploadLandingSlider.single("image"),
  LandingController.createMegaOffer
);

router.patch(
  "/mega-offer/:id",
  authGuard(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SOCIAL_MANAGER),
  uploadLandingSlider.single("image"),
  LandingController.updateMegaOffer
);

  

router.delete(
  "/mega-offer/:id",
  authGuard(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SOCIAL_MANAGER),
  LandingController.deleteMegaOffer
);




// ================== GalleryImage Apis ================== //



router.post(
  "/gallery",
  authGuard(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SOCIAL_MANAGER),
  uploadGalleryImages.array("image", 12), // max 12 images
  LandingController.createGalleryImages
);

router.get(
  "/gallery",
  LandingController.getGalleryImages
);

router.delete(
  "/gallery/:id",
  authGuard(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SOCIAL_MANAGER),
  LandingController.deleteGalleryImage
);





/* ===================== LANDING VIDEO ===================== */

/**
 * CREATE landing video
 * - thumbnail (required)
 * - video (only if sourceType = UPLOAD)
 * - youtubeUrl (only if sourceType = YOUTUBE)
 */
router.post(
  "/landing-video",
  authGuard(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SOCIAL_MANAGER),
  uploadLandingVideo.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "video", maxCount: 1 },
  ]),
  LandingController.createLandingVideo
);


router.get(
  "/landing-video",
  LandingController.getLandingVideos
);

/**
 * UPDATE landing video
 * - thumbnail optional
 * - video optional
 * - sourceType switch supported
 */
router.patch(
  "/landing-video/:id",
  authGuard(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SOCIAL_MANAGER),
  uploadLandingVideo.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "video", maxCount: 1 },
  ]),
  LandingController.updateLandingVideo
);


router.delete(
  "/landing-video/:id",
  authGuard(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SOCIAL_MANAGER),
  LandingController.deleteLandingVideo
);



export const LandingRoutes = router;