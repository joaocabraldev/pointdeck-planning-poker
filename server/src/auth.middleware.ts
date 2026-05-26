import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// JWT Secret - In production, use environment variable
export const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Extend Express Request to include user info
export interface AuthRequest extends Request {
  user?: {
    id: string;
    name: string;
  };
}

// Authentication middleware
export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.substring(7); // Remove "Bearer " prefix

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; name: string };
    req.user = decoded;
    next();
  
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};
