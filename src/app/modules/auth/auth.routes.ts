

import express from "express";
import { AuthController, logout, updateUserCon } from "./auth.controller";
import { strictLimiter } from "../../middlewares/strictFixTimeSecurity";
import { uploadUserAvatar } from "../../middlewares/uploadUserAvatar";
import { authGuard } from "../../middlewares/auth";
import { UserRole } from "@prisma/client";


export const authRouter = express.Router();

// REGISTER (sends OTP — same throttle as other auth actions)
authRouter.post("/register", strictLimiter, AuthController.register);

//  verify email
authRouter.post("/verify-email", strictLimiter, AuthController.verifyEmail);

// VERIFY PHONE
authRouter.post("/verify-phone", strictLimiter, AuthController.verifyPhone);

// LOGIN
authRouter.post("/login", AuthController.login);

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

// USER CRUD
authRouter.get("/users", strictLimiter, authGuard(UserRole.ADMIN), AuthController.getAllUsers);
authRouter.get("/users/:id", strictLimiter, AuthController.getUserById);
authRouter.patch("/users/:id/role", strictLimiter, authGuard(UserRole.ADMIN), AuthController.updateRoleUser);


// UPLOAD AVATAR (requires login — client sends Bearer token)
authRouter.post(
  "/upload-avatar",
  strictLimiter,
  authGuard(UserRole.ADMIN, UserRole.CUSTOMER),
  uploadUserAvatar.single("file"),
  AuthController.uploadAvatar
);

authRouter.patch(
  "/users/:id",
  strictLimiter,
  updateUserCon
);








authRouter.delete("/users/:id", strictLimiter, AuthController.deleteUser);
