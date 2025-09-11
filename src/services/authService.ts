import axios, { AxiosInstance, AxiosResponse } from 'axios';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Base URL configuration
const getBaseURL = () => {
  if (__DEV__) {
    // Development mode - use localhost with platform-specific IP
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:3000'; // Android emulator
    } else {
      return 'http://localhost:3000'; // iOS simulator/web
    }
  } else {
    // Production - should be set via environment variable
    return process.env.EXPO_PUBLIC_API_URL || 'https://api.twinship.app';
  }
};

// Types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  accessTokenExpires: Date;
  refreshTokenExpires: Date;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  emailVerified: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  displayName: string;
}

export interface LoginData {
  email: string;
  password: string;
  deviceId?: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
  requiresEmailVerification?: boolean;
}

export interface AuthError {
  code: string;
  message: string;
  statusCode: number;
}

// Secure storage keys
const TOKENS_KEY = 'auth_tokens';
const BIOMETRIC_CREDENTIALS_KEY = 'biometric_credentials';

class AuthService {
  private api: AxiosInstance;
  private currentTokens: AuthTokens | null = null;
  private refreshPromise: Promise<AuthTokens> | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: getBaseURL(),
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
    this.loadStoredTokens();
  }

  private setupInterceptors() {
    // Request interceptor to add auth headers
    this.api.interceptors.request.use(
      async (config) => {
        const tokens = await this.getTokens();
        if (tokens?.accessToken) {
          config.headers.Authorization = `Bearer ${tokens.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const newTokens = await this.refreshAccessToken();
            if (newTokens) {
              originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
              return this.api(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, redirect to login
            await this.logout();
            throw refreshError;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private async loadStoredTokens(): Promise<void> {
    try {
      const storedTokens = await SecureStore.getItemAsync(TOKENS_KEY);
      if (storedTokens) {
        const tokens = JSON.parse(storedTokens);
        // Convert date strings back to Date objects
        tokens.accessTokenExpires = new Date(tokens.accessTokenExpires);
        tokens.refreshTokenExpires = new Date(tokens.refreshTokenExpires);
        this.currentTokens = tokens;
      }
    } catch (error) {
      console.error('Failed to load stored tokens:', error);
    }
  }

  private async storeTokens(tokens: AuthTokens): Promise<void> {
    try {
      this.currentTokens = tokens;
      await SecureStore.setItemAsync(TOKENS_KEY, JSON.stringify(tokens));
    } catch (error) {
      console.error('Failed to store tokens:', error);
      throw new Error('Failed to store authentication tokens');
    }
  }

  private async clearTokens(): Promise<void> {
    try {
      this.currentTokens = null;
      await SecureStore.deleteItemAsync(TOKENS_KEY);
    } catch (error) {
      console.error('Failed to clear tokens:', error);
    }
  }

  async getTokens(): Promise<AuthTokens | null> {
    if (this.currentTokens) {
      // Check if access token is expired
      if (new Date() >= this.currentTokens.accessTokenExpires) {
        try {
          return await this.refreshAccessToken();
        } catch (error) {
          return null;
        }
      }
      return this.currentTokens;
    }
    return null;
  }

  async refreshAccessToken(): Promise<AuthTokens> {
    // Prevent multiple concurrent refresh attempts
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.performTokenRefresh();
    
    try {
      const tokens = await this.refreshPromise;
      return tokens;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async performTokenRefresh(): Promise<AuthTokens> {
    if (!this.currentTokens?.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const deviceId = await this.getDeviceId();
      const response: AxiosResponse<{ tokens: AuthTokens }> = await axios.post(
        `${getBaseURL()}/auth/refresh`,
        {
          refreshToken: this.currentTokens.refreshToken,
          deviceId,
        }
      );

      const newTokens = {
        ...response.data.tokens,
        accessTokenExpires: new Date(response.data.tokens.accessTokenExpires),
        refreshTokenExpires: new Date(response.data.tokens.refreshTokenExpires),
      };

      await this.storeTokens(newTokens);
      return newTokens;
    } catch (error) {
      await this.clearTokens();
      throw error;
    }
  }

  private async getDeviceId(): Promise<string> {
    try {
      let deviceId = await SecureStore.getItemAsync('device_id');
      if (!deviceId) {
        deviceId = Constants.sessionId || `${Platform.OS}_${Date.now()}`;
        await SecureStore.setItemAsync('device_id', deviceId);
      }
      return deviceId;
    } catch (error) {
      return `${Platform.OS}_${Date.now()}`;
    }
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/register', data);
      
      const authData = {
        ...response.data,
        tokens: {
          ...response.data.tokens,
          accessTokenExpires: new Date(response.data.tokens.accessTokenExpires),
          refreshTokenExpires: new Date(response.data.tokens.refreshTokenExpires),
        },
      };

      await this.storeTokens(authData.tokens);
      return authData;
    } catch (error: any) {
      if (error.response?.data) {
        throw error.response.data;
      }
      throw new Error('Registration failed');
    }
  }

  async login(data: LoginData): Promise<AuthResponse> {
    try {
      const deviceId = await this.getDeviceId();
      const loginData = { ...data, deviceId };
      
      const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/login', loginData);
      
      const authData = {
        ...response.data,
        tokens: {
          ...response.data.tokens,
          accessTokenExpires: new Date(response.data.tokens.accessTokenExpires),
          refreshTokenExpires: new Date(response.data.tokens.refreshTokenExpires),
        },
      };

      await this.storeTokens(authData.tokens);
      return authData;
    } catch (error: any) {
      if (error.response?.data) {
        throw error.response.data;
      }
      throw new Error('Login failed');
    }
  }

  async logout(): Promise<void> {
    try {
      if (this.currentTokens?.refreshToken) {
        await this.api.post('/auth/logout', {
          refreshToken: this.currentTokens.refreshToken,
        });
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      await this.clearTokens();
      await this.clearBiometricCredentials();
    }
  }

  async verifyEmail(token: string): Promise<{ user: User; message: string }> {
    try {
      const response = await this.api.post('/auth/verify-email', { token });
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw error.response.data;
      }
      throw new Error('Email verification failed');
    }
  }

  async resendVerificationEmail(email: string): Promise<{ message: string }> {
    try {
      const response = await this.api.post('/auth/resend-verification', { email });
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw error.response.data;
      }
      throw new Error('Failed to resend verification email');
    }
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    try {
      const response = await this.api.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw error.response.data;
      }
      throw new Error('Password reset request failed');
    }
  }

  async resetPassword(token: string, password: string): Promise<{ message: string; user: User }> {
    try {
      const response = await this.api.post('/auth/reset-password', { token, password });
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw error.response.data;
      }
      throw new Error('Password reset failed');
    }
  }

  // Biometric Authentication Methods
  async isBiometricAvailable(): Promise<boolean> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      return hasHardware && isEnrolled;
    } catch (error) {
      console.error('Biometric availability check failed:', error);
      return false;
    }
  }

  async getBiometricType(): Promise<LocalAuthentication.AuthenticationType[]> {
    try {
      return await LocalAuthentication.supportedAuthenticationTypesAsync();
    } catch (error) {
      console.error('Failed to get biometric types:', error);
      return [];
    }
  }

  async enableBiometricAuth(email: string, password: string): Promise<boolean> {
    try {
      const isAvailable = await this.isBiometricAvailable();
      if (!isAvailable) {
        throw new Error('Biometric authentication is not available on this device');
      }

      // First verify the credentials work
      await this.login({ email, password });

      // Store credentials securely for biometric access
      const credentials = { email, password };
      await SecureStore.setItemAsync(
        BIOMETRIC_CREDENTIALS_KEY,
        JSON.stringify(credentials),
        {
          requireAuthentication: true,
          authenticationPrompt: 'Authenticate to save your login credentials',
        }
      );

      return true;
    } catch (error) {
      console.error('Failed to enable biometric auth:', error);
      throw error;
    }
  }

  async loginWithBiometrics(): Promise<AuthResponse> {
    try {
      const isAvailable = await this.isBiometricAvailable();
      if (!isAvailable) {
        throw new Error('Biometric authentication is not available');
      }

      // Authenticate with biometrics to access stored credentials
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to log in',
        cancelLabel: 'Cancel',
        fallbackLabel: 'Use Password',
      });

      if (!result.success) {
        throw new Error('Biometric authentication failed');
      }

      // Get stored credentials
      const storedCredentials = await SecureStore.getItemAsync(BIOMETRIC_CREDENTIALS_KEY);
      if (!storedCredentials) {
        throw new Error('No biometric credentials found');
      }

      const { email, password } = JSON.parse(storedCredentials);
      return await this.login({ email, password });
    } catch (error) {
      console.error('Biometric login failed:', error);
      throw error;
    }
  }

  async clearBiometricCredentials(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(BIOMETRIC_CREDENTIALS_KEY);
    } catch (error) {
      console.error('Failed to clear biometric credentials:', error);
    }
  }

  async hasBiometricCredentials(): Promise<boolean> {
    try {
      const credentials = await SecureStore.getItemAsync(BIOMETRIC_CREDENTIALS_KEY);
      return !!credentials;
    } catch (error) {
      return false;
    }
  }

  // Check if user is currently authenticated
  async isAuthenticated(): Promise<boolean> {
    const tokens = await this.getTokens();
    return !!tokens?.accessToken;
  }

  // Get current user info from token
  async getCurrentUser(): Promise<User | null> {
    try {
      const tokens = await this.getTokens();
      if (!tokens) return null;

      const response = await this.api.get('/auth/me');
      return response.data.user;
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  }
}

// Export singleton instance
export const authService = new AuthService();

// Export helper functions for use in components
export const useAuthHelpers = () => {
  return {
    isAuthenticated: () => authService.isAuthenticated(),
    getCurrentUser: () => authService.getCurrentUser(),
    isBiometricAvailable: () => authService.isBiometricAvailable(),
    getBiometricType: () => authService.getBiometricType(),
    hasBiometricCredentials: () => authService.hasBiometricCredentials(),
  };
};