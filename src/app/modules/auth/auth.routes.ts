

import express from "express";
import { AuthController, logout, updateUserCon } from "./auth.controller";
import { loginLimiter, strictLimiter } from "../../middlewares/strictFixTimeSecurity";
import { uploadUserAvatar } from "../../middlewares/uploadUserAvatar";
import { authGuard } from "../../middlewares/auth";
import { UserRole } from "@prisma/client";


export const authRouter = express.Router();

// REGISTER (sends OTP — same throttle as other auth actions)
authRouter.post("/register", strictLimiter, AuthController.register);

// SEED ADMIN — protected by `x-seed-token` header (must match env SEED_TOKEN).
// Creates an ADMIN user, or upgrades an existing user with the same email/phone.
authRouter.post("/seed-admin", strictLimiter, AuthController.seedAdmin);

//  verify email
authRouter.post("/verify-email", strictLimiter, AuthController.verifyEmail);

// VERIFY PHONE
authRouter.post("/verify-phone", strictLimiter, AuthController.verifyPhone);

// LOGIN
authRouter.post("/login", loginLimiter, AuthController.login);

// REFRESH TOKEN
authRouter.post("/refresh-token", strictLimiter, AuthController.refreshToken);

// SEND OTP (email or phone)
authRouter.post("/send-otp", strictLimiter, AuthController.sendOTP);


// logOut
authRouter.post("/logout", logout);





// FORGOT PASSWORD
authRouter.post("/forgot-password", strictLimiter, AuthController.forgotPassword);


// RESET PASSWORD
authRouter.post("/reset-password", strictLimiter, AuthController.resetPassword);

// GET CURRENT USER
authRouter.get("/me", strictLimiter, AuthController.getMe);

// USER LIST — any staff role can view (filtered access enforced in UI).
authRouter.get(
  "/users",
  strictLimiter,
  authGuard(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.SOCIAL_MANAGER
  ),
  AuthController.getAllUsers
);

// CREATE STAFF USER (admin user management) — server-side role rules in
// the service decide what role the caller may actually create.
authRouter.post(
  "/users/staff",
  strictLimiter,
  authGuard(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  AuthController.createStaffUser
);

authRouter.get(
  "/users/:id",
  strictLimiter,
  authGuard(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.SOCIAL_MANAGER,
    UserRole.CUSTOMER
  ),
  AuthController.getUserById
);

// ROLE CHANGES — admin-only routes; service enforces caller-role rules
// (ADMIN can't promote to ADMIN/SUPER_ADMIN, etc.).
authRouter.patch(
  "/users/:id/role",
  strictLimiter,
  authGuard(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  AuthController.updateRoleUser
);


// UPLOAD AVATAR (requires login — client sends Bearer token)
authRouter.post(
  "/upload-avatar",
  strictLimiter,
  authGuard(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.SOCIAL_MANAGER,
    UserRole.CUSTOMER
  ),
  uploadUserAvatar.single("file"),
  AuthController.uploadAvatar
);

authRouter.patch(
  "/users/:id",
  strictLimiter,
  authGuard(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.SOCIAL_MANAGER,
    UserRole.CUSTOMER
  ),
  updateUserCon
);


authRouter.delete(
  "/users/:id",
  strictLimiter,
  authGuard(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  AuthController.deleteUser
);
