import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { authService } from '../services/auth.service';
import { strictRateLimiter, emailRateLimiter } from '../middleware/rateLimiter';

const router = Router();

// Validation middleware
const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.type === 'field' ? err.path : undefined,
        message: err.msg,
      })),
    });
    return;
  }
  next();
};

// Register endpoint
router.post(
  '/register',
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain uppercase, lowercase, and number'),
    body('displayName')
      .optional()
      .isLength({ min: 2, max: 50 })
      .withMessage('Display name must be between 2 and 50 characters'),
  ],
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.register(req.body);
      
      res.status(201).json({
        success: true,
        user: result.user,
        tokens: result.tokens,
        requiresEmailVerification: result.requiresEmailVerification,
        message: 'Registration successful. Please check your email for verification.',
      });
    } catch (error) {
      next(error);
    }
  }
);

// Login endpoint
router.post(
  '/login',
  strictRateLimiter,
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
    body('deviceId')
      .optional()
      .isString()
      .withMessage('Device ID must be a string'),
  ],
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.login(req.body);
      
      res.json({
        success: true,
        user: result.user,
        tokens: result.tokens,
        message: 'Login successful',
      });
    } catch (error) {
      next(error);
    }
  }
);

// Logout endpoint
router.post(
  '/logout',
  [
    body('refreshToken')
      .notEmpty()
      .withMessage('Refresh token is required'),
  ],
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await authService.logout(req.body.refreshToken);
      
      res.json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      next(error);
    }
  }
);

// Refresh token endpoint
router.post(
  '/refresh',
  [
    body('refreshToken')
      .notEmpty()
      .withMessage('Refresh token is required'),
    body('deviceId')
      .optional()
      .isString()
      .withMessage('Device ID must be a string'),
  ],
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.refresh(
        req.body.refreshToken,
        req.body.deviceId
      );
      
      res.json({
        success: true,
        user: result.user,
        tokens: result.tokens,
        message: 'Token refresh successful',
      });
    } catch (error) {
      next(error);
    }
  }
);

// Email verification endpoint
router.post(
  '/verify-email',
  [
    body('token')
      .notEmpty()
      .withMessage('Verification token is required'),
  ],
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.verifyEmail(req.body);
      
      res.json({
        success: true,
        user: result.user,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Resend email verification endpoint
router.post(
  '/resend-verification',
  emailRateLimiter,
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),
  ],
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.resendVerificationEmail(req.body);
      
      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Forgot password endpoint
router.post(
  '/forgot-password',
  emailRateLimiter,
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),
  ],
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ipAddress = req.ip || req.connection?.remoteAddress || 'unknown';
      const userAgent = req.get('User-Agent');
      
      const result = await authService.forgotPassword(
        req.body,
        ipAddress,
        userAgent
      );
      
      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Reset password endpoint
router.post(
  '/reset-password',
  strictRateLimiter,
  [
    body('token')
      .notEmpty()
      .withMessage('Reset token is required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain uppercase, lowercase, and number'),
  ],
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ipAddress = req.ip || req.connection?.remoteAddress || 'unknown';
      const userAgent = req.get('User-Agent');
      
      const result = await authService.resetPassword(
        req.body,
        ipAddress,
        userAgent
      );
      
      res.json({
        success: true,
        message: result.message,
        user: result.user,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;