import React, { memo, useMemo, useCallback } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { getNeonAccentColor, getNeonAccentColorWithOpacity, getNeonGradientColors } from '../../utils/neonColors';
import { ThemeColor } from '../../state/twinStore';

interface AssessmentCardProps {
  assessment: {
    id: string;
    title: string;
    description: string;
    category: 'emotional' | 'cognitive' | 'communication' | 'compatibility';
    duration: number; // in minutes
    questionCount: number;
    isPremium?: boolean;
    completedAt?: string;
    score?: number;
  };
  themeColor: ThemeColor;
  onPress: (assessmentId: string) => void;
  disabled?: boolean;
  locked?: boolean;
}

export const AssessmentCard = memo<AssessmentCardProps>(({
  assessment,
  themeColor,
  onPress,
  disabled = false,
  locked = false
}) => {
  // Memoize color calculations
  const colors = useMemo(() => {
    const gradientColors = getNeonGradientColors(themeColor);
    return {
      accent: getNeonAccentColor(themeColor),
      cardBg: getNeonAccentColorWithOpacity(themeColor, 0.1),
      gradient: gradientColors as [string, string, string],
    };
  }, [themeColor]);

  // Memoize category icon and color
  const categoryConfig = useMemo(() => {
    switch (assessment.category) {
      case 'emotional':
        return { icon: 'heart', color: '#ec4899' };
      case 'cognitive':
        return { icon: 'brain', color: '#8b5cf6' };
      case 'communication':
        return { icon: 'chatbubbles', color: '#06b6d4' };
      case 'compatibility':
        return { icon: 'people', color: '#10b981' };
      default:
        return { icon: 'help-circle', color: '#6b7280' };
    }
  }, [assessment.category]);

  // Memoize completion status
  const isCompleted = useMemo(() => !!assessment.completedAt, [assessment.completedAt]);

  // Memoized press handler
  const handlePress = useCallback(() => {
    if (!disabled && !locked) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress(assessment.id);
    }
  }, [disabled, locked, onPress, assessment.id]);

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || locked}
      className={`rounded-2xl overflow-hidden ${disabled || locked ? 'opacity-50' : ''}`}
      style={{
        backgroundColor: colors.cardBg
      }}
    >
      {/* Premium Badge */}
      {assessment.isPremium && (
        <LinearGradient
          colors={colors.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className="absolute top-0 right-0 px-3 py-1 rounded-bl-xl"
        >
          <Text className="text-white text-xs font-bold">PREMIUM</Text>
        </LinearGradient>
      )}

      <View className="p-6">
        {/* Header */}
        <View className="flex-row items-start mb-4">
          <View
            className="w-12 h-12 rounded-full items-center justify-center mr-3"
            style={{
              backgroundColor: categoryConfig.color + '20',
            }}
          >
            <Ionicons
              name={categoryConfig.icon as any}
              size={24}
              color={categoryConfig.color}
            />
          </View>

          <View className="flex-1">
            <Text className="text-white text-lg font-semibold mb-1">
              {assessment.title}
            </Text>
            <Text className="text-white/70 text-sm leading-5">
              {assessment.description}
            </Text>
          </View>
        </View>

        {/* Assessment Info */}
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center space-x-4">
            <View className="flex-row items-center">
              <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.6)" />
              <Text className="text-white/60 text-xs ml-1">
                {assessment.duration} min
              </Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="help-circle-outline" size={14} color="rgba(255,255,255,0.6)" />
              <Text className="text-white/60 text-xs ml-1">
                {assessment.questionCount} questions
              </Text>
            </View>
          </View>

          {locked && (
            <Ionicons name="lock-closed" size={16} color="rgba(255,255,255,0.4)" />
          )}
        </View>

        {/* Completion Status or Score */}
        {isCompleted ? (
          <View className="bg-green-500/20 rounded-lg p-3">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                <Text className="text-green-500 text-sm font-semibold ml-2">
                  Completed
                </Text>
              </View>
              {assessment.score !== undefined && (
                <Text className="text-white font-bold">
                  {assessment.score}%
                </Text>
              )}
            </View>
            {assessment.completedAt && (
              <Text className="text-white/50 text-xs mt-1">
                {new Date(assessment.completedAt).toLocaleDateString()}
              </Text>
            )}
          </View>
        ) : (
          <Pressable
            onPress={handlePress}
            disabled={disabled || locked}
            className="rounded-lg overflow-hidden"
          >
            <LinearGradient
              colors={locked ? ['#4b5563', '#374151'] : colors.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="py-3 px-4"
            >
              <Text className="text-white text-center font-semibold">
                {locked ? 'Unlock with Premium' : 'Start Assessment'}
              </Text>
            </LinearGradient>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for better performance
  return (
    prevProps.assessment.id === nextProps.assessment.id &&
    prevProps.assessment.completedAt === nextProps.assessment.completedAt &&
    prevProps.assessment.score === nextProps.assessment.score &&
    prevProps.themeColor === nextProps.themeColor &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.locked === nextProps.locked
  );
});

AssessmentCard.displayName = 'AssessmentCard';