import rateLimit from "express-rate-limit";

export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // very strict
  message: {
    success: false,
    message: "Too many attempts, please wait",
  },
});
