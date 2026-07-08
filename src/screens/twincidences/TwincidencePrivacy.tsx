/**
 * Twincidence Privacy Screen
 *
 * Manage permissions for automated twincidence detection.
 *
 * Story: 4-6 Privacy and Permissions Management
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, ImageBackground, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTwincidencesStore } from '../../state/twincidencesStore';
import { locationSyncService } from '../../services/locationSyncService';
import { healthKitService } from '../../services/healthKitService';
import { TwincidenceCategory } from '../../types/twincidences';

interface TwincidencePrivacyProps {
  navigation: any;
}

export const TwincidencePrivacy: React.FC<TwincidencePrivacyProps> = ({ navigation }) => {
  const { permissions, updatePermissions } = useTwincidencesStore();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleTogglePermission = async (category: TwincidenceCategory, enabled: boolean) => {
    setIsUpdating(true);

    try {
      // Special handling for permissions that require system permissions
      if (category === TwincidenceCategory.LOCATION_COINCIDENCE && enabled) {
        const granted = await locationSyncService.requestPermissions();
        if (!granted) {
          Alert.alert(
            'Permission Required',
            'Location permission is required for this feature. Please enable it in Settings.',
            [{ text: 'OK' }]
          );
          setIsUpdating(false);
          return;
        }
      }

      if (category === TwincidenceCategory.BIOMETRIC_SYNC && enabled) {
        const status = healthKitService.getImplementationStatus();
        if (!status.available) {
          Alert.alert(
            'HealthKit Not Available',
            status.reason,
            [{ text: 'OK' }]
          );
          setIsUpdating(false);
          return;
        }

        const granted = await healthKitService.requestPermissions([]);
        if (!granted) {
          Alert.alert(
            'Permission Required',
            'HealthKit permission is required for this feature.',
            [{ text: 'OK' }]
          );
          setIsUpdating(false);
          return;
        }
      }

      // Update permission in store
      const permissionKey = getPermissionKey(category);
      if (permissionKey) {
        updatePermissions({ [permissionKey]: enabled });
      }

      // Show confirmation for first-time enable
      if (enabled) {
        Alert.alert(
          'Auto-Detection Enabled',
          `We'll now automatically detect ${getCategoryLabel(category).toLowerCase()} synchronicities.`,
          [{ text: 'Got it' }]
        );
      }
    } catch (error) {
      console.error('[TwincidencePrivacy] Error toggling permission:', error);
      Alert.alert('Error', 'Failed to update permission. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const permissionCategories = [
    {
      key: TwincidenceCategory.TWINTUITION_SYNC,
      icon: 'flash',
      color: '#FF1493',
      label: 'Twintuition Sync',
      description: 'Auto-detect when you and your twin send alerts at the same time',
      enabled: permissions.twintuitionSync,
      systemPermission: false,
    },
    {
      key: TwincidenceCategory.BIOMETRIC_SYNC,
      icon: 'heart-circle',
      color: '#FF4500',
      label: 'Biometric Sync',
      description: 'Compare heart rate, sleep, and activity data (requires HealthKit)',
      enabled: permissions.biometricTracking,
      systemPermission: true,
      available: healthKitService.isAvailable(),
    },
    {
      key: TwincidenceCategory.LOCATION_COINCIDENCE,
      icon: 'location',
      color: '#32CD32',
      label: 'Location Coincidences',
      description: 'Detect when you\'re in the same vicinity',
      enabled: permissions.locationTracking,
      systemPermission: true,
    },
    {
      key: TwincidenceCategory.DIGITAL_BEHAVIOR,
      icon: 'phone-portrait',
      color: '#1E90FF',
      label: 'Digital Behavior',
      description: 'Track app usage patterns and digital habits',
      enabled: permissions.digitalBehavior,
      systemPermission: false,
      comingSoon: true,
    },
    {
      key: TwincidenceCategory.COMMUNICATION_PATTERN,
      icon: 'chatbubbles',
      color: '#8A2BE2',
      label: 'Communication Patterns',
      description: 'Analyze messaging frequency and response times',
      enabled: permissions.communicationPattern,
      systemPermission: false,
      comingSoon: true,
    },
    {
      key: TwincidenceCategory.ENVIRONMENTAL_MATCHING,
      icon: 'partly-sunny',
      color: '#FFD700',
      label: 'Environmental Matching',
      description: 'Compare weather, temperature, and environmental conditions',
      enabled: permissions.environmentalMatching,
      systemPermission: false,
      comingSoon: true,
    },
  ];

  const getNextReviewDate = () => {
    const date = new Date(permissions.nextReviewDate);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  return (
    <ImageBackground source={require("../../../assets/galaxybackground.png")} style={{ flex: 1 }}>
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 py-4">
          <View className="flex-row items-center flex-1">
            <Pressable onPress={() => navigation.goBack()} className="mr-4">
              <Ionicons name="arrow-back" size={24} color="white" />
            </Pressable>
            <View>
              <Text className="text-white text-2xl font-bold">Privacy & Detection</Text>
              <Text className="text-white/70 text-sm">Manage auto-detection settings</Text>
            </View>
          </View>
        </View>

        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
          {/* Privacy Notice */}
          <LinearGradient
            colors={['rgba(138, 43, 226, 0.2)', 'rgba(138, 43, 226, 0.1)']}
            className="rounded-2xl p-4 mb-6 border border-purple-500/40"
          >
            <View className="flex-row items-start">
              <Ionicons name="shield-checkmark" size={24} color="#8A2BE2" />
              <View className="flex-1 ml-3">
                <Text className="text-white font-semibold text-base mb-1">
                  Your Privacy Matters
                </Text>
                <Text className="text-white/70 text-sm leading-5">
                  All detected data is encrypted and only shared between you and your twin. You can review and revoke permissions at any time.
                </Text>
              </View>
            </View>
          </LinearGradient>

          {/* Permission Categories */}
          <Text className="text-white font-semibold text-lg mb-4">Auto-Detection Categories</Text>

          {permissionCategories.map((category) => (
            <View key={category.key} className="mb-4">
              <LinearGradient
                colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
                className="rounded-2xl p-4 border border-white/20"
              >
                <View className="flex-row items-start">
                  <View
                    className="rounded-full p-3 mr-3"
                    style={{ backgroundColor: category.color + '30' }}
                  >
                    <Ionicons name={category.icon as any} size={24} color={category.color} />
                  </View>

                  <View className="flex-1 mr-3">
                    <View className="flex-row items-center mb-1">
                      <Text className="text-white font-semibold text-base flex-1">
                        {category.label}
                      </Text>
                      {category.systemPermission && (
                        <View className="bg-blue-500/30 rounded-full px-2 py-0.5 ml-2">
                          <Text className="text-blue-400 text-xs">System</Text>
                        </View>
                      )}
                      {category.comingSoon && (
                        <View className="bg-yellow-500/30 rounded-full px-2 py-0.5 ml-2">
                          <Text className="text-yellow-400 text-xs">Soon</Text>
                        </View>
                      )}
                    </View>
                    <Text className="text-white/60 text-sm leading-5">
                      {category.description}
                    </Text>
                    {category.available === false && (
                      <Text className="text-orange-400 text-xs mt-2">
                        Not available on this device
                      </Text>
                    )}
                  </View>

                  <Switch
                    value={category.enabled}
                    onValueChange={(value) => handleTogglePermission(category.key, value)}
                    disabled={isUpdating || category.comingSoon || category.available === false}
                    trackColor={{ false: '#767577', true: category.color + '60' }}
                    thumbColor={category.enabled ? category.color : '#f4f3f4'}
                  />
                </View>
              </LinearGradient>
            </View>
          ))}

          {/* Research Participation */}
          <View className="mb-6 mt-4">
            <Text className="text-white font-semibold text-lg mb-4">Research Contribution</Text>
            <LinearGradient
              colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
              className="rounded-2xl p-4 border border-white/20"
            >
              <View className="flex-row items-start">
                <View className="rounded-full p-3 mr-3 bg-purple-500/30">
                  <Ionicons name="school" size={24} color="#8A2BE2" />
                </View>

                <View className="flex-1 mr-3">
                  <Text className="text-white font-semibold text-base mb-1">
                    Contribute to Research
                  </Text>
                  <Text className="text-white/60 text-sm leading-5">
                    Share anonymized synchronicity data with twin studies researchers
                  </Text>
                </View>

                <Switch
                  value={permissions.researchParticipation}
                  onValueChange={(value) => updatePermissions({ researchParticipation: value })}
                  disabled={isUpdating}
                  trackColor={{ false: '#767577', true: '#8A2BE280' }}
                  thumbColor={permissions.researchParticipation ? '#8A2BE2' : '#f4f3f4'}
                />
              </View>
            </LinearGradient>
          </View>

          {/* Consent Information */}
          <LinearGradient
            colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']}
            className="rounded-2xl p-4 mb-6 border border-white/10"
          >
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-white/70 text-sm">Consent Last Updated</Text>
              <Text className="text-white text-sm">
                {new Date(permissions.lastUpdated).toLocaleDateString()}
              </Text>
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-white/70 text-sm">Next Review Date</Text>
              <Text className="text-white text-sm">{getNextReviewDate()}</Text>
            </View>
          </LinearGradient>

          {/* Data Management */}
          <View className="mb-6">
            <Text className="text-white font-semibold text-lg mb-4">Data Management</Text>

            <Pressable
              onPress={() => {
                Alert.alert(
                  'Export Data',
                  'Export all your twincidences and detection data?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Export',
                      onPress: () => {
                        // TODO: Implement export functionality (Story 4-12)
                        Alert.alert('Coming Soon', 'Export feature will be available soon!');
                      },
                    },
                  ]
                );
              }}
              className="mb-3"
            >
              <LinearGradient
                colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
                className="rounded-2xl p-4 flex-row items-center justify-between border border-white/20"
              >
                <View className="flex-row items-center">
                  <Ionicons name="download" size={20} color="#8A2BE2" />
                  <Text className="text-white font-medium ml-3">Export All Data</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.5)" />
              </LinearGradient>
            </Pressable>

            <Pressable
              onPress={() => {
                Alert.alert(
                  'Reset Permissions',
                  'This will reset all permissions to their default values. Continue?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Reset',
                      style: 'destructive',
                      onPress: () => {
                        updatePermissions({
                          twintuitionSync: false,
                          biometricTracking: false,
                          locationTracking: false,
                          digitalBehavior: false,
                          communicationPattern: false,
                          environmentalMatching: false,
                          researchParticipation: false,
                        });
                        Alert.alert('Permissions Reset', 'All permissions have been reset.');
                      },
                    },
                  ]
                );
              }}
            >
              <LinearGradient
                colors={['rgba(255,69,0,0.2)', 'rgba(255,69,0,0.1)']}
                className="rounded-2xl p-4 flex-row items-center justify-between border border-red-500/40"
              >
                <View className="flex-row items-center">
                  <Ionicons name="refresh" size={20} color="#FF4500" />
                  <Text className="text-white font-medium ml-3">Reset All Permissions</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.5)" />
              </LinearGradient>
            </Pressable>
          </View>

          <View className="pb-8" />
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
};

