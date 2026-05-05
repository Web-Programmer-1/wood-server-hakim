import rateLimit, { ipKeyGenerator } from "express-rate-limit";

export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // very strict
  message: {
    success: false,
    message: "Too many attempts, please wait",
  },
});

// Dedicated brute-force protection for /login.
// Keyed by IP + submitted identifier so one IP cannot rotate accounts,
// and one account cannot be hammered from many IPs (skipSuccessfulRequests
// keeps legitimate users from burning the budget).
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const identifier =
      typeof req.body?.email === "string"
        ? req.body.email.toLowerCase()
        : typeof req.body?.phone === "string"
          ? req.body.phone
          : "unknown";
    return `${ipKeyGenerator(req.ip ?? "")}:${identifier}`;
  },
  message: {
    success: false,
    message: "Too many login attempts. Please try again in 15 minutes.",
  },
});
