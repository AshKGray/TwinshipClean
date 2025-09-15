import React, { useState, useRef, useEffect } from "react";
import { View, Text, Pressable, Image, Alert, AnimatedBackground } from "react-native";
import { ImageBackground } from "expo-image";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';
import { useTwinStore } from "../../state/twinStore";

interface PhotoSetupScreenProps {
  onContinue: () => void;
  onBack: () => void;
}

export const PhotoSetupScreen: React.FC<PhotoSetupScreenProps> = ({ 
  onContinue, 
  onBack 
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const { userProfile, setUserProfile } = useTwinStore();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const requestPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'We need access to your photos to set up your profile picture.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const pickImageFromGallery = async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'We need camera access to take your profile picture.',
        [{ text: 'OK' }]
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const handleContinue = () => {
    if (userProfile) {
      setUserProfile({
        ...userProfile,
        profilePicture: selectedImage || undefined
      });
    } else {
      // Create minimal profile to store the photo
      const tempProfile: any = {
        id: "temp-user-" + Date.now(),
        profilePicture: selectedImage || undefined,
        name: "",
        age: 0,
        gender: "",
        twinType: "identical",
        birthDate: new Date().toISOString(),
        accentColor: "neon-purple",
        isConnected: false,
      };
      setUserProfile(tempProfile);
    }
    onContinue();
  };

  const photoOptions = [
    {
      title: "Take Photo",
      subtitle: "Use your camera",
      icon: "camera" as const,
      onPress: takePhoto,
    },
    {
      title: "Choose from Gallery",
      subtitle: "Select from your photos",
      icon: "images" as const,
      onPress: pickImageFromGallery,
    }
  ];

  return (
    <ImageBackground source={require("../../assets/galaxybackground.png")} style={{ flex: 1 }}
      contentFit="cover"
      placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
      transition={200}>
      <SafeAreaView className="flex-1">
        <View className="flex-1 px-8">
          {/* Header */}
          <View className="flex-row items-center justify-between pt-4 pb-8">
            <Pressable
              onPress={onBack}
              className="w-10 h-10 rounded-full bg-black/80 items-center justify-center"
            >
              <Ionicons name="chevron-back" size={20} color="white" />
            </Pressable>
            
            <View className="flex-1 items-center">
              <Text className="text-white/60 text-sm">Step 1 of 5</Text>
              <View className="flex-row mt-2 space-x-1">
                {[...Array(5)].map((_, i) => (
                  <View 
                    key={i} 
                    className={`h-1 w-8 rounded-full ${
                      i === 0 ? 'bg-white' : 'bg-black/80'
                    }`} 
                  />
                ))}
              </View>
            </View>
            
            <View className="w-10" />
          </View>

          {/* Content */}
          <Animated.View 
            style={{
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            }}
            className="flex-1 justify-center"
          >
            {/* Photo Symbol */}
            <View className="items-center mb-8">
              <View className="relative">
                <View className="w-24 h-24 rounded-full border-2 border-white/30 items-center justify-center">
                  <Ionicons name="person" size={32} color="white" />
                </View>
                <View className="absolute -inset-1 w-26 h-26 rounded-full border border-white/10" />
              </View>
            </View>

            <Text className="text-white text-3xl font-bold text-center mb-4">
              Profile Picture
            </Text>
            
            <Text className="text-white/70 text-base text-center mb-12 leading-6">
              Choose a photo that represents you. This helps your twin recognize you in the app.
            </Text>

            {/* Current Photo Preview */}
            {selectedImage && (
              <View className="items-center mb-8">
                <View className="relative">
                  <Image 
                    source={{ uri: selectedImage }} 
                    className="w-32 h-32 rounded-full"
                  />
                  <View className="absolute -inset-1 w-34 h-34 rounded-full border-2 border-white/50" />
                  <View className="absolute -inset-2 w-36 h-36 rounded-full border border-white/20" />
                </View>
                <Text className="text-white/60 text-sm mt-4">Perfect! Your twin will love this.</Text>
              </View>
            )}

            {/* Photo Options */}
            <View className="space-y-4 mb-12">
              {photoOptions.map((option, index) => (
                <Pressable
                  key={index}
                  onPress={option.onPress}
                  className="bg-black/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.8 : 1,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                  })}
                >
                  <View className="flex-row items-center">
                    <View className="w-12 h-12 rounded-full bg-black/80 items-center justify-center mr-4">
                      <Ionicons name={option.icon} size={24} color="white" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-white text-lg font-semibold">
                        {option.title}
                      </Text>
                      <Text className="text-white/60 text-sm">
                        {option.subtitle}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.4)" />
                  </View>
                </Pressable>
              ))}
            </View>

            {/* Skip Option */}
            <View className="items-center mb-8">
              <Pressable onPress={handleContinue}>
                <Text className="text-white/60 text-sm underline">
                  Skip for now (you can add this later)
                </Text>
              </Pressable>
            </View>
          </Animated.View>

          {/* Continue Button */}
          <View className="pb-8">
            <Pressable
              onPress={handleContinue}
              disabled={!selectedImage}
              className={`rounded-full py-4 items-center border ${
                selectedImage 
                  ? 'bg-black/80 border-white/30' 
                  : 'bg-black/70 border-white/10'
              }`}
              style={({ pressed }) => ({
                opacity: pressed ? 0.8 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              })}
            >
              <LinearGradient
                colors={selectedImage 
                  ? ['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']
                  : ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']
                }
                className="absolute inset-0 rounded-full"
              />
              <Text className={`text-lg font-semibold ${
                selectedImage ? 'text-white' : 'text-white/40'
              }`}>
                {selectedImage ? 'Continue' : 'Choose Photo to Continue'}
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
};