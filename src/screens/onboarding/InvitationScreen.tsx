/**
 * InvitationScreen - Story 1.3
 *
 * Generate and share twin invitation codes.
 * Users can copy the code or share via email/SMS.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Share,
} from 'react-native';
import { ImageBackground } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';

import { useTwinStore } from '../../state/twinStore';
import { useInvitationStore } from '../../state/invitationStore';
import { invitationService } from '../../services/invitationService';
import NeonButton from '../../components/common/NeonButton';
import CosmicCard from '../../components/common/CosmicCard';

export const InvitationScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { userProfile } = useTwinStore();
  const {
    currentInvitation,
    setCurrentInvitation,
    isLoading,
    setLoading,
    error,
    setError
  } = useInvitationStore();

  const [invitationCode, setInvitationCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Generate invitation code on mount
  useEffect(() => {
    generateInvitation();
  }, []);

  const generateInvitation = async () => {
    if (!userProfile) return;

    try {
      setLoading(true);
      setError(null);

      // Generate a simple 8-character code for MVP
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();

      // Create invitation using service
      const invitation = await invitationService.createInvitation(
        userProfile,
        { email: userProfile.name.toLowerCase().replace(/\s/g, '') + '@example.com' }
      );

      setCurrentInvitation(invitation);
      setInvitationCode(invitation.token.substring(0, 8)); // Use first 8 chars for display
    } catch (err) {
      console.error('Failed to generate invitation:', err);
      setError('Failed to generate invitation code');
    } finally {
      setLoading(false);
    }
  };

  const copyCode = async () => {
    if (!invitationCode) return;

    try {
      await Clipboard.setStringAsync(invitationCode);
      setCopied(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const shareInvitation = async () => {
    if (!invitationCode || !userProfile) return;

    try {
      const message = `Hey! I'm using Twinship to connect with my twin. Join me using this code: ${invitationCode}\n\nDownload Twinship and enter the code to pair with me!`;

      await Share.share({
        message,
        title: 'Join me on Twinship!',
      });

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (err) {
      console.error('Failed to share invitation:', err);
    }
  };

  const handleContinue = () => {
    // Navigate to tutorial or home
    navigation.navigate('Tutorial');
  };

  const handleSkip = () => {
    // Skip to home
    navigation.navigate('Main', { screen: 'Home' });
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <ImageBackground
      source={require('../../../assets/galaxybackground.png')}
      style={{ flex: 1 }}
      contentFit="cover"
      placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
      transition={200}
    >
      <SafeAreaView className="flex-1">
        <ScrollView
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between py-4">
            <Pressable
              onPress={() => navigation.goBack()}
              className="w-10 h-10 rounded-full bg-white/10 items-center justify-center"
            >
              <Ionicons name="chevron-back" size={20} color="white" />
            </Pressable>
            <Text className="text-white text-xl font-bold">Invite Your Twin</Text>
            <Pressable onPress={handleSkip}>
              <Text className="text-white/70">Skip</Text>
            </Pressable>
          </View>

          {/* Icon */}
          <View className="items-center py-8">
            <View className="w-24 h-24 rounded-full bg-white/10 items-center justify-center mb-4">
              <Ionicons name="share-social" size={48} color="#4A9FFF" />
            </View>
            <Text className="text-white text-3xl font-bold text-center mb-3">
              Share Your Code
            </Text>
            <Text className="text-white/70 text-base text-center px-4">
              Send this invitation code to your twin so they can pair with you on Twinship
            </Text>
          </View>

          {/* Invitation Code Card */}
          {isLoading ? (
            <View className="py-12 items-center">
              <ActivityIndicator size="large" color="#4A9FFF" />
              <Text className="text-white/70 mt-4">Generating invitation...</Text>
            </View>
          ) : error ? (
            <CosmicCard
              glowBorder
              accentColor="comet-coral"
              padding={24}
              testID="error-card"
            >
              <View className="items-center">
                <Ionicons name="alert-circle" size={48} color="#FF8B7B" />
                <Text className="text-white text-lg font-semibold mt-4 mb-2">
                  Generation Failed
                </Text>
                <Text className="text-white/70 text-center mb-4">
                  {error}
                </Text>
                <NeonButton
                  variant="primary"
                  accentColor="stellar-blue"
                  onPress={generateInvitation}
                  size="medium"
                >
                  Try Again
                </NeonButton>
              </View>
            </CosmicCard>
          ) : invitationCode ? (
            <>
              <CosmicCard
                glowBorder
                accentColor={userProfile?.accentColor || 'stellar-blue'}
                padding={32}
                testID="invitation-card"
              >
                <View className="items-center">
                  <Text className="text-white/70 text-sm mb-2">Your Invitation Code</Text>
                  <Text className="text-white text-5xl font-bold tracking-widest mb-6 font-mono">
                    {invitationCode}
                  </Text>

                  {/* Copy Button */}
                  <Pressable
                    onPress={copyCode}
                    className="flex-row items-center bg-white/10 px-6 py-3 rounded-full mb-4"
                  >
                    <Ionicons
                      name={copied ? "checkmark-circle" : "copy-outline"}
                      size={20}
                      color={copied ? "#4ECDC4" : "white"}
                    />
                    <Text className="text-white font-semibold ml-2">
                      {copied ? "Copied!" : "Copy Code"}
                    </Text>
                  </Pressable>

                  {/* Expiration Info */}
                  {currentInvitation && (
                    <View className="flex-row items-center bg-black/30 px-4 py-2 rounded-full mt-4">
                      <Ionicons name="time-outline" size={16} color="white" />
                      <Text className="text-white/70 text-xs ml-2">
                        Expires {formatDate(currentInvitation.expiresAt)}
                      </Text>
                    </View>
                  )}
                </View>
              </CosmicCard>

              {/* Share Options */}
              <View className="mt-6 space-y-4">
                <Text className="text-white text-lg font-semibold mb-2">
                  Share via
                </Text>

                <NeonButton
                  variant="secondary"
                  accentColor="stellar-blue"
                  onPress={shareInvitation}
                  size="large"
                  fullWidth
                  icon={<Ionicons name="share-social" size={20} color="#4A9FFF" />}
                  iconPosition="left"
                >
                  Share Invitation
                </NeonButton>

                {/* Info Box */}
                <CosmicCard
                  blur
                  padding={16}
                  testID="info-card"
                >
                  <View className="flex-row items-start">
                    <Ionicons name="information-circle" size={24} color="#4A9FFF" className="mr-3" />
                    <View className="flex-1">
                      <Text className="text-white text-sm font-medium mb-1">
                        How it works
                      </Text>
                      <Text className="text-white/70 text-xs leading-5">
                        Your twin needs to download Twinship and enter this code during setup. The code expires in 7 days for security.
                      </Text>
                    </View>
                  </View>
                </CosmicCard>
              </View>

              {/* Actions */}
              <View className="mt-8 space-y-3">
                <NeonButton
                  variant="primary"
                  accentColor={userProfile?.accentColor || 'celestial-indigo'}
                  onPress={handleContinue}
                  size="large"
                  fullWidth
                >
                  Continue to Tutorial
                </NeonButton>

                <Pressable onPress={handleSkip} className="py-3">
                  <Text className="text-white/70 text-center">
                    Skip Tutorial
                  </Text>
                </Pressable>
              </View>
            </>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
};
