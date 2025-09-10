import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { useTwinStore } from '../state/twinStore';
import { useInvitationStore, useInvitationAnalytics } from '../state/invitationStore';
import { getNeonAccentColor, getNeonAccentColorWithOpacity } from '../utils/neonColors';

export const InvitationAnalyticsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { userProfile } = useTwinStore();
  const { refreshAnalytics, retryFailedInvitation } = useInvitationStore();
  const analytics = useInvitationAnalytics();
  
  const accentColor = userProfile?.accentColor || 'neon-purple';
  const themeColor = getNeonAccentColor(accentColor);
  const themeColorWithOpacity = getNeonAccentColorWithOpacity(accentColor, 0.3);

  useEffect(() => {
    refreshAnalytics();
  }, [refreshAnalytics]);

  const handleRetryInvitation = async (invitationId: string, method: 'email' | 'sms') => {
    try {
      const success = await retryFailedInvitation(invitationId, method);
      if (success) {
        Alert.alert('Success', 'Invitation resent successfully!');
        refreshAnalytics();
      } else {
        Alert.alert('Error', 'Failed to resend invitation.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to resend invitation.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return '#10b981'; // green
      case 'declined':
        return '#ef4444'; // red
      case 'expired':
        return '#6b7280'; // gray
      case 'sent':
        return '#3b82f6'; // blue
      case 'pending':
        return '#eab308'; // yellow
      default:
        return '#6b7280';
    }
  };

  const getStatusIcon = (status: string): keyof typeof Ionicons.glyphMap => {
    switch (status) {
      case 'accepted':
        return 'checkmark-circle';
      case 'declined':
        return 'close-circle';
      case 'expired':
        return 'time';
      case 'sent':
        return 'paper-plane';
      case 'pending':
        return 'hourglass';
      default:
        return 'help-circle';
    }
  };

  if (!analytics) {
    return (
      <ImageBackground source={require("../../assets/galaxybackground.png")} style={{ flex: 1 }}>
        <SafeAreaView className="flex-1">
          <View className="flex-1 justify-center items-center">
            <Text className="text-white text-lg">Loading analytics...</Text>
          </View>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground source={require("../../assets/galaxybackground.png")} style={{ flex: 1 }}>
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 py-4">
          <Pressable
            onPress={() => navigation.goBack()}
            className="w-10 h-10 rounded-full bg-white/10 items-center justify-center"
          >
            <Ionicons name="arrow-back" size={20} color="white" />
          </Pressable>
          
          <Text className="text-white text-lg font-semibold">
            Invitation Analytics
          </Text>
          
          <Pressable
            onPress={refreshAnalytics}
            className="w-10 h-10 rounded-full bg-white/10 items-center justify-center"
          >
            <Ionicons name="refresh" size={20} color="white" />
          </Pressable>
        </View>

        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
          {/* Overview Stats */}
          <View className="grid grid-cols-2 gap-4 mb-6">
            <View className="bg-white/10 rounded-2xl p-4">
              <Text className="text-white/70 text-sm font-medium">Total Sent</Text>
              <Text className="text-white text-2xl font-bold mt-1">
                {analytics.totalSent}
              </Text>
            </View>
            
            <View className="bg-white/10 rounded-2xl p-4">
              <Text className="text-white/70 text-sm font-medium">Accepted</Text>
              <Text className="text-green-400 text-2xl font-bold mt-1">
                {analytics.totalAccepted}
              </Text>
            </View>
            
            <View className="bg-white/10 rounded-2xl p-4">
              <Text className="text-white/70 text-sm font-medium">Success Rate</Text>
              <Text 
                className="text-2xl font-bold mt-1"
                style={{ color: themeColor }}
              >
                {analytics.acceptanceRate.toFixed(1)}%
              </Text>
            </View>
            
            <View className="bg-white/10 rounded-2xl p-4">
              <Text className="text-white/70 text-sm font-medium">Declined</Text>
              <Text className="text-red-400 text-2xl font-bold mt-1">
                {analytics.totalDeclined}
              </Text>
            </View>
          </View>

          {/* Average Response Time */}
          {analytics.averageResponseTime > 0 && (
            <View className="bg-white/10 rounded-2xl p-4 mb-6">
              <Text className="text-white/70 text-sm font-medium mb-2">
                Average Response Time
              </Text>
              <Text className="text-white text-lg font-semibold">
                {Math.round(analytics.averageResponseTime / (1000 * 60 * 60))} hours
              </Text>
            </View>
          )}

          {/* Recent Invitations */}
          <View className="bg-white/10 rounded-2xl p-4 mb-6">
            <Text className="text-white text-lg font-semibold mb-4">
              Recent Invitations
            </Text>
            
            {analytics.recentInvitations.length === 0 ? (
              <View className="py-8 items-center">
                <Ionicons name="mail-outline" size={48} color="rgba(255, 255, 255, 0.3)" />
                <Text className="text-white/50 text-center mt-4">
                  No recent invitations
                </Text>
              </View>
            ) : (
              <View className="space-y-3">
                {analytics.recentInvitations.map((invitation, index) => (
                  <View 
                    key={invitation.id} 
                    className="bg-white/5 rounded-xl p-4"
                  >
                    <View className="flex-row items-center justify-between mb-2">
                      <View className="flex-row items-center">
                        <Ionicons
                          name={getStatusIcon(invitation.status)}
                          size={20}
                          color={getStatusColor(invitation.status)}
                        />
                        <Text className="text-white font-medium ml-2">
                          {invitation.recipientEmail || invitation.recipientPhone || 'Unknown'}
                        </Text>
                      </View>
                      
                      <Text 
                        className="text-sm font-medium capitalize"
                        style={{ color: getStatusColor(invitation.status) }}
                      >
                        {invitation.status}
                      </Text>
                    </View>
                    
                    <Text className="text-white/60 text-sm mb-2">
                      Sent {formatDate(invitation.createdAt)}
                    </Text>
                    
                    {invitation.status === 'pending' && invitation.attemptCount < 3 && (
                      <View className="flex-row space-x-2 mt-3">
                        {invitation.recipientEmail && (
                          <Pressable
                            onPress={() => handleRetryInvitation(invitation.id, 'email')}
                            className="bg-blue-500/20 rounded-lg px-3 py-2 flex-row items-center"
                          >
                            <Ionicons name="mail" size={16} color="#3b82f6" />
                            <Text className="text-blue-400 text-xs font-medium ml-1">
                              Retry Email
                            </Text>
                          </Pressable>
                        )}
                        
                        {invitation.recipientPhone && (
                          <Pressable
                            onPress={() => handleRetryInvitation(invitation.id, 'sms')}
                            className="bg-green-500/20 rounded-lg px-3 py-2 flex-row items-center"
                          >
                            <Ionicons name="chatbubble" size={16} color="#10b981" />
                            <Text className="text-green-400 text-xs font-medium ml-1">
                              Retry SMS
                            </Text>
                          </Pressable>
                        )}
                      </View>
                    )}
                    
                    {invitation.attemptCount >= 3 && (
                      <View className="bg-red-500/20 rounded-lg p-2 mt-2">
                        <Text className="text-red-200 text-xs">
                          Maximum retry attempts reached
                        </Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Quick Actions */}
          <View className="bg-white/10 rounded-2xl p-4 mb-8">
            <Text className="text-white text-lg font-semibold mb-4">
              Quick Actions
            </Text>
            
            <View className="space-y-3">
              <Pressable
                onPress={() => navigation.navigate('SendInvitation' as never)}
                className="flex-row items-center p-3 rounded-xl"
                style={{ backgroundColor: themeColorWithOpacity }}
              >
                <Ionicons name="add-circle" size={24} color={themeColor} />
                <Text className="text-white font-medium ml-3">
                  Send New Invitation
                </Text>
              </Pressable>
              
              <Pressable
                onPress={() => navigation.navigate('ReceiveInvitation' as never)}
                className="bg-white/5 flex-row items-center p-3 rounded-xl"
              >
                <Ionicons name="key" size={24} color="rgba(255, 255, 255, 0.7)" />
                <Text className="text-white font-medium ml-3">
                  Enter Invitation Code
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
};