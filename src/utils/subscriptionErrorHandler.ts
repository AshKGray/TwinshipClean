import { telemetryService } from '../services/telemetryService';

export enum SubscriptionErrorCode {
  NETWORK_ERROR = 'NETWORK_ERROR',
  STORE_UNAVAILABLE = 'STORE_UNAVAILABLE',
  USER_CANCELLED = 'USER_CANCELLED',
  INVALID_PRODUCT = 'INVALID_PRODUCT',
  PURCHASE_IN_PROGRESS = 'PURCHASE_IN_PROGRESS',
  PURCHASE_NOT_ALLOWED = 'PURCHASE_NOT_ALLOWED',
  PRODUCT_NOT_AVAILABLE = 'PRODUCT_NOT_AVAILABLE',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  RESTORE_FAILED = 'RESTORE_FAILED',
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  INVALID_RECEIPT = 'INVALID_RECEIPT'
}

export interface SubscriptionError {
  code: SubscriptionErrorCode;
  message: string;
  userMessage: string;
  retryable: boolean;
  originalError?: any;
}

export class SubscriptionErrorHandler {
  private static readonly MAX_RETRIES = 3;
  private static readonly INITIAL_RETRY_DELAY = 1000; // 1 second
  private static retryCount = new Map<string, number>();

  /**
   * Map RevenueCat or platform errors to our error types
   */
  static mapError(error: any): SubscriptionError {
    // RevenueCat error codes
    if (error?.userCancelled) {
      return {
        code: SubscriptionErrorCode.USER_CANCELLED,
        message: 'User cancelled the purchase',
        userMessage: 'Purchase cancelled',
        retryable: false,
        originalError: error
      };
    }

    if (error?.code === 'NETWORK_ERROR' || error?.message?.includes('network')) {
      return {
        code: SubscriptionErrorCode.NETWORK_ERROR,
        message: 'Network connection failed',
        userMessage: 'Connection error. Please check your internet and try again.',
        retryable: true,
        originalError: error
      };
    }

    if (error?.code === 'STORE_PROBLEM' || error?.message?.includes('store') || error?.message?.includes('Store')) {
      return {
        code: SubscriptionErrorCode.STORE_UNAVAILABLE,
        message: 'App Store/Play Store unavailable',
        userMessage: 'The store is temporarily unavailable. Please try again later.',
        retryable: true,
        originalError: error
      };
    }

    if (error?.code === 'PRODUCT_NOT_AVAILABLE_FOR_PURCHASE') {
      return {
        code: SubscriptionErrorCode.PRODUCT_NOT_AVAILABLE,
        message: 'Product not available for purchase',
        userMessage: 'This subscription is not available in your region.',
        retryable: false,
        originalError: error
      };
    }

    if (error?.code === 'PURCHASE_NOT_ALLOWED') {
      return {
        code: SubscriptionErrorCode.PURCHASE_NOT_ALLOWED,
        message: 'Purchase not allowed',
        userMessage: 'Purchases are restricted on this device. Please check your settings.',
        retryable: false,
        originalError: error
      };
    }

    if (error?.code === 'PAYMENT_PENDING') {
      return {
        code: SubscriptionErrorCode.PAYMENT_PENDING,
        message: 'Payment is pending',
        userMessage: 'Your payment is being processed. Please check back later.',
        retryable: false,
        originalError: error
      };
    }

    if (error?.code === 'INVALID_RECEIPT') {
      return {
        code: SubscriptionErrorCode.INVALID_RECEIPT,
        message: 'Invalid purchase receipt',
        userMessage: 'Purchase verification failed. Please contact support.',
        retryable: false,
        originalError: error
      };
    }

    // Default unknown error
    return {
      code: SubscriptionErrorCode.UNKNOWN_ERROR,
      message: error?.message || 'An unknown error occurred',
      userMessage: 'Something went wrong. Please try again.',
      retryable: true,
      originalError: error
    };
  }

  /**
   * Execute a function with retry logic
   */
  static async withRetry<T>(
    operation: () => Promise<T>,
    operationId: string,
    onRetry?: (attempt: number) => void
  ): Promise<T> {
    const attempts = this.retryCount.get(operationId) || 0;
    
    try {
      const result = await operation();
      // Reset retry count on success
      this.retryCount.delete(operationId);
      return result;
    } catch (error) {
      const mappedError = this.mapError(error);
      
      if (!mappedError.retryable || attempts >= this.MAX_RETRIES) {
        // Max retries reached or error not retryable
        this.retryCount.delete(operationId);
        throw mappedError;
      }
      
      // Calculate delay with exponential backoff
      const delay = this.INITIAL_RETRY_DELAY * Math.pow(2, attempts);
      
      // Update retry count
      this.retryCount.set(operationId, attempts + 1);
      
      // Notify about retry
      if (onRetry) {
        onRetry(attempts + 1);
      }
      
      // Log retry attempt
      console.log(`Retrying operation ${operationId}, attempt ${attempts + 1}/${this.MAX_RETRIES} after ${delay}ms`);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Retry the operation
      return this.withRetry(operation, operationId, onRetry);
    }
  }

  /**
   * Track error for analytics
   */
  static trackError(error: SubscriptionError, context?: Record<string, any>) {
    // Track subscription errors as performance metrics
    telemetryService.trackPerformance(
      'subscription_error',
      1,
      {
        error_code: error.code,
        error_message: error.message,
        retryable: error.retryable,
        appVersion: '1.0.0',
        ...context
      }
    );
  }

  /**
   * Get user-friendly error message
   */
  static getUserMessage(error: SubscriptionError): string {
    return error.userMessage;
  }

  /**
   * Check if error is retryable
   */
  static isRetryable(error: SubscriptionError): boolean {
    return error.retryable;
  }

  /**
   * Clear retry count for an operation
   */
  static clearRetryCount(operationId: string) {
    this.retryCount.delete(operationId);
  }

  /**
   * Get retry count for an operation
   */
  static getRetryCount(operationId: string): number {
    return this.retryCount.get(operationId) || 0;
  }
}