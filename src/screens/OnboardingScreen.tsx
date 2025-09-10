import React, { useState } from "react";
import { View } from "react-native";
import { useTwinStore } from "../state/twinStore";

// Import all onboarding screens
import { WelcomeScreen } from "./onboarding/WelcomeScreen";
import { PhotoSetupScreen } from "./onboarding/PhotoSetupScreen";
import { PersonalDetailsScreen } from "./onboarding/PersonalDetailsScreen";
import { TwinTypeScreen } from "./onboarding/TwinTypeScreen";
import { ColorSelectionScreen } from "./onboarding/ColorSelectionScreen";
import { ProfileReviewScreen } from "./onboarding/ProfileReviewScreen";

interface OnboardingScreenProps {
  onComplete: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  onComplete,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const { userProfile } = useTwinStore();

  const handleNext = () => {
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  const handleEdit = (step: number) => {
    setCurrentStep(step - 1); // Convert to 0-based index
  };

  const handleComplete = () => {
    onComplete();
  };

  const screens = [
    <WelcomeScreen key="welcome" onContinue={handleNext} />,
    <PhotoSetupScreen key="photo" onContinue={handleNext} onBack={handleBack} />,
    <PersonalDetailsScreen key="details" onContinue={handleNext} onBack={handleBack} />,
    <TwinTypeScreen key="twintype" onContinue={handleNext} onBack={handleBack} />,
    <ColorSelectionScreen key="color" onContinue={handleNext} onBack={handleBack} />,
    <ProfileReviewScreen 
      key="review" 
      onComplete={handleComplete} 
      onBack={handleBack} 
      onEdit={handleEdit}
    />,
  ];

  return (
    <View className="flex-1">
      {screens[currentStep]}
    </View>
  );
};