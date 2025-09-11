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

export interface JWTPayload {
  sub: string;
  email: string;
  emailVerified: boolean;
  iat: number;
  exp: number;
  jti?: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  accessTokenExpires: Date;
  refreshTokenExpires: Date;
}

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

export interface EmailVerificationRequest {
  token: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface ResendVerificationRequest {
  email: string;
}

export const AuthErrorCodes = {
  INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  ACCOUNT_LOCKED: 'AUTH_ACCOUNT_LOCKED',
  EMAIL_NOT_VERIFIED: 'AUTH_EMAIL_NOT_VERIFIED',
  EMAIL_ALREADY_VERIFIED: 'AUTH_EMAIL_ALREADY_VERIFIED',
  VERIFICATION_TOKEN_INVALID: 'AUTH_VERIFICATION_TOKEN_INVALID',
  VERIFICATION_TOKEN_EXPIRED: 'AUTH_VERIFICATION_TOKEN_EXPIRED',
  PASSWORD_RESET_TOKEN_INVALID: 'AUTH_PASSWORD_RESET_TOKEN_INVALID',
  PASSWORD_RESET_TOKEN_EXPIRED: 'AUTH_PASSWORD_RESET_TOKEN_EXPIRED',
  PASSWORD_RESET_TOKEN_USED: 'AUTH_PASSWORD_RESET_TOKEN_USED',
  TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  TOKEN_INVALID: 'AUTH_TOKEN_INVALID',
  TOKEN_REVOKED: 'AUTH_TOKEN_REVOKED',
  REFRESH_TOKEN_EXPIRED: 'AUTH_REFRESH_TOKEN_EXPIRED',
  REFRESH_TOKEN_REVOKED: 'AUTH_REFRESH_TOKEN_REVOKED',
  USER_NOT_FOUND: 'AUTH_USER_NOT_FOUND',
  EMAIL_ALREADY_EXISTS: 'AUTH_EMAIL_ALREADY_EXISTS',
  WEAK_PASSWORD: 'AUTH_WEAK_PASSWORD',
  RATE_LIMIT_EXCEEDED: 'AUTH_RATE_LIMIT_EXCEEDED',
  UNAUTHORIZED: 'AUTH_UNAUTHORIZED',
  FORBIDDEN: 'AUTH_FORBIDDEN',
} as const;