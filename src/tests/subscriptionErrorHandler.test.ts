import { SubscriptionErrorHandler, SubscriptionErrorCode } from '../utils/subscriptionErrorHandler';

describe('SubscriptionErrorHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear retry counts
    SubscriptionErrorHandler.clearRetryCount('test-operation');
  });

  describe('Error Mapping', () => {
    test('should map user cancelled error correctly', () => {
      const error = { userCancelled: true };
      const mapped = SubscriptionErrorHandler.mapError(error);
      
      expect(mapped.code).toBe(SubscriptionErrorCode.USER_CANCELLED);
      expect(mapped.retryable).toBe(false);
      expect(mapped.userMessage).toBe('Purchase cancelled');
    });

    test('should map network error correctly', () => {
      const error = { code: 'NETWORK_ERROR' };
      const mapped = SubscriptionErrorHandler.mapError(error);
      
      expect(mapped.code).toBe(SubscriptionErrorCode.NETWORK_ERROR);
      expect(mapped.retryable).toBe(true);
      expect(mapped.userMessage).toContain('Connection error');
    });

    test('should map store unavailable error correctly', () => {
      const error = { message: 'The store is unavailable' };
      const mapped = SubscriptionErrorHandler.mapError(error);
      
      expect(mapped.code).toBe(SubscriptionErrorCode.STORE_UNAVAILABLE);
      expect(mapped.retryable).toBe(true);
      expect(mapped.userMessage).toContain('temporarily unavailable');
    });

    test('should map unknown error as retryable', () => {
      const error = { message: 'Something went wrong' };
      const mapped = SubscriptionErrorHandler.mapError(error);
      
      expect(mapped.code).toBe(SubscriptionErrorCode.UNKNOWN_ERROR);
      expect(mapped.retryable).toBe(true);
      expect(mapped.userMessage).toBe('Something went wrong. Please try again.');
    });
  });

  describe('Retry Logic', () => {
    test('should retry on retryable errors', async () => {
      let attempts = 0;
      const operation = jest.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 2) {
          throw { code: 'NETWORK_ERROR' };
        }
        return 'success';
      });

      const result = await SubscriptionErrorHandler.withRetry(
        operation,
        'test-operation'
      );

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    test('should not retry on non-retryable errors', async () => {
      const operation = jest.fn().mockRejectedValue({ userCancelled: true });

      await expect(
        SubscriptionErrorHandler.withRetry(operation, 'test-operation')
      ).rejects.toMatchObject({
        code: SubscriptionErrorCode.USER_CANCELLED,
        retryable: false
      });

      expect(operation).toHaveBeenCalledTimes(1);
    });

    test('should stop after max retries', async () => {
      const operation = jest.fn().mockRejectedValue({ code: 'NETWORK_ERROR' });

      await expect(
        SubscriptionErrorHandler.withRetry(operation, 'test-operation')
      ).rejects.toMatchObject({
        code: SubscriptionErrorCode.NETWORK_ERROR
      });

      // 1 initial attempt + 3 retries = 4 total
      expect(operation).toHaveBeenCalledTimes(4);
    });

    test('should use exponential backoff', async () => {
      jest.useFakeTimers();
      
      const operation = jest.fn().mockRejectedValue({ code: 'NETWORK_ERROR' });
      
      const retryPromise = SubscriptionErrorHandler.withRetry(
        operation,
        'test-operation'
      );

      // Initial attempt
      await Promise.resolve();
      expect(operation).toHaveBeenCalledTimes(1);

      // First retry after 1000ms
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
      expect(operation).toHaveBeenCalledTimes(2);

      // Second retry after 2000ms (exponential backoff)
      jest.advanceTimersByTime(2000);
      await Promise.resolve();
      expect(operation).toHaveBeenCalledTimes(3);

      // Third retry after 4000ms
      jest.advanceTimersByTime(4000);
      await Promise.resolve();
      expect(operation).toHaveBeenCalledTimes(4);

      jest.useRealTimers();
    });

    test('should call onRetry callback', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce({ code: 'NETWORK_ERROR' })
        .mockResolvedValueOnce('success');
      
      const onRetry = jest.fn();

      await SubscriptionErrorHandler.withRetry(
        operation,
        'test-operation',
        onRetry
      );

      expect(onRetry).toHaveBeenCalledWith(1);
    });
  });

  describe('Retry Count Management', () => {
    test('should track retry count', async () => {
      expect(SubscriptionErrorHandler.getRetryCount('test-operation')).toBe(0);

      const operation = jest.fn()
        .mockRejectedValueOnce({ code: 'NETWORK_ERROR' })
        .mockResolvedValueOnce('success');

      await SubscriptionErrorHandler.withRetry(operation, 'test-operation');

      // Count should be cleared after success
      expect(SubscriptionErrorHandler.getRetryCount('test-operation')).toBe(0);
    });

    test('should clear retry count on success', async () => {
      const operation = jest.fn().mockResolvedValue('success');

      await SubscriptionErrorHandler.withRetry(operation, 'test-operation');

      expect(SubscriptionErrorHandler.getRetryCount('test-operation')).toBe(0);
    });

    test('should clear retry count after max retries', async () => {
      const operation = jest.fn().mockRejectedValue({ code: 'NETWORK_ERROR' });

      try {
        await SubscriptionErrorHandler.withRetry(operation, 'test-operation');
      } catch {
        // Expected to throw
      }

      expect(SubscriptionErrorHandler.getRetryCount('test-operation')).toBe(0);
    });
  });

  describe('Error Tracking', () => {
    test('should provide user-friendly messages', () => {
      const error = {
        code: SubscriptionErrorCode.NETWORK_ERROR,
        message: 'Technical error message',
        userMessage: 'Connection error. Please check your internet and try again.',
        retryable: true
      };

      const userMessage = SubscriptionErrorHandler.getUserMessage(error);
      expect(userMessage).toBe('Connection error. Please check your internet and try again.');
    });

    test('should identify retryable errors', () => {
      const retryableError = {
        code: SubscriptionErrorCode.NETWORK_ERROR,
        message: '',
        userMessage: '',
        retryable: true
      };

      const nonRetryableError = {
        code: SubscriptionErrorCode.USER_CANCELLED,
        message: '',
        userMessage: '',
        retryable: false
      };

      expect(SubscriptionErrorHandler.isRetryable(retryableError)).toBe(true);
      expect(SubscriptionErrorHandler.isRetryable(nonRetryableError)).toBe(false);
    });
  });
});