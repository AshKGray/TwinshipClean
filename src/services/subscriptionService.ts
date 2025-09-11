import { Platform } from "react-native";
// Safe import for react-native-purchases
let Purchases: any;
let PurchasesOfferings: any;
let CustomerInfo: any;
let PurchasesPackage: any;
let PurchasesStoreProduct: any;
let LOG_LEVEL: any;

// Dynamically import react-native-purchases to avoid NativeEventEmitter issues
try {
  const purchasesModule = require('react-native-purchases');
  Purchases = purchasesModule.default;
  PurchasesOfferings = purchasesModule.PurchasesOfferings;
  CustomerInfo = purchasesModule.CustomerInfo;
  PurchasesPackage = purchasesModule.PurchasesPackage;
  PurchasesStoreProduct = purchasesModule.PurchasesStoreProduct;
  LOG_LEVEL = purchasesModule.LOG_LEVEL;
} catch (error) {
  console.warn('react-native-purchases not available, using mock data only:', error);
}
import { SubscriptionProduct, PurchaseResult, RestorePurchasesResult, SUBSCRIPTION_PRODUCTS } from "../types/premium/subscription";
import { SubscriptionErrorHandler, SubscriptionErrorCode } from "../utils/subscriptionErrorHandler";

/**
 * Subscription Service
 * 
 * This service provides an abstraction layer for subscription management.
 * Uses RevenueCat SDK for production and falls back to mock data in development.
 */

class SubscriptionService {
  private isInitialized: boolean = false;
  private mockProducts: SubscriptionProduct[] = SUBSCRIPTION_PRODUCTS;
  private useMockData: boolean = __DEV__ && (!process.env.EXPO_PUBLIC_REVENUECAT_API_KEY || !Purchases);

  /**
   * Initialize the subscription service
   */
  async initialize(userId?: string): Promise<boolean> {
    try {
      console.log("Initializing subscription service...");
      
      if (this.useMockData) {
        console.log("Using mock subscription data in development");
        this.isInitialized = true;
        return true;
      }
      
      const apiKey = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY;
      if (!apiKey || !Purchases) {
        console.warn("RevenueCat not available (missing API key or SDK), using mock data");
        this.useMockData = true;
        this.isInitialized = true;
        return true;
      }
      
      // Configure RevenueCat
      if (__DEV__ && LOG_LEVEL) {
        Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      }
      
      // Initialize RevenueCat with the API key
      await Purchases.configure({
        apiKey,
        appUserID: userId, // Optional user ID for identifying the user
        observerMode: false, // Set to false to enable RevenueCat to handle purchases
        useAmazon: false
      });
      
      console.log("RevenueCat initialized successfully");
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error("Failed to initialize subscription service:", error);
      // Fall back to mock data on error
      this.useMockData = true;
      this.isInitialized = true;
      return false;
    }
  }

