export type SubscriptionPlan = "free" | "monthly" | "yearly";

export type SubscriptionStatus = "active" | "expired" | "canceled" | "trial" | "inactive";

export interface SubscriptionProduct {
  id: string;
  title: string;
  description: string;
  price: string;
  priceAmountMicros?: number;
  priceAmount?: number; // For RevenueCat compatibility
  priceCurrencyCode?: string;
  currency?: string; // Alternative field name
  subscriptionPeriod?: "monthly" | "yearly"; // For mock data
  period?: string; // For RevenueCat data ("month" | "year")
  introductoryPrice?: {
    price: string;
    priceAmountMicros?: number;
    cycles: number;
    period: string;
  };
  
  // RevenueCat specific fields
  introPrice?: string;
  introPriceAmount?: number;
  introPeriod?: string;
}

export interface PremiumFeature {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "assessment" | "coaching" | "analytics" | "export" | "insights";
  isPremium: boolean;
  teaser?: {
    title: string;
    content: string;
    preview?: any;
  };
}

export interface SubscriptionInfo {
  isActive: boolean;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  expiryDate?: string;
  purchaseDate?: string;
  originalTransactionId?: string;
  productId?: string;
  willRenew: boolean;
  trialEndDate?: string;
  isInIntroductoryPeriod?: boolean;
  gracePeriodEndDate?: string;
}

export interface PurchaseResult {
  success: boolean;
  productId?: string;
  transactionId?: string;
  error?: string;
  userCancelled?: boolean;
}

export interface RestorePurchasesResult {
  success: boolean;
  restoredPurchases: number;
  error?: string;
}

export const PREMIUM_FEATURES: PremiumFeature[] = [
  {
    id: "detailed_results",
    name: "Detailed Assessment Results",
    description: "Comprehensive personality insights and twin dynamics analysis",
    icon: "analytics",
    category: "assessment",
    isPremium: true,
    teaser: {
      title: "Unlock Your Twin Bond Analysis",
      content: "See detailed scores across 12+ personality dimensions and twin-specific metrics"
    }
  },
  {
    id: "coaching_plans",
    name: "Personalized Coaching Plans", 
    description: "Weekly micro-experiments and relationship strategies",
    icon: "fitness",
    category: "coaching",
    isPremium: true,
    teaser: {
      title: "Get Your Custom Action Plan",
      content: "Receive personalized weekly exercises to strengthen your twin bond"
    }
  },
  {
    id: "pdf_export",
    name: "PDF Report Export",
    description: "Professional reports you can save and share",
    icon: "document-text",
    category: "export",
    isPremium: true
  },
  {
    id: "twin_analytics",
    name: "Advanced Twin Analytics",
    description: "Comprehensive dashboard with progress tracking",
    icon: "stats-chart",
    category: "analytics", 
    isPremium: true,
    teaser: {
      title: "Track Your Twin Journey",
      content: "See how your relationship evolves over time with detailed metrics"
    }
  },
  {
    id: "recommendations",
    name: "AI-Powered Recommendations",
    description: "Smart insights based on your twin dynamics",
    icon: "bulb",
    category: "insights",
    isPremium: true,
    teaser: {
      title: "Discover Personalized Insights",
      content: "AI analyzes your results to provide tailored relationship advice"
    }
  },
  {
    id: "unlimited_assessments",
    name: "Unlimited Retakes",
    description: "Track progress by retaking assessments monthly",
    icon: "refresh",
    category: "assessment",
    isPremium: true
  }
];

export const SUBSCRIPTION_PRODUCTS: SubscriptionProduct[] = [
  {
    id: "twinship_monthly",
    title: "Monthly Premium",
    description: "Full access to all premium features",
    price: "$9.99",
    priceAmountMicros: 9990000,
    priceCurrencyCode: "USD",
    subscriptionPeriod: "monthly"
  },
  {
    id: "twinship_yearly", 
    title: "Yearly Premium",
    description: "Save 40% with annual billing",
    price: "$59.99",
    priceAmountMicros: 59990000,
    priceCurrencyCode: "USD",
    subscriptionPeriod: "yearly",
    introductoryPrice: {
      price: "$19.99",
      priceAmountMicros: 19990000,
      cycles: 1,
      period: "3 months"
    }
  }
];