
import express from "express";
import { uploadFoundationStoryAssets } from "../../middlewares/UploadServicesBanner";
import { FoundationStoryController } from "./foundation.controller";
import { authGuard } from "../../middlewares/auth";
import { UserRole } from "@prisma/client";


const router = express.Router();

// Foundation lives under settings — CONTENT scope.
const contentGuard = authGuard(
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.SOCIAL_MANAGER
);

router.post(
  "/",
  contentGuard,
  uploadFoundationStoryAssets,
  FoundationStoryController.create
);


router.get("/", FoundationStoryController.getAll);

router.get("/:id", FoundationStoryController.getById);

router.patch(
  "/:id",
  contentGuard,
  uploadFoundationStoryAssets,
  FoundationStoryController.update
);

router.delete(
  "/:id",
  contentGuard,
  FoundationStoryController.delete
);


export const FoundationStoryRoutes = router;
