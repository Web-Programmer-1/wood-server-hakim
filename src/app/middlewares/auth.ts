



import { Request, Response, NextFunction, RequestHandler } from "express";
import jwt from "jsonwebtoken";

export type JwtPayload = {
  id: string;
  role: string;
};

export const authGuard =
  (...allowedRoles: string[]): RequestHandler =>
  (req: Request & { user?: JwtPayload }, res: Response, next: NextFunction) => {
    try {
      let token: string | undefined;

      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
      }

   
      if (!token && req.cookies?.accessToken) {
        token = req.cookies.accessToken;
      }

      console.log("AUTH HEADER:", req.headers.authorization);
console.log("COOKIE TOKEN:", req.cookies?.accessToken);


      if (!token) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_ACCESS_SECRET!
      ) as JwtPayload;

   
      if (
        allowedRoles.length &&
        !allowedRoles.includes(decoded.role)
      ) {
        return res.status(403).json({
          success: false,
          message: "Forbidden",
        });
      }

      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }
  };
