import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  useAnimatedProps,
  interpolate
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { SyncScoreMetrics } from '../../types/games';
import { getNeonAccentColor } from '../../utils/neonColors';
import { ThemeColor } from '../../state/twinStore';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface SyncScoreDisplayProps {
  metrics: SyncScoreMetrics;
  themeColor: ThemeColor;
  compact?: boolean;
}

export const SyncScoreDisplay: React.FC<SyncScoreDisplayProps> = ({
  metrics,
  themeColor,
  compact = false
}) => {
  const { width } = Dimensions.get('window');
  const accentColor = getNeonAccentColor(themeColor);
  
  const circleProgress = useSharedValue(0);
  const statsOpacity = useSharedValue(0);
  
  React.useEffect(() => {
    circleProgress.value = withTiming(metrics.syncPercentage / 100, { duration: 1500 });
    statsOpacity.value = withSpring(1, { damping: 15 });
  }, [metrics.syncPercentage]);
  
  const radius = compact ? 40 : 60;
  const strokeWidth = compact ? 6 : 8;
  const circumference = 2 * Math.PI * radius;
  
  const animatedCircleProps = useAnimatedProps(() => {
    const strokeDashoffset = circumference * (1 - circleProgress.value);
    return {
      strokeDashoffset
    };
  });
  
  const statsStyle = useAnimatedStyle(() => {
    return {
      opacity: statsOpacity.value,
      transform: [{ scale: withSpring(statsOpacity.value) }]
    };
  });
  
  const getSyncLevel = () => {
    if (metrics.syncPercentage >= 80) return { label: 'Telepathic', color: '#10b981', icon: 'flash' };
    if (metrics.syncPercentage >= 60) return { label: 'Connected', color: accentColor, icon: 'link' };
    if (metrics.syncPercentage >= 40) return { label: 'Syncing', color: '#f59e0b', icon: 'pulse' };
    if (metrics.syncPercentage >= 20) return { label: 'Learning', color: '#8b5cf6', icon: 'school' };
    return { label: 'Exploring', color: '#6b7280', icon: 'compass' };
  };
  
  const syncLevel = getSyncLevel();
  
  if (compact) {
    return (
      <View className="flex-row items-center space-x-3">
        {/* Compact Circular Progress */}
        <View className="relative">
          <Svg width={radius * 2 + strokeWidth} height={radius * 2 + strokeWidth}>
            {/* Background Circle */}
            <Circle
              cx={radius + strokeWidth / 2}
              cy={radius + strokeWidth / 2}
              r={radius}
              stroke="rgba(255,255,255,0.2)"
              strokeWidth={strokeWidth}
              fill="none"
            />
            {/* Progress Circle */}
            <AnimatedCircle
              cx={radius + strokeWidth / 2}
              cy={radius + strokeWidth / 2}
              r={radius}
              stroke={syncLevel.color}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={circumference}
              strokeLinecap="round"
              transform={`rotate(-90 ${radius + strokeWidth / 2} ${radius + strokeWidth / 2})`}
              animatedProps={animatedCircleProps}
            />
          </Svg>
          <View className="absolute inset-0 items-center justify-center">
            <Text className="text-white text-sm font-bold">
              {metrics.syncPercentage}%
            </Text>
          </View>
        </View>
        
        {/* Compact Stats */}
        <Animated.View style={statsStyle}>
          <Text className="text-white font-semibold">{syncLevel.label}</Text>
          <Text className="text-white/70 text-sm">
            {metrics.totalGames} games • {metrics.perfectMatches} matches
          </Text>
        </Animated.View>
      </View>
    );
  }
  
  return (
    <View className="items-center">
      {/* Main Sync Circle */}
      <View className="relative mb-6">
        {/* Glow Effect */}
        <View 
          className="absolute inset-0 rounded-full blur-2xl"
          style={{
            backgroundColor: syncLevel.color,
            opacity: 0.3,
            width: (radius * 2) + 40,
            height: (radius * 2) + 40,
            left: -20,
            top: -20
          }}
        />
        
        <Svg width={radius * 2 + strokeWidth} height={radius * 2 + strokeWidth}>
          {/* Background Circle */}
          <Circle
            cx={radius + strokeWidth / 2}
            cy={radius + strokeWidth / 2}
            r={radius}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress Circle */}
          <AnimatedCircle
            cx={radius + strokeWidth / 2}
            cy={radius + strokeWidth / 2}
            r={radius}
            stroke={syncLevel.color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeLinecap="round"
            transform={`rotate(-90 ${radius + strokeWidth / 2} ${radius + strokeWidth / 2})`}
            animatedProps={animatedCircleProps}
          />
        </Svg>
        
        {/* Center Content */}
        <View className="absolute inset-0 items-center justify-center">
          <Text className="text-white text-2xl font-bold">
            {metrics.syncPercentage}%
          </Text>
          <Text className="text-white/70 text-sm mt-1">
            Sync Rate
          </Text>
        </View>
      </View>
      
      {/* Sync Level Badge */}
      <View 
        className="flex-row items-center px-4 py-2 rounded-full mb-4"
        style={{ backgroundColor: `${syncLevel.color}20` }}
      >
        <Ionicons name={syncLevel.icon as any} size={16} color={syncLevel.color} />
        <Text className="text-white ml-2 font-semibold">
          {syncLevel.label}
        </Text>
      </View>
      
      {/* Detailed Stats */}
      <Animated.View style={statsStyle} className="w-full">
        <View className="bg-white/10 rounded-xl p-4 backdrop-blur">
          <View className="flex-row justify-around">
            <View className="items-center">
              <Text className="text-white text-lg font-bold">
                {metrics.totalGames}
              </Text>
              <Text className="text-white/70 text-xs">Games</Text>
            </View>
            
            <View className="items-center">
              <Text className="text-white text-lg font-bold">
                {metrics.perfectMatches}
              </Text>
              <Text className="text-white/70 text-xs">Matches</Text>
            </View>
            
            <View className="items-center">
              <Text className="text-white text-lg font-bold">
                {metrics.streakCount}
              </Text>
              <Text className="text-white/70 text-xs">Streak</Text>
            </View>
            
            <View className="items-center">
              <Text className="text-white text-lg font-bold">
                {metrics.maxStreak}
              </Text>
              <Text className="text-white/70 text-xs">Best</Text>
            </View>
          </View>
        </View>
      </Animated.View>
      
      {/* Progress Bar for Next Level */}
      {metrics.syncPercentage < 100 && (
        <View className="w-full mt-4">
          <Text className="text-white/70 text-center text-xs mb-2">
            Next Level: {getSyncLevel().label}
          </Text>
          <View className="h-2 bg-white/20 rounded-full overflow-hidden">
            <LinearGradient
              colors={[accentColor, syncLevel.color]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                height: '100%',
                width: `${(metrics.syncPercentage % 20) * 5}%`,
                borderRadius: 4
              }}
            />
          </View>
        </View>
      )}
    </View>
  );
};