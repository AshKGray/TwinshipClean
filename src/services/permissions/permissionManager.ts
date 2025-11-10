import { Platform } from 'react-native';
import * as Location from 'expo-location';
import { TwincidenceCategory, TwincidencePermissions } from '../../types/twincidences';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PERMISSIONS_KEY = 'twincidence_permissions';
const LAST_CONSENT_CHECK_KEY = 'twincidence_last_consent_check';

export class PermissionManager {
  /**
   * Check if a specific device permission is granted
   */
  static async checkDevicePermission(permissionType: 'location' | 'health'): Promise<boolean> {
    try {
      switch (permissionType) {
        case 'location':
          const { status } = await Location.getForegroundPermissionsAsync();
          return status === 'granted';

        case 'health':
          // HealthKit permission check (iOS only)
          // This would require react-native-health or similar package
          // For now, return false as placeholder
          if (Platform.OS === 'ios') {
            // TODO: Implement HealthKit permission check
            // const isAuthorized = await AppleHealthKit.isAvailable();
            return false;
          }
          return false;

        default:
          return false;
      }
    } catch (error) {
      console.error(`[PermissionManager] Error checking ${permissionType} permission:`, error);
      return false;
    }
  }

  /**
   * Request device permission
   */
  static async requestDevicePermission(permissionType: 'location' | 'health'): Promise<boolean> {
    try {
      switch (permissionType) {
        case 'location':
          const { status } = await Location.requestForegroundPermissionsAsync();
          return status === 'granted';

        case 'health':
          // HealthKit permission request (iOS only)
          if (Platform.OS === 'ios') {
            // TODO: Implement HealthKit permission request
            // await AppleHealthKit.requestAuthorization(...)
            return false;
          }
          return false;

        default:
          return false;
      }
    } catch (error) {
      console.error(`[PermissionManager] Error requesting ${permissionType} permission:`, error);
      return false;
    }
  }

  /**
   * Request background location permission (for location coincidence detection)
   */
  static async requestBackgroundLocationPermission(): Promise<boolean> {
    try {
      // First check if foreground permission is granted
      const foreground = await this.checkDevicePermission('location');
      if (!foreground) {
        const granted = await this.requestDevicePermission('location');
        if (!granted) return false;
      }

      // Then request background permission
      const { status } = await Location.requestBackgroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('[PermissionManager] Error requesting background location:', error);
      return false;
    }
  }

  /**
   * Get required device permission for a twincidence category
   */
  static getRequiredDevicePermission(category: TwincidenceCategory): 'location' | 'health' | null {
    switch (category) {
      case TwincidenceCategory.BIOMETRIC_SYNC:
        return 'health';
      case TwincidenceCategory.LOCATION_COINCIDENCE:
        return 'location';
      default:
        return null;
    }
  }

  /**
   * Check if user has enabled a specific twincidence category
   */
  static async hasPermission(
    category: TwincidenceCategory,
    permissions: TwincidencePermissions
  ): Promise<boolean> {
    // Check app-level permission first
    const appPermissionGranted = (() => {
      switch (category) {
        case TwincidenceCategory.TWINTUITION_SYNC:
          return permissions.twintuitionSync;
        case TwincidenceCategory.BIOMETRIC_SYNC:
          return permissions.biometricTracking;
        case TwincidenceCategory.LOCATION_COINCIDENCE:
          return permissions.locationTracking;
        case TwincidenceCategory.DIGITAL_BEHAVIOR:
          return permissions.digitalBehavior;
        case TwincidenceCategory.COMMUNICATION_PATTERN:
          return permissions.communicationPattern;
        case TwincidenceCategory.ENVIRONMENTAL_MATCHING:
          return permissions.environmentalMatching;
        default:
          return true; // Manual entries don't need permissions
      }
    })();

    if (!appPermissionGranted) return false;

    // Check device-level permission if required
    const devicePermission = this.getRequiredDevicePermission(category);
    if (devicePermission) {
      return await this.checkDevicePermission(devicePermission);
    }

    return true;
  }

