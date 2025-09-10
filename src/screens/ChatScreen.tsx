import React from 'react';
import { ImageBackground, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTwinStore } from '../state/twinStore';
import { TwinTalkScreen } from './chat/TwinTalkScreen';

// Legacy ChatScreen - now redirects to TwinTalkScreen
export const ChatScreen = () => {
  const userProfile = useTwinStore((state) => state.userProfile);
  const accentColor = userProfile?.accentColor || 'neon-purple';

  // Simply render the new TwinTalkScreen
  return <TwinTalkScreen />;
};