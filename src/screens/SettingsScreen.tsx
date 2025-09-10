import React, { useState } from "react";
import { View, Text, Pressable, Alert, ScrollView, TextInput, Modal, ImageBackground } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useTwinStore } from "../state/twinStore";
import { Ionicons } from "@expo/vector-icons";
import { getNeonAccentColor } from "../utils/neonColors";

export const SettingsScreen = () => {
  const navigation = useNavigation<any>();
  const { userProfile, twinProfile, signOut, researchParticipation, setResearchParticipation, notificationsEnabled, setNotificationsEnabled, setUserProfile } = useTwinStore();
  const themeColor = userProfile?.accentColor || "neon-purple";
  
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState("");
  const [showLocationSettings, setShowLocationSettings] = useState(false);

  const handleSignOut = () => {
    Alert.alert(
      "Twinconnect",
      "Are you sure you want to twinconnect? You'll need to complete the setup process again to re-establish twinsync.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Twinconnect", 
          style: "destructive", 
          onPress: () => {
            signOut();
            Alert.alert("Twinconnected", "You have been successfully twinconnected.");
          }
        }
      ]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const startEditing = (field: string, currentValue: string) => {
    setEditingField(field);
    setTempValue(currentValue);
  };

  const saveEdit = () => {
    if (!userProfile || !editingField) return;
    
    const updatedProfile = { ...userProfile };
    switch (editingField) {
      case 'name':
        updatedProfile.name = tempValue;
        break;
      case 'age':
        const age = parseInt(tempValue);
        if (!isNaN(age) && age > 0 && age < 150) {
          updatedProfile.age = age;
        } else {
          Alert.alert("Invalid Age", "Please enter a valid age between 1 and 149");
          return;
        }
        break;
    }
    
    setUserProfile(updatedProfile);
    setEditingField(null);
    setTempValue("");
  };

  const cancelEdit = () => {
    setEditingField(null);
    setTempValue("");
  };

  return (
    <ImageBackground source={require("../../assets/galaxybackground.png")} style={{ flex: 1 }}>
      <SafeAreaView className="flex-1">
        <ScrollView className="flex-1 px-6">
          {/* Header */}
          <View className="flex-row items-center justify-between py-4">
            <Pressable onPress={() => navigation.goBack()} className="w-10 h-10 rounded-full bg-white/10 items-center justify-center">
              <Ionicons name="chevron-back" size={20} color="white" />
            </Pressable>
            <View className="flex-1">
              <Text className="text-white text-2xl font-bold text-center">
                Twinsettings
              </Text>
              <Text className="text-white/70 text-center mt-2">
                Manage your twincredible account and preferences
              </Text>
            </View>
            <View className="w-10" />
          </View>

          {/* User Profile Section */}
          {userProfile && (
            <View className="bg-white/10 rounded-xl p-6 mb-6">
              <Text className="text-white text-lg font-semibold mb-4">Your Twinprofile</Text>
              
              <View className="space-y-4">
                {/* Editable Name */}
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <Ionicons name="person" size={20} color="white" />
                    {editingField === 'name' ? (
                      <View className="flex-1 ml-3 flex-row items-center">
                        <TextInput
                          value={tempValue}
                          onChangeText={setTempValue}
                          className="text-white flex-1 bg-white/20 rounded-lg px-3 py-2 mr-2"
                          placeholder="Enter name"
                          placeholderTextColor="rgba(255,255,255,0.5)"
                        />
                        <Pressable onPress={saveEdit} className="bg-green-500/30 rounded-lg p-2 mr-1">
                          <Ionicons name="checkmark" size={16} color="white" />
                        </Pressable>
                        <Pressable onPress={cancelEdit} className="bg-red-500/30 rounded-lg p-2">
                          <Ionicons name="close" size={16} color="white" />
                        </Pressable>
                      </View>
                    ) : (
                      <Text className="text-white ml-3 flex-1">{userProfile.name}</Text>
                    )}
                  </View>
                  {editingField !== 'name' && (
                    <Pressable onPress={() => startEditing('name', userProfile.name)} className="ml-3">
                      <Ionicons name="pencil" size={18} color="rgba(255,255,255,0.7)" />
                    </Pressable>
                  )}
                </View>
                
                {/* Editable Age */}
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <Ionicons name="calendar" size={20} color="white" />
                    {editingField === 'age' ? (
                      <View className="flex-1 ml-3 flex-row items-center">
                        <TextInput
                          value={tempValue}
                          onChangeText={setTempValue}
                          className="text-white flex-1 bg-white/20 rounded-lg px-3 py-2 mr-2"
                          placeholder="Enter age"
                          placeholderTextColor="rgba(255,255,255,0.5)"
                          keyboardType="numeric"
                        />
                        <Pressable onPress={saveEdit} className="bg-green-500/30 rounded-lg p-2 mr-1">
                          <Ionicons name="checkmark" size={16} color="white" />
                        </Pressable>
                        <Pressable onPress={cancelEdit} className="bg-red-500/30 rounded-lg p-2">
                          <Ionicons name="close" size={16} color="white" />
                        </Pressable>
                      </View>
                    ) : (
                      <Text className="text-white ml-3 flex-1">Age: {userProfile.age}</Text>
                    )}
                  </View>
                  {editingField !== 'age' && (
                    <Pressable onPress={() => startEditing('age', userProfile.age.toString())} className="ml-3">
                      <Ionicons name="pencil" size={18} color="rgba(255,255,255,0.7)" />
                    </Pressable>
                  )}
                </View>
                
                <View className="flex-row items-center">
                  <Ionicons name="transgender" size={20} color="white" />
                  <Text className="text-white ml-3">Gender: {userProfile.gender}</Text>
                </View>
                
                <View className="flex-row items-center">
                  <Ionicons name="people" size={20} color="white" />
                  <Text className="text-white ml-3 capitalize">{userProfile.twinType} Twin</Text>
                </View>
                
                <View className="flex-row items-center">
                  <Ionicons name="gift" size={20} color="white" />
                  <Text className="text-white ml-3">Birthday: {formatDate(userProfile.birthDate)}</Text>
                </View>
                
                <View className="flex-row items-center">
                  <View 
                    className="w-5 h-5 rounded-full mr-3"
                    style={{ backgroundColor: getNeonAccentColor(userProfile.accentColor) }}
                  />
                  <Text className="text-white">Your Accent Color</Text>
                </View>
              </View>
            </View>
          )}

          {/* Twin Connection Section */}
          {twinProfile && (
            <View className="bg-white/10 rounded-xl p-6 mb-6">
              <Text className="text-white text-lg font-semibold mb-4">Twinconnection Status</Text>
              
              <View className="space-y-3">
                <View className="flex-row items-center">
                  <Ionicons name="heart" size={20} color="white" />
                  <Text className="text-white ml-3">{twinProfile.name}</Text>
                </View>
                
                <View className="flex-row items-center">
                  <View 
                    className="w-5 h-5 rounded-full mr-3"
                    style={{ backgroundColor: getNeonAccentColor(twinProfile.accentColor) }}
                  />
                  <Text className="text-white">Twin's Accent Color</Text>
                </View>
                
                <View className="flex-row items-center">
                  <View className={`w-3 h-3 rounded-full mr-3 ${twinProfile.isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                  <Text className="text-white">{twinProfile.isConnected ? 'Twinsync Active' : 'Twinconnection Lost'}</Text>
                </View>
              </View>
            </View>
          )}

          {/* App Settings */}
          <View className="bg-white/10 rounded-xl p-6 mb-6">
            <Text className="text-white text-lg font-semibold mb-4">Twincredible Settings</Text>
            
            <View className="space-y-4">
              <Pressable
                onPress={() => setNotificationsEnabled(!notificationsEnabled)}
                className="flex-row items-center justify-between"
              >
                <View className="flex-row items-center">
                  <Ionicons name="notifications" size={20} color="white" />
                  <Text className="text-white ml-3">Twinspirations</Text>
                </View>
                <Ionicons 
                  name={notificationsEnabled ? "toggle" : "toggle-outline"} 
                  size={24} 
                  color={notificationsEnabled ? getNeonAccentColor(themeColor) : "rgba(255,255,255,0.5)"} 
                />
              </Pressable>
              
              <Pressable
                onPress={() => setResearchParticipation(!researchParticipation)}
                className="flex-row items-center justify-between"
              >
                <View className="flex-row items-center">
                  <Ionicons name="flask" size={20} color="white" />
                  <Text className="text-white ml-3">Twinquiry Participation</Text>
                </View>
                <Ionicons 
                  name={researchParticipation ? "toggle" : "toggle-outline"} 
                  size={24} 
                  color={researchParticipation ? getNeonAccentColor(themeColor) : "rgba(255,255,255,0.5)"} 
                />
              </Pressable>

              <Pressable
                onPress={() => setShowLocationSettings(true)}
                className="flex-row items-center justify-between"
              >
                <View className="flex-row items-center">
                  <Ionicons name="location" size={20} color="white" />
                  <Text className="text-white ml-3">Location Sharing</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
              </Pressable>
            </View>
          </View>

          {/* Account Actions */}
          <View className="bg-white/10 rounded-xl p-6 mb-6">
            <Text className="text-white text-lg font-semibold mb-4">Twincredible Account</Text>
            
            <View className="space-y-4">
              <Pressable className="flex-row items-center">
                <Ionicons name="help-circle" size={20} color="white" />
                <Text className="text-white ml-3">Twincredible Support</Text>
                <View className="flex-1" />
                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
              </Pressable>
              
              <Pressable className="flex-row items-center">
                <Ionicons name="document-text" size={20} color="white" />
                <Text className="text-white ml-3">Twincredible Privacy</Text>
                <View className="flex-1" />
                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
              </Pressable>
            </View>
          </View>

          {/* Sign Out Button */}
          <View className="bg-white/10 rounded-xl p-6 mb-8">
            <Pressable
              onPress={handleSignOut}
              className="flex-row items-center justify-center py-2"
            >
              <Ionicons name="log-out" size={20} color="#ff4444" />
              <Text className="text-red-400 ml-3 text-lg font-semibold">Twinconnect</Text>
            </Pressable>
          </View>
        </ScrollView>

        {/* Location Settings Modal */}
        <Modal
          visible={showLocationSettings}
          animationType="slide"
          transparent={true}
        >
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-white/95 rounded-t-3xl p-6 max-h-96">
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-black text-xl font-bold">Location Sharing</Text>
                <Pressable onPress={() => setShowLocationSettings(false)}>
                  <Ionicons name="close" size={24} color="black" />
                </Pressable>
              </View>
              
              <View className="space-y-4">
                <Pressable className="flex-row items-center justify-between p-4 bg-gray-100 rounded-xl">
                  <View className="flex-row items-center">
                    <Ionicons name="location" size={20} color="#666" />
                    <Text className="text-black ml-3">Share Location with Twin</Text>
                  </View>
                  <Ionicons name="toggle-outline" size={24} color="#666" />
                </Pressable>
                
                <Pressable className="flex-row items-center justify-between p-4 bg-gray-100 rounded-xl">
                  <View className="flex-row items-center">
                    <Ionicons name="eye" size={20} color="#666" />
                    <Text className="text-black ml-3">See Twin's Location</Text>
                  </View>
                  <Ionicons name="toggle-outline" size={24} color="#666" />
                </Pressable>
                
                <Text className="text-gray-600 text-sm text-center mt-4 leading-5">
                  Location sharing allows you and your twin to see each other's real-time location on a map. This helps you stay connected and aware of each other's whereabouts.
                </Text>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </ImageBackground>
  );
};