import React, { useEffect } from 'react';
import { View, Alert, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ConsentForm } from '../../components/research/ConsentForm';
import { useResearchStore } from '../../state/researchStore';
import { useTwinStore } from '../../state/twinStore';
import { ConsentItem } from '../../types/research';

export const ConsentScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { studyId } = route.params as { studyId: string };
  
  const { userProfile } = useTwinStore();
  const { 
    selectedStudy, 
    consentInProgress, 
    error,
    recordConsent,
    joinStudy,
    loadAvailableStudies,
    selectStudy,
    clearError
  } = useResearchStore();

  useEffect(() => {
    // Load studies and select the current one
    loadAvailableStudies().then(() => {
      // Find and select the study
      const studies = useResearchStore.getState().availableStudies;
      const study = studies.find(s => s.id === studyId);
      if (study) {
        selectStudy(study);
      } else {
        Alert.alert('Study Not Found', 'The requested study could not be found.');
        navigation.goBack();
      }
    });

    return () => {
      clearError();
    };
  }, [studyId]);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
    }
  }, [error]);

  const handleConsent = async (consentItems: ConsentItem[]) => {
    if (!userProfile || !selectedStudy) return;

    try {
      // Record consent
      await recordConsent(
        userProfile.id,
        selectedStudy.id,
        consentItems,
        'user_ip' // In production, get actual IP
      );

      // Join the study
      await joinStudy(userProfile.id, selectedStudy.id);

      Alert.alert(
        'Welcome to the Study!',
        `You have successfully joined "${selectedStudy.title}". Thank you for contributing to twin research!`,
        [
          {
            text: 'View Dashboard',
            onPress: () => navigation.navigate('ResearchDashboardScreen' as never)
          },
          {
            text: 'Continue',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      console.error('Error during consent process:', error);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  if (!selectedStudy) {
    return (
      <ImageBackground source={require("../../assets/galaxybackground.png")} style={{ flex: 1 }}>
        <SafeAreaView className="flex-1 justify-center items-center">
          <View className="bg-white/10 rounded-xl p-6">
            <Text className="text-white text-lg">Loading study information...</Text>
          </View>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground source={require("../../assets/galaxybackground.png")} style={{ flex: 1 }}>
      <SafeAreaView className="flex-1">
        <ConsentForm
          study={selectedStudy}
          onConsent={handleConsent}
          onCancel={handleCancel}
          isLoading={consentInProgress}
        />
      </SafeAreaView>
    </ImageBackground>
  );
};