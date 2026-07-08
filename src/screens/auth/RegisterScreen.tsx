import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ImageBackground,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useAuth } from '../../state/authStore';

export const RegisterScreen = () => {
  const navigation = useNavigation<any>();
  const { register, isLoading, error, clearError } = useAuth();

  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    // Clear any existing errors when component mounts
    clearError();
  }, []);

  const validateDisplayName = (name: string): boolean => {
    if (!name.trim()) {
      setErrors(prev => ({ ...prev, displayName: 'Display name is required' }));
      return false;
    }
    if (name.trim().length < 2) {
      setErrors(prev => ({ ...prev, displayName: 'Display name must be at least 2 characters' }));
      return false;
    }
    setErrors(prev => ({ ...prev, displayName: '' }));
    return true;
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setErrors(prev => ({ ...prev, email: 'Email is required' }));
      return false;
    }
    if (!emailRegex.test(email)) {
      setErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
      return false;
    }
    setErrors(prev => ({ ...prev, email: '' }));
    return true;
  };

  const validatePassword = (password: string): boolean => {
    if (!password) {
      setErrors(prev => ({ ...prev, password: 'Password is required' }));
      return false;
    }
    if (password.length < 8) {
      setErrors(prev => ({ ...prev, password: 'Password must be at least 8 characters' }));
      return false;
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      setErrors(prev => ({ 
        ...prev, 
        password: 'Password must contain uppercase, lowercase, and number' 
      }));
      return false;
    }
    setErrors(prev => ({ ...prev, password: '' }));
    return true;
  };

  const validateConfirmPassword = (confirmPassword: string): boolean => {
    if (!confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: 'Please confirm your password' }));
      return false;
    }
    if (confirmPassword !== formData.password) {
      setErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
      return false;
    }
    setErrors(prev => ({ ...prev, confirmPassword: '' }));
    return true;
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Real-time validation for better UX
    switch (field) {
      case 'displayName':
        if (errors.displayName) validateDisplayName(value);
        break;
      case 'email':
        if (errors.email) validateEmail(value);
        break;
      case 'password':
        if (errors.password) validatePassword(value);
        // Also revalidate confirm password if it exists
        if (formData.confirmPassword && errors.confirmPassword) {
          validateConfirmPassword(formData.confirmPassword);
        }
        break;
      case 'confirmPassword':
        if (errors.confirmPassword) validateConfirmPassword(value);
        break;
    }
  };

  const handleRegister = async () => {
    // Clear previous errors
    clearError();
    
    const isDisplayNameValid = validateDisplayName(formData.displayName);
    const isEmailValid = validateEmail(formData.email);
    const isPasswordValid = validatePassword(formData.password);
    const isConfirmPasswordValid = validateConfirmPassword(formData.confirmPassword);

    if (!isDisplayNameValid || !isEmailValid || !isPasswordValid || !isConfirmPasswordValid) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    try {
      await register({
        displayName: formData.displayName.trim(),
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Navigation is handled automatically by AppNavigator based on isAuthenticated and isOnboarded state
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const getPasswordStrengthColor = (password: string): string => {
    if (!password) return 'bg-gray-500';
    if (password.length < 8) return 'bg-red-500';
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) return 'bg-orange-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = (password: string): string => {
    if (!password) return 'Enter password';
    if (password.length < 8) return 'Too short';
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) return 'Add uppercase, lowercase & number';
    return 'Strong password';
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
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View className="px-6">
              {/* Header */}
              <View className="flex-row items-center justify-between py-4">
                <Pressable
                  onPress={() => navigation.goBack()}
                  className="w-10 h-10 rounded-full bg-white/10 items-center justify-center"
                >
                  <Ionicons name="chevron-back" size={20} color="white" />
                </Pressable>
                <Text className="text-white text-xl font-bold flex-1 text-center">Create Account</Text>
                <View className="w-10" />
              </View>

              {/* Logo/Title */}
              <View className="items-center mt-4 mb-8">
                <Text className="text-white text-3xl font-bold mb-2">Join Twinship</Text>
                <Text className="text-white/70 text-center">
                  Create your account to start connecting with your twin
                </Text>
              </View>

              {/* Error Message */}
              {error && (
                <View className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-6">
                  <Text className="text-red-200 text-center">{error}</Text>
                </View>
              )}

              {/* Registration Form */}
              <View className="space-y-4">
                {/* Display Name Input */}
                <View>
                  <Text className="text-white/80 mb-2">Display Name</Text>
                  <TextInput
                    value={formData.displayName}
                    onChangeText={(text) => updateFormData('displayName', text)}
                    placeholder="What should we call you?"
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    className="bg-white/10 rounded-xl px-4 py-4 text-white text-base"
                    autoCapitalize="words"
                    editable={!isLoading}
                  />
                  {errors.displayName ? (
                    <Text className="text-red-400 text-sm mt-1 ml-2">{errors.displayName}</Text>
                  ) : null}
                </View>

                {/* Email Input */}
                <View>
                  <Text className="text-white/80 mb-2">Email</Text>
                  <TextInput
                    value={formData.email}
                    onChangeText={(text) => updateFormData('email', text)}
                    placeholder="Enter your email"
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    className="bg-white/10 rounded-xl px-4 py-4 text-white text-base"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                  />
                  {errors.email ? (
                    <Text className="text-red-400 text-sm mt-1 ml-2">{errors.email}</Text>
                  ) : null}
                </View>

                {/* Password Input */}
                <View>
                  <Text className="text-white/80 mb-2">Password</Text>
                  <View className="relative">
                    <TextInput
                      value={formData.password}
                      onChangeText={(text) => updateFormData('password', text)}
                      placeholder="Create a strong password"
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
                  
                  {/* Password Strength Indicator */}
                  {formData.password ? (
                    <View className="mt-2">
                      <View className="flex-row items-center space-x-2 ml-2">
                        <View className={`w-3 h-3 rounded-full ${getPasswordStrengthColor(formData.password)}`} />
                        <Text className="text-white/70 text-xs">
                          {getPasswordStrengthText(formData.password)}
                        </Text>
                      </View>
                    </View>
                  ) : null}
                  
                  {errors.password ? (
                    <Text className="text-red-400 text-sm mt-1 ml-2">{errors.password}</Text>
                  ) : null}
                </View>

                {/* Confirm Password Input */}
                <View>
                  <Text className="text-white/80 mb-2">Confirm Password</Text>
                  <View className="relative">
                    <TextInput
                      value={formData.confirmPassword}
                      onChangeText={(text) => updateFormData('confirmPassword', text)}
                      placeholder="Confirm your password"
                      placeholderTextColor="rgba(255,255,255,0.5)"
                      className="bg-white/10 rounded-xl px-4 py-4 text-white text-base pr-12"
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!isLoading}
                    />
                    <Pressable
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-4"
                    >
                      <Ionicons
                        name={showConfirmPassword ? 'eye-off' : 'eye'}
                        size={20}
                        color="rgba(255,255,255,0.7)"
                      />
                    </Pressable>
                  </View>
                  {errors.confirmPassword ? (
                    <Text className="text-red-400 text-sm mt-1 ml-2">{errors.confirmPassword}</Text>
                  ) : null}
                </View>

                {/* Terms and Privacy */}
                <View className="bg-white/5 rounded-xl p-4 mt-4">
                  <Text className="text-white/70 text-xs leading-5 text-center">
                    By creating an account, you agree to our{' '}
                    <Text className="text-purple-300 underline">Terms of Service</Text>
                    {' '}and{' '}
                    <Text className="text-purple-300 underline">Privacy Policy</Text>
                  </Text>
                </View>

                {/* Register Button */}
                <Pressable
                  onPress={handleRegister}
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
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                  </Text>
                </Pressable>

                {/* Twinfinity Quote */}
                <View className="items-center mt-3">
                  <Text className="text-white/50 text-xs italic">
                    to Twinfinity and beyond!
                  </Text>
                </View>

                {/* Sign In Link */}
                <View className="flex-row justify-center items-center mt-6">
                  <Text className="text-white/70">Already have an account? </Text>
                  <Pressable
                    onPress={() => navigation.navigate('Login')}
                    disabled={isLoading}
                  >
                    <Text className="text-purple-300 font-semibold">Sign In</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
};