/**
 * Location Sync Service
 *
 * Detects when twins are in the same vicinity and auto-creates twincidences.
 *
 * Story: 4-8 Location-Based Coincidence Detection
 */

import * as Location from 'expo-location';
import { twincidenceService } from './twincidenceService';
import { TwincidenceCategory } from '../types/twincidences';
import type { LocationCoincidenceData } from '../types/twincidences';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
  userId: string;
}

export class LocationSyncService {
  private static watchSubscription: Location.LocationSubscription | null = null;
  private static isTracking = false;
  private static lastLocation: LocationData | null = null;
  private static onCoincidenceCallback: ((data: LocationCoincidenceData) => void) | null = null;

  /**
   * Request location permissions
   */
  static async requestPermissions(): Promise<boolean> {
    try {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();

      if (foregroundStatus !== 'granted') {
        console.log('[LocationSync] Foreground location permission denied');
        return false;
      }

      console.log('[LocationSync] Location permissions granted');
      return true;
    } catch (error) {
      console.error('[LocationSync] Error requesting permissions:', error);
      return false;
    }
  }

  /**
   * Check if location permissions are granted
   */
  static async hasPermissions(): Promise<boolean> {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('[LocationSync] Error checking permissions:', error);
      return false;
    }
  }

  /**
   * Get current location
   */
  static async getCurrentLocation(userId: string): Promise<LocationData | null> {
    try {
      const hasPermission = await this.hasPermissions();
      if (!hasPermission) {
        console.log('[LocationSync] No location permission');
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const locationData: LocationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || 0,
        timestamp: new Date().toISOString(),
        userId,
      };

      this.lastLocation = locationData;
      return locationData;
    } catch (error) {
      console.error('[LocationSync] Error getting current location:', error);
      return null;
    }
  }

  /**
   * Start tracking location changes
   */
  static async startTracking(
    userId: string,
    onCoincidence?: (data: LocationCoincidenceData) => void
  ): Promise<boolean> {
    try {
      if (this.isTracking) {
        console.log('[LocationSync] Already tracking');
        return true;
      }

      const hasPermission = await this.hasPermissions();
      if (!hasPermission) {
        const granted = await this.requestPermissions();
        if (!granted) {
          return false;
        }
      }

      this.onCoincidenceCallback = onCoincidence || null;

      this.watchSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 60000, // Update every 60 seconds
          distanceInterval: 100, // Or when moved 100 meters
        },
        (location) => {
          const locationData: LocationData = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy || 0,
            timestamp: new Date().toISOString(),
            userId,
          };

          this.lastLocation = locationData;
          console.log('[LocationSync] Location updated:', locationData);
        }
      );

      this.isTracking = true;
      console.log('[LocationSync] Started tracking');
      return true;
    } catch (error) {
      console.error('[LocationSync] Error starting tracking:', error);
      return false;
    }
  }

  /**
   * Stop tracking location
   */
  static async stopTracking(): Promise<void> {
    if (this.watchSubscription) {
      this.watchSubscription.remove();
      this.watchSubscription = null;
    }
    this.isTracking = false;
    this.onCoincidenceCallback = null;
    console.log('[LocationSync] Stopped tracking');
  }

  /**
   * Calculate distance between two locations (in meters)
   * Uses Haversine formula
   */
  static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  /**
   * Check for location coincidence with twin
   */
  static async checkCoincidence(
    twin1Location: LocationData,
    twin2Location: LocationData,
    thresholdMeters: number = 500
  ): Promise<LocationCoincidenceData | null> {
    try {
      const distance = this.calculateDistance(
        twin1Location.latitude,
        twin1Location.longitude,
        twin2Location.latitude,
        twin2Location.longitude
      );

      console.log('[LocationSync] Distance between twins:', distance, 'meters');

      if (distance <= thresholdMeters) {
        const coincidenceData: LocationCoincidenceData = {
          twin1Location: {
            latitude: twin1Location.latitude,
            longitude: twin1Location.longitude,
            accuracy: twin1Location.accuracy,
          },
          twin2Location: {
            latitude: twin2Location.latitude,
            longitude: twin2Location.longitude,
            accuracy: twin2Location.accuracy,
          },
          distance,
          timestamp: new Date().toISOString(),
        };

        // Trigger callback if set
        if (this.onCoincidenceCallback) {
          this.onCoincidenceCallback(coincidenceData);
        }

        return coincidenceData;
      }

      return null;
    } catch (error) {
      console.error('[LocationSync] Error checking coincidence:', error);
      return null;
    }
  }

  /**
   * Auto-create twincidence from location coincidence
   */
  static async createLocationTwincidence(
    twinPairId: string,
    coincidenceData: LocationCoincidenceData
  ): Promise<string> {
    try {
      const distanceKm = (coincidenceData.distance / 1000).toFixed(2);
      const title = `Location Sync: ${distanceKm}km apart`;

      const confidenceScore = this.calculateConfidenceScore(
        coincidenceData.distance,
        coincidenceData.twin1Location.accuracy,
        coincidenceData.twin2Location.accuracy
      );

      const twincidenceId = await twincidenceService.createAutoTwincidence(
        twinPairId,
        TwincidenceCategory.LOCATION_COINCIDENCE,
        title,
        { locationData: coincidenceData },
        confidenceScore
      );

      console.log('[LocationSync] Created location twincidence:', twincidenceId);
      return twincidenceId;
    } catch (error) {
      console.error('[LocationSync] Error creating location twincidence:', error);
      throw error;
    }
  }

  /**
   * Calculate confidence score based on distance and accuracy
   */
  private static calculateConfidenceScore(
    distance: number,
    accuracy1: number,
    accuracy2: number
  ): number {
    // Closer distance = higher confidence
    let score = Math.max(0, 1 - distance / 1000); // Normalize to 0-1, lower at 1km

    // Better accuracy = higher confidence
    const avgAccuracy = (accuracy1 + accuracy2) / 2;
    const accuracyFactor = Math.max(0, 1 - avgAccuracy / 100); // Normalize to 0-1, lower at 100m

    // Combine factors
    score = (score * 0.7 + accuracyFactor * 0.3);

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Get last known location
   */
  static getLastLocation(): LocationData | null {
    return this.lastLocation;
  }

  /**
   * Check if currently tracking
   */
  static isCurrentlyTracking(): boolean {
    return this.isTracking;
  }

  /**
   * Format distance for display
   */
  static formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(2)}km`;
  }

  /**
   * Get location name from coordinates (reverse geocoding)
   */
  static async getLocationName(latitude: number, longitude: number): Promise<string> {
    try {
      const result = await Location.reverseGeocodeAsync({ latitude, longitude });

      if (result && result.length > 0) {
        const location = result[0];
        const parts = [
          location.name,
          location.city || location.subregion,
          location.region,
        ].filter(Boolean);

        return parts.join(', ');
      }

      return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    } catch (error) {
      console.error('[LocationSync] Error reverse geocoding:', error);
      return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    }
  }
}

export const locationSyncService = LocationSyncService;
