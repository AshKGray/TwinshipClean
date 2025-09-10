import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SubscriptionInfo, SubscriptionPlan, SubscriptionStatus, PurchaseResult } from "../types/premium/subscription";
import { subscriptionService } from "../services/subscriptionService";

interface SubscriptionState {
  // Subscription status
  subscriptionInfo: SubscriptionInfo;
  isLoading: boolean;
  error: string | null;
  
  // Premium feature access
  hasAccessTo: (featureId: string) => boolean;
  
  // Purchase flow
  isPurchasing: boolean;
  isRestoring: boolean;
  
  // Analytics
  conversionEvents: Array<{
    event: string;
    timestamp: string;
    context?: Record<string, any>;
  }>;
  
  // Actions
  setSubscriptionInfo: (info: SubscriptionInfo) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setPurchasing: (purchasing: boolean) => void;
  setRestoring: (restoring: boolean) => void;
  
  // Premium feature checks
  canAccessFeature: (featureId: string) => boolean;
  getPremiumUpsellData: (featureId: string) => { shouldShow: boolean; message: string; };
  
  // Analytics tracking
  trackConversionEvent: (event: string, context?: Record<string, any>) => void;
  
  // RevenueCat integration functions
  purchaseProduct: (productId: string) => Promise<PurchaseResult>;
  restorePurchases: () => Promise<void>;
  syncSubscriptionStatus: () => Promise<void>;
  
  // Mock purchase functions (fallback)
  mockPurchase: (productId: string) => Promise<PurchaseResult>;
  mockRestore: () => Promise<void>;
  
  // Reset
  reset: () => void;
}

