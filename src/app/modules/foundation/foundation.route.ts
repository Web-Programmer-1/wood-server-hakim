
import express from "express";
import { uploadFoundationStoryAssets } from "../../middlewares/UploadServicesBanner";
import { FoundationStoryController } from "./foundation.controller";
import { authGuard } from "../../middlewares/auth";
import { UserRole } from "@prisma/client";


const router = express.Router();

router.post(
  "/",
  authGuard(UserRole.ADMIN),
  uploadFoundationStoryAssets,
  FoundationStoryController.create
);


router.get("/", 

    FoundationStoryController.getAll);

router.get("/:id",
    
    FoundationStoryController.getById);

    router.patch(    
  "/:id",
   authGuard(UserRole.ADMIN),
  uploadFoundationStoryAssets,
  FoundationStoryController.update
);

router.delete("/:id",
    authGuard(UserRole.ADMIN),
    FoundationStoryController.delete);


export const FoundationStoryRoutes = router;