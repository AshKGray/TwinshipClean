import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface DifferenceIndicatorProps {
  difference: number;
  accentColor: string;
  size?: "small" | "medium" | "large";
  showNumber?: boolean;
}

export const DifferenceIndicator: React.FC<DifferenceIndicatorProps> = ({
  difference,
  accentColor,
  size = "medium",
  showNumber = true
}) => {
  const getSizeStyles = () => {
    switch (size) {
      case "small":
        return {
          iconSize: 12,
          textSize: "text-xs",
          containerPadding: "px-1 py-0.5"
        };
      case "large":
        return {
          iconSize: 20,
          textSize: "text-base",
          containerPadding: "px-3 py-1"
        };
      default:
        return {
          iconSize: 16,
          textSize: "text-sm",
          containerPadding: "px-2 py-1"
        };
    }
  };

  const { iconSize, textSize, containerPadding } = getSizeStyles();
  
  const getDifferenceInfo = () => {
    if (difference > 10) {
      return {
        color: "#10b981",
        bgColor: "#10b98120",
        icon: "trending-up",
        label: "Higher",
        description: "You score higher"
      };
    } else if (difference > 3) {
      return {
        color: "#3b82f6",
        bgColor: "#3b82f620",
        icon: "arrow-up",
        label: "Slightly Higher",
        description: "You score slightly higher"
      };
    } else if (difference < -10) {
      return {
        color: "#ef4444",
        bgColor: "#ef444420",
        icon: "trending-down",
        label: "Lower",
        description: "Twin scores higher"
      };
    } else if (difference < -3) {
      return {
        color: "#f59e0b",
        bgColor: "#f59e0b20",
        icon: "arrow-down",
        label: "Slightly Lower",
        description: "Twin scores slightly higher"
      };
    } else {
      return {
        color: "#6b7280",
        bgColor: "#6b728020",
        icon: "remove",
        label: "Balanced",
        description: "Very similar scores"
      };
    }
  };

  const info = getDifferenceInfo();
  const absoluteDifference = Math.abs(difference);

  return (
    <View 
      className={`flex-row items-center rounded-full ${containerPadding}`}
      style={{ backgroundColor: info.bgColor }}
    >
      <Ionicons 
        name={info.icon as any} 
        size={iconSize} 
        color={info.color} 
      />
      {showNumber && absoluteDifference > 0 && (
        <Text 
          className={`font-bold ml-1 ${textSize}`}
          style={{ color: info.color }}
        >
          {absoluteDifference}
        </Text>
      )}
    </View>
  );
};