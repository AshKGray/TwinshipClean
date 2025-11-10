import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Switch, Alert, ImageBackground, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTwincidencesStore } from '../../state/twincidencesStore';

interface TwincidencePrivacyScreenProps {
  navigation: any;
}

const PERMISSION_INFO = {
  twintuitionSync: {
    title: 'Twintuition Sync Detection',
    description: 'Automatically log when you and your twin press the Twintuition button simultaneously (within 30 seconds).',
    batteryImpact: 'Minimal',
    icon: 'flash' as const,
    color: '#FF1493',
    requiresDevicePermission: false,
  },
  biometricTracking: {
    title: 'Biometric Synchronicity',
    description: 'Detect synchronized heart rate spikes, sleep patterns, and workout timing using HealthKit data.',
    batteryImpact: 'Low-Medium',
    icon: 'heart-circle' as const,
    color: '#FF4500',
    requiresDevicePermission: true,
    devicePermissionName: 'Health (HealthKit)',
  },
  locationTracking: {
    title: 'Location Coincidences',
    description: 'Discover when you and your twin visit the same places, either at the same time or separately. Only place categories are stored, not exact addresses.',
    batteryImpact: 'Medium',
    icon: 'location' as const,
    color: '#32CD32',
    requiresDevicePermission: true,
    devicePermissionName: 'Location (Always)',
  },
  digitalBehavior: {
    title: 'Digital Behavior Patterns',
    description: 'Detect similar app usage, music listening, or screen time patterns. All processing happens on-device.',
    batteryImpact: 'Low',
    icon: 'phone-portrait' as const,
    color: '#1E90FF',
    requiresDevicePermission: false,
  },
  communicationPattern: {
    title: 'Communication Patterns',
    description: 'Notice when you and your twin message each other at similar times or with similar frequency.',
    batteryImpact: 'Minimal',
    icon: 'chatbubbles' as const,
    color: '#8A2BE2',
    requiresDevicePermission: false,
  },
  environmentalMatching: {
    title: 'Environmental Matching',
    description: 'Detect when you are in similar environments (weather, noise level, lighting) at the same time.',
    batteryImpact: 'Low',
    icon: 'partly-sunny' as const,
    color: '#FFD700',
    requiresDevicePermission: false,
  },
  researchParticipation: {
    title: 'Research Data Sharing',
    description: 'Contribute anonymous synchronicity data to twin research studies. You can opt out anytime.',
    batteryImpact: 'None',
    icon: 'school' as const,
    color: '#20B2AA',
    requiresDevicePermission: false,
  },
};

