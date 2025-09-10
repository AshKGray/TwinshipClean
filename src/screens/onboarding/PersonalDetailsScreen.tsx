import React, { useState, useRef, useEffect } from "react";
import { View, Text, Pressable, TextInput, ScrollView, Animated, ImageBackground } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useTwinStore, TwinProfile, ThemeColor } from "../../state/twinStore";
import { getZodiacSign } from "../../utils/zodiac";

interface PersonalDetailsScreenProps {
  onContinue: () => void;
  onBack: () => void;
}

interface FormData {
  name: string;
  age: string;
  gender: string;
  sexualOrientation: string;
  showSexualOrientation: boolean;
  placeOfBirth: string;
  timeOfBirth: string;
}

export const PersonalDetailsScreen: React.FC<PersonalDetailsScreenProps> = ({ 
  onContinue, 
  onBack 
}) => {
  const { userProfile, setUserProfile } = useTwinStore();
  const [showOrientationPicker, setShowOrientationPicker] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: userProfile?.name || "",
    age: userProfile?.age?.toString() || "",
    gender: userProfile?.gender || "",
    sexualOrientation: userProfile?.sexualOrientation || "",
    showSexualOrientation: userProfile?.showSexualOrientation ?? true,
    placeOfBirth: userProfile?.placeOfBirth || "",
    timeOfBirth: userProfile?.timeOfBirth || "",
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const genderOptions = ["Male", "Female", "Non-binary", "Other", "Prefer not to say"];
  const orientationOptions = [
    "Heterosexual", "Homosexual", "Bisexual", "Pansexual", 
    "Asexual", "Demisexual", "Other", "Prefer not to say"
  ];

  const handleContinue = () => {
    const age = parseInt(formData.age);
    if (!formData.name.trim() || !formData.age.trim() || isNaN(age) || age < 13) {
      return;
    }

    const updatedProfile: TwinProfile = {
      id: userProfile?.id || "user-" + Date.now(),
      name: formData.name.trim(),
      age: age,
      gender: formData.gender,
      sexualOrientation: formData.sexualOrientation || undefined,
      showSexualOrientation: formData.showSexualOrientation,
      twinType: userProfile?.twinType || "identical",
      birthDate: userProfile?.birthDate || new Date().toISOString(),
      placeOfBirth: formData.placeOfBirth || undefined,
      timeOfBirth: formData.timeOfBirth || undefined,
      profilePicture: userProfile?.profilePicture,
      accentColor: userProfile?.accentColor || "neon-purple",
      isConnected: false,
    };

    const birthDateObj = new Date(updatedProfile.birthDate);
    const month = birthDateObj.getMonth() + 1;
    const day = birthDateObj.getDate();
    updatedProfile.zodiacSign = getZodiacSign(month, day);

    setUserProfile(updatedProfile);
    onContinue();
  };

  const isFormValid = () => {
    const age = parseInt(formData.age);
    return formData.name.trim() && formData.age.trim() && !isNaN(age) && age >= 13 && formData.gender;
  };

  const renderSelector = (
    label: string,
    value: string,
    options: string[],
    onSelect: (value: string) => void,
    isRequired: boolean = false
  ) => (
    <View className="mb-6">
      <Text className="text-white text-lg mb-3 font-semibold">
        {label} {isRequired && <Text className="text-red-300">*</Text>}
      </Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        className="flex-row"
        contentContainerStyle={{ paddingRight: 20 }}
      >
        {options.map((option) => (
          <Pressable
            key={option}
            onPress={() => onSelect(option)}
            className={`mr-3 px-4 py-2 rounded-full border ${
              value === option 
                ? 'bg-white/20 border-white/50' 
                : 'bg-white/5 border-white/20'
            }`}
            style={({ pressed }) => ({
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Text className={`${
              value === option ? 'text-white' : 'text-white/70'
            } font-medium`}>
              {option}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <ImageBackground source={require("../../assets/galaxybackground.png")} style={{ flex: 1 }}>
      <SafeAreaView className="flex-1">
          {/* Header */}
          <View className="flex-row items-center justify-between pt-4 pb-8 px-8">
            <Pressable
              onPress={onBack}
              className="w-10 h-10 rounded-full bg-white/10 items-center justify-center"
            >
              <Ionicons name="chevron-back" size={20} color="white" />
            </Pressable>
            
            <View className="flex-1 items-center">
              <Text className="text-white/60 text-sm">Step 2 of 5</Text>
              <View className="flex-row mt-2 space-x-1">
                {[...Array(5)].map((_, i) => (
                  <View 
                    key={i} 
                    className={`h-1 w-8 rounded-full ${
                      i <= 1 ? 'bg-white' : 'bg-white/20'
                    }`} 
                  />
                ))}
              </View>
            </View>
            
            <View className="w-10" />
          </View>

        <ScrollView 
          className="flex-1" 
          showsVerticalScrollIndicator={true}
          contentContainerStyle={{ paddingBottom: 100 }}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled={true}
        >
          <View className="px-8">
            <Animated.View style={{ opacity: fadeAnim }}>
              {/* Profile Symbol */}
              <View className="items-center mb-8">
                <View className="relative">
                  <View className="w-20 h-20 rounded-full border-2 border-white/30 items-center justify-center">
                    <Ionicons name="person-circle" size={32} color="white" />
                  </View>
                  <View className="absolute -inset-1 w-22 h-22 rounded-full border border-white/10" />
                </View>
              </View>

              <Text className="text-white text-3xl font-bold text-center mb-4">
                Your Twinfo
              </Text>
              
              <Text className="text-white/70 text-base text-center mb-12 leading-6">
                Share the details that make you uniquely you. This information helps us personalize your twin experience.
              </Text>

              {/* Required Fields */}
              <View className="mb-6">
                <Text className="text-white text-lg mb-3 font-semibold">
                  Full Name <Text className="text-red-300">*</Text>
                </Text>
                <TextInput
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder="Enter your full name"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-4 text-white text-lg border border-white/20"
                  autoCapitalize="words"
                />
              </View>

              <View className="mb-6">
                <Text className="text-white text-lg mb-3 font-semibold">
                  Age <Text className="text-red-300">*</Text>
                </Text>
                <TextInput
                  value={formData.age}
                  onChangeText={(text) => setFormData({ ...formData, age: text.replace(/[^0-9]/g, '') })}
                  placeholder="Enter your age"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-4 text-white text-lg border border-white/20"
                  keyboardType="numeric"
                  maxLength={3}
                />
                {formData.age && parseInt(formData.age) < 13 && (
                  <Text className="text-red-300 text-sm mt-1">
                    You must be at least 13 years old to use Twinship
                  </Text>
                )}
              </View>

              {renderSelector(
                "Gender",
                formData.gender,
                genderOptions,
                (value) => setFormData({ ...formData, gender: value }),
                true
              )}

              {/* Optional Sexual Orientation - Dropdown */}
              <View className="mb-6">
                <Text className="text-white text-lg mb-2 font-semibold">
                  Sexual Orientation 
                  <Text className="text-white/60 text-sm font-normal"> (Optional)</Text>
                </Text>
                <View className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden">
                  <Pressable
                    onPress={() => setShowOrientationPicker(!showOrientationPicker)}
                    className="flex-row items-center justify-between px-4 py-4"
                  >
                    <Text className={formData.sexualOrientation ? "text-white text-base" : "text-white/60 text-base"}>
                      {formData.sexualOrientation || "Select sexual orientation"}
                    </Text>
                    <Ionicons 
                      name={showOrientationPicker ? "chevron-up" : "chevron-down"} 
                      size={20} 
                      color="rgba(255,255,255,0.7)" 
                    />
                  </Pressable>
                  {showOrientationPicker && (
                    <View className="bg-white/5 border-t border-white/10">
                      <ScrollView 
                        style={{ maxHeight: 200 }}
                        showsVerticalScrollIndicator={true}
                        nestedScrollEnabled={true}
                      >
                        {orientationOptions.map((option) => (
                          <Pressable
                            key={option}
                            onPress={() => {
                              setFormData({ ...formData, sexualOrientation: option });
                              setShowOrientationPicker(false);
                            }}
                            className="px-4 py-3 border-b border-white/5"
                            style={({ pressed }) => ({
                              backgroundColor: pressed ? 'rgba(255,255,255,0.1)' : 'transparent'
                            })}
                          >
                            <Text className="text-white/80 text-base">{option}</Text>
                          </Pressable>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
                
                {formData.sexualOrientation && (
                  <Pressable
                    onPress={() => setFormData({ 
                      ...formData, 
                      showSexualOrientation: !formData.showSexualOrientation 
                    })}
                    className="flex-row items-center mt-3"
                  >
                    <View className={`w-6 h-6 rounded border-2 mr-3 items-center justify-center ${
                      formData.showSexualOrientation 
                        ? 'bg-white/20 border-white/50' 
                        : 'border-white/30'
                    }`}>
                      {formData.showSexualOrientation && (
                        <Ionicons name="checkmark" size={16} color="white" />
                      )}
                    </View>
                    <Text className="text-white/70 flex-1">
                      Display sexual orientation on my profile
                    </Text>
                  </Pressable>
                )}
              </View>

              {/* Optional Astrology Fields */}
              <View className="bg-white/5 rounded-xl p-4 mb-6 border border-white/10">
                <Text className="text-white text-lg font-semibold mb-2">
                  🌟 Astrology & Birth Info
                </Text>
                <Text className="text-white/60 text-sm mb-6">
                  Optional information for enhanced compatibility insights
                </Text>

                <View className="mb-4">
                  <Text className="text-white text-base mb-3">
                    Place of Birth
                  </Text>
                  <TextInput
                    value={formData.placeOfBirth}
                    onChangeText={(text) => setFormData({ ...formData, placeOfBirth: text })}
                    placeholder="e.g., New York, NY, USA"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 text-white border border-white/20"
                    autoCapitalize="words"
                  />
                </View>

                <View>
                  <Text className="text-white text-base mb-3">
                    Time of Birth
                  </Text>
                  <TextInput
                    value={formData.timeOfBirth}
                    onChangeText={(text) => setFormData({ ...formData, timeOfBirth: text })}
                    placeholder="e.g., 3:45 PM"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 text-white border border-white/20"
                  />
                </View>
              </View>
              {/* Continue Button - Inside ScrollView */}
              <View className="mt-8 mb-4">
                <Pressable
                  onPress={handleContinue}
                  disabled={!isFormValid()}
                  className={`rounded-full py-4 items-center border ${
                    isFormValid() 
                      ? 'bg-white/20 border-white/30' 
                      : 'bg-white/5 border-white/10'
                  }`}
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.8 : 1,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                  })}
                >
                  <LinearGradient
                    colors={isFormValid()
                      ? ['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']
                      : ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']
                    }
                    className="absolute inset-0 rounded-full"
                  />
                  <Text className={`text-lg font-semibold ${
                    isFormValid() ? 'text-white' : 'text-white/40'
                  }`}>
                    Continue
                  </Text>
                </Pressable>
              </View>
            </Animated.View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
};