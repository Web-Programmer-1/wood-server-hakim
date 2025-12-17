

import express from "express";
import { AuthController } from "./auth.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";


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
authRouter.get("/me", auth(UserRole.ADMIN, UserRole.CUSTOMER), AuthController.getMe);

// USER CRUD
authRouter.get("/users",  AuthController.getAllUsers);
authRouter.get("/users/:id", AuthController.getUserById);
authRouter.patch("/users/:id", AuthController.updateUser);
authRouter.delete("/users/:id", AuthController.deleteUser);
