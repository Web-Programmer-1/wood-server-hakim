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
      const data = await AuthService.getUserById(req.params.id);
      res.json(data);
    } catch (err: any) {
      res.status(404).json({ message: err.message });
    }
  },

  async updateRoleUser(req: Request, res: Response) {
    try {
      const data = await AuthService.updateRoleUser(req.params.id, req.body.role);
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  },










  async deleteUser(req: Request, res: Response) {
    try {
      const data = await AuthService.deleteUser(req.params.id);
      res.json(data);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
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
    const result = await AuthService.updateUser(
      req.params.id,
      req.body
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};












