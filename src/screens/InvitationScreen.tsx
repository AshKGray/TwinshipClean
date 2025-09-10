import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  Pressable, 
  Alert, 
  TextInput, 
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  ImageBackground,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { useTwinStore, TwinType, ThemeColor } from "../state/twinStore";
import { 
  useInvitationStore, 
  useInvitationLoading, 
  useInvitationError, 
  useInvitationStep,
  useCurrentInvitation,
  usePendingInvitationToken,
} from "../state/invitationStore";
import { useDeepLinkHandler } from "../utils/deepLinking";
import { getNeonAccentColor, getNeonAccentColorWithOpacity } from "../utils/neonColors";
import { Invitation } from "../services/invitationService";

type InvitationMode = 'send' | 'receive' | 'manual';

interface InvitationScreenProps {
  mode?: InvitationMode;
  invitationData?: {
    fromName: string;
    fromEmail?: string;
    fromPhone?: string;
    twinType: TwinType;
    accentColor: ThemeColor;
  };
  onComplete?: () => void;
}

export const InvitationScreen: React.FC<InvitationScreenProps> = ({
  mode = 'send',
  invitationData,
  onComplete,
}) => {
  const navigation = useNavigation();
  const { userProfile, setTwinProfile, setPaired } = useTwinStore();
  const {
    invitationStep,
    selectedMethod,
    recipientContact,
    currentInvitation,
    setInvitationStep,
    setSelectedMethod,
    setRecipientContact,
    createAndSendInvitation,
    processIncomingInvitation,
    acceptInvitation,
    declineInvitation,
    clearError,
    reset,
  } = useInvitationStore();
  
  const isLoading = useInvitationLoading();
  const error = useInvitationError();
  const pendingToken = usePendingInvitationToken();
  const { processPendingInvitation, clearPendingData } = useDeepLinkHandler();
  
  const [localState, setLocalState] = useState({
    manualToken: '',
    showTokenInput: false,
    isProcessing: false,
  });
  
  const [animatedValue] = useState(new Animated.Value(0));
  
  const accentColor = userProfile?.accentColor || 'neon-purple';
  const themeColor = getNeonAccentColor(accentColor);
  const themeColorWithOpacity = getNeonAccentColorWithOpacity(accentColor, 0.3);

  // Handle deep link invitation on component mount
  useEffect(() => {
    const handlePendingInvitation = async () => {
      if (pendingToken && mode === 'receive') {
        try {
          const result = await processPendingInvitation();
          if (result.success && result.invitation) {
            setLocalState(prev => ({ ...prev, isProcessing: false }));
            // Show invitation details for user to accept/decline
          } else {
            Alert.alert('Invalid Invitation', result.error || 'This invitation link is not valid.');
          }
        } catch (error) {
          console.error('Error processing pending invitation:', error);
        }
      }
    };
    
    handlePendingInvitation();
  }, [pendingToken, mode, processPendingInvitation]);

  // Animate entrance
  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  // Clear error when component unmounts
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  const handleSendInvitation = async () => {
    if (!userProfile) {
      Alert.alert('Error', 'User profile not found');
      return;
    }

    if (!recipientContact.email && !recipientContact.phone) {
      Alert.alert('Missing Contact', 'Please provide either an email address or phone number.');
      return;
    }

    if (!selectedMethod) {
      Alert.alert('Select Method', 'Please select how you want to send the invitation.');
      return;
    }

    try {
      const success = await createAndSendInvitation(
        userProfile,
        recipientContact,
        selectedMethod
      );

      if (success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // Auto-navigate back after success
        setTimeout(() => {
          onComplete?.();
          navigation.goBack();
        }, 3000);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (error) {
      console.error('Send invitation error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleAcceptInvitation = async (invitation: Invitation) => {
    setLocalState(prev => ({ ...prev, isProcessing: true }));
    
    try {
      const success = await acceptInvitation(invitation.token);
      
      if (success) {
        // Create twin profile from invitation data
        const twinProfile = {
          id: `twin_${Date.now()}`,
          name: invitation.inviterName,
          age: 0,
          gender: '',
          twinType: invitation.twinType,
          birthDate: new Date().toISOString(),
          accentColor: invitation.accentColor,
          isConnected: true,
        };

        setTwinProfile(twinProfile);
        setPaired(true);
        
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        Alert.alert(
          'Connection Established! 🌟',
          `You are now connected with ${invitation.inviterName}! Your twin journey begins now.`,
          [
            {
              text: 'Start Chatting',
              onPress: () => {
                onComplete?.();
                navigation.navigate('Main' as never);
              },
            },
          ]
        );
        
        clearPendingData();
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Error', error || 'Failed to accept invitation. Please try again.');
      }
    } catch (error) {
      console.error('Accept invitation error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to accept invitation. Please try again.');
    } finally {
      setLocalState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  const handleDeclineInvitation = async (invitation: Invitation) => {
    Alert.alert(
      'Decline Invitation',
      'Are you sure you want to decline this twin invitation? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            try {
              await declineInvitation(invitation.token);
              clearPendingData();
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to decline invitation.');
            }
          },
        },
      ]
    );
  };

  const handleManualTokenEntry = async () => {
    if (!localState.manualToken.trim()) {
      Alert.alert('Enter Code', 'Please enter the invitation code.');
      return;
    }

    setLocalState(prev => ({ ...prev, isProcessing: true }));

    try {
      const result = await processIncomingInvitation(localState.manualToken.trim().toUpperCase());
      
      if (result.success && result.invitation) {
        // Show invitation for acceptance
        setLocalState(prev => ({ ...prev, showTokenInput: false }));
      } else {
        Alert.alert('Invalid Code', result.error || 'The invitation code is not valid.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to process invitation code.');
    } finally {
      setLocalState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  const renderContactForm = () => (
    <Animated.View
      style={{
        opacity: animatedValue,
        transform: [{
          translateY: animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [50, 0],
          }),
        }],
      }}
      className="space-y-6"
    >
      <View className="bg-white/10 rounded-2xl p-6">
        <Text className="text-white text-xl font-bold mb-4">Invite Your Twin 💫</Text>
        
        <View className="space-y-4">
          <View>
            <Text className="text-white/80 text-sm font-medium mb-2">Twin's Name (Optional)</Text>
            <TextInput
              value={recipientContact.name || ''}
              onChangeText={(name) => setRecipientContact({ name })}
              placeholder="Your twin's name"
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              className="bg-white/10 rounded-xl px-4 py-3 text-white text-base"
            />
          </View>
          
          <View>
            <Text className="text-white/80 text-sm font-medium mb-2">Email Address</Text>
            <TextInput
              value={recipientContact.email || ''}
              onChangeText={(email) => setRecipientContact({ email })}
              placeholder="twin@example.com"
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              className="bg-white/10 rounded-xl px-4 py-3 text-white text-base"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          
          <Text className="text-white/60 text-center text-sm">— or —</Text>
          
          <View>
            <Text className="text-white/80 text-sm font-medium mb-2">Phone Number</Text>
            <TextInput
              value={recipientContact.phone || ''}
              onChangeText={(phone) => setRecipientContact({ phone })}
              placeholder="+1 (555) 123-4567"
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              className="bg-white/10 rounded-xl px-4 py-3 text-white text-base"
              keyboardType="phone-pad"
            />
          </View>
        </View>
      </View>
      
      <View className="bg-white/10 rounded-2xl p-6">
        <Text className="text-white text-lg font-semibold mb-4">How would you like to send?</Text>
        
        <View className="space-y-3">
          {recipientContact.email && (
            <Pressable
              onPress={() => setSelectedMethod('email')}
              className={`flex-row items-center p-4 rounded-xl ${
                selectedMethod === 'email' ? 'bg-white/20' : 'bg-white/5'
              }`}
            >
              <Ionicons 
                name={selectedMethod === 'email' ? 'radio-button-on' : 'radio-button-off'} 
                size={24} 
                color={selectedMethod === 'email' ? themeColor : 'rgba(255, 255, 255, 0.7)'} 
              />
              <Ionicons name="mail" size={20} color="white" className="ml-3" />
              <Text className="text-white text-base font-medium ml-3">Email Invitation</Text>
            </Pressable>
          )}
          
          {recipientContact.phone && (
            <Pressable
              onPress={() => setSelectedMethod('sms')}
              className={`flex-row items-center p-4 rounded-xl ${
                selectedMethod === 'sms' ? 'bg-white/20' : 'bg-white/5'
              }`}
            >
              <Ionicons 
                name={selectedMethod === 'sms' ? 'radio-button-on' : 'radio-button-off'} 
                size={24} 
                color={selectedMethod === 'sms' ? themeColor : 'rgba(255, 255, 255, 0.7)'} 
              />
              <Ionicons name="chatbubble" size={20} color="white" className="ml-3" />
              <Text className="text-white text-base font-medium ml-3">SMS Invitation</Text>
            </Pressable>
          )}
          
          {recipientContact.email && recipientContact.phone && (
            <Pressable
              onPress={() => setSelectedMethod('both')}
              className={`flex-row items-center p-4 rounded-xl ${
                selectedMethod === 'both' ? 'bg-white/20' : 'bg-white/5'
              }`}
            >
              <Ionicons 
                name={selectedMethod === 'both' ? 'radio-button-on' : 'radio-button-off'} 
                size={24} 
                color={selectedMethod === 'both' ? themeColor : 'rgba(255, 255, 255, 0.7)'} 
              />
              <Ionicons name="send" size={20} color="white" className="ml-3" />
              <Text className="text-white text-base font-medium ml-3">Both Email & SMS</Text>
            </Pressable>
          )}
        </View>
      </View>
      
      {error && (
        <View className="bg-red-500/20 border border-red-500/50 rounded-xl p-4">
          <Text className="text-red-200 text-center">{error}</Text>
        </View>
      )}
      
      <Pressable
        onPress={handleSendInvitation}
        disabled={isLoading || !selectedMethod}
        className={`rounded-xl py-4 items-center ${
          isLoading || !selectedMethod ? 'bg-white/10' : 'bg-white/20'
        }`}
        style={{ backgroundColor: !isLoading && selectedMethod ? themeColorWithOpacity : undefined }}
      >
        {isLoading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white text-lg font-semibold">
            Send Invitation 🚀
          </Text>
        )}
      </Pressable>
    </Animated.View>
  );

  const renderInvitationStatus = () => {
    const getStepIcon = () => {
      switch (invitationStep) {
        case 'sending':
          return <ActivityIndicator color={themeColor} size="large" />;
        case 'sent':
          return <Ionicons name="checkmark-circle" size={64} color={themeColor} />;
        case 'success':
          return <Ionicons name="heart" size={64} color={themeColor} />;
        case 'error':
          return <Ionicons name="alert-circle" size={64} color="#ff4444" />;
        default:
          return <Ionicons name="send" size={64} color={themeColor} />;
      }
    };
    
    const getStepMessage = () => {
      switch (invitationStep) {
        case 'sending':
          return 'Sending your twin invitation...';
        case 'sent':
          return 'Invitation sent successfully!';
        case 'success':
          return 'Your invitation is on its way! 🌟';
        case 'error':
          return 'There was an issue sending the invitation.';
        default:
          return 'Preparing to send...';
      }
    };
    
    return (
      <Animated.View
        style={{
          opacity: animatedValue,
          transform: [{
            scale: animatedValue.interpolate({
              inputRange: [0, 1],
              outputRange: [0.8, 1],
            }),
          }],
        }}
        className="flex-1 justify-center items-center px-8"
      >
        <View className="items-center mb-8">
          {getStepIcon()}
          <Text className="text-white text-2xl font-bold text-center mt-6">
            {getStepMessage()}
          </Text>
          
          {invitationStep === 'sent' && (
            <Text className="text-white/70 text-center text-base mt-4">
              Your twin will receive the invitation and can use it to connect with you.
            </Text>
          )}
          
          {invitationStep === 'error' && error && (
            <Text className="text-red-200 text-center text-base mt-4">
              {error}
            </Text>
          )}
        </View>
        
        {(invitationStep === 'success' || invitationStep === 'error') && (
          <Pressable
            onPress={() => {
              reset();
              navigation.goBack();
            }}
            className="bg-white/20 rounded-xl py-3 px-8"
          >
            <Text className="text-white text-base font-semibold">
              {invitationStep === 'success' ? 'Done' : 'Try Again'}
            </Text>
          </Pressable>
        )}
      </Animated.View>
    );
  };

  const renderReceiveInvitation = () => {
    if (currentInvitation) {
      return (
        <Animated.View
          style={{
            opacity: animatedValue,
            transform: [{ translateY: animatedValue.interpolate({ inputRange: [0, 1], outputRange: [50, 0] }) }],
          }}
          className="flex-1 justify-center px-8"
        >
          <View className="items-center mb-12">
            <View 
              className="w-24 h-24 rounded-full items-center justify-center mb-6"
              style={{ backgroundColor: getNeonAccentColorWithOpacity(currentInvitation.accentColor, 0.3) }}
            >
              <Ionicons name="heart" size={48} color={getNeonAccentColor(currentInvitation.accentColor)} />
            </View>
            
            <Text className="text-white text-3xl font-bold text-center mb-4">
              Twin Invitation 💫
            </Text>
            
            <Text className="text-white/70 text-center text-lg mb-8">
              {currentInvitation.inviterName} wants to connect with you!
            </Text>
          </View>

          <View className="bg-white/10 rounded-2xl p-6 mb-8">
            <View className="flex-row items-center mb-4">
              <Ionicons name="person" size={24} color="white" />
              <Text className="text-white text-lg font-semibold ml-3">
                {currentInvitation.inviterName}
              </Text>
            </View>
            
            <View className="flex-row items-center mb-4">
              <Ionicons name="people" size={24} color="white" />
              <Text className="text-white text-lg ml-3 capitalize">
                {currentInvitation.twinType} Twins
              </Text>
            </View>
            
            <View className="flex-row items-center mb-4">
              <Ionicons name="color-palette" size={24} color={getNeonAccentColor(currentInvitation.accentColor)} />
              <Text className="text-white text-lg ml-3 capitalize">
                {currentInvitation.accentColor.replace('neon-', '')} Theme
              </Text>
            </View>
            
            <View className="flex-row items-center">
              <Ionicons name="time" size={24} color="white" />
              <Text className="text-white text-lg ml-3">
                Expires {new Date(currentInvitation.expiresAt).toLocaleDateString()}
              </Text>
            </View>
          </View>

          <View className="space-y-4">
            <Pressable
              onPress={() => handleAcceptInvitation(currentInvitation)}
              disabled={localState.isProcessing}
              className="rounded-xl py-4 items-center"
              style={{ backgroundColor: themeColorWithOpacity }}
            >
              {localState.isProcessing ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white text-lg font-semibold">
                  Accept Invitation ✨
                </Text>
              )}
            </Pressable>
            
            <Pressable
              onPress={() => handleDeclineInvitation(currentInvitation)}
              disabled={localState.isProcessing}
              className="bg-white/10 rounded-xl py-4 items-center"
            >
              <Text className="text-white text-lg">Decline</Text>
            </Pressable>
          </View>
        </Animated.View>
      );
    }
    
    // Manual token entry fallback
    return (
      <Animated.View
        style={{
          opacity: animatedValue,
          transform: [{ translateY: animatedValue.interpolate({ inputRange: [0, 1], outputRange: [50, 0] }) }],
        }}
        className="flex-1 justify-center px-8"
      >
        <View className="items-center mb-12">
          <View className="w-24 h-24 rounded-full bg-white/20 items-center justify-center mb-6">
            <Ionicons name="key" size={48} color="white" />
          </View>
          
          <Text className="text-white text-3xl font-bold text-center mb-4">
            Enter Invitation Code
          </Text>
          
          <Text className="text-white/70 text-center text-lg mb-8">
            Enter the code your twin shared with you
          </Text>
        </View>

        <View className="bg-white/10 rounded-2xl p-6 mb-8">
          <TextInput
            value={localState.manualToken}
            onChangeText={(text) => setLocalState(prev => ({ ...prev, manualToken: text.toUpperCase() }))}
            placeholder="Enter invitation code"
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
            className="bg-white/10 rounded-xl px-4 py-4 text-white text-lg text-center tracking-widest font-mono"
            autoCapitalize="characters"
            maxLength={64}
            autoCorrect={false}
          />
        </View>
        
        {error && (
          <View className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-4">
            <Text className="text-red-200 text-center">{error}</Text>
          </View>
        )}

        <Pressable
          onPress={handleManualTokenEntry}
          disabled={localState.isProcessing || !localState.manualToken.trim()}
          className={`rounded-xl py-4 items-center ${
            localState.isProcessing || !localState.manualToken.trim() ? 'bg-white/10' : 'bg-white/20'
          }`}
          style={{ 
            backgroundColor: !localState.isProcessing && localState.manualToken.trim() ? themeColorWithOpacity : undefined 
          }}
        >
          {localState.isProcessing ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-lg font-semibold">
              Process Invitation
            </Text>
          )}
        </Pressable>
      </Animated.View>
    );
  };

  const renderContent = () => {
    if (mode === 'send') {
      if (invitationStep === 'sending' || invitationStep === 'sent' || invitationStep === 'success' || invitationStep === 'error') {
        return renderInvitationStatus();
      }
      return (
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="px-6 py-8">
            {renderContactForm()}
          </View>
        </ScrollView>
      );
    }
    
    return renderReceiveInvitation();
  };

  return (
    <ImageBackground source={require("../../assets/galaxybackground.png")} style={{ flex: 1 }}>
      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          {/* Header */}
          <View className="flex-row items-center justify-between px-6 py-4">
            <Pressable
              onPress={() => {
                reset();
                navigation.goBack();
              }}
              className="w-10 h-10 rounded-full bg-white/10 items-center justify-center"
            >
              <Ionicons name="arrow-back" size={20} color="white" />
            </Pressable>
            
            <Text className="text-white text-lg font-semibold">
              {mode === 'send' ? 'Send Invitation' : 'Invitation Received'}
            </Text>
            
            <View className="w-10" />
          </View>
          
          {renderContent()}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
};