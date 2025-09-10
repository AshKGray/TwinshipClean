import React, { useState, useRef, useEffect } from "react";
import { View, Text, Pressable, ScrollView, Animated, TextInput, ImageBackground } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TwinTypeSelector } from "../../components/onboarding/TwinTypeSelector";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useTwinStore, TwinType } from "../../state/twinStore";

interface TwinTypeScreenProps {
  onContinue: () => void;
  onBack: () => void;
}

export const TwinTypeScreen: React.FC<TwinTypeScreenProps> = ({ 
  onContinue, 
  onBack 
}) => {
  const { userProfile, setUserProfile } = useTwinStore();
  const [selectedType, setSelectedType] = useState<TwinType | null>(
    userProfile?.twinType || null
  );
  const [showInfo, setShowInfo] = useState(false);
  const [otherTypeDescription, setOtherTypeDescription] = useState("");
  const [twinDeceased, setTwinDeceased] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleContinue = () => {
    if (!selectedType || !userProfile) return;
    
    // If "other" is selected but no description provided, don't continue
    if (selectedType === "other" && !otherTypeDescription.trim()) return;

    setUserProfile({
      ...userProfile,
      twinType: selectedType,
      // Store additional twin type info for future use
      otherTwinTypeDescription: selectedType === "other" ? otherTypeDescription.trim() : undefined,
      twinDeceased: twinDeceased,
    });
    onContinue();
  };

  const twinTypes = [
    {
      type: "identical" as TwinType,
      title: "Identical Twins",
      subtitle: "Monozygotic • Same DNA",
      description: "Formed from one fertilized egg that splits into two. You share 100% of your genetic material and are always the same biological sex.",
      icon: "people" as const,
      features: [
        "Share identical DNA",
        "Same biological sex",
        "Often look very similar",
        "May have stronger intuitive connection"
      ]
    },
    {
      type: "fraternal" as TwinType,
      title: "Fraternal Twins",
      subtitle: "Dizygotic • Different DNA",
      description: "Formed from two separate fertilized eggs. You share about 50% of your genetic material, like regular siblings, but were born at the same time.",
      icon: "people-outline" as const,
      features: [
        "Share ~50% of DNA",
        "Can be different sexes",
        "May look different",
        "Unique twin bond regardless"
      ]
    },
    {
      type: "other" as TwinType,
      title: "Other Twin Type",
      subtitle: "Special circumstances",
      description: "This includes semi-identical twins, conjoined twins who were separated, twins with different fathers, or other unique twin circumstances.",
      icon: "heart" as const,
      features: [
        "Unique twin situation",
        "Special bond regardless",
        "Every twin story matters",
        "Celebrated here equally"
      ]
    }
  ];

  return (
    <ImageBackground source={require("../../assets/galaxybackground.png")} style={{ flex: 1 }}>
      <SafeAreaView className="flex-1">
        <View className="flex-1">
          {/* Header */}
          <View className="flex-row items-center justify-between pt-4 pb-8 px-8">
            <Pressable
              onPress={onBack}
              className="w-10 h-10 rounded-full bg-white/10 items-center justify-center"
            >
              <Ionicons name="chevron-back" size={20} color="white" />
            </Pressable>
            
            <View className="flex-1 items-center">
              <Text className="text-white/60 text-sm">Step 3 of 5</Text>
              <View className="flex-row mt-2 space-x-1">
                {[...Array(5)].map((_, i) => (
                  <View 
                    key={i} 
                    className={`h-1 w-8 rounded-full ${
                      i <= 2 ? 'bg-white' : 'bg-white/20'
                    }`} 
                  />
                ))}
              </View>
            </View>
            
            <Pressable
              onPress={() => setShowInfo(!showInfo)}
              className="w-10 h-10 rounded-full bg-white/10 items-center justify-center"
            >
              <Ionicons name="information-circle" size={20} color="white" />
            </Pressable>
          </View>

          <ScrollView className="flex-1 px-8" showsVerticalScrollIndicator={false}>
            <Animated.View style={{ opacity: fadeAnim }}>
              {/* Twin Symbol */}
              <View className="items-center mb-8">
                <View className="relative">
                  <View className="w-20 h-20 rounded-full border-2 border-white/30 items-center justify-center">
                    <View className="flex-row">
                      <View className="w-6 h-6 rounded-full bg-white/50 mr-1" />
                      <View className="w-6 h-6 rounded-full bg-white/50" />
                    </View>
                  </View>
                  <View className="absolute -inset-1 w-22 h-22 rounded-full border border-white/10" />
                </View>
              </View>

              <Text className="text-white text-3xl font-bold text-center mb-4">
                Your Twin Connection
              </Text>
              
              <Text className="text-white/70 text-base text-center mb-12 leading-6">
                Understanding your twin type helps us personalize your experience and connect you with relevant research and insights.
              </Text>

              {/* Information Panel */}
              {showInfo && (
                <Animated.View className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-white/20">
                  <Text className="text-white text-lg font-semibold mb-4">
                    🧬 Twin Science Made Simple
                  </Text>
                  <Text className="text-white/70 text-sm leading-6">
                    Twin type affects various aspects of your shared experience, from genetics to psychology. Research shows that identical twins often have stronger synchronized behaviors and may share more intuitive connections, while fraternal twins bring unique perspectives from their genetic diversity. Both types create special bonds that are stronger than ordinary sibling relationships.
                  </Text>
                </Animated.View>
              )}

              {/* Twin Type Options */}
              <View className="space-y-4 mb-8">
                {twinTypes.map((twinType) => (
                  <TwinTypeSelector
                    key={twinType.type}
                    twinType={twinType}
                    isSelected={selectedType === twinType.type}
                    onSelect={(type) => setSelectedType(type)}
                    showDetails={selectedType === twinType.type}
                  />
                ))}
              </View>

              {/* Other Twin Type Description */}
              {selectedType === "other" && (
                <View className="mb-8">
                  <Text className="text-white text-lg mb-3 font-semibold">
                    Please describe your twin type
                  </Text>
                  <TextInput
                    value={otherTypeDescription}
                    onChangeText={setOtherTypeDescription}
                    placeholder="e.g., Semi-identical twins, twins with different fathers, etc."
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-4 text-white text-base border border-white/20"
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                    autoCapitalize="sentences"
                  />
                </View>
              )}

              {/* Deceased Twin Option - Very Sensitive */}
              <View className="bg-white/5 rounded-xl p-6 mb-8 border border-white/10">
                <Pressable
                  onPress={() => setTwinDeceased(!twinDeceased)}
                  className="flex-row items-start"
                >
                  <View className={`w-6 h-6 rounded border-2 mr-4 mt-0.5 items-center justify-center ${
                    twinDeceased 
                      ? 'bg-white/20 border-white/50' 
                      : 'border-white/30'
                  }`}>
                    {twinDeceased && (
                      <Ionicons name="checkmark" size={16} color="white" />
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className="text-white text-base font-medium mb-2">
                      My twin has passed away
                    </Text>
                    <Text className="text-white/70 text-sm leading-6 mb-3">
                      We understand this is an incredibly difficult journey. Your twin connection remains sacred and meaningful, and we're honored to help you preserve those precious memories and celebrate the bond you shared.
                    </Text>
                    <View className="bg-amber-500/20 rounded-lg p-3 border border-amber-500/30">
                      <Text className="text-amber-200 text-xs font-medium mb-1">
                        💛 Special Features Coming Soon
                      </Text>
                      <Text className="text-amber-100/80 text-xs leading-5">
                        We're thoughtfully developing dedicated memorial features, memory sharing tools, and grief support resources specifically for twins who have experienced loss. These will be available in a future update.
                      </Text>
                    </View>
                  </View>
                </Pressable>
              </View>

              {/* Reassurance */}
              <View className="bg-white/5 rounded-xl p-6 mb-8 border border-white/10">
                <View className="flex-row items-start">
                  <Ionicons name="heart" size={20} color="#ff69b4" className="mr-3 mt-1" />
                  <View className="flex-1">
                    <Text className="text-white text-base font-medium mb-2">
                      Every Twin Bond is Special
                    </Text>
                    <Text className="text-white/60 text-sm leading-6">
                      Regardless of your twin type, your connection is unique and valuable. Twinship celebrates all forms of twinship and provides personalized experiences for every type of twin relationship.
                    </Text>
                  </View>
                </View>
              </View>
            </Animated.View>
          </ScrollView>

          {/* Continue Button */}
          <View className="px-8 pb-8">
            <Pressable
              onPress={handleContinue}
              disabled={!selectedType || (selectedType === "other" && !otherTypeDescription.trim())}
              className={`rounded-full py-4 items-center border ${
                selectedType && !(selectedType === "other" && !otherTypeDescription.trim())
                  ? 'bg-white/20 border-white/30' 
                  : 'bg-white/5 border-white/10'
              }`}
              style={({ pressed }) => ({
                opacity: pressed ? 0.8 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              })}
            >
              <LinearGradient
                colors={selectedType && !(selectedType === "other" && !otherTypeDescription.trim())
                  ? ['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']
                  : ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']
                }
                className="absolute inset-0 rounded-full"
              />
              <Text className={`text-lg font-semibold ${
                selectedType && !(selectedType === "other" && !otherTypeDescription.trim()) ? 'text-white' : 'text-white/40'
              }`}>
                Continue
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
};