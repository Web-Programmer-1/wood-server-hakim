

import express from "express";
import { AuthController, updateUserCon } from "./auth.controller";

import { UserRole } from "@prisma/client";
import { authGuard } from "../../middlewares/auth";


export const authRouter = express.Router();

// REGISTER
authRouter.post("/register", AuthController.register);

//  verify email
authRouter.post("/verify-email", AuthController.verifyEmail);

// VERIFY PHONE
authRouter.post("/verify-phone", AuthController.verifyPhone);

// LOGIN
authRouter.post("/login", AuthController.login);

// REFRESH TOKEN
authRouter.post("/refresh-token", AuthController.refreshToken);

// SEND OTP (email or phone)
authRouter.post("/send-otp", AuthController.sendOTP);





// FORGOT PASSWORD
authRouter.post("/forgot-password", AuthController.forgotPassword);


// RESET PASSWORD
authRouter.post("/reset-password", AuthController.resetPassword);

// GET CURRENT USER
authRouter.get("/me",  AuthController.getMe);

// USER CRUD
authRouter.get("/users",   AuthController.getAllUsers);
authRouter.get("/users/:id",   AuthController.getUserById);
// authRouter.patch("/users/:id",authGuard(UserRole.ADMIN, UserRole.CUSTOMER), AuthController.updateUserCon);


authRouter.patch(
  "/users/:id",

  updateUserCon
);






authRouter.delete("/users/:id",  AuthController.deleteUser);
