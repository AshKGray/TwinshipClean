import React, { useState } from "react";
import { View, Text, Pressable, ScrollView, Switch, ImageBackground } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTwinStore } from "../state/twinStore";
import { Ionicons } from "@expo/vector-icons";

export const ResearchScreen = () => {
  const { themeColor, researchParticipation, setResearchParticipation, twinType } = useTwinStore();
  const [selectedStudies, setSelectedStudies] = useState<string[]>([]);

  const researchStudies = [
    {
      id: "synchronicity",
      title: "Twin Synchronicity Study",
      description: "Help us understand how twins experience simultaneous thoughts, feelings, and actions.",
      duration: "6 months",
      compensation: "Research insights",
      participants: 1247,
    },
    {
      id: "emotional_connection",
      title: "Emotional Mirroring Research",
      description: "Study the emotional connections between twins across distances.",
      duration: "3 months", 
      compensation: "Early access to features",
      participants: 892,
    },
    {
      id: "genetic_behavior",
      title: "Genetics & Behavior Correlation",
      description: "Explore how genetic similarities influence behavioral patterns in twins.",
      duration: "12 months",
      compensation: "Personalized insights",
      participants: 634,
    },
  ];

  const toggleStudySelection = (studyId: string) => {
    setSelectedStudies(prev => 
      prev.includes(studyId) 
        ? prev.filter(id => id !== studyId)
        : [...prev, studyId]
    );
  };

  const handleJoinResearch = () => {
    setResearchParticipation(true);
    // In a real app, this would send the selected studies to the backend
  };

  const handleLeaveResearch = () => {
    setResearchParticipation(false);
    setSelectedStudies([]);
  };

  return (
    <ImageBackground source={require("../../assets/galaxybackground.png")} style={{ flex: 1 }}>
      <SafeAreaView className="flex-1">
        <ScrollView className="flex-1 px-6">
          {/* Header */}
          <View className="py-4">
            <Text className="text-white text-2xl font-bold text-center">
              Twin Research
            </Text>
            <Text className="text-white/70 text-center mt-2">
              Contribute to groundbreaking twin studies
            </Text>
          </View>

          {/* Current Status */}
          <View className="bg-white/10 rounded-xl p-6 mb-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-white text-xl font-semibold">Research Participation</Text>
              <Switch
                value={researchParticipation}
                onValueChange={researchParticipation ? handleLeaveResearch : () => {}}
                trackColor={{ false: "#374151", true: "#8b5cf6" }}
                thumbColor={researchParticipation ? "#ffffff" : "#9ca3af"}
              />
            </View>
            
            <View className="flex-row items-center">
              <Ionicons 
                name={researchParticipation ? "checkmark-circle" : "close-circle"} 
                size={24} 
                color={researchParticipation ? "#10b981" : "#ef4444"} 
              />
              <Text className="text-white ml-3">
                {researchParticipation ? "Currently participating" : "Not participating"}
              </Text>
            </View>
            
            {researchParticipation && (
              <Text className="text-white/70 text-sm mt-2">
                Thank you for contributing to twin research! Your data helps us understand the unique bond between twins.
              </Text>
            )}
          </View>

          {/* Twin Type Info */}
          <View className="bg-white/5 rounded-xl p-4 mb-6">
            <View className="flex-row items-center">
              <Ionicons name="people" size={24} color="white" />
              <Text className="text-white ml-3">
                You are <Text className="font-semibold capitalize">{twinType || "unknown"}</Text> twins
              </Text>
            </View>
            <Text className="text-white/70 text-sm mt-2 ml-9">
              This information helps researchers categorize and analyze data appropriately.
            </Text>
          </View>

          {/* Available Studies */}
          <View className="mb-6">
            <Text className="text-white text-xl font-semibold mb-4">Available Studies</Text>
            
            <View className="space-y-4">
              {researchStudies.map((study) => (
                <View key={study.id} className="bg-white/10 rounded-xl p-6">
                  <View className="flex-row items-start justify-between mb-4">
                    <View className="flex-1">
                      <Text className="text-white text-lg font-semibold mb-2">
                        {study.title}
                      </Text>
                      <Text className="text-white/70 text-sm leading-5 mb-3">
                        {study.description}
                      </Text>
                      
                      <View className="flex-row items-center space-x-4">
                        <View className="flex-row items-center">
                          <Ionicons name="time" size={16} color="rgba(255,255,255,0.7)" />
                          <Text className="text-white/70 text-sm ml-1">{study.duration}</Text>
                        </View>
                        
                        <View className="flex-row items-center">
                          <Ionicons name="people" size={16} color="rgba(255,255,255,0.7)" />
                          <Text className="text-white/70 text-sm ml-1">{study.participants} participants</Text>
                        </View>
                      </View>
                      
                      <View className="bg-purple-500/20 rounded-lg p-3 mt-3">
                        <Text className="text-purple-300 text-sm font-medium">
                          Compensation: {study.compensation}
                        </Text>
                      </View>
                    </View>
                  </View>
                  
                  {!researchParticipation && (
                    <Pressable
                      onPress={() => toggleStudySelection(study.id)}
                      className={`flex-row items-center justify-center py-3 rounded-lg ${
                        selectedStudies.includes(study.id)
                          ? "bg-purple-500"
                          : "bg-white/20"
                      }`}
                    >
                      <Ionicons 
                        name={selectedStudies.includes(study.id) ? "checkmark" : "add"} 
                        size={20} 
                        color="white" 
                      />
                      <Text className="text-white font-semibold ml-2">
                        {selectedStudies.includes(study.id) ? "Selected" : "Select Study"}
                      </Text>
                    </Pressable>
                  )}
                  
                  {researchParticipation && (
                    <View className="bg-green-500/20 rounded-lg p-3">
                      <View className="flex-row items-center justify-center">
                        <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                        <Text className="text-green-300 font-semibold ml-2">Participating</Text>
                      </View>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>

          {/* Join Research Button */}
          {!researchParticipation && selectedStudies.length > 0 && (
            <View className="mb-8">
              <Pressable
                onPress={handleJoinResearch}
                className="bg-purple-500 py-4 rounded-xl items-center"
              >
                <Text className="text-white text-lg font-semibold">
                  Join Research ({selectedStudies.length} studies)
                </Text>
              </Pressable>
              
              <Text className="text-white/50 text-sm text-center mt-4">
                By joining, you agree to share anonymized data to help advance twin research.
                You can opt out at any time.
              </Text>
            </View>
          )}

          {/* Research Benefits */}
          <View className="bg-white/5 rounded-xl p-6 mb-8">
            <Text className="text-white text-lg font-semibold mb-4">Why Participate?</Text>
            
            <View className="space-y-3">
              <View className="flex-row items-start">
                <Ionicons name="bulb" size={20} color="#fbbf24" />
                <Text className="text-white/70 text-sm ml-3 flex-1">
                  Contribute to groundbreaking research on twin connections and synchronicity
                </Text>
              </View>
              
              <View className="flex-row items-start">
                <Ionicons name="shield-checkmark" size={20} color="#10b981" />
                <Text className="text-white/70 text-sm ml-3 flex-1">
                  All data is anonymized and securely stored following research ethics guidelines
                </Text>
              </View>
              
              <View className="flex-row items-start">
                <Ionicons name="gift" size={20} color="#8b5cf6" />
                <Text className="text-white/70 text-sm ml-3 flex-1">
                  Receive personalized insights about your twin connection
                </Text>
              </View>
              
              <View className="flex-row items-start">
                <Ionicons name="people" size={20} color="#3b82f6" />
                <Text className="text-white/70 text-sm ml-3 flex-1">
                  Help other twins understand their unique bonds better
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
};