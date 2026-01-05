

import express from "express";
import { AuthController, logout, updateUserCon } from "./auth.controller";
import { strictLimiter } from "../../middlewares/strictFixTimeSecurity";


export const authRouter = express.Router();

// REGISTER
authRouter.post("/register", strictLimiter, AuthController.register);

//  verify email
authRouter.post("/verify-email", strictLimiter, AuthController.verifyEmail);

// VERIFY PHONE
authRouter.post("/verify-phone", strictLimiter , AuthController.verifyPhone);

// LOGIN
authRouter.post("/login", strictLimiter, AuthController.login);

// REFRESH TOKEN
authRouter.post("/refresh-token",strictLimiter, AuthController.refreshToken);

// SEND OTP (email or phone)
authRouter.post("/send-otp", strictLimiter, AuthController.sendOTP);


// logOut 
authRouter.post("/logout",logout);





// FORGOT PASSWORD
authRouter.post("/forgot-password", strictLimiter, AuthController.forgotPassword);


// RESET PASSWORD
authRouter.post("/reset-password",strictLimiter, AuthController.resetPassword);

// GET CURRENT USER
authRouter.get("/me", strictLimiter, AuthController.getMe);

// USER CRUD
authRouter.get("/users", strictLimiter,  AuthController.getAllUsers);
authRouter.get("/users/:id", strictLimiter,  AuthController.getUserById);


authRouter.patch(
  "/users/:id",
strictLimiter,
  updateUserCon
);








authRouter.delete("/users/:id",strictLimiter,  AuthController.deleteUser);
