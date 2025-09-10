import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTwinStore } from "../../state/twinStore";
import { useSubscriptionStore } from "../../state/subscriptionStore";
import { getNeonAccentColor } from "../../utils/neonColors";

interface PremiumBadgeProps {
  featureId: string;
  size?: "small" | "medium" | "large";
  variant?: "badge" | "button" | "icon";
  onPress?: () => void;
  showText?: boolean;
}

export const PremiumBadge: React.FC<PremiumBadgeProps> = ({
  featureId,
  size = "medium",
  variant = "badge",
  onPress,
  showText = true
}) => {
  const userProfile = useTwinStore((state) => state.userProfile);
  const hasAccessTo = useSubscriptionStore((state) => state.hasAccessTo);
  const trackConversionEvent = useSubscriptionStore((state) => state.trackConversionEvent);
  
  const accentColor = userProfile?.accentColor || "neon-purple";
  const neonColor = getNeonAccentColor(accentColor);
  const hasAccess = hasAccessTo(featureId);

  const handlePress = () => {
    if (onPress) {
      trackConversionEvent('premium_badge_clicked', { featureId, variant });
      onPress();
    }
  };

  // Don't show badge if user has access
  if (hasAccess) {
    return null;
  }

  const getSizeStyles = () => {
    switch (size) {
      case "small":
        return {
          container: "px-2 py-1",
          text: "text-xs",
          icon: 12
        };
      case "large": 
        return {
          container: "px-4 py-2",
          text: "text-sm",
          icon: 16
        };
      default:
        return {
          container: "px-3 py-1.5",
          text: "text-xs",
          icon: 14
        };
    }
  };

  const sizeStyles = getSizeStyles();

  if (variant === "icon") {
    return (
      <TouchableOpacity
        onPress={handlePress}
        disabled={!onPress}
        style={{ 
          backgroundColor: `${neonColor}20`,
          opacity: onPress ? 1 : 0.8
        }}
        className="w-6 h-6 rounded-full items-center justify-center"
      >
        <Ionicons name="star" size={sizeStyles.icon} color={neonColor} />
      </TouchableOpacity>
    );
  }

  if (variant === "button") {
    return (
      <TouchableOpacity
        onPress={handlePress}
        disabled={!onPress}
        style={{ backgroundColor: `${neonColor}20`, borderColor: neonColor }}
        className={`${sizeStyles.container} rounded-full border flex-row items-center ${!onPress ? 'opacity-60' : ''}`}
      >
        <Ionicons name="star" size={sizeStyles.icon} color={neonColor} />
        {showText && (
          <Text 
            className={`${sizeStyles.text} font-bold ml-1`}
            style={{ color: neonColor }}
          >
            PREMIUM
          </Text>
        )}
      </TouchableOpacity>
    );
  }

  // Default badge variant
  return (
    <View
      style={{ backgroundColor: `${neonColor}20` }}
      className={`${sizeStyles.container} rounded-full flex-row items-center`}
    >
      <Ionicons name="star" size={sizeStyles.icon} color={neonColor} />
      {showText && (
        <Text 
          className={`${sizeStyles.text} font-bold ml-1`}
          style={{ color: neonColor }}
        >
          PRO
        </Text>
      )}
    </View>
  );
};

// Utility component for quick feature labeling
export const PremiumLabel: React.FC<{ featureId: string }> = ({ featureId }) => {
  return (
    <PremiumBadge 
      featureId={featureId}
      size="small"
      variant="badge"
      showText={true}
    />
  );
};

// Utility component for upgrade buttons
export const PremiumUpgradeButton: React.FC<{ 
  featureId: string; 
  onUpgrade: () => void;
  text?: string; 
}> = ({ 
  featureId, 
  onUpgrade, 
  text = "UPGRADE" 
}) => {
  const userProfile = useTwinStore((state) => state.userProfile);
  const hasAccessTo = useSubscriptionStore((state) => state.hasAccessTo);
  const accentColor = userProfile?.accentColor || "neon-purple";
  const neonColor = getNeonAccentColor(accentColor);

  if (hasAccessTo(featureId)) {
    return null;
  }

  return (
    <TouchableOpacity
      onPress={onUpgrade}
      style={{ backgroundColor: neonColor }}
      className="px-4 py-2 rounded-full flex-row items-center"
    >
      <Ionicons name="star" size={14} color="black" />
      <Text className="text-black font-bold text-sm ml-1">
        {text}
      </Text>
    </TouchableOpacity>
  );
};