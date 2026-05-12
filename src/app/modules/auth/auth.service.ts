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
import { ROLE_GROUPS, UserRole } from "../../constants/UserRole";
import {
  generateTempPassword,
  sendStaffCredentialsEmail,
} from "../../../utils/staffCredentialsEmail";


// ============================================================
//  PHONE NORMALIZATION (Bangladesh)
//  Canonical form: `880` + 10-digit local number (no leading 0).
//  Examples that all map to `8801712345678`:
//    01712345678       (local, 11 digits with leading 0)
//    1712345678        (local, 10 digits without leading 0)
//    8801712345678     (already canonical)
//    +8801712345678    (E.164)
//    881712345678      (legacy / buggy form — recovered)
//  Strategy: peel off any country prefix, drop the leading 0,
//  then prepend `880` exactly once. Calling this twice is safe.
// ============================================================
export function normalizePhone(input: string | null | undefined): string | null {
  if (input === null || input === undefined) return null;
  let p = String(input).trim().replace(/[\s\-()+]/g, "");
  if (!p) return null;
  if (!/^[0-9]+$/.test(p)) return p; // leave non-digit garbage to validation

  if (p.startsWith("880")) p = p.slice(3);
  else if (p.startsWith("88")) p = p.slice(2);

  while (p.startsWith("0")) p = p.slice(1);

  return "880" + p;
}

function isEmail(value: string): boolean {
  return value.includes("@");
}

