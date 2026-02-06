import crypto from "crypto";

export const generateTrackingToken = () =>
  crypto.randomBytes(24).toString("hex");
