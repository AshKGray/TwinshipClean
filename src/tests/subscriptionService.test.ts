import { subscriptionService } from '../services/subscriptionService';

describe('Subscription Service Integration', () => {
  beforeEach(() => {
    // Reset any mocks
    jest.clearAllMocks();
  });

  test('should initialize subscription service', async () => {
    const result = await subscriptionService.initialize();
    expect(result).toBe(true);
  });

  test('should fetch products', async () => {
    await subscriptionService.initialize();
    const products = await subscriptionService.getProducts();
    
    // Should return mock products in development
    expect(products).toBeDefined();
    expect(Array.isArray(products)).toBe(true);
    
    if (products.length > 0) {
      expect(products[0]).toHaveProperty('id');
      expect(products[0]).toHaveProperty('title');
      expect(products[0]).toHaveProperty('price');
    }
  });

  test('should handle purchase flow', async () => {
    await subscriptionService.initialize();
    
    // Test with mock product ID
    const result = await subscriptionService.purchaseProduct('twinship_monthly');
    
    // In development, this will use mock data
    expect(result).toBeDefined();
    expect(result).toHaveProperty('success');
  });

  test('should handle restore purchases', async () => {
    await subscriptionService.initialize();
    
    const result = await subscriptionService.restorePurchases();
    
    expect(result).toBeDefined();
    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('restoredPurchases');
  });

  test('should check subscription status', async () => {
    await subscriptionService.initialize();
    
    const hasSubscription = await subscriptionService.hasActiveSubscription();
    expect(typeof hasSubscription).toBe('boolean');
  });

  test('should get current subscription info', async () => {
    await subscriptionService.initialize();
    
    const subscription = await subscriptionService.getCurrentSubscription();
    // Can be null or an object
    expect(subscription === null || typeof subscription === 'object').toBe(true);
  });
});