// Helper functions
const getPermissionKey = (category: TwincidenceCategory): string | null => {
  const map: Record<TwincidenceCategory, string> = {
    [TwincidenceCategory.TWINTUITION_SYNC]: 'twintuitionSync',
    [TwincidenceCategory.BIOMETRIC_SYNC]: 'biometricTracking',
    [TwincidenceCategory.LOCATION_COINCIDENCE]: 'locationTracking',
    [TwincidenceCategory.DIGITAL_BEHAVIOR]: 'digitalBehavior',
    [TwincidenceCategory.COMMUNICATION_PATTERN]: 'communicationPattern',
    [TwincidenceCategory.ENVIRONMENTAL_MATCHING]: 'environmentalMatching',
    [TwincidenceCategory.MANUAL_ESP]: '',
    [TwincidenceCategory.MANUAL_DREAM]: '',
    [TwincidenceCategory.MANUAL_TWIN_TALK]: '',
    [TwincidenceCategory.MANUAL_PARALLEL_EXPERIENCE]: '',
    [TwincidenceCategory.MANUAL_OTHER]: '',
  };

  return map[category] || null;
};

const getCategoryLabel = (category: TwincidenceCategory): string => {
  const map: Record<TwincidenceCategory, string> = {
    [TwincidenceCategory.TWINTUITION_SYNC]: 'Twintuition Sync',
    [TwincidenceCategory.BIOMETRIC_SYNC]: 'Biometric Sync',
    [TwincidenceCategory.LOCATION_COINCIDENCE]: 'Location Coincidence',
    [TwincidenceCategory.DIGITAL_BEHAVIOR]: 'Digital Behavior',
    [TwincidenceCategory.COMMUNICATION_PATTERN]: 'Communication Pattern',
    [TwincidenceCategory.ENVIRONMENTAL_MATCHING]: 'Environmental Matching',
    [TwincidenceCategory.MANUAL_ESP]: 'ESP',
    [TwincidenceCategory.MANUAL_DREAM]: 'Dream',
    [TwincidenceCategory.MANUAL_TWIN_TALK]: 'Twin-Talk',
    [TwincidenceCategory.MANUAL_PARALLEL_EXPERIENCE]: 'Parallel Experience',
    [TwincidenceCategory.MANUAL_OTHER]: 'Other',
  };

  return map[category] || 'Unknown';
};
