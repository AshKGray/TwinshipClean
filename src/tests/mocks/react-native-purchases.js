// Mock for react-native-purchases
export const LOG_LEVEL = {
  VERBOSE: 'VERBOSE',
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR'
};

const mockPurchases = {
  configure: jest.fn().mockResolvedValue(true),
  setLogLevel: jest.fn(),
  getOfferings: jest.fn().mockResolvedValue({
    current: {
      availablePackages: [
        {
          product: {
            identifier: 'twinship_monthly',
            title: 'Monthly Subscription',
            description: 'Access all premium features',
            priceString: '$9.99',
            price: 9.99,
            currencyCode: 'USD'
          },
          packageType: 'MONTHLY'
        },
        {
          product: {
            identifier: 'twinship_yearly',
            title: 'Annual Subscription',
            description: 'Best value - save 50%!',
            priceString: '$59.99',
            price: 59.99,
            currencyCode: 'USD',
            introPrice: {
              priceString: '$19.99',
              price: 19.99
            }
          },
          packageType: 'ANNUAL'
        }
      ]
    }
  }),
  purchasePackage: jest.fn().mockResolvedValue({
    customerInfo: {
      entitlements: {
        active: {
          premium: {
            productIdentifier: 'twinship_monthly',
            expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          }
        }
      }
    },
    productIdentifier: 'twinship_monthly'
  }),
  restorePurchases: jest.fn().mockResolvedValue({
    entitlements: {
      active: {}
    }
  }),
  getCustomerInfo: jest.fn().mockResolvedValue({
    entitlements: {
      active: {}
    }
  })
};

export default mockPurchases;