const initialSubscriptionInfo: SubscriptionInfo = {
  isActive: false,
  plan: "free",
  status: "inactive",
  willRenew: false,
};

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      // Initial state
      subscriptionInfo: initialSubscriptionInfo,
      isLoading: false,
      error: null,
      isPurchasing: false,
      isRestoring: false,
      conversionEvents: [],
      
      // Premium access checker
      hasAccessTo: (featureId: string): boolean => {
        const { subscriptionInfo } = get();
        if (!subscriptionInfo.isActive) return false;
        
        // All premium features require active subscription
        const premiumFeatures = [
          "detailed_results",
          "coaching_plans", 
          "pdf_export",
          "twin_analytics",
          "recommendations",
          "unlimited_assessments"
        ];
        
        return premiumFeatures.includes(featureId);
      },
      
      canAccessFeature: (featureId: string): boolean => {
        return get().hasAccessTo(featureId);
      },
      
      getPremiumUpsellData: (featureId: string) => {
        const hasAccess = get().hasAccessTo(featureId);
        
        if (hasAccess) {
          return { shouldShow: false, message: "" };
        }
        
        const upsellMessages: Record<string, string> = {
          detailed_results: "Unlock detailed personality insights and twin dynamics analysis",
          coaching_plans: "Get personalized weekly exercises to strengthen your bond",
          pdf_export: "Export professional reports to save and share",
          twin_analytics: "Access comprehensive progress tracking dashboard",
          recommendations: "Receive AI-powered insights based on your twin dynamics",
          unlimited_assessments: "Retake assessments monthly to track your progress"
        };
        
        return {
          shouldShow: true,
          message: upsellMessages[featureId] || "Upgrade to Premium for full access"
        };
      },
      
      // Actions
      setSubscriptionInfo: (info) => set({ subscriptionInfo: info }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      setPurchasing: (purchasing) => set({ isPurchasing: purchasing }),
      setRestoring: (restoring) => set({ isRestoring: restoring }),
      
      trackConversionEvent: (event, context) => {
        const newEvent = {
          event,
          timestamp: new Date().toISOString(),
          context
        };
        
        set((state) => ({
          conversionEvents: [newEvent, ...state.conversionEvents.slice(0, 99)] // Keep last 100
        }));
      },
      
      // RevenueCat integration methods
      purchaseProduct: async (productId: string): Promise<PurchaseResult> => {
        set({ isPurchasing: true, error: null });
        
        try {
          const result = await subscriptionService.validateAndPurchase(productId);
          
          if (result.success) {
            // Sync subscription status after successful purchase
            await get().syncSubscriptionStatus();
            get().trackConversionEvent("purchase_completed", { productId });
          }
          
          set({ isPurchasing: false });
          return result;
        } catch (error: any) {
          set({ isPurchasing: false, error: error.message || "Purchase failed" });
          return {
            success: false,
            error: error.message || "Purchase failed"
          };
        }
      },
      
      restorePurchases: async (): Promise<void> => {
        set({ isRestoring: true, error: null });
        
        try {
          const result = await subscriptionService.restorePurchases();
          
          if (result.success && result.restoredPurchases > 0) {
            // Sync subscription status after restore
            await get().syncSubscriptionStatus();
            get().trackConversionEvent("purchase_restored", { count: result.restoredPurchases });
          }
          
          set({ isRestoring: false });
        } catch (error: any) {
          set({ isRestoring: false, error: error.message || "Restore failed" });
        }
      },
      
      syncSubscriptionStatus: async (): Promise<void> => {
        try {
          const subscription = await subscriptionService.getCurrentSubscription();
          
          if (subscription) {
            const subscriptionInfo: SubscriptionInfo = {
              isActive: subscription.isActive,
              plan: subscription.productId?.includes("monthly") ? "monthly" : "yearly",
              status: subscription.isActive ? "active" : "inactive",
              purchaseDate: subscription.originalPurchaseDate,
              expiryDate: subscription.expiryDate,
              productId: subscription.productId,
              willRenew: subscription.willRenew,
              originalTransactionId: subscription.originalPurchaseDate
            };
            
            set({ subscriptionInfo });
          } else {
            set({ subscriptionInfo: initialSubscriptionInfo });
          }
        } catch (error) {
          console.error("Failed to sync subscription status:", error);
        }
      },
      
      // Mock functions for development (replace with RevenueCat implementation)
      mockPurchase: async (productId: string): Promise<PurchaseResult> => {
        set({ isPurchasing: true, error: null });
        
        try {
          // Simulate purchase delay
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Mock successful purchase
          const newSubscriptionInfo: SubscriptionInfo = {
            isActive: true,
            plan: productId.includes("monthly") ? "monthly" : "yearly",
            status: "active",
            purchaseDate: new Date().toISOString(),
            expiryDate: new Date(Date.now() + (productId.includes("monthly") ? 30 : 365) * 24 * 60 * 60 * 1000).toISOString(),
            productId,
            willRenew: true,
            originalTransactionId: `mock_${Date.now()}`
          };
          
          set({ subscriptionInfo: newSubscriptionInfo, isPurchasing: false });
          
          // Track conversion
          get().trackConversionEvent("purchase_completed", { productId });
          
          return {
            success: true,
            productId,
            transactionId: newSubscriptionInfo.originalTransactionId
          };
        } catch (error) {
          set({ isPurchasing: false, error: "Purchase failed" });
          return {
            success: false,
            error: "Purchase failed"
          };
        }
      },
      
      mockRestore: async () => {
        // Use real RevenueCat restore if available, otherwise fall back to mock
        if (process.env.EXPO_PUBLIC_REVENUECAT_API_KEY) {
          return get().restorePurchases();
        }
        
        set({ isRestoring: true, error: null });
        
        try {
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          // Mock restore - could restore previous purchase or do nothing
          const hasValidPurchase = Math.random() > 0.5; // 50% chance of finding purchase
          
          if (hasValidPurchase) {
            const restoredInfo: SubscriptionInfo = {
              isActive: true,
              plan: "yearly",
              status: "active",
              purchaseDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
              expiryDate: new Date(Date.now() + 335 * 24 * 60 * 60 * 1000).toISOString(),
              productId: "twinship_yearly",
              willRenew: true,
              originalTransactionId: `restored_${Date.now()}`
            };
            
            set({ subscriptionInfo: restoredInfo });
            get().trackConversionEvent("purchase_restored", { plan: "yearly" });
          }
          
          set({ isRestoring: false });
        } catch (error) {
          set({ isRestoring: false, error: "Restore failed" });
        }
      },
      
      reset: () => set({
        subscriptionInfo: initialSubscriptionInfo,
        isLoading: false,
        error: null,
        isPurchasing: false,
        isRestoring: false,
        conversionEvents: []
      })
    }),
    {
      name: "subscription-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        subscriptionInfo: state.subscriptionInfo,
        conversionEvents: state.conversionEvents
      }),
    }
  )
);