import React, { memo, useMemo, useCallback } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { getNeonAccentColor, getNeonAccentColorWithOpacity } from '../../utils/neonColors';
import { ThemeColor } from '../../state/twinStore';

interface GameCardProps {
  game: {
    id: string;
    name: string;
    description: string;
    icon: string;
    difficulty: 'easy' | 'medium' | 'hard';
    rounds?: number;
    timeLimit?: number;
  };
  themeColor: ThemeColor;
  onPress: (gameId: string) => void;
  disabled?: boolean;
  stats?: {
    played: number;
    averageScore: number;
  };
}

export const GameCard = memo<GameCardProps>(({
  game,
  themeColor,
  onPress,
  disabled = false,
  stats
}) => {
  // Memoize color calculations
  const colors = useMemo(() => ({
    accent: getNeonAccentColor(themeColor),
    cardBg: getNeonAccentColorWithOpacity(themeColor, 0.1),
    iconBg: getNeonAccentColorWithOpacity(themeColor, 0.3),
  }), [themeColor]);

  // Memoize difficulty color
  const difficultyColor = useMemo(() => {
    switch (game.difficulty) {
      case 'easy': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'hard': return '#ef4444';
      default: return '#6b7280';
    }
  }, [game.difficulty]);

  // Memoized press handler
  const handlePress = useCallback(() => {
    if (!disabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress(game.id);
    }
  }, [disabled, onPress, game.id]);

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      className={`rounded-2xl p-6 ${disabled ? 'opacity-50' : ''}`}
      style={{
        backgroundColor: colors.cardBg
      }}
    >
      <View className="flex-row items-center">
        {/* Game Icon */}
        <View
          className="w-16 h-16 rounded-xl items-center justify-center mr-4"
          style={{
            backgroundColor: colors.iconBg
          }}
        >
          <Ionicons
            name={game.icon as any}
            size={32}
            color={colors.accent}
          />
        </View>

        {/* Game Info */}
        <View className="flex-1">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-white text-xl font-semibold">
              {game.name}
            </Text>
            <View
              className="px-3 py-1 rounded-full"
              style={{ backgroundColor: difficultyColor + '30' }}
            >
              <Text
                className="text-xs font-semibold capitalize"
                style={{ color: difficultyColor }}
              >
                {game.difficulty}
              </Text>
            </View>
          </View>

          <Text className="text-white/70 text-sm leading-5 mb-3">
            {game.description}
          </Text>

          <View className="flex-row items-center justify-between">
            <Text className="text-white/60 text-xs">
              {game.rounds ?? 1} rounds • {game.timeLimit ?? 60}s per round
            </Text>
            <Ionicons
              name="chevron-forward"
              size={16}
              color="rgba(255,255,255,0.6)"
            />
          </View>
        </View>
      </View>

      {/* Game Stats */}
      {stats && (
        <View className="mt-4 pt-4 border-t border-white/10">
          <View className="flex-row justify-between">
            <Text className="text-white/60 text-xs">
              Played: {stats.played}
            </Text>
            <Text className="text-white/60 text-xs">
              Success: {Math.round(stats.averageScore)}%
            </Text>
          </View>
        </View>
      )}
    </Pressable>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for better performance
  return (
    prevProps.game.id === nextProps.game.id &&
    prevProps.themeColor === nextProps.themeColor &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.stats?.played === nextProps.stats?.played &&
    prevProps.stats?.averageScore === nextProps.stats?.averageScore
  );
});

GameCard.displayName = 'GameCard';