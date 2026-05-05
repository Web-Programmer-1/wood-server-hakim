import { NextFunction, Request, response, Response } from "express";
import { AuthService, logoutService } from "./auth.service";

// auth.controller.ts
import { RequestHandler } from "express";

export const AuthController = {
  async register(req: Request, res: Response) {
    try {
      const data = await AuthService.register(req.body);
      res.json(data);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  },

  async verifyEmail(req: Request, res: Response) {
    try {
      const data = await AuthService.verifyEmail(req.body);
      res.json(data);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  },

  async verifyPhone(req: Request, res: Response) {
    try {
      const data = await AuthService.verifyPhone(req.body);
      res.json(data);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  },

  async login(req: Request, res: Response) {
    try {
      const data = await AuthService.login(req.body, res);
      res.json(data);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  },

  async refreshToken(req: Request, res: Response) {
    try {
      const data = await AuthService.refreshToken(req, res);
      res.json(data);
    } catch (err: any) {
      res.status(401).json({ message: err.message });
    }
  },




  //  Send Single Send OTP using forgot password and reset password

  async sendOTP(req: Request, res: Response) {
    try {
      const data = await AuthService.sendOTP(req.body);
      res.json(data);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  },











  async resetPassword(req: Request, res: Response) {
    try {
      const { identifier, otp, newPassword } = req.body;

      const data = await AuthService.resetPassword(identifier, otp, newPassword);

      res.json(data);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  },


  //  Forgot Password -------------------

  async forgotPassword(req: Request, res: Response) {
    try {
      const data = await AuthService.forgotPassword(req.body);
      res.json(data);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  },








  async getMe(req: Request, res: Response) {
    try {
      const data = await AuthService.getMe(req);
      res.json(data);
    } catch (err: any) {
      res.status(401).json({ message: err.message });
    }
  },

  async getAllUsers(req: Request, res: Response) {
    try {
      const data = await AuthService.getAllUsers();
      res.json(data);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  },

  async getUserById(req: Request, res: Response) {
    try {
      const targetId = req.params.id as string;
      const caller = req.user;
      if (!caller) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      if (caller.role !== "ADMIN" && caller.id !== targetId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const data = await AuthService.getUserById(targetId);
      res.json(data);
    } catch (err: any) {
      res.status(404).json({ message: err.message });
    }
  },

  async updateRoleUser(req: Request, res: Response) {
    try {
      const data = await AuthService.updateRoleUser(req.params.id as string, req.body.role);
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  },










  async deleteUser(req: Request, res: Response) {
    try {
      const data = await AuthService.deleteUser(req.params.id as string);
      res.json(data);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  },

  async seedAdmin(req: Request, res: Response) {
    try {
      // Headers can be string | string[] | undefined; also strip stray whitespace.
      const rawHeader = req.headers["x-seed-token"];
      const provided = (Array.isArray(rawHeader) ? rawHeader[0] : rawHeader)?.trim();
      // Also accept ?token=... query for quick browser/curl debugging.
      const queryToken = typeof req.query.token === "string" ? req.query.token.trim() : undefined;
      const supplied = provided || queryToken;
      const expected = process.env.SEED_TOKEN?.trim();

      if (!expected) {
        return res.status(500).json({ message: "SEED_TOKEN is not configured on the server" });
      }
      if (!supplied || supplied !== expected) {
        return res.status(403).json({
          message: "Forbidden: invalid seed token",
          debug: {
            providedHeaderPresent: Boolean(provided),
            providedHeaderLength: provided?.length ?? 0,
            providedHeaderPreview: provided ? `${provided.slice(0, 4)}...${provided.slice(-4)}` : null,
            expectedLength: expected.length,
            expectedPreview: `${expected.slice(0, 4)}...${expected.slice(-4)}`,
          },
        });
      }

      const data = await AuthService.seedAdmin(req.body ?? {});
      res.status(data.created ? 201 : 200).json({ success: true, ...data });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async uploadAvatar(req: Request, res: Response) {
    try {
      if (!req.file) {
        throw new Error("No file uploaded");
      }

      // The file is already uploaded to S3 by the middleware
      // @ts-ignore - location property exists on multer-s3 file object
      const avatarUrl = (req.file as any).location;

      res.status(200).json({
        success: true,
        data: {
          url: avatarUrl
        }
      });
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  },



};








export const logout = async (req: Request, res: Response) => {
  try {
    const data = await logoutService(res);
    res.json(data);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};





export const updateUserCon: RequestHandler = async (req, res) => {
  try {
    const targetId = req.params.id as string;
    const caller = req.user;
    if (!caller) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const isAdmin = caller.role === "ADMIN";
    if (!isAdmin && caller.id !== targetId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const result = await AuthService.updateUser(targetId, req.body, {
      isAdmin,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};












