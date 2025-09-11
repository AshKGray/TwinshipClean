import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ImageBackground,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useAuth, useBiometricAuth } from '../../state/authStore';

export const LoginScreen = () => {
  const navigation = useNavigation<any>();
  const { login, isLoading, error, clearError } = useAuth();
  const {
    biometricAvailable,
    biometricEnabled,
    biometricType,
    loginWithBiometrics,
    checkBiometricAvailability,
  } = useBiometricAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

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

  const validatePassword = (password: string): boolean => {
    if (!password) {
      setPasswordError('Password is required');
      return false;
    }
    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleLogin = async () => {
    // Clear previous errors
    clearError();
    
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    try {
      await login({ email: email.toLowerCase().trim(), password });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.navigate('Home');
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleBiometricLogin = async () => {
    if (!biometricAvailable || !biometricEnabled) {
      Alert.alert(
        'Biometric Authentication Unavailable',
        'Please set up biometric authentication in your account settings.'
      );
      return;
    }

    try {
      await loginWithBiometrics();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.navigate('Home');
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Authentication Failed', error.message);
    }
  };

  const getBiometricButtonText = (): string => {
    if (biometricType.includes('Face ID')) return 'Continue with Face ID';
    if (biometricType.includes('Touch ID')) return 'Continue with Touch ID';
    return 'Continue with Biometrics';
  };

  const getBiometricIcon = (): string => {
    if (biometricType.includes('Face ID')) return 'face-outline';
    if (biometricType.includes('Touch ID')) return 'finger-print';
    return 'shield-checkmark';
  };

  return (
    <ImageBackground source={require('../../../assets/galaxybackground.png')} style={{ flex: 1 }}>
      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
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
                <Text className="text-white text-xl font-bold flex-1 text-center">Welcome Back</Text>
                <View className="w-10" />
              </View>

              {/* Logo/Title */}
              <View className="items-center mt-8 mb-8">
                <Text className="text-white text-3xl font-bold mb-2">Twinship</Text>
                <Text className="text-white/70 text-center">
                  Sign in to connect with your twin
                </Text>
              </View>

              {/* Error Message */}
              {error && (
                <View className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-6">
                  <Text className="text-red-200 text-center">{error}</Text>
                </View>
              )}

              {/* Login Form */}
              <View className="space-y-4">
                {/* Email Input */}
                <View>
                  <Text className="text-white/80 mb-2">Email</Text>
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

                {/* Password Input */}
                <View>
                  <Text className="text-white/80 mb-2">Password</Text>
                  <View className="relative">
                    <TextInput
                      value={password}
                      onChangeText={(text) => {
                        setPassword(text);
                        if (passwordError) validatePassword(text);
                      }}
                      placeholder="Enter your password"
                      placeholderTextColor="rgba(255,255,255,0.5)"
                      className="bg-white/10 rounded-xl px-4 py-4 text-white text-base pr-12"
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!isLoading}
                    />
                    <Pressable
                      onPress={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-4"
                    >
                      <Ionicons
                        name={showPassword ? 'eye-off' : 'eye'}
                        size={20}
                        color="rgba(255,255,255,0.7)"
                      />
                    </Pressable>
                  </View>
                  {passwordError ? (
                    <Text className="text-red-400 text-sm mt-1 ml-2">{passwordError}</Text>
                  ) : null}
                </View>

                {/* Forgot Password */}
                <View className="items-end">
                  <Pressable
                    onPress={() => navigation.navigate('ForgotPassword')}
                    disabled={isLoading}
                  >
                    <Text className="text-purple-300 text-sm">Forgot password?</Text>
                  </Pressable>
                </View>

                {/* Login Button */}
                <Pressable
                  onPress={handleLogin}
                  disabled={isLoading}
                  className={`rounded-xl py-4 items-center mt-6 ${
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
                    {isLoading ? 'Signing In...' : 'Sign In'}
                  </Text>
                </Pressable>

                {/* Biometric Login */}
                {biometricAvailable && biometricEnabled && (
                  <View className="items-center mt-6">
                    <Text className="text-white/60 text-sm mb-4">or</Text>
                    <Pressable
                      onPress={handleBiometricLogin}
                      disabled={isLoading}
                      className="flex-row items-center bg-white/10 rounded-xl px-6 py-3"
                      style={({ pressed }) => [
                        {
                          opacity: pressed ? 0.8 : 1,
                        },
                      ]}
                    >
                      <Ionicons
                        name={getBiometricIcon() as any}
                        size={20}
                        color="white"
                        style={{ marginRight: 8 }}
                      />
                      <Text className="text-white">{getBiometricButtonText()}</Text>
                    </Pressable>
                  </View>
                )}

                {/* Sign Up Link */}
                <View className="flex-row justify-center items-center mt-8">
                  <Text className="text-white/70">Don't have an account? </Text>
                  <Pressable
                    onPress={() => navigation.navigate('Register')}
                    disabled={isLoading}
                  >
                    <Text className="text-purple-300 font-semibold">Sign Up</Text>
                  </Pressable>
                </View>

                {/* Development Mode */}
                {__DEV__ && (
                  <View className="bg-yellow-500/10 rounded-xl p-4 border border-yellow-500/30 mt-6">
                    <Text className="text-yellow-200 text-sm font-medium mb-2">🧪 Development Mode</Text>
                    <Text className="text-yellow-100/80 text-xs leading-5">
                      Test credentials: test@twinship.app / password123
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
};