function normalizeIdentifier(input: string): string {
  return isEmail(input) ? input.trim().toLowerCase() : (normalizePhone(input) ?? input);
}


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

  // Invalidate an OTP after a successful verify or password reset so it
  // cannot be replayed. Works for both Redis and DB-backed storage.
  async clearOTP(key: string, target: { email?: string | null; phone?: string | null }) {
    if (redis) {
      try { await redis.del(key); } catch { /* ignore */ }
      return;
    }
    await prisma.oTP.deleteMany({
      where: {
        OR: [
          target.email ? { email: target.email } : undefined,
          target.phone ? { phone: target.phone } : undefined,
        ].filter(Boolean) as any,
      },
    });
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
    const { name, password } = body;
    const email = body.email ? body.email.trim().toLowerCase() : null;
    const phone = normalizePhone(body.phone);

    if (!email && !phone) throw new Error("Email or phone is required");

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

    // Send OTPs outside the transaction to avoid timeout. We deliberately
    // swallow failures here (the user row already exists, the OTP can be
    // resent) but we surface the reason back to the client so the UI can
    // explain why no code arrived.
    const otpWarnings: string[] = [];

    if (email) {
      try {
        await this.sendEmailOTP(email);
      } catch (error: any) {
        console.error("Failed to send email OTP:", error.message);
        otpWarnings.push(`Email OTP failed: ${error.message}`);
      }
    }

    if (phone) {
      try {
        await this.sendPhoneOTP(phone);
      } catch (error: any) {
        console.error("Failed to send phone OTP:", error.message);
        otpWarnings.push(`Phone OTP failed: ${error.message}`);
      }
    }

    return {
      ...result,
      message:
        otpWarnings.length > 0
          ? `Account created, but OTP delivery failed. ${otpWarnings.join(" | ")} You can request a new code from the OTP screen.`
          : result.message,
      otpDelivered: otpWarnings.length === 0,
      otpWarnings,
    };
  },


  async verifyEmail(body: IEmailVerify & { verifyOnly?: boolean }) {
    const email = body.email ? body.email.trim().toLowerCase() : "";
    const { otp } = body;
    // `verifyOnly` lets the password-reset flow check the OTP without
    // consuming it — the /reset-password endpoint that runs next needs
    // the same OTP to still be in storage.
    const verifyOnly = body.verifyOnly === true;
    if (!email) throw new Error("Email is required");

    const key = `OTP:EMAIL:${email}`;
    const stored = await this.getOTP(key);

    if (!stored || stored !== otp) throw new Error("Invalid or expired OTP");

    const user = await prisma.user.findFirst({
      where: { email },
    });

    if (!user) throw new Error("User not found with this email");

    if (!verifyOnly) {
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true },
      });
      await this.clearOTP(key, { email });
    }

    return { message: verifyOnly ? "OTP is valid." : "Email verified successfully." };
  },



  /* ==========================
        VERIFY PHONE
  ========================== */


  async verifyPhone(body: any) {
    const phone = normalizePhone(body.phone);
    const { otp } = body;
    const verifyOnly = body?.verifyOnly === true;
    if (!phone) throw new Error("Phone is required");

    const key = `OTP:PHONE:${phone}`;
    const stored = await this.getOTP(key);

    if (!stored || stored !== otp) throw new Error("Invalid or expired OTP");

    const user = await prisma.user.findFirst({
      where: { phone },
    });

    if (!user) throw new Error("User not found with this phone number");

    if (!verifyOnly) {
      await prisma.user.update({
        where: { id: user.id },
        data: { phoneVerified: true },
      });
      await this.clearOTP(key, { phone });
    }

    return { message: verifyOnly ? "OTP is valid." : "Phone verified." };
  },





  async refreshToken(req: Request, res: Response) {
    const token = req.cookies.refreshToken;
    if (!token) throw new Error("Unauthorized");

    try {
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as any;

      // Re-read the user so role/status reflect current state, not what
      // was true when the refresh token was minted (handles role
      // changes and account deactivation between refreshes).
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, role: true, status: true },
      });
      if (!user || user.status !== "ACTIVE") {
        throw new Error("Invalid refresh token");
      }

      const newAccessToken = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_ACCESS_SECRET!,
        { expiresIn: "15m" }
      );

      res.cookie("accessToken", newAccessToken, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000,
      });

      return {
        message: "Token refreshed",
        accessToken: newAccessToken,
      };
    } catch {
      throw new Error("Invalid refresh token");
    }
  },









  /* ==========================
            LOGIN
  ========================== */



  async login(body: any, res: Response) {
    const { password } = body;

    // Accept any of: `identifier` (preferred — email or phone), `email`, or
    // `phone`. The UI uses a single field for the user but older clients
    // may still send `email`-only payloads; preserve that path.
    const rawIdentifier: string | undefined =
      body.identifier ?? body.email ?? body.phone;

    if (!rawIdentifier) throw new Error("Email or phone is required");
    if (!password) throw new Error("Password is required");

    const identifier = normalizeIdentifier(String(rawIdentifier));
    const looksLikeEmail = isEmail(identifier);

    const user = await prisma.user.findFirst({
      where: looksLikeEmail ? { email: identifier } : { phone: identifier },
    });
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
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: "7d" }
    );


    // Set Cookies
    res.cookie("accessToken", accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });


    return {
      message: "Logged in successfully.",
      accessToken,
      refreshToken,
      user,
    };
  },





  /* ==========================
        REFRESH TOKEN
  ========================== */


  async forgotPassword(body: { identifier: string }) {
    if (!body?.identifier) throw new Error("Email or phone is required");

    const identifier = normalizeIdentifier(String(body.identifier));
    const looksLikeEmail = isEmail(identifier);

    const user = await prisma.user.findFirst({
      where: looksLikeEmail ? { email: identifier } : { phone: identifier },
    });

    if (!user) {
      throw new Error("No user found with this email or phone");
    }

    if (looksLikeEmail) {
      await this.sendEmailOTP(identifier);
    } else {
      await this.sendPhoneOTP(identifier);
    }

    return {
      message: "OTP sent for password reset",
      identifier,
    };
  },




  //  Send single OTP using forgot password and reset password

  async sendOTP(body: { identifier: string }) {
    if (!body?.identifier) throw new Error("Email or phone is required");

    const identifier = normalizeIdentifier(String(body.identifier));
    const looksLikeEmail = isEmail(identifier);

    const user = await prisma.user.findFirst({
      where: looksLikeEmail ? { email: identifier } : { phone: identifier },
    });

    if (!user) throw new Error("No user found with this email/phone");

    if (looksLikeEmail) {
      await this.sendEmailOTP(identifier);
    } else {
      await this.sendPhoneOTP(identifier);
    }

    return { message: "OTP sent successfully", identifier };
  },










  async resetPassword(rawIdentifier: string, otp: string, newPassword: string) {
    if (!rawIdentifier) throw new Error("Email or phone is required");
    if (!otp) throw new Error("OTP is required");
    if (!newPassword || newPassword.length < 8) {
      throw new Error("Password must be at least 8 characters");
    }
    if (!/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      throw new Error("Password must contain both letters and numbers");
    }

    const identifier = normalizeIdentifier(String(rawIdentifier));
    const looksLikeEmail = isEmail(identifier);

    const user = await prisma.user.findFirst({
      where: looksLikeEmail ? { email: identifier } : { phone: identifier },
    });

    if (!user) throw new Error("User not found");

    // Read the OTP through the same helper used to write it — this is what
    // actually fixes "I can't set new password" in deployments with Redis.
    // Previously this method only checked the DB, so when Redis was the
    // configured store the OTP was unreachable and every reset failed.
    const key = looksLikeEmail ? `OTP:EMAIL:${identifier}` : `OTP:PHONE:${identifier}`;
    const stored = await this.getOTP(key);

    if (!stored || stored !== otp) {
      throw new Error("Invalid or expired OTP");
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hashed },
    });

    // Burn the OTP and clear any failed-login lockout so the user can sign
    // in immediately with the new password.
    await this.clearOTP(key, looksLikeEmail ? { email: identifier } : { phone: identifier });
    try { await this.resetLoginAttempt(user.id); } catch { /* no attempt row yet */ }

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
    body: any,
    options: { isAdmin: boolean } = { isAdmin: false }
  ) {
    // Whitelist self-serviceable fields. role/status are admin-only —
    // silently dropping them for non-admins blocks the trivial
    // `PATCH /users/:id { role: "ADMIN" }` escalation.
    const data: any = {
      name: body.name,
      email: body.email,
      phone: body.phone,
    };

    if (options.isAdmin) {
      if (body.role) data.role = body.role as UserRole;
      if (body.status) data.status = body.status;
    }

    if (body.profile) {
      const profileFields = {
        avatarUri: body.profile.avatarUri,
        bio: body.profile.bio,
        gender: body.profile.gender,
      };
      data.profile = {
        upsert: {
          create: profileFields,
          update: profileFields,
        },
      };
    }

    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data,
      include: { profile: true },
    });

    return updatedUser;
  },

  async updateRoleUser(
    targetUserId: string,
    role: string,
    caller?: { id: string; role: UserRole }
  ) {
    // Validate the requested role against our enum.
    const requested = role as UserRole;
    if (!Object.values(UserRole).includes(requested)) {
      throw new Error("Invalid role");
    }

    // Caller-role rules:
    //  - SUPER_ADMIN can promote/demote anyone (incl. demoting themselves
    //    only if there is another SUPER_ADMIN — enforced below).
    //  - ADMIN cannot create SUPER_ADMIN/ADMIN accounts and cannot edit
    //    SUPER_ADMIN/ADMIN users.
    //  - Other roles cannot reach this method (route guard rejects).
    const target = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, role: true },
    });
    if (!target) throw new Error("User not found");

    // Treat the DB-side enum as a string for comparison — the local enum
    // values match the Prisma-generated values 1:1 but TypeScript sees
    // them as distinct nominal types.
    const targetRole = target.role as unknown as UserRole;

    if (caller) {
      if (caller.role === UserRole.ADMIN) {
        if (
          targetRole === UserRole.SUPER_ADMIN ||
          targetRole === UserRole.ADMIN
        ) {
          throw new Error("ADMIN cannot modify SUPER_ADMIN or ADMIN accounts");
        }
        if (
          requested === UserRole.SUPER_ADMIN ||
          requested === UserRole.ADMIN
        ) {
          throw new Error("ADMIN cannot assign SUPER_ADMIN or ADMIN role");
        }
      }

      // Guard against the last SUPER_ADMIN demoting themselves.
      if (
        caller.id === targetUserId &&
        targetRole === UserRole.SUPER_ADMIN &&
        requested !== UserRole.SUPER_ADMIN
      ) {
        const superAdminCount = await prisma.user.count({
          where: { role: UserRole.SUPER_ADMIN as any },
        });
        if (superAdminCount <= 1) {
          throw new Error(
            "Cannot demote the last SUPER_ADMIN. Promote another user first."
          );
        }
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: { role: requested as any },
      include: { profile: true },
    });

    return updatedUser;
  },







  async deleteUser(targetId: string, callerId: string, callerRole?: UserRole) {
    if (!targetId) throw new Error("Target user id is required");
    if (targetId === callerId) {
      // Stops an admin from accidentally locking themselves out, and
      // avoids the "ghost admin" footgun where the current session lives
      // on past a row that no longer exists.
      throw new Error("You cannot delete your own account from the admin panel");
    }

    const target = await prisma.user.findUnique({
      where: { id: targetId },
      select: { id: true, role: true, name: true, email: true, phone: true },
    });
    if (!target) throw new Error("User not found");

    const targetRole = target.role as unknown as UserRole;

    // ADMIN cannot delete SUPER_ADMIN or other ADMIN accounts.
    // MANAGER and SOCIAL_MANAGER cannot reach this endpoint at all (route
    // guard rejects), but guard defensively in case the guard list changes.
    if (callerRole === UserRole.ADMIN) {
      if (
        targetRole === UserRole.SUPER_ADMIN ||
        targetRole === UserRole.ADMIN
      ) {
        throw new Error("ADMIN cannot delete SUPER_ADMIN or ADMIN accounts");
      }
    }
    if (
      callerRole &&
      callerRole !== UserRole.SUPER_ADMIN &&
      callerRole !== UserRole.ADMIN
    ) {
      throw new Error("You are not allowed to delete users");
    }

    // Protect against deleting the last remaining SUPER_ADMIN.
    if (targetRole === UserRole.SUPER_ADMIN) {
      const superAdminCount = await prisma.user.count({
        where: { role: UserRole.SUPER_ADMIN as any },
      });
      if (superAdminCount <= 1) {
        throw new Error(
          "Cannot delete the last remaining SUPER_ADMIN. Promote another user first."
        );
      }
    }

    await prisma.user.delete({ where: { id: targetId } });

    return {
      message: "User deleted successfully",
      deletedUser: { id: target.id, name: target.name, email: target.email, phone: target.phone },
    };
  },


  /**
   * Create a staff (back-office) user with auto-generated password.
   *
   * Caller role determines what they may create:
   *   - SUPER_ADMIN can create any role including SUPER_ADMIN.
   *   - ADMIN can create MANAGER and SOCIAL_MANAGER only.
   *   - Other roles cannot reach this method (route guard rejects).
   *
   * The password is generated server-side and emailed to the recipient.
   * The hash is the only persisted form — there is no API surface that
   * returns the plaintext to the creator.
   */
  async createStaffUser(
    callerRole: UserRole,
    body: { name: string; email: string; role: UserRole }
  ) {
    const name = body.name?.trim();
    const email = body.email?.trim().toLowerCase();
    const role = body.role;

    if (!name) throw new Error("Name is required");
    if (!email) throw new Error("Email is required");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      throw new Error("A valid email address is required");
    }
    if (!role) throw new Error("Role is required");

    const assignableByCaller: Record<UserRole, UserRole[]> = {
      [UserRole.SUPER_ADMIN]: [
        UserRole.SUPER_ADMIN,
        UserRole.ADMIN,
        UserRole.MANAGER,
        UserRole.SOCIAL_MANAGER,
        UserRole.CUSTOMER,
      ],
      [UserRole.ADMIN]: [UserRole.MANAGER, UserRole.SOCIAL_MANAGER, UserRole.CUSTOMER],
      [UserRole.MANAGER]: [],
      [UserRole.SOCIAL_MANAGER]: [],
      [UserRole.CUSTOMER]: [],
    };

    const allowed = assignableByCaller[callerRole] ?? [];
    if (!allowed.includes(role)) {
      throw new Error(
        `Your role (${callerRole}) is not allowed to create a ${role} account`
      );
    }

    const existing = await prisma.user.findFirst({ where: { email } });
    if (existing) {
      throw new Error("A user with this email already exists");
    }

    const tempPassword = generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    // Create the row first; only email the password if the row exists.
    // If the mailer fails afterwards, we delete the row and surface the
    // error so the admin can retry without leaving an unreachable
    // account behind.
    const created = await prisma.$transaction(async (tx: any) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
          role,
          status: "ACTIVE",
          emailVerified: true,
          profile: { create: { avatarUri: null, bio: null, gender: null } },
        },
      });
      await tx.loginAttempt.create({ data: { userId: user.id } });
      return user;
    }, { timeout: 30000 });

    try {
      await sendStaffCredentialsEmail({
        to: email,
        name,
        role,
        tempPassword,
      });
    } catch (err: any) {
      // Roll back so the admin can retry instead of being stuck with
      // a created-but-unreachable account.
      await prisma.user.delete({ where: { id: created.id } }).catch(() => {});
      throw new Error(
        `Account creation failed: could not send credentials email (${err?.message ?? "unknown error"}). Please try again.`
      );
    }

    return {
      message: "Staff user created. Credentials emailed to the user.",
      user: {
        id: created.id,
        name: created.name,
        email: created.email,
        role: created.role,
        status: created.status,
        createdAt: created.createdAt,
      },
    };
  },

  async seedAdmin(body: { name?: string; email?: string; phone?: string; password?: string }) {
    const name = body.name ?? process.env.ADMIN_SEED_NAME ?? "Super Admin";
    const email = body.email ?? process.env.ADMIN_SEED_EMAIL;
    const phone = body.phone ?? process.env.ADMIN_SEED_PHONE ?? null;
    const password = body.password ?? process.env.ADMIN_SEED_PASSWORD;

    if (!email) throw new Error("Admin email is required (body.email or ADMIN_SEED_EMAIL)");
    if (!password) throw new Error("Admin password is required (body.password or ADMIN_SEED_PASSWORD)");
    if (password.length < 6) throw new Error("Admin password must be at least 6 characters");

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, ...(phone ? [{ phone }] : [])] },
    });

    if (existing) {
      if (existing.role === UserRole.ADMIN) {
        return {
          message: "Admin already exists",
          created: false,
          user: { id: existing.id, name: existing.name, email: existing.email, phone: existing.phone, role: existing.role },
        };
      }

      const upgraded = await prisma.user.update({
        where: { id: existing.id },
        data: { role: UserRole.ADMIN, status: "ACTIVE", emailVerified: true },
      });

      return {
        message: "Existing user upgraded to admin",
        created: false,
        user: { id: upgraded.id, name: upgraded.name, email: upgraded.email, phone: upgraded.phone, role: upgraded.role },
      };
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const created = await prisma.$transaction(async (tx: any) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          phone,
          passwordHash,
          role: UserRole.ADMIN,
          status: "ACTIVE",
          emailVerified: true,
          phoneVerified: phone ? true : false,
          profile: { create: { avatarUri: null, bio: null, gender: null } },
        },
      });

      await tx.loginAttempt.create({ data: { userId: user.id } });
      return user;
    }, { timeout: 30000 });

    return {
      message: "Admin user seeded successfully",
      created: true,
      user: { id: created.id, name: created.name, email: created.email, phone: created.phone, role: created.role },
    };
  },


};











export const logoutService = async (res: Response) => {
  res.clearCookie("accessToken", cookieOptions);
  res.clearCookie("refreshToken", cookieOptions);

  return {
    message: "Logged out successfully",
  };
};
