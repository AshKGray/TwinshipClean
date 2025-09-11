/**
 * Authentication Types and Interfaces
 * 
 * These types define the structure for authentication-related
 * data throughout the application.
 */

// ============================================
// User Types
// ============================================

export interface User {
  id: string;
  email: string;
  emailNormalized: string;
  emailVerified: boolean;
  displayName?: string;
  avatarUrl?: string;
  lastLoginAt?: Date;
  lastLoginIp?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface UserWithPassword extends User {
  passwordHash: string;
  failedLoginAttempts: number;
  accountLockedUntil?: Date;
}

export interface UserRegistration {
  email: string;
  password: string;
  displayName?: string;
}

export interface UserLogin {
  email: string;
  password: string;
  deviceId?: string;
  rememberMe?: boolean;
}

// ============================================
// Token Types
// ============================================

export interface JWTPayload {
  sub: string; // User ID
  email: string;
  emailVerified: boolean;
  iat: number;
  exp: number;
  jti?: string; // JWT ID for tracking
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  accessTokenExpires: Date;
  refreshTokenExpires: Date;
}

export interface RefreshToken {
  id: string;
  token: string;
  userId: string;
  deviceId?: string;
  userAgent?: string;
  ipAddress?: string;
  expiresAt: Date;
  revokedAt?: Date;
  revokedReason?: 'logout' | 'security' | 'expired' | 'replaced';
  replacedByToken?: string;
  createdAt: Date;
  lastUsedAt?: Date;
}

// ============================================
// Password Reset Types
// ============================================

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
}

export interface PasswordReset {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  usedAt?: Date;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

// ============================================
// Email Verification Types
// ============================================

export interface EmailVerification {
  userId: string;
  token: string;
  expiresAt: Date;
}

// ============================================
// Login History Types
// ============================================

export type LoginEventType = 
  | 'login_success'
  | 'login_failed'
  | 'logout'
  | 'account_locked'
  | 'account_unlocked'
  | 'password_reset_requested'
  | 'password_reset_completed';

export type LoginFailureReason = 
  | 'invalid_password'
  | 'account_locked'
  | 'email_not_verified'
  | 'user_not_found'
  | 'token_expired'
  | 'token_invalid';

export interface LoginHistory {
  id: string;
  userId?: string;
  email: string;
  eventType: LoginEventType;
  success: boolean;
  failureReason?: LoginFailureReason;
  ipAddress?: string;
  userAgent?: string;
  deviceFingerprint?: string;
  createdAt: Date;
}

// ============================================
// Twin-Specific Auth Types
// ============================================

export type TwinPairStatus = 'pending' | 'active' | 'inactive';
export type TwinType = 'identical' | 'fraternal' | 'other';

export interface TwinPair {
  id: string;
  user1Id: string;
  user2Id: string;
  pairingCode?: string;
  pairedAt?: Date;
  pairType?: TwinType;
  status: TwinPairStatus;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// API Response Types
// ============================================

export interface AuthResponse {
  success: boolean;
  user?: User;
  tokens?: TokenPair;
  message?: string;
  errors?: string[];
}

export interface RegistrationResponse extends AuthResponse {
  requiresEmailVerification: boolean;
}

export interface LoginResponse extends AuthResponse {
  requiresTwoFactor?: boolean;
}

export interface RefreshResponse {
  success: boolean;
  tokens?: TokenPair;
  message?: string;
}

export interface PasswordResetResponse {
  success: boolean;
  message: string;
}

// ============================================
// Security Configuration Types
// ============================================

export interface AuthConfig {
  jwtSecret: string;
  jwtAccessTokenExpires: string;
  jwtRefreshTokenExpires: string;
  bcryptRounds: number;
  maxLoginAttempts: number;
  lockoutDuration: number; // in minutes
  emailVerificationRequired: boolean;
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireLowercase: boolean;
  passwordRequireNumbers: boolean;
  passwordRequireSpecialChars: boolean;
}

// ============================================
// Error Types
// ============================================

export class AuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 401
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export const AuthErrorCodes = {
  INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  ACCOUNT_LOCKED: 'AUTH_ACCOUNT_LOCKED',
  EMAIL_NOT_VERIFIED: 'AUTH_EMAIL_NOT_VERIFIED',
  TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  TOKEN_INVALID: 'AUTH_TOKEN_INVALID',
  REFRESH_TOKEN_EXPIRED: 'AUTH_REFRESH_TOKEN_EXPIRED',
  REFRESH_TOKEN_REVOKED: 'AUTH_REFRESH_TOKEN_REVOKED',
  USER_NOT_FOUND: 'AUTH_USER_NOT_FOUND',
  EMAIL_ALREADY_EXISTS: 'AUTH_EMAIL_ALREADY_EXISTS',
  WEAK_PASSWORD: 'AUTH_WEAK_PASSWORD',
  RATE_LIMIT_EXCEEDED: 'AUTH_RATE_LIMIT_EXCEEDED',
  UNAUTHORIZED: 'AUTH_UNAUTHORIZED',
  FORBIDDEN: 'AUTH_FORBIDDEN',
} as const;

// ============================================
// Middleware Types
// ============================================

export interface AuthenticatedRequest extends Request {
  user?: User;
  token?: JWTPayload;
  deviceId?: string;
}

// ============================================
// Validation Types
// ============================================

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
}

export interface EmailValidationResult {
  isValid: boolean;
  normalized: string;
  errors: string[];
}