export const TwincidencePrivacyScreen: React.FC<TwincidencePrivacyScreenProps> = ({ navigation }) => {
  const { permissions, updatePermissions } = useTwincidencesStore();
  const [localPermissions, setLocalPermissions] = useState(permissions);

  const handleTogglePermission = (key: keyof typeof permissions) => {
    // Skip toggle for these fields
    if (key === 'lastUpdated' || key === 'consentDate' || key === 'nextReviewDate') {
      return;
    }

    const permissionInfo = PERMISSION_INFO[key as keyof typeof PERMISSION_INFO];

    if (localPermissions[key] === false && permissionInfo?.requiresDevicePermission) {
      // Turning ON a permission that requires device-level permission
      Alert.alert(
        `Enable ${permissionInfo.devicePermissionName}?`,
        `To use ${permissionInfo.title}, you'll need to grant ${permissionInfo.devicePermissionName} permission in your iPhone Settings.`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Open Settings',
            onPress: () => {
              Linking.openSettings();
            },
          },
          {
            text: 'Enable Anyway',
            onPress: () => {
              const updated = { ...localPermissions, [key]: true };
              setLocalPermissions(updated);
              updatePermissions({ [key]: true });
            },
          },
        ]
      );
    } else {
      // Normal toggle
      const updated = { ...localPermissions, [key]: !localPermissions[key] };
      setLocalPermissions(updated);
      updatePermissions({ [key]: !localPermissions[key] });
    }
  };

  const handleResetConsent = () => {
    Alert.alert(
      'Reset All Permissions?',
      'This will turn off all automated detection features. You can re-enable them anytime.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            const resetPermissions = {
              twintuitionSync: false,
              biometricTracking: false,
              locationTracking: false,
              digitalBehavior: false,
              communicationPattern: false,
              environmentalMatching: false,
              researchParticipation: false,
            };
            setLocalPermissions({ ...localPermissions, ...resetPermissions });
            updatePermissions(resetPermissions);
          },
        },
      ]
    );
  };

  const PermissionToggle: React.FC<{ permissionKey: keyof typeof PERMISSION_INFO }> = ({ permissionKey }) => {
    const info = PERMISSION_INFO[permissionKey];
    const isEnabled = localPermissions[permissionKey];

    return (
      <Pressable
        onPress={() => handleTogglePermission(permissionKey)}
        className="mb-4"
      >
        <LinearGradient
          colors={isEnabled ? [info.color + '30', info.color + '10'] : ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
          className={`rounded-2xl p-4 border ${isEnabled ? 'border-opacity-60' : 'border-white/20'}`}
          style={{ borderColor: isEnabled ? info.color : undefined }}
        >
          <View className="flex-row items-start">
            <View
              className="rounded-full p-3 mr-4"
              style={{ backgroundColor: info.color + '20' }}
            >
              <Ionicons name={info.icon} size={24} color={info.color} />
            </View>

            <View className="flex-1">
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-white font-semibold text-base">{info.title}</Text>
                <Switch
                  value={isEnabled}
                  onValueChange={() => handleTogglePermission(permissionKey)}
                  trackColor={{ false: '#374151', true: info.color + '80' }}
                  thumbColor={isEnabled ? info.color : '#9CA3AF'}
                  ios_backgroundColor="#374151"
                />
              </View>

              <Text className="text-white/70 text-sm mb-2 leading-5">{info.description}</Text>

              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Ionicons name="battery-half" size={14} color="rgba(255,255,255,0.5)" />
                  <Text className="text-white/50 text-xs ml-1">Battery: {info.batteryImpact}</Text>
                </View>

                {info.requiresDevicePermission && (
                  <View className="flex-row items-center">
                    <Ionicons name="phone-portrait" size={14} color="rgba(255,255,255,0.5)" />
                    <Text className="text-white/50 text-xs ml-1">{info.devicePermissionName}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </LinearGradient>
      </Pressable>
    );
  };

  const InfoSection: React.FC = () => (
    <LinearGradient
      colors={['rgba(138, 43, 226, 0.2)', 'rgba(138, 43, 226, 0.05)']}
      className="rounded-2xl p-4 mb-6 border border-purple-500/30"
    >
      <View className="flex-row items-start">
        <Ionicons name="information-circle" size={24} color="#8A2BE2" />
        <View className="flex-1 ml-3">
          <Text className="text-white font-semibold text-base mb-2">Your Privacy is Protected</Text>
          <Text className="text-white/70 text-sm leading-5">
            • All automated detection happens on-device{'\n'}
            • Location data stores only place categories, not exact addresses{'\n'}
            • You control what data is shared{'\n'}
            • Annual consent review reminders{'\n'}
            • Data can be exported or deleted anytime
          </Text>
        </View>
      </View>
    </LinearGradient>
  );

  const ConsentReviewSection: React.FC = () => {
    const nextReview = new Date(permissions.nextReviewDate);
    const daysUntilReview = Math.ceil((nextReview.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    return (
      <LinearGradient
        colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
        className="rounded-2xl p-4 mb-6 border border-white/20"
      >
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-white font-semibold text-base">Annual Consent Review</Text>
          <View className="bg-purple-500/30 rounded-full px-3 py-1">
            <Text className="text-purple-400 text-xs font-semibold">{daysUntilReview} days</Text>
          </View>
        </View>
        <Text className="text-white/60 text-sm">
          You'll be reminded to review and update your privacy preferences in {daysUntilReview} days. This ensures you stay in control of your data.
        </Text>
      </LinearGradient>
    );
  };

  return (
    <ImageBackground source={require("../../../assets/galaxybackground.png")} style={{ flex: 1 }}>
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 py-4">
          <Pressable onPress={() => navigation.goBack()} className="mr-4">
            <Ionicons name="arrow-back" size={24} color="white" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-white text-2xl font-bold">Privacy & Permissions</Text>
            <Text className="text-white/70 text-sm">Control what gets detected automatically</Text>
          </View>
        </View>

        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
          {/* Info Section */}
          <InfoSection />

          {/* Consent Review */}
          <ConsentReviewSection />

          {/* Permission Toggles */}
          <Text className="text-white text-lg font-semibold mb-4">Detection Permissions</Text>

          <PermissionToggle permissionKey="twintuitionSync" />
          <PermissionToggle permissionKey="biometricTracking" />
          <PermissionToggle permissionKey="locationTracking" />
          <PermissionToggle permissionKey="digitalBehavior" />
          <PermissionToggle permissionKey="communicationPattern" />
          <PermissionToggle permissionKey="environmentalMatching" />

          <Text className="text-white text-lg font-semibold mb-4 mt-6">Research Participation</Text>
          <PermissionToggle permissionKey="researchParticipation" />

          {/* Reset Button */}
          <Pressable
            onPress={handleResetConsent}
            className="mt-6 mb-8 border border-red-500/50 rounded-xl p-4"
          >
            <View className="flex-row items-center justify-center">
              <Ionicons name="refresh" size={20} color="#FF4444" />
              <Text className="text-red-400 font-semibold ml-2">Reset All Permissions</Text>
            </View>
          </Pressable>

          {/* Last Updated */}
          <Text className="text-white/40 text-xs text-center mb-8">
            Last updated: {new Date(permissions.lastUpdated).toLocaleDateString()}
          </Text>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
};
