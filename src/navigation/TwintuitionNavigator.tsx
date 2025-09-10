import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { TwintuitionHistoryScreen } from '../screens/TwintuitionHistoryScreen';
import { TwintuitionSettingsScreen } from '../screens/TwintuitionSettingsScreen';

export type TwintuitionStackParamList = {
  TwintuitionHistory: undefined;
  TwintuitionSettings: undefined;
};

const Stack = createStackNavigator<TwintuitionStackParamList>();

export const TwintuitionNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
      }}
    >
      <Stack.Screen 
        name="TwintuitionHistory" 
        component={TwintuitionHistoryScreen} 
      />
      <Stack.Screen 
        name="TwintuitionSettings" 
        component={TwintuitionSettingsScreen} 
      />
    </Stack.Navigator>
  );
};