  /**
   * Get available products
   */
  async getProducts(): Promise<SubscriptionProduct[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      if (this.useMockData) {
        return this.mockProducts;
      }
      
      // Fetch offerings from RevenueCat
      const offerings = await Purchases.getOfferings();
      
      if (!offerings.current || !offerings.current.availablePackages) {
        console.warn("No offerings available from RevenueCat");
        return this.mockProducts;
      }
      
      // Convert RevenueCat packages to our SubscriptionProduct format
      return this.parseRevenueCatProducts(offerings);
    } catch (error) {
      console.error("Failed to get products:", error);
      return this.mockProducts;
    }
  }

  /**
   * Purchase a product
   */
  async purchaseProduct(productId: string): Promise<PurchaseResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      console.log(`Attempting to purchase: ${productId}`);
      
      if (this.useMockData) {
        // Mock implementation
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const product = this.mockProducts.find(p => p.id === productId);
        if (!product) {
          return { success: false, error: "Product not found" };
        }

        return {
          success: true,
          productId,
          transactionId: `mock_txn_${Date.now()}`
        };
      }
      
      // Use retry logic for the purchase operation
      const result = await SubscriptionErrorHandler.withRetry(
        async () => {
          // Get the current offerings
          const offerings = await Purchases.getOfferings();
          
          if (!offerings.current) {
            throw new Error("No offerings available");
          }
          
          // Find the package that matches our product ID
          const packageToPurchase = offerings.current.availablePackages.find(
            pkg => pkg.product.identifier === productId
          );
          
          if (!packageToPurchase) {
            throw { 
              code: 'PRODUCT_NOT_AVAILABLE_FOR_PURCHASE',
              message: "Product not found" 
            };
          }
          
          // Purchase the package
          return await Purchases.purchasePackage(packageToPurchase);
        },
        `purchase_${productId}`,
        (attempt) => {
          console.log(`Retrying purchase for ${productId}, attempt ${attempt}`);
        }
      );
      
      return this.parseRevenueCatPurchase(result);
    } catch (error: any) {
      const mappedError = SubscriptionErrorHandler.mapError(error);
      
      // Track the error
      SubscriptionErrorHandler.trackError(mappedError, { productId });
      
      console.error("Purchase failed:", mappedError);
      
      if (mappedError.code === SubscriptionErrorCode.USER_CANCELLED) {
        return { success: false, userCancelled: true };
      }
      
      return {
        success: false,
        error: SubscriptionErrorHandler.getUserMessage(mappedError)
      };
    }
  }

  /**
   * Restore purchases
   */
  async restorePurchases(): Promise<RestorePurchasesResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      console.log("Restoring purchases...");
      
      if (this.useMockData) {
        // Mock implementation
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const hasValidPurchase = Math.random() > 0.3; // 70% chance of finding purchase
        
        return {
          success: true,
          restoredPurchases: hasValidPurchase ? 1 : 0
        };
      }
      
      // Use retry logic for restore operation
      const customerInfo = await SubscriptionErrorHandler.withRetry(
        async () => await Purchases.restorePurchases(),
        'restore_purchases',
        (attempt) => {
          console.log(`Retrying restore purchases, attempt ${attempt}`);
        }
      );
      
      return this.parseRevenueCatRestore(customerInfo);
    } catch (error: any) {
      const mappedError = SubscriptionErrorHandler.mapError(error);
      
      // Track the error
      SubscriptionErrorHandler.trackError(mappedError, { operation: 'restore' });
      
      console.error("Restore failed:", mappedError);
      
      return {
        success: false,
        restoredPurchases: 0,
        error: SubscriptionErrorHandler.getUserMessage(mappedError)
      };
    }
  }

  /**
   * Get current subscription status
   */
  async getCurrentSubscription(): Promise<any> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      if (this.useMockData) {
        // Mock implementation
        return null; // No active subscription
      }
      
      // Get customer info from RevenueCat
      const customerInfo = await Purchases.getCustomerInfo();
      
      return this.parseRevenueCatCustomerInfo(customerInfo);
    } catch (error) {
      console.error("Failed to get current subscription:", error);
      return null;
    }
  }

  /**
   * Check if user has active subscription
   */
  async hasActiveSubscription(): Promise<boolean> {
    const subscription = await this.getCurrentSubscription();
    return subscription?.isActive || false;
  }

  /**
   * Get subscription expiry date
   */
  async getExpiryDate(): Promise<string | null> {
    const subscription = await this.getCurrentSubscription();
    return subscription?.expiryDate || null;
  }

  /**
   * Check if user is eligible to purchase
   */
  async checkPurchaseEligibility(productId: string): Promise<{ eligible: boolean; reason?: string }> {
    try {
      // Check if already subscribed
      const hasSubscription = await this.hasActiveSubscription();
      if (hasSubscription) {
        const currentSub = await this.getCurrentSubscription();
        if (currentSub?.productId === productId) {
          return { 
            eligible: false, 
            reason: "You already have this subscription" 
          };
        }
      }

      // Check if product exists
      const products = await this.getProducts();
      const productExists = products.some(p => p.id === productId);
      
      if (!productExists) {
        return { 
          eligible: false, 
          reason: "Product not available" 
        };
      }

      return { eligible: true };
    } catch (error) {
      console.error("Failed to check purchase eligibility:", error);
      return { 
        eligible: false, 
        reason: "Unable to verify eligibility" 
      };
    }
  }

  /**
   * Validate purchase to prevent double-charging
   */
  private isPurchaseInProgress = false;
  
  async validateAndPurchase(productId: string): Promise<PurchaseResult> {
    // Prevent multiple simultaneous purchases
    if (this.isPurchaseInProgress) {
      return {
        success: false,
        error: "A purchase is already in progress"
      };
    }

    try {
      this.isPurchaseInProgress = true;

      // Check eligibility first
      const eligibility = await this.checkPurchaseEligibility(productId);
      if (!eligibility.eligible) {
        return {
          success: false,
          error: eligibility.reason || "Not eligible for purchase"
        };
      }

      // Proceed with purchase
      return await this.purchaseProduct(productId);
    } finally {
      this.isPurchaseInProgress = false;
    }
  }

  /**
   * Cancel subscription (directs user to platform settings)
   */
  async cancelSubscription(): Promise<{ success: boolean; message: string }> {
    try {
      if (Platform.OS === 'ios') {
        // iOS users must cancel through Settings
        return {
          success: true,
          message: "To cancel your subscription, go to Settings > [Your Name] > Subscriptions"
        };
      } else {
        // Android users cancel through Play Store
        return {
          success: true,
          message: "To cancel your subscription, go to Play Store > Menu > Subscriptions"
        };
      }
    } catch (error) {
      console.error("Failed to provide cancellation instructions:", error);
      return {
        success: false,
        message: "Unable to provide cancellation instructions"
      };
    }
  }

  // Private helper methods for RevenueCat integration
  private parseRevenueCatProducts(offerings: PurchasesOfferings): SubscriptionProduct[] {
    const products: SubscriptionProduct[] = [];
    
    if (!offerings.current) {
      return products;
    }
    
    for (const pkg of offerings.current.availablePackages) {
      const product = pkg.product;
      
      // Map to our SubscriptionProduct format
      products.push({
        id: product.identifier,
        title: product.title || product.identifier,
        description: product.description || "",
        price: product.priceString,
        priceAmount: product.price,
        currency: product.currencyCode || "USD",
        period: this.getPeriodFromPackageType(pkg.packageType),
        introPrice: product.introPrice?.priceString,
        introPriceAmount: product.introPrice?.price,
        introPeriod: product.introPrice ? "1 month" : undefined
      });
    }
    
    return products;
  }

  private parseRevenueCatPurchase(result: { customerInfo: CustomerInfo; productIdentifier: string }): PurchaseResult {
    const { customerInfo, productIdentifier } = result;
    
    // Check if the purchase was successful by verifying entitlements
    const hasActiveEntitlement = Object.keys(customerInfo.entitlements.active).length > 0;
    
    if (hasActiveEntitlement) {
      return {
        success: true,
        productId: productIdentifier,
        transactionId: customerInfo.originalPurchaseDate || `txn_${Date.now()}`
      };
    }
    
    return {
      success: false,
      error: "Purchase verification failed"
    };
  }

  private parseRevenueCatRestore(customerInfo: CustomerInfo): RestorePurchasesResult {
    const activeEntitlements = Object.keys(customerInfo.entitlements.active).length;
    
    return {
      success: true,
      restoredPurchases: activeEntitlements
    };
  }

  private parseRevenueCatCustomerInfo(customerInfo: CustomerInfo): any {
    const activeEntitlements = customerInfo.entitlements.active;
    
    if (Object.keys(activeEntitlements).length === 0) {
      return null;
    }
    
    // Get the first active entitlement (assuming single subscription model)
    const entitlementKey = Object.keys(activeEntitlements)[0];
    const entitlement = activeEntitlements[entitlementKey];
    
    return {
      isActive: true,
      productId: entitlement.productIdentifier,
      expiryDate: entitlement.expirationDate,
      willRenew: !entitlement.unsubscribeDetectedAt,
      isSandbox: entitlement.isSandbox,
      originalPurchaseDate: entitlement.originalPurchaseDate
    };
  }
  
  private getPeriodFromPackageType(packageType: string): string {
    switch (packageType) {
      case "$rc_monthly":
      case "MONTHLY":
        return "month";
      case "$rc_annual":
      case "ANNUAL":
      case "YEARLY":
        return "year";
      case "$rc_weekly":
      case "WEEKLY":
        return "week";
      default:
        return "month";
    }
  }
}

export const subscriptionService = new SubscriptionService();