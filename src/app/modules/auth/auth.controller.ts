import { NextFunction, Request, response, Response } from "express";
import { AuthService } from "./auth.service";

// auth.controller.ts
import { RequestHandler } from "express";

export const AuthController = {
  async register(req:Request, res:Response) {
    try {
      const data = await AuthService.register(req.body);
      res.json(data);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  },

  async verifyEmail(req:Request, res:Response) {
    try {
      const data = await AuthService.verifyEmail(req.body);
      res.json(data);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  },

  async verifyPhone(req:Request, res:Response) {
    try {
      const data = await AuthService.verifyPhone(req.body);
      res.json(data);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  },

  async login(req:Request, res:Response) {
    try {
      const data = await AuthService.login(req.body, res);
      res.json(data);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  },

  async refreshToken(req:Request, res:Response) {
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

// async updateUser(req: Request, res: Response) {
//   try {
//     const data = await AuthService.updateUser(req.params.id, req.body);
//     res.json(data);
//   } catch (err: any) {
//     res.status(400).json({ message: err.message });
//   }
// },











async deleteUser(req: Request, res: Response) {
  try {
    const data = await AuthService.deleteUser(req.params.id);
    res.json(data);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
},












};













 export const updateUserCon: RequestHandler = async (req:Request & { user?: any }, res:Response) => {
  try {
    const result = await AuthService.updateUser(
      req.params.id,
      req.body,
      req.user!.id,     // authGuard guarantee করে
      req.user!.role
    );

    console.log(result)

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(403).json({ message: error.message });
  }
};

