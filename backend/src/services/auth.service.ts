import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../server';
import { 
  UserRegistration, 
  UserLogin, 
  TokenPair,
  AuthError,
  AuthErrorCodes,
  JWTPayload,
  EmailVerificationRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ResendVerificationRequest
} from '../types/auth';
import { logger } from '../utils/logger';
import { emailService } from './email.service';

export class AuthService {
  private readonly bcryptRounds: number;
  private readonly jwtSecret: string;
  private readonly accessTokenExpiry: string;
  private readonly refreshTokenExpiry: string;

  constructor() {
    this.bcryptRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
    this.jwtSecret = process.env.JWT_SECRET!;
    this.accessTokenExpiry = process.env.JWT_ACCESS_TOKEN_EXPIRES || '15m';
    this.refreshTokenExpiry = process.env.JWT_REFRESH_TOKEN_EXPIRES || '7d';

    if (!this.jwtSecret) {
      throw new Error('JWT_SECRET is not configured');
    }
  }

  async register(data: UserRegistration) {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email.toLowerCase() },
      });

      if (existingUser) {
        throw new AuthError(
          'An account with this email already exists',
          AuthErrorCodes.EMAIL_ALREADY_EXISTS,
          409
        );
      }

      // Validate password strength
      this.validatePasswordStrength(data.password);

      // Hash password
      const passwordHash = await bcrypt.hash(data.password, this.bcryptRounds);

      // Create verification token
      const emailVerificationToken = uuidv4();
      const emailVerificationExpires = new Date();
      emailVerificationExpires.setHours(emailVerificationExpires.getHours() + 24);

      // Create user
      const user = await prisma.user.create({
        data: {
          email: data.email,
          emailNormalized: data.email.toLowerCase(),
          passwordHash,
          displayName: data.displayName,
          emailVerificationToken,
          emailVerificationExpires,
        },
        select: {
          id: true,
          email: true,
          displayName: true,
          emailVerified: true,
          createdAt: true,
        },
      });

      // Generate tokens
      const tokens = await this.generateTokenPair(user.id, user.email, user.emailVerified);

      // Send verification email
      try {
        const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:8081'}/auth/verify-email?token=${emailVerificationToken}`;
        await emailService.sendEmailVerification(user.email, {
          displayName: user.displayName || '',
          verificationUrl,
          expirationTime: '24 hours'
        });
        logger.info(`Verification email sent to ${user.email}`);
      } catch (emailError) {
        logger.error('Failed to send verification email:', emailError);
        // Don't fail registration if email fails, just log it
      }

      return {
        user,
        tokens,
        requiresEmailVerification: true,
      };
    } catch (error) {
      if (error instanceof AuthError) throw error;
      logger.error('Registration error:', error);
      throw new AuthError('Registration failed', 'REGISTRATION_FAILED', 500);
    }
  }

  async login(data: UserLogin) {
    try {
      // Find user
      const user = await prisma.user.findUnique({
        where: { emailNormalized: data.email.toLowerCase() },
      });

      if (!user) {
        // Log failed attempt even if user doesn't exist (security)
        await this.logLoginAttempt(data.email, 'login_failed', false, 'user_not_found');
        throw new AuthError(
          'Invalid email or password',
          AuthErrorCodes.INVALID_CREDENTIALS,
          401
        );
      }

      // Check if account is locked
      if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
        await this.logLoginAttempt(user.email, 'login_failed', false, 'account_locked', user.id);
        throw new AuthError(
          'Account is locked due to too many failed attempts',
          AuthErrorCodes.ACCOUNT_LOCKED,
          401
        );
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(data.password, user.passwordHash);

      if (!isValidPassword) {
        // Increment failed attempts
        await this.handleFailedLogin(user.id);
        await this.logLoginAttempt(user.email, 'login_failed', false, 'invalid_password', user.id);
        throw new AuthError(
          'Invalid email or password',
          AuthErrorCodes.INVALID_CREDENTIALS,
          401
        );
      }

      // Check email verification
      if (!user.emailVerified && process.env.EMAIL_VERIFICATION_REQUIRED === 'true') {
        await this.logLoginAttempt(user.email, 'login_failed', false, 'email_not_verified', user.id);
        throw new AuthError(
          'Please verify your email before logging in',
          AuthErrorCodes.EMAIL_NOT_VERIFIED,
          401
        );
      }

      // Reset failed attempts and update last login
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,
          accountLockedUntil: null,
          lastLoginAt: new Date(),
          lastLoginIp: data.deviceId,
        },
      });

      // Generate tokens
      const tokens = await this.generateTokenPair(
        user.id, 
        user.email, 
        user.emailVerified,
        data.deviceId
      );

      // Log successful login
      await this.logLoginAttempt(user.email, 'login_success', true, undefined, user.id);

      return {
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          emailVerified: user.emailVerified,
        },
        tokens,
      };
    } catch (error) {
      if (error instanceof AuthError) throw error;
      logger.error('Login error:', error);
      throw new AuthError('Login failed', 'LOGIN_FAILED', 500);
    }
  }

  async logout(refreshToken: string) {
    try {
      // Find and revoke the refresh token
      const token = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
      });

      if (!token) {
        throw new AuthError(
          'Invalid refresh token',
          AuthErrorCodes.TOKEN_INVALID,
          401
        );
      }

      // Revoke the token
      await prisma.refreshToken.update({
        where: { id: token.id },
        data: {
          revokedAt: new Date(),
          revokedReason: 'logout',
        },
      });

      // Log logout event
      await this.logLoginAttempt(
        '', // Email will be fetched from user relation if needed
        'logout',
        true,
        undefined,
        token.userId
      );

      return { success: true };
    } catch (error) {
      if (error instanceof AuthError) throw error;
      logger.error('Logout error:', error);
      throw new AuthError('Logout failed', 'LOGOUT_FAILED', 500);
    }
  }

  async refresh(refreshToken: string, deviceId?: string) {
    try {
      // Find the refresh token
      const storedToken = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              emailVerified: true,
              accountLockedUntil: true,
            },
          },
        },
      });

      if (!storedToken) {
        throw new AuthError(
          'Invalid refresh token',
          AuthErrorCodes.TOKEN_INVALID,
          401
        );
      }

      // Check if token is expired
      if (storedToken.expiresAt < new Date()) {
        throw new AuthError(
          'Refresh token has expired',
          AuthErrorCodes.TOKEN_EXPIRED,
          401
        );
      }

      // Check if token is revoked
      if (storedToken.revokedAt) {
        throw new AuthError(
          'Refresh token has been revoked',
          AuthErrorCodes.REFRESH_TOKEN_REVOKED,
          401
        );
      }

      // Check if user account is locked
      if (storedToken.user.accountLockedUntil && storedToken.user.accountLockedUntil > new Date()) {
        throw new AuthError(
          'Account is locked',
          AuthErrorCodes.ACCOUNT_LOCKED,
          401
        );
      }

      // Token rotation: revoke old token and create new ones
      await prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: {
          revokedAt: new Date(),
          revokedReason: 'token_rotation',
        },
      });

      // Generate new token pair
      const tokens = await this.generateTokenPair(
        storedToken.user.id,
        storedToken.user.email,
        storedToken.user.emailVerified,
        deviceId || (storedToken.deviceId ?? undefined)
      );

      // Log refresh event
      await this.logLoginAttempt(
        storedToken.user.email,
        'token_refresh',
        true,
        undefined,
        storedToken.user.id
      );

      return {
        user: {
          id: storedToken.user.id,
          email: storedToken.user.email,
          emailVerified: storedToken.user.emailVerified,
        },
        tokens,
      };
    } catch (error) {
      if (error instanceof AuthError) throw error;
      logger.error('Token refresh error:', error);
      throw new AuthError('Token refresh failed', 'TOKEN_REFRESH_FAILED', 500);
    }
  }

  private async generateTokenPair(
    userId: string, 
    email: string, 
    emailVerified: boolean,
    deviceId?: string
  ): Promise<TokenPair> {
    // Generate access token
    const accessTokenPayload: JWTPayload = {
      sub: userId,
      email,
      emailVerified,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + this.parseExpiry(this.accessTokenExpiry),
    };

    const accessToken = jwt.sign(accessTokenPayload, this.jwtSecret);

    // Generate refresh token
    const refreshTokenValue = uuidv4();
    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setSeconds(
      refreshTokenExpiry.getSeconds() + this.parseExpiry(this.refreshTokenExpiry)
    );

    // Store refresh token in database
    await prisma.refreshToken.create({
      data: {
        token: refreshTokenValue,
        userId,
        deviceId,
        expiresAt: refreshTokenExpiry,
      },
    });

    return {
      accessToken,
      refreshToken: refreshTokenValue,
      accessTokenExpires: new Date(accessTokenPayload.exp * 1000),
      refreshTokenExpires: refreshTokenExpiry,
    };
  }

  private validatePasswordStrength(password: string) {
    const minLength = parseInt(process.env.PASSWORD_MIN_LENGTH || '8');
    
    if (password.length < minLength) {
      throw new AuthError(
        `Password must be at least ${minLength} characters long`,
        AuthErrorCodes.WEAK_PASSWORD,
        422
      );
    }

    // Check for at least one uppercase, one lowercase, one number
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      throw new AuthError(
        'Password must contain at least one uppercase letter, one lowercase letter, and one number',
        AuthErrorCodes.WEAK_PASSWORD,
        422
      );
    }
  }

  private parseExpiry(expiry: string): number {
    const unit = expiry.slice(-1);
    const value = parseInt(expiry.slice(0, -1));

    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 60 * 60;
      case 'd': return value * 60 * 60 * 24;
      default: return 900; // Default 15 minutes
    }
  }

  private async handleFailedLogin(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { failedLoginAttempts: true },
    });

    if (!user) return;

    const newAttempts = user.failedLoginAttempts + 1;
    const maxAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5');

    const updateData: any = {
      failedLoginAttempts: newAttempts,
    };

    if (newAttempts >= maxAttempts) {
      const lockoutDuration = parseInt(process.env.LOCKOUT_DURATION || '30');
      const lockedUntil = new Date();
      lockedUntil.setMinutes(lockedUntil.getMinutes() + lockoutDuration);
      updateData.accountLockedUntil = lockedUntil;

      await this.logLoginAttempt('', 'account_locked', false, undefined, userId);
    }

    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });
  }

  private async logLoginAttempt(
    email: string,
    eventType: string,
    success: boolean,
    failureReason?: string,
    userId?: string
  ) {
    try {
      await prisma.loginHistory.create({
        data: {
          userId,
          email: email || 'unknown',
          eventType,
          success,
          failureReason,
        },
      });
    } catch (error) {
      logger.error('Failed to log login attempt:', error);
    }
  }

  async verifyEmail(data: EmailVerificationRequest) {
    try {
      // Find user by verification token
      const user = await prisma.user.findUnique({
        where: { emailVerificationToken: data.token },
      });

      if (!user) {
        throw new AuthError(
          'Invalid verification token',
          AuthErrorCodes.VERIFICATION_TOKEN_INVALID,
          400
        );
      }

      // Check if already verified
      if (user.emailVerified) {
        throw new AuthError(
          'Email is already verified',
          AuthErrorCodes.EMAIL_ALREADY_VERIFIED,
          400
        );
      }

      // Check if token is expired
      if (user.emailVerificationExpires && user.emailVerificationExpires < new Date()) {
        throw new AuthError(
          'Verification token has expired',
          AuthErrorCodes.VERIFICATION_TOKEN_EXPIRED,
          400
        );
      }

      // Verify the email
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: true,
          emailVerificationToken: null,
          emailVerificationExpires: null,
        },
        select: {
          id: true,
          email: true,
          displayName: true,
          emailVerified: true,
        },
      });

      logger.info(`Email verified for user: ${user.email}`);

      return {
        user: updatedUser,
        message: 'Email verified successfully',
      };
    } catch (error) {
      if (error instanceof AuthError) throw error;
      logger.error('Email verification error:', error);
      throw new AuthError('Email verification failed', 'EMAIL_VERIFICATION_FAILED', 500);
    }
  }

  async resendVerificationEmail(data: ResendVerificationRequest) {
    try {
      // Find user by email
      const user = await prisma.user.findUnique({
        where: { emailNormalized: data.email.toLowerCase() },
      });

      if (!user) {
        // Don't reveal if email exists or not for security
        return {
          message: 'If an account exists with this email, a verification email has been sent.',
        };
      }

      // Check if already verified
      if (user.emailVerified) {
        throw new AuthError(
          'Email is already verified',
          AuthErrorCodes.EMAIL_ALREADY_VERIFIED,
          400
        );
      }

      // Generate new verification token (6-hour expiry for resend)
      const emailVerificationToken = uuidv4();
      const emailVerificationExpires = new Date();
      emailVerificationExpires.setHours(emailVerificationExpires.getHours() + 6);

      // Update user with new token
      await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerificationToken,
          emailVerificationExpires,
        },
      });

      // Send verification email
      try {
        const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:8081'}/auth/verify-email?token=${emailVerificationToken}`;
        await emailService.sendEmailVerification(user.email, {
          displayName: user.displayName || '',
          verificationUrl,
          expirationTime: '6 hours'
        });
        logger.info(`Verification email resent to ${user.email}`);
      } catch (emailError) {
        logger.error('Failed to send verification email:', emailError);
        throw new AuthError('Failed to send verification email', 'EMAIL_SEND_FAILED', 500);
      }

      return {
        message: 'Verification email sent successfully',
      };
    } catch (error) {
      if (error instanceof AuthError) throw error;
      logger.error('Resend verification email error:', error);
      throw new AuthError('Failed to resend verification email', 'RESEND_VERIFICATION_FAILED', 500);
    }
  }

  async forgotPassword(data: ForgotPasswordRequest, ipAddress?: string, userAgent?: string) {
    try {
      // Find user by email
      const user = await prisma.user.findUnique({
        where: { emailNormalized: data.email.toLowerCase() },
      });

      // Always return success message to prevent email enumeration
      const successMessage = 'If an account exists with this email, a password reset link has been sent.';

      if (!user) {
        return { message: successMessage };
      }

      // Check if account is locked
      if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
        return { message: successMessage };
      }

      // Generate secure reset token using crypto.randomBytes
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpires = new Date();
      resetTokenExpires.setHours(resetTokenExpires.getHours() + 1); // 1 hour expiry

      // Store password reset token
      await prisma.passwordReset.create({
        data: {
          userId: user.id,
          token: resetToken,
          expiresAt: resetTokenExpires,
          ipAddress,
          userAgent,
        },
      });

      // Send password reset email
      try {
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:8081'}/auth/reset-password?token=${resetToken}`;
        await emailService.sendPasswordReset(user.email, {
          displayName: user.displayName || '',
          resetUrl,
          expirationTime: '1 hour',
          requestedFrom: ipAddress || 'Unknown',
        });
        logger.info(`Password reset email sent to ${user.email}`);
      } catch (emailError) {
        logger.error('Failed to send password reset email:', emailError);
        // Clean up the reset token if email fails
        await prisma.passwordReset.deleteMany({
          where: { token: resetToken },
        });
        throw new AuthError('Failed to send password reset email', 'EMAIL_SEND_FAILED', 500);
      }

      return { message: successMessage };
    } catch (error) {
      if (error instanceof AuthError) throw error;
      logger.error('Forgot password error:', error);
      throw new AuthError('Password reset request failed', 'PASSWORD_RESET_REQUEST_FAILED', 500);
    }
  }

  async resetPassword(data: ResetPasswordRequest, ipAddress?: string, userAgent?: string) {
    try {
      // Find the reset token
      const resetToken = await prisma.passwordReset.findUnique({
        where: { token: data.token },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              displayName: true,
              accountLockedUntil: true,
            },
          },
        },
      });

      if (!resetToken) {
        throw new AuthError(
          'Invalid or expired reset token',
          AuthErrorCodes.PASSWORD_RESET_TOKEN_INVALID,
          400
        );
      }

      // Check if token is expired
      if (resetToken.expiresAt < new Date()) {
        throw new AuthError(
          'Reset token has expired',
          AuthErrorCodes.PASSWORD_RESET_TOKEN_EXPIRED,
          400
        );
      }

      // Check if token was already used
      if (resetToken.usedAt) {
        throw new AuthError(
          'Reset token has already been used',
          AuthErrorCodes.PASSWORD_RESET_TOKEN_USED,
          400
        );
      }

      // Check if account is locked
      if (resetToken.user.accountLockedUntil && resetToken.user.accountLockedUntil > new Date()) {
        throw new AuthError(
          'Account is locked',
          AuthErrorCodes.ACCOUNT_LOCKED,
          401
        );
      }

      // Validate new password strength
      this.validatePasswordStrength(data.password);

      // Hash new password
      const passwordHash = await bcrypt.hash(data.password, this.bcryptRounds);

      // Update user password and mark token as used
      await prisma.$transaction([
        prisma.user.update({
          where: { id: resetToken.user.id },
          data: {
            passwordHash,
            failedLoginAttempts: 0,
            accountLockedUntil: null,
          },
        }),
        prisma.passwordReset.update({
          where: { id: resetToken.id },
          data: {
            usedAt: new Date(),
            ipAddress,
            userAgent,
          },
        }),
        // Revoke all existing refresh tokens for security
        prisma.refreshToken.updateMany({
          where: { 
            userId: resetToken.user.id,
            revokedAt: null,
          },
          data: {
            revokedAt: new Date(),
            revokedReason: 'password_reset',
          },
        }),
      ]);

      logger.info(`Password reset successful for user: ${resetToken.user.email}`);

      return {
        message: 'Password reset successful',
        user: {
          id: resetToken.user.id,
          email: resetToken.user.email,
          displayName: resetToken.user.displayName,
        },
      };
    } catch (error) {
      if (error instanceof AuthError) throw error;
      logger.error('Reset password error:', error);
      throw new AuthError('Password reset failed', 'PASSWORD_RESET_FAILED', 500);
    }
  }
}

let authServiceInstance: AuthService;

const getAuthService = () => {
  if (!authServiceInstance) {
    authServiceInstance = new AuthService();
  }
  return authServiceInstance;
};

export const authService = {
  register: (data: UserRegistration) => getAuthService().register(data),
  login: (data: UserLogin) => getAuthService().login(data),
  logout: (refreshToken: string) => getAuthService().logout(refreshToken),
  refresh: (refreshToken: string, deviceId?: string) => getAuthService().refresh(refreshToken, deviceId),
  verifyEmail: (data: EmailVerificationRequest) => getAuthService().verifyEmail(data),
  resendVerificationEmail: (data: ResendVerificationRequest) => getAuthService().resendVerificationEmail(data),
  forgotPassword: (data: ForgotPasswordRequest, ipAddress?: string, userAgent?: string) => 
    getAuthService().forgotPassword(data, ipAddress, userAgent),
  resetPassword: (data: ResetPasswordRequest, ipAddress?: string, userAgent?: string) => 
    getAuthService().resetPassword(data, ipAddress, userAgent),
};