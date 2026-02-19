import { Router } from "express";
import { paperflyTrackController } from "./courier.controller";

const router = Router();

router.post("/paperfly/track", paperflyTrackController);

export const courierRouter = router;
