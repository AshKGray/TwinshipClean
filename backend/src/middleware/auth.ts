import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthError, AuthErrorCodes, JWTPayload } from '../types/auth';
import { prisma } from '../server';
import { logger } from '../utils/logger';

// Extend Request interface to include user data
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        emailVerified: boolean;
      };
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthError(
        'Authorization token is required',
        AuthErrorCodes.UNAUTHORIZED,
        401
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      throw new AuthError(
        'Authorization token is required',
        AuthErrorCodes.UNAUTHORIZED,
        401
      );
    }

    // Verify JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      logger.error('JWT_SECRET not configured');
      throw new AuthError(
        'Server configuration error',
        AuthErrorCodes.UNAUTHORIZED,
        500
      );
    }

    let decoded: JWTPayload;
    try {
      decoded = jwt.verify(token, jwtSecret) as JWTPayload;
    } catch (jwtError: any) {
      if (jwtError.name === 'TokenExpiredError') {
        throw new AuthError(
          'Access token has expired',
          AuthErrorCodes.TOKEN_EXPIRED,
          401
        );
      } else if (jwtError.name === 'JsonWebTokenError') {
        throw new AuthError(
          'Invalid access token',
          AuthErrorCodes.TOKEN_INVALID,
          401
        );
      }
      throw new AuthError(
        'Token verification failed',
        AuthErrorCodes.TOKEN_INVALID,
        401
      );
    }

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        accountLockedUntil: true,
      },
    });

    if (!user) {
      throw new AuthError(
        'User not found',
        AuthErrorCodes.USER_NOT_FOUND,
        401
      );
    }

    // Check if account is locked
    if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
      throw new AuthError(
        'Account is locked',
        AuthErrorCodes.ACCOUNT_LOCKED,
        401
      );
    }

    // Check email verification if required
    if (!user.emailVerified && process.env.EMAIL_VERIFICATION_REQUIRED === 'true') {
      throw new AuthError(
        'Email verification required',
        AuthErrorCodes.EMAIL_NOT_VERIFIED,
        401
      );
    }

    // Attach user to request object
    req.user = {
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
    };

    next();
  } catch (error) {
    if (error instanceof AuthError) {
      return res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });
    }

    logger.error('Authentication middleware error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error',
      },
    });
  }
};

// Optional middleware that doesn't throw errors if no token is provided
export const optionalAuthenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // No token provided, continue without user
    }

    // Use the main authenticate middleware
    await authenticate(req, res, next);
  } catch (error) {
    // Continue without user if authentication fails
    next();
  }
};

// Middleware to require email verification
export const requireEmailVerification = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: {
        code: AuthErrorCodes.UNAUTHORIZED,
        message: 'Authentication required',
      },
    });
  }

  if (!req.user.emailVerified) {
    return res.status(401).json({
      success: false,
      error: {
        code: AuthErrorCodes.EMAIL_NOT_VERIFIED,
        message: 'Email verification required',
      },
    });
  }

  next();
};