import React from 'react';
import { View, Text, Pressable, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
  runOnJS
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { GameSession } from '../../types/games';
import { getNeonAccentColor } from '../../utils/neonColors';
import { ThemeColor } from '../../state/twinStore';

interface GameResultProps {
  session: GameSession;
  onPlayAgain: () => void;
  onBackToHub: () => void;
  themeColor: ThemeColor;
}

export const GameResult: React.FC<GameResultProps> = ({
  session,
  onPlayAgain,
  onBackToHub,
  themeColor
}) => {
  const { width } = Dimensions.get('window');
  const accentColor = getNeonAccentColor(themeColor);
  
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scoreScale = useSharedValue(0);
  
  React.useEffect(() => {
    // Entrance animation
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
    opacity.value = withSpring(1);
    
    // Delayed score animation
    scoreScale.value = withDelay(
      500,
      withSequence(
        withSpring(1.3, { damping: 10 }),
        withSpring(1, { damping: 15 })
      )
    );
    
    // Haptic feedback for result
    if (session.syncScore >= 80) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (session.syncScore >= 50) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);
  
  const containerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value
    };
  });
  
  const scoreStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scoreScale.value }]
    };
  });
  
  const getResultIcon = () => {
    if (session.syncScore >= 80) return 'checkmark-circle';
    if (session.syncScore >= 50) return 'flash';
    return 'close-circle';
  };
  
  const getResultColor = () => {
    if (session.syncScore >= 80) return '#10b981';
    if (session.syncScore >= 50) return accentColor;
    return '#ef4444';
  };
  
  const getResultMessage = () => {
    if (session.syncScore >= 90) return 'Perfect Synchronicity!';
    if (session.syncScore >= 80) return 'Incredible Connection!';
    if (session.syncScore >= 60) return 'Strong Twin Bond!';
    if (session.syncScore >= 40) return 'Growing Connection';
    return 'Keep Practicing';
  };
  
  const matches = session.results.filter(r => r.isMatch).length;
  const totalRounds = session.results.length;
  
  return (
    <Animated.View style={[containerStyle, { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }]}>
      {/* Main Result Display */}
      <View className="items-center mb-8">
        <View className="relative">
          {/* Glow Effect */}
          <View 
            className="absolute inset-0 rounded-full blur-xl"
            style={{
              backgroundColor: getResultColor(),
              opacity: 0.3,
              width: 120,
              height: 120,
              left: -10,
              top: -10
            }}
          />
          
          <Ionicons 
            name={getResultIcon()} 
            size={100} 
            color={getResultColor()}
          />
        </View>
        
        <Animated.View style={scoreStyle} className="items-center mt-6">
          <Text className="text-white text-4xl font-bold">
            {session.syncScore}%
          </Text>
          <Text className="text-white text-xl mt-2">
            {getResultMessage()}
          </Text>
        </Animated.View>
      </View>
      
      {/* Detailed Results */}
      <View className="w-full bg-white/10 rounded-2xl p-6 mb-8 backdrop-blur">
        <Text className="text-white text-lg font-semibold text-center mb-4">
          Game Summary
        </Text>
        
        <View className="space-y-4">
          <View className="flex-row justify-between items-center">
            <Text className="text-white/80">Perfect Matches</Text>
            <Text className="text-white font-semibold">
              {matches}/{totalRounds}
            </Text>
          </View>
          
          <View className="flex-row justify-between items-center">
            <Text className="text-white/80">Game Type</Text>
            <Text className="text-white font-semibold capitalize">
              {session.gameType.replace('_', ' ')}
            </Text>
          </View>
          
          <View className="flex-row justify-between items-center">
            <Text className="text-white/80">Duration</Text>
            <Text className="text-white font-semibold">
              {session.completedAt && session.startedAt 
                ? Math.round((new Date(session.completedAt).getTime() - new Date(session.startedAt).getTime()) / 1000)
                : 0}s
            </Text>
          </View>
          
          {/* Sync Score Visualization */}
          <View className="mt-4">
            <Text className="text-white/80 mb-2">Synchronicity Level</Text>
            <View className="h-2 bg-white/20 rounded-full overflow-hidden">
              <LinearGradient
                colors={[accentColor, getResultColor()]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  height: '100%',
                  width: `${session.syncScore}%`,
                  borderRadius: 4
                }}
              />
            </View>
          </View>
        </View>
      </View>
      
      {/* Round by Round Results */}
      <View className="w-full bg-white/5 rounded-xl p-4 mb-8">
        <Text className="text-white text-center mb-3 font-semibold">Round Results</Text>
        <View className="flex-row justify-center space-x-2">
          {session.results.map((result, index) => (
            <View 
              key={index}
              className={`w-8 h-8 rounded-full items-center justify-center ${
                result.isMatch ? 'bg-green-500' : 'bg-red-500/50'
              }`}
            >
              <Text className="text-white text-xs font-bold">
                {index + 1}
              </Text>
            </View>
          ))}
        </View>
      </View>
      
      {/* Action Buttons */}
      <View className="flex-row space-x-4 w-full max-w-sm">
        <Pressable
          onPress={onPlayAgain}
          className="flex-1 py-4 rounded-xl items-center"
          style={{ backgroundColor: accentColor }}
        >
          <Text className="text-white font-semibold text-lg">Play Again</Text>
        </Pressable>
        
        <Pressable
          onPress={onBackToHub}
          className="flex-1 bg-white/20 py-4 rounded-xl items-center"
        >
          <Text className="text-white font-semibold text-lg">Back to Games</Text>
        </Pressable>
      </View>
      
      {/* Achievement Notification (if any new achievements) */}
      {session.syncScore >= 90 && (
        <View className="absolute top-12 left-4 right-4">
          <View className="bg-yellow-500/90 rounded-lg p-3 flex-row items-center">
            <Ionicons name="trophy" size={20} color="white" />
            <Text className="text-white ml-2 font-semibold">Achievement Unlocked!</Text>
          </View>
        </View>
      )}
    </Animated.View>
  );
};