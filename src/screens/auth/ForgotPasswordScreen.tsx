import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ImageBackground,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { usePasswordReset } from '../../state/authStore';

export const ForgotPasswordScreen = () => {
  const navigation = useNavigation<any>();
  const { forgotPassword, isLoading, error, clearError } = usePasswordReset();

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    // Clear any existing errors when component mounts
    clearError();
  }, []);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setEmailError('Email is required');
      return false;
    }
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleForgotPassword = async () => {
    // Clear previous errors
    clearError();
    setIsSuccess(false);
    
    const isEmailValid = validateEmail(email);

    if (!isEmailValid) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    try {
      await forgotPassword(email.toLowerCase().trim());
      setIsSuccess(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  if (isSuccess) {
    return (
      <ImageBackground source={require('../../../assets/galaxybackground.png')} style={{ flex: 1 }}>
        <SafeAreaView className="flex-1">
          <View className="flex-1 px-6">
            {/* Header */}
            <View className="flex-row items-center justify-between py-4">
              <Pressable
                onPress={() => navigation.goBack()}
                className="w-10 h-10 rounded-full bg-white/10 items-center justify-center"
              >
                <Ionicons name="chevron-back" size={20} color="white" />
              </Pressable>
              <Text className="text-white text-xl font-bold flex-1 text-center">Reset Password</Text>
              <View className="w-10" />
            </View>

            {/* Success Content */}
            <View className="flex-1 justify-center items-center px-4">
              <View className="bg-green-500/20 rounded-full w-20 h-20 items-center justify-center mb-6">
                <Ionicons name="mail-outline" size={32} color="#10b981" />
              </View>
              
              <Text className="text-white text-2xl font-bold text-center mb-4">
                Check Your Email
              </Text>
              
              <Text className="text-white/70 text-center text-base leading-6 mb-8">
                We've sent a password reset link to{'\n'}
                <Text className="text-white font-medium">{email}</Text>
              </Text>
              
              <Text className="text-white/60 text-center text-sm leading-5 mb-8">
                Click the link in the email to reset your password. If you don't see it, check your spam folder.
              </Text>

              <Pressable
                onPress={() => navigation.navigate('Login')}
                className="bg-purple-500 rounded-xl py-4 px-8 w-full max-w-xs"
                style={({ pressed }) => [
                  {
                    opacity: pressed ? 0.8 : 1,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                  },
                ]}
              >
                <Text className="text-white font-semibold text-center">Back to Sign In</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  setIsSuccess(false);
                  clearError();
                }}
                className="mt-4"
              >
                <Text className="text-purple-300 text-center">Try different email</Text>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground source={require('../../../assets/galaxybackground.png')} style={{ flex: 1 }}>
      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <View className="flex-1 px-6">
            {/* Header */}
            <View className="flex-row items-center justify-between py-4">
              <Pressable
                onPress={() => navigation.goBack()}
                className="w-10 h-10 rounded-full bg-white/10 items-center justify-center"
              >
                <Ionicons name="chevron-back" size={20} color="white" />
              </Pressable>
              <Text className="text-white text-xl font-bold flex-1 text-center">Reset Password</Text>
              <View className="w-10" />
            </View>

            {/* Content */}
            <View className="flex-1 justify-center">
              <View className="items-center mb-8">
                <View className="bg-white/10 rounded-full w-16 h-16 items-center justify-center mb-4">
                  <Ionicons name="lock-closed-outline" size={24} color="white" />
                </View>
                <Text className="text-white text-2xl font-bold mb-2">Forgot Password?</Text>
                <Text className="text-white/70 text-center">
                  Enter your email and we'll send you a link to reset your password.
                </Text>
              </View>

              {/* Error Message */}
              {error && (
                <View className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-6">
                  <Text className="text-red-200 text-center">{error}</Text>
                </View>
              )}

              {/* Email Input */}
              <View className="mb-6">
                <Text className="text-white/80 mb-2">Email Address</Text>
                <TextInput
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (emailError) validateEmail(text);
                  }}
                  placeholder="Enter your email"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  className="bg-white/10 rounded-xl px-4 py-4 text-white text-base"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
                {emailError ? (
                  <Text className="text-red-400 text-sm mt-1 ml-2">{emailError}</Text>
                ) : null}
              </View>

              {/* Send Reset Link Button */}
              <Pressable
                onPress={handleForgotPassword}
                disabled={isLoading}
                className={`rounded-xl py-4 items-center mb-6 ${
                  isLoading ? 'bg-purple-500/50' : 'bg-purple-500'
                }`}
                style={({ pressed }) => [
                  {
                    opacity: pressed ? 0.8 : 1,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                  },
                ]}
              >
                <Text className="text-white font-semibold text-lg">
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
                </Text>
              </Pressable>

              {/* Back to Login */}
              <View className="flex-row justify-center items-center">
                <Text className="text-white/70">Remember your password? </Text>
                <Pressable
                  onPress={() => navigation.navigate('Login')}
                  disabled={isLoading}
                >
                  <Text className="text-purple-300 font-semibold">Sign In</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
};