import React from 'react';
import { Pressable, Text, View, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useTwinStore } from '../state/twinStore';
import { useInvitationStore } from '../state/invitationStore';
import { getNeonAccentColor, getNeonAccentColorWithOpacity } from '../utils/neonColors';

interface InvitationButtonProps {
  variant?: 'primary' | 'secondary' | 'minimal';
  size?: 'small' | 'medium' | 'large';
  showIcon?: boolean;
  disabled?: boolean;
  onPress?: () => void;
}

export const InvitationButton: React.FC<InvitationButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  showIcon = true,
  disabled = false,
  onPress,
}) => {
  const navigation = useNavigation();
  const { userProfile, paired } = useTwinStore();
  const { isLoading, invitationStep } = useInvitationStore();
  
  const accentColor = userProfile?.accentColor || 'neon-purple';
  const themeColor = getNeonAccentColor(accentColor);
  const themeColorWithOpacity = getNeonAccentColorWithOpacity(accentColor, 0.3);

  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }

    if (!userProfile) {
      Alert.alert('Setup Required', 'Please complete your profile setup first.');
      return;
    }

    if (paired) {
      Alert.alert(
        'Already Connected',
        'You are already connected with your twin! You can find them in the Twin Talk chat.',
        [{ text: 'OK' }]
      );
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('SendInvitation' as never);
  };

  const getButtonText = () => {
    if (paired) {
      return 'Connected';
    }

    if (isLoading) {
      return 'Sending...';
    }

    if (invitationStep === 'sent' || invitationStep === 'success') {
      return 'Invitation Sent';
    }

    switch (size) {
      case 'small':
        return 'Invite';
      case 'large':
        return 'Send Twin Invitation';
      default:
        return 'Invite Twin';
    }
  };

  const getButtonStyle = () => {
    const baseStyle = 'rounded-xl items-center justify-center flex-row';
    
    const sizeStyles = {
      small: 'px-3 py-2',
      medium: 'px-4 py-3',
      large: 'px-6 py-4',
    };

    const variantStyles = {
      primary: paired ? 'bg-green-500/30' : `bg-white/20`,
      secondary: 'bg-white/10 border border-white/30',
      minimal: 'bg-transparent',
    };

    return `${baseStyle} ${sizeStyles[size]} ${variantStyles[variant]}`;
  };

  const getTextStyle = () => {
    const sizeStyles = {
      small: 'text-sm',
      medium: 'text-base',
      large: 'text-lg',
    };

    return `text-white font-semibold ${sizeStyles[size]}`;
  };

  const getIconSize = () => {
    switch (size) {
      case 'small':
        return 16;
      case 'large':
        return 24;
      default:
        return 20;
    }
  };

  const getIconName = (): keyof typeof Ionicons.glyphMap => {
    if (paired) {
      return 'checkmark-circle';
    }

    if (isLoading) {
      return 'hourglass';
    }

    if (invitationStep === 'sent' || invitationStep === 'success') {
      return 'paper-plane';
    }

    return 'heart';
  };

  const getIconColor = () => {
    if (paired) {
      return '#10b981'; // green-500
    }

    return variant === 'primary' ? themeColor : 'rgba(255, 255, 255, 0.8)';
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || isLoading}
      className={getButtonStyle()}
      style={{
        backgroundColor: variant === 'primary' && !paired ? themeColorWithOpacity : undefined,
        opacity: disabled || isLoading ? 0.6 : 1,
      }}
    >
      {showIcon && (
        <Ionicons
          name={getIconName()}
          size={getIconSize()}
          color={getIconColor()}
          style={{ marginRight: 6 }}
        />
      )}
      <Text className={getTextStyle()}>
        {getButtonText()}
      </Text>
    </Pressable>
  );
};

// Convenience components for common use cases
export const InvitationFAB: React.FC<{ onPress?: () => void }> = ({ onPress }) => (
  <View className="absolute bottom-6 right-6">
    <InvitationButton
      variant="primary"
      size="large"
      onPress={onPress}
    />
  </View>
);

export const InvitationMenuItem: React.FC<{ onPress?: () => void }> = ({ onPress }) => (
  <InvitationButton
    variant="minimal"
    size="medium"
    onPress={onPress}
  />
);

export const InvitationStatusBadge: React.FC = () => {
  const { paired, invitationStatus } = useTwinStore();
  const { invitationStep } = useInvitationStore();

  if (paired) {
    return (
      <View className="flex-row items-center bg-green-500/20 rounded-full px-3 py-1">
        <Ionicons name="checkmark-circle" size={16} color="#10b981" />
        <Text className="text-green-400 text-xs font-medium ml-1">
          Connected
        </Text>
      </View>
    );
  }

  if (invitationStep === 'sent' || invitationStep === 'success') {
    return (
      <View className="flex-row items-center bg-blue-500/20 rounded-full px-3 py-1">
        <Ionicons name="paper-plane" size={16} color="#3b82f6" />
        <Text className="text-blue-400 text-xs font-medium ml-1">
          Invitation Sent
        </Text>
      </View>
    );
  }

  if (invitationStatus === 'received') {
    return (
      <View className="flex-row items-center bg-yellow-500/20 rounded-full px-3 py-1">
        <Ionicons name="mail" size={16} color="#eab308" />
        <Text className="text-yellow-400 text-xs font-medium ml-1">
          Invitation Received
        </Text>
      </View>
    );
  }

  return null;
};