  /**
   * Check if annual consent review is needed
   */
  static async shouldShowConsentReview(permissions: TwincidencePermissions): Promise<boolean> {
    try {
      const lastCheck = await AsyncStorage.getItem(LAST_CONSENT_CHECK_KEY);
      const now = new Date();
      const nextReview = new Date(permissions.nextReviewDate);

      // Show if we've passed the next review date
      if (now >= nextReview) {
        return true;
      }

      // Also check if it's been more than 30 days since last check
      if (lastCheck) {
        const lastCheckDate = new Date(lastCheck);
        const daysSinceLastCheck = (now.getTime() - lastCheckDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceLastCheck >= 30) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('[PermissionManager] Error checking consent review:', error);
      return false;
    }
  }

  /**
   * Mark consent review as shown
   */
  static async markConsentReviewShown(): Promise<void> {
    try {
      await AsyncStorage.setItem(LAST_CONSENT_CHECK_KEY, new Date().toISOString());
    } catch (error) {
      console.error('[PermissionManager] Error marking consent review:', error);
    }
  }

  /**
   * Get permission status summary
   */
  static async getPermissionSummary(permissions: TwincidencePermissions): Promise<{
    totalEnabled: number;
    devicePermissionsNeeded: string[];
    batteryImpact: 'low' | 'medium' | 'high';
  }> {
    const enabledCategories = [
      { key: 'twintuitionSync', value: permissions.twintuitionSync },
      { key: 'biometricTracking', value: permissions.biometricTracking },
      { key: 'locationTracking', value: permissions.locationTracking },
      { key: 'digitalBehavior', value: permissions.digitalBehavior },
      { key: 'communicationPattern', value: permissions.communicationPattern },
      { key: 'environmentalMatching', value: permissions.environmentalMatching },
    ];

    const totalEnabled = enabledCategories.filter((cat) => cat.value).length;

    // Check which device permissions are needed but not granted
    const devicePermissionsNeeded: string[] = [];

    if (permissions.biometricTracking) {
      const hasHealth = await this.checkDevicePermission('health');
      if (!hasHealth) devicePermissionsNeeded.push('Health (HealthKit)');
    }

    if (permissions.locationTracking) {
      const hasLocation = await this.checkDevicePermission('location');
      if (!hasLocation) devicePermissionsNeeded.push('Location');
    }

    // Calculate battery impact
    let batteryScore = 0;
    if (permissions.biometricTracking) batteryScore += 2;
    if (permissions.locationTracking) batteryScore += 3;
    if (permissions.digitalBehavior) batteryScore += 1;
    if (permissions.environmentalMatching) batteryScore += 1;

    const batteryImpact = batteryScore <= 2 ? 'low' : batteryScore <= 4 ? 'medium' : 'high';

    return {
      totalEnabled,
      devicePermissionsNeeded,
      batteryImpact,
    };
  }

  /**
   * Create default permissions object
   */
  static createDefaultPermissions(): TwincidencePermissions {
    const now = new Date();
    const nextYear = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

    return {
      twintuitionSync: false,
      biometricTracking: false,
      locationTracking: false,
      digitalBehavior: false,
      communicationPattern: false,
      environmentalMatching: false,
      researchParticipation: false,
      lastUpdated: now.toISOString(),
      consentDate: now.toISOString(),
      nextReviewDate: nextYear.toISOString(),
    };
  }

  /**
   * Update next review date (extends by 1 year)
   */
  static extendConsentReviewDate(permissions: TwincidencePermissions): TwincidencePermissions {
    const now = new Date();
    const nextYear = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

    return {
      ...permissions,
      nextReviewDate: nextYear.toISOString(),
      lastUpdated: now.toISOString(),
    };
  }

  /**
   * Validate permissions object
   */
  static validatePermissions(permissions: any): permissions is TwincidencePermissions {
    return (
      typeof permissions === 'object' &&
      typeof permissions.twintuitionSync === 'boolean' &&
      typeof permissions.biometricTracking === 'boolean' &&
      typeof permissions.locationTracking === 'boolean' &&
      typeof permissions.digitalBehavior === 'boolean' &&
      typeof permissions.communicationPattern === 'boolean' &&
      typeof permissions.environmentalMatching === 'boolean' &&
      typeof permissions.researchParticipation === 'boolean' &&
      typeof permissions.lastUpdated === 'string' &&
      typeof permissions.consentDate === 'string' &&
      typeof permissions.nextReviewDate === 'string'
    );
  }
}
