import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import nodemailer from "nodemailer";
import { generateOTP } from "../../../utils/otp";
import { sendSMS } from "../../../utils/sendSMS";

import { prisma } from "../../shared/prisma";
import redis from "../../../utils/redis";
import { IEmailVerify, IRegister, RegisterBody } from "./auth.interface";
import { Request, Response } from "express";

import { cookieOptions } from "../../../jwt_token_accessbility/cookieOptions";
import { UserRole } from "../../constants/UserRole";




export const AuthService = {

  async saveOTP(key: string, otp: string) {
    if (redis) {
      await redis.setEx(key, 300, otp);
    } else {
      await prisma.oTP.create({
        data: {
          code: otp,
          email: key.includes("EMAIL") ? key.split(":")[2] : null,
          phone: key.includes("PHONE") ? key.split(":")[2] : null,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        },
      });
    }
  },

  async getOTP(key: string) {
    if (redis) {
      return await redis.get(key);
    }

    const otp = await prisma.oTP.findFirst({
      where: {
        OR: [
          { email: key.includes("EMAIL") ? key.split(":")[2] : undefined },
          { phone: key.includes("PHONE") ? key.split(":")[2] : undefined },
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otp || otp.expiresAt < new Date()) return null;

    return otp.code;
  },

  /* ==========================
        SEND EMAIL OTP
  ========================== */
  async sendEmailOTP(email: string) {
    const otp = generateOTP();
    const key = `OTP:EMAIL:${email}`;
    await this.saveOTP(key, otp);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      to: email,
      subject: "Your OTP Code",
      html: `<h2>Your OTP Code is: <b>${otp}</b></h2>`,
    });
  },

  /* ==========================
        SEND PHONE OTP
  ========================== */
  async sendPhoneOTP(phone: string) {
    const otp = generateOTP();
    const key = `OTP:PHONE:${phone}`;
    await this.saveOTP(key, otp);
    await sendSMS(phone, `Your OTP Code is: ${otp}`);
  },


  async getLoginAttempt(userId: string) {
    let attempt = await prisma.loginAttempt.findUnique({ where: { userId } });

    if (!attempt) {
      attempt = await prisma.loginAttempt.create({
        data: { userId },
      });
    }

    return attempt;
  },

  async validateLoginAttempt(userId: string) {
    const attempt = await this.getLoginAttempt(userId);

    if (attempt.lockedUntil && attempt.lockedUntil > new Date()) {
      throw new Error("Account locked for 15 minutes");
    }
  },

  async registerFailedAttempt(userId: string) {
    const attempt = await this.getLoginAttempt(userId);
    const count = attempt.attemptCount + 1;

    if (count >= 5) {
      await prisma.loginAttempt.update({
        where: { userId },
        data: {
          attemptCount: 5,
          lockedUntil: new Date(Date.now() + 15 * 60 * 1000),
          lastAttemptAt: new Date(),
        },
      });

      throw new Error("Too many failed attempts. Account locked for 15 minutes.");
    }

    await prisma.loginAttempt.update({
      where: { userId },
      data: {
        attemptCount: { increment: 1 },
        lastAttemptAt: new Date(),
      },
    });
  },

  async resetLoginAttempt(userId: string) {
    await prisma.loginAttempt.update({
      where: { userId },
      data: {
        attemptCount: 0,
        lockedUntil: null,
        lastAttemptAt: new Date(),
      },
    });
  },





  async register(body: IRegister) {
    const { name, email, phone, password } = body;


    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          email ? { email } : undefined,
          phone ? { phone } : undefined,
        ].filter(Boolean) as any,
      },
    });

    if (existingUser) {
      if (email && existingUser.email === email) {
        throw new Error("Email already registered");
      }
      if (phone && existingUser.phone === phone) {
        throw new Error("Phone number already registered");
      }
      throw new Error("User already exists");
    }


    if (!password) throw new Error("Password is required");

    const hash = await bcrypt.hash(password, 10); // hash password

    // Perform database operations in transaction
    // Set timeout to 30 seconds as a safety measure
    const result = await prisma.$transaction(async (tx: any) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          phone,
          passwordHash: hash, // store hashed password
          profile: {
            create: { avatarUri: null, bio: null, gender: null },
          },
        },
        include: { profile: true },
      });

      await tx.loginAttempt.create({ data: { userId: user.id } });

      return {
        message: "User registered successfully. OTP sent.",
        userId: user.id,

      };
    }, {
      timeout: 30000, // 30 seconds timeout
    });

    // Send OTPs outside the transaction to avoid timeout
    // These are external API calls that can take time
    // Wrap in try-catch so OTP failures don't fail registration
    try {
      if (email) await this.sendEmailOTP(email);
    } catch (error: any) {
      console.error("Failed to send email OTP:", error.message);
      // Don't throw - user is already created, OTP can be resent later
    }

    try {
      if (phone) await this.sendPhoneOTP(phone);
    } catch (error: any) {
      console.error("Failed to send phone OTP:", error.message);
      // Don't throw - user is already created, OTP can be resent later
    }

    return result;
  },


  async verifyEmail(body: IEmailVerify) {
    const { email, otp } = body;

    const key = `OTP:EMAIL:${email}`;
    const stored = await this.getOTP(key);

    if (stored !== otp) throw new Error("Invalid OTP");

    // STEP 1 → find user by email (email is NOT unique)
    const user = await prisma.user.findFirst({
      where: { email },
    });

    if (!user) throw new Error("User not found with this email");

    // STEP 2 → update using unique id
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true },
    });


    await prisma.userProfile.update({
      where: { userId: user.id },
      data: {

      },
    });


    return { message: "Email verified successfully." };
  },



  /* ==========================
        VERIFY PHONE
  ========================== */


  async verifyPhone(body: any) {
    const { phone, otp } = body;

    const key = `OTP:PHONE:${phone}`;
    const stored = await this.getOTP(key);

    if (stored !== otp) throw new Error("Invalid OTP");

    const user = await prisma.user.findFirst({
      where: { phone },
    });

    if (!user) throw new Error("User not found with this phone number");

    await prisma.user.update({
      where: { id: user.id },
      data: { phoneVerified: true },
    });

    //   await prisma.userProfile.update({
    //   where: { userId: user.id },
    //   data: {
    //   user:user,
    //   },
    // });


    return { message: "Phone verified." };
  },





  async refreshToken(req: Request, res: Response) {
    const token = req.cookies.refreshToken;
    if (!token) throw new Error("Unauthorized");

    try {
      // Verify refresh token
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as any;

      // Create new access token
      const newAccessToken = jwt.sign(
        { id: decoded.id },
        process.env.JWT_ACCESS_SECRET!,
        { expiresIn: "1h" }
      );

      // Set it in cookies again
      res.cookie("accessToken", newAccessToken, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000,
      });

      return {
        message: "Token refreshed",
        accessToken: newAccessToken
      };

    } catch (err) {
      console.log("Refresh-token error =>", err);
      throw new Error("Invalid refresh token");
    }
  },









  /* ==========================
            LOGIN
  ========================== */



  async login(body: any, res: Response) {
    const { email, password } = body;

    const user = await prisma.user.findFirst({ where: { email } });
    if (!user) throw new Error("Invalid credentials");

    await this.validateLoginAttempt(user.id);

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      await this.registerFailedAttempt(user.id);
      throw new Error("Invalid credentials");
    }

    await this.resetLoginAttempt(user.id);


    const accessToken = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_ACCESS_SECRET!,
      { expiresIn: "90d" }
    );

    console.log(user.role, user.id)



    const refreshToken = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: "7d" }
    );


    // Set Cookies
    res.cookie("accessToken", accessToken, {
      ...cookieOptions,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.cookie("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });


    return {
      message: "Logged in successfully.",
      accessToken,
      refreshToken,
    };
  },





  /* ==========================
        REFRESH TOKEN
  ========================== */


  async forgotPassword(body: { identifier: string }) {
    const { identifier } = body;

    if (!identifier) throw new Error("Email or phone is required");

    // Find user by email OR phone
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { phone: identifier },
        ]
      }
    });

    if (!user) {
      throw new Error("No user found with this email or phone");
    }

    // Send OTP to email or phone
    if (identifier.includes("@")) {
      await this.sendEmailOTP(identifier);
    } else {
      await this.sendPhoneOTP(identifier);
    }

    return {
      message: "OTP sent for password reset",
      identifier
    };
  },




  //  Send single OTP using forgot password and reset password

  async sendOTP(body: { identifier: string }) {
    const { identifier } = body;

    if (!identifier) throw new Error("Email or phone is required");

    // Check user exists
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { phone: identifier }
        ]
      }
    });

    if (!user) throw new Error("No user found with this email/phone");

    // Send OTP
    if (identifier.includes("@")) {
      await this.sendEmailOTP(identifier);
    } else {
      await this.sendPhoneOTP(identifier);
    }

    return { message: "OTP sent successfully" };
  },










  async resetPassword(identifier: string, otp: string, newPassword: string) {
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { phone: identifier }]
      }
    });

    if (!user) throw new Error("User not found");

    // Find OTP
    const savedOTP = await prisma.oTP.findFirst({
      where: {
        OR: [
          { email: user.email ?? undefined },
          { phone: user.phone ?? undefined }
        ]
      },
      orderBy: { createdAt: "desc" }
    });

    if (!savedOTP || savedOTP.code !== otp) {
      throw new Error("Invalid OTP");
    }

    // Update password
    const hashed = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashed
      }
    });

    return { message: "Password reset successful" };
  },







  async getMe(req: Request) {
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    if (!token && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) throw new Error("Unauthorized");

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as any;

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { profile: true },
    });

    return user;
  },


  //      ----------- Get All Users -------------

  async getAllUsers() {
    return await prisma.user.findMany({
      include: { profile: true },
    });
  },


  //  ---------GetUserById ----------


  async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { profile: true },
    });

    if (!user) throw new Error("User not found");
    return user;
  },







  async updateUser(
    targetUserId: string,
    body: any
  ) {

    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone,


        ...(body.role ? { role: body.role as UserRole } : {}),

        ...(body.status ? { status: body.status } : {}),

        profile: body.profile
          ? {
            upsert: {
              create: {
                ...body.profile,

              },
              update: {
                ...body.profile,

              },
            },
          }
          : undefined,
      },
      include: { profile: true },
    });

    return updatedUser;
  },

  async updateRoleUser(targetUserId: string, role: string) {
    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: { role: role as UserRole },
      include: { profile: true },
    });

    return updatedUser;
  },







  async deleteUser(id: string) {
    await prisma.user.delete({
      where: { id }
    });

    return { message: "User deleted successfully" };
  }


};











export const logoutService = async (res: Response) => {
  res.clearCookie("accessToken", cookieOptions);
  res.clearCookie("refreshToken", cookieOptions);

  return {
    message: "Logged out successfully",
  };
};
