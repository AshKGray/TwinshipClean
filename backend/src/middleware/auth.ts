import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

// Extend Express Request type globally
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        id: string;
        email: string;
        emailVerified?: boolean;
      };
    }
  }
}

export interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    id: string;
    email: string;
    emailVerified?: boolean;
  };
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '') || req.header('x-auth-token');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token, authorization denied',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    req.user = {
      userId: decoded.userId || decoded.sub,
      id: decoded.userId || decoded.sub,
      email: decoded.email,
      emailVerified: decoded.emailVerified,
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({
      success: false,
      error: 'Token is not valid',
    });
  }
};

// Alias for consistency
export const authenticateToken = authMiddleware;