import React, { useState, useRef, useEffect } from "react";
import { View, Text, Pressable, ScrollView, Image, Animated, ImageBackground } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useTwinStore } from "../../state/twinStore";
import { getNeonAccentColor } from "../../utils/neonColors";

interface ProfileReviewScreenProps {
  onComplete: () => void;
  onBack: () => void;
  onEdit: (step: number) => void;
}

export const ProfileReviewScreen: React.FC<ProfileReviewScreenProps> = ({ 
  onComplete, 
  onBack,
  onEdit 
}) => {
  const { userProfile, setOnboarded } = useTwinStore();
  const [isCompleting, setIsCompleting] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const completionAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleComplete = async () => {
    setIsCompleting(true);
    
    // Completion animation
    Animated.sequence([
      Animated.timing(completionAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(completionAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setOnboarded(true);
      onComplete();
    });
  };

  if (!userProfile) {
    return null;
  }

  const accentColor = getNeonAccentColor(userProfile.accentColor);

  const profileSections = [
    {
      title: "Profile Photo",
      value: userProfile.profilePicture ? "Photo selected" : "No photo",
      editStep: 1,
      icon: "camera" as const,
    },
    {
      title: "Personal Details",
      value: `${userProfile.name}, ${userProfile.age}, ${userProfile.gender}`,
      editStep: 2,
      icon: "person" as const,
    },
    {
      title: "Twin Type",
      value: userProfile.twinType.charAt(0).toUpperCase() + userProfile.twinType.slice(1),
      editStep: 3,
      icon: "people" as const,
    },
    {
      title: "Theme Color",
      value: userProfile.accentColor.replace('neon-', '').charAt(0).toUpperCase() + 
             userProfile.accentColor.replace('neon-', '').slice(1),
      editStep: 4,
      icon: "color-palette" as const,
    },
  ];

  return (
    <ImageBackground source={require("../../../assets/galaxybackground.png")} style={{ flex: 1 }}>
      <SafeAreaView className="flex-1">
        <View className="flex-1">
          {/* Header */}
          <View className="flex-row items-center justify-between pt-4 pb-8 px-8">
            <Pressable
              onPress={onBack}
              className="w-10 h-10 rounded-full bg-black/80 items-center justify-center"
              disabled={isCompleting}
            >
              <Ionicons name="chevron-back" size={20} color="white" />
            </Pressable>
            
            <View className="flex-1 items-center">
              <Text className="text-white/60 text-sm">Step 6 of 6</Text>
              <View className="flex-row mt-2 space-x-1">
                {[...Array(6)].map((_, i) => (
                  <View
                    key={i}
                    className="h-1 w-8 rounded-full bg-white"
                  />
                ))}
              </View>
            </View>
            
            <View className="w-10" />
          </View>

          <ScrollView className="flex-1 px-8" showsVerticalScrollIndicator={false}>
            <Animated.View 
              style={{
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }}
            >
              {/* Completion Symbol */}
              <View className="items-center mb-8">
                <View className="relative">
                  <View 
                    className="w-24 h-24 rounded-full border-4 items-center justify-center"
                    style={{ 
                      borderColor: accentColor + '60',
                      backgroundColor: accentColor + '20'
                    }}
                  >
                    {userProfile.profilePicture ? (
                      <Image 
                        source={{ uri: userProfile.profilePicture }} 
                        className="w-20 h-20 rounded-full"
                      />
                    ) : (
                      <Ionicons name="person" size={32} color={accentColor} />
                    )}
                  </View>
                  <View 
                    className="absolute -inset-2 w-28 h-28 rounded-full border"
                    style={{ borderColor: accentColor + '30' }}
                  />
                  <View 
                    className="absolute -inset-4 w-32 h-32 rounded-full border"
                    style={{ borderColor: accentColor + '10' }}
                  />
                </View>
              </View>

              <Text className="text-white text-3xl font-bold text-center mb-4">
                Profile Complete
              </Text>
              
              <Text className="text-white/70 text-base text-center mb-12 leading-6">
                Review your information below. Everything looks perfect? Let's begin your twin journey!
              </Text>

              {/* Profile Summary */}
              <View className="space-y-4 mb-8">
                {profileSections.map((section, index) => (
                  <View 
                    key={index}
                    className="bg-black/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center flex-1">
                        <View 
                          className="w-12 h-12 rounded-full items-center justify-center mr-4"
                          style={{ backgroundColor: accentColor + '30' }}
                        >
                          <Ionicons 
                            name={section.icon} 
                            size={20} 
                            color={accentColor}
                          />
                        </View>
                        <View className="flex-1">
                          <Text className="text-white text-lg font-semibold mb-1">
                            {section.title}
                          </Text>
                          <Text className="text-white/70 text-sm">
                            {section.value}
                          </Text>
                        </View>
                      </View>
                      
                      <Pressable
                        onPress={() => onEdit(section.editStep)}
                        className="w-8 h-8 rounded-full bg-black/80 items-center justify-center"
                        disabled={isCompleting}
                      >
                        <Ionicons name="pencil" size={14} color="rgba(255,255,255,0.6)" />
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>

              {/* Optional Information */}
              {(userProfile.sexualOrientation || userProfile.placeOfBirth || userProfile.timeOfBirth) && (
                <View className="bg-black/70 rounded-2xl p-6 mb-8 border border-white/10">
                  <Text className="text-white text-lg font-semibold mb-4">
                    ✨ Additional Details
                  </Text>
                  
                  {userProfile.sexualOrientation && (
                    <View className="flex-row justify-between items-center mb-3">
                      <Text className="text-white/60 text-sm">Sexual Orientation</Text>
                      <Text className="text-white text-sm">
                        {userProfile.sexualOrientation}
                        {!userProfile.showSexualOrientation && " (Private)"}
                      </Text>
                    </View>
                  )}
                  
                  {userProfile.placeOfBirth && (
                    <View className="flex-row justify-between items-center mb-3">
                      <Text className="text-white/60 text-sm">Place of Birth</Text>
                      <Text className="text-white text-sm">{userProfile.placeOfBirth}</Text>
                    </View>
                  )}
                  
                  {userProfile.timeOfBirth && (
                    <View className="flex-row justify-between items-center">
                      <Text className="text-white/60 text-sm">Time of Birth</Text>
                      <Text className="text-white text-sm">{userProfile.timeOfBirth}</Text>
                    </View>
                  )}
                </View>
              )}

              {/* Privacy Promise */}
              <View className="bg-black/70 rounded-2xl p-6 mb-8 border border-white/10">
                <View className="flex-row items-start">
                  <Ionicons name="shield-checkmark" size={24} color="#4ade80" className="mr-4 mt-1" />
                  <View className="flex-1">
                    <Text className="text-white text-base font-semibold mb-2">
                      Our Privacy Promise
                    </Text>
                    <Text className="text-white/60 text-sm leading-6">
                      Your information is protected with the highest level of security and privacy. 
                      Only you and your twin will have access to your shared space. 
                      We never sell or share your personal data.
                    </Text>
                  </View>
                </View>
              </View>
            </Animated.View>
          </ScrollView>

          {/* Complete Button */}
          <View className="px-8 pb-8">
            <Pressable
              onPress={handleComplete}
              disabled={isCompleting}
              className="rounded-full py-4 items-center border-2 relative overflow-hidden"
              style={{
                backgroundColor: accentColor + '30',
                borderColor: accentColor + '60',
                opacity: isCompleting ? 0.8 : 1,
              }}
            >
              <LinearGradient
                colors={[
                  accentColor + '40',
                  accentColor + '20'
                ]}
                className="absolute inset-0 rounded-full"
              />
              
              {/* Completion Animation Overlay */}
              <Animated.View
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: accentColor + '80',
                  opacity: completionAnim,
                }}
                className="rounded-full items-center justify-center"
              >
                <Ionicons name="checkmark-circle" size={32} color="white" />
              </Animated.View>
              
              {isCompleting ? (
                <View className="flex-row items-center">
                  <View className="w-6 h-6 rounded-full border-2 border-white border-t-transparent animate-spin mr-3" />
                  <Text className="text-white text-lg font-semibold">
                    Setting up your account...
                  </Text>
                </View>
              ) : (
                <View className="flex-row items-center">
                  <Ionicons name="sparkles" size={20} color="white" className="mr-3" />
                  <Text className="text-white text-lg font-semibold">
                    Begin Twin Journey
                  </Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
};