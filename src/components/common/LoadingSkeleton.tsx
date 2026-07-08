import React from 'react';
import { View, Text, Dimensions, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming,
  Easing
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

interface LoadingSkeletonProps {
  type?: 'game' | 'assessment' | 'premium' | 'generic';
  message?: string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ 
  type = 'generic',
  message 
}) => {
  const shimmerValue = useSharedValue(0);

  React.useEffect(() => {
    shimmerValue.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.bezier(0.4, 0.0, 0.6, 1.0) }),
      -1,
      true
    );
  }, []);

  const shimmerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: shimmerValue.value * (width + 100) - 100 }],
    };
  });

  const getTypeSpecificContent = () => {
    switch (type) {
      case 'game':
        return (
          <View className="px-6 pt-8">
            {/* Game header skeleton */}
            <View className="flex-row items-center justify-between mb-8">
              <View className="w-10 h-10 bg-white/20 rounded-full" />
              <View className="w-32 h-8 bg-white/20 rounded-lg" />
              <View className="w-10 h-10 bg-white/20 rounded-full" />
            </View>
            
            {/* Game cards skeleton */}
            {[1, 2, 3].map((index) => (
              <View key={index} className="mb-4 bg-white/10 rounded-2xl p-4">
                <View className="flex-row">
                  <View className="w-16 h-16 bg-white/20 rounded-xl mr-4" />
                  <View className="flex-1">
                    <View className="w-3/4 h-6 bg-white/20 rounded mb-2" />
                    <View className="w-full h-4 bg-white/10 rounded mb-2" />
                    <View className="w-1/2 h-4 bg-white/10 rounded" />
                  </View>
                </View>
              </View>
            ))}
          </View>
        );
      
      case 'assessment':
        return (
          <View className="px-6 pt-8">
            {/* Assessment header */}
            <View className="items-center mb-8">
              <View className="w-24 h-24 bg-white/20 rounded-full mb-4" />
              <View className="w-48 h-8 bg-white/20 rounded-lg mb-2" />
              <View className="w-64 h-4 bg-white/10 rounded" />
            </View>
            
            {/* Question skeleton */}
            <View className="bg-white/10 rounded-2xl p-6 mb-6">
              <View className="w-full h-6 bg-white/20 rounded mb-4" />
              <View className="w-3/4 h-6 bg-white/20 rounded mb-6" />
              
              {/* Answer options */}
              {[1, 2, 3, 4, 5].map((index) => (
                <View key={index} className="w-full h-12 bg-white/10 rounded-xl mb-2" />
              ))}
            </View>
          </View>
        );
      
      case 'premium':
        return (
          <View className="px-6 pt-8">
            {/* Premium header */}
            <View className="items-center mb-8">
              <View className="w-20 h-20 bg-white/20 rounded-full mb-4" />
              <View className="w-56 h-8 bg-white/20 rounded-lg mb-2" />
              <View className="w-40 h-4 bg-white/10 rounded" />
            </View>
            
            {/* Features list */}
            {[1, 2, 3, 4].map((index) => (
              <View key={index} className="flex-row items-center mb-4 bg-white/10 rounded-xl p-4">
                <View className="w-6 h-6 bg-white/20 rounded-full mr-3" />
                <View className="flex-1">
                  <View className="w-3/4 h-5 bg-white/20 rounded mb-1" />
                  <View className="w-full h-3 bg-white/10 rounded" />
                </View>
              </View>
            ))}
            
            {/* Subscription cards */}
            {[1, 2].map((index) => (
              <View key={index} className="bg-white/10 rounded-2xl p-4 mb-4">
                <View className="flex-row justify-between items-center mb-2">
                  <View className="w-20 h-6 bg-white/20 rounded" />
                  <View className="w-16 h-5 bg-white/10 rounded" />
                </View>
                <View className="w-full h-8 bg-white/20 rounded-lg" />
              </View>
            ))}
          </View>
        );
      
      default:
        return (
          <View className="px-6 pt-8">
            {/* Generic skeleton */}
            <View className="flex-row items-center justify-between mb-6">
              <View className="w-10 h-10 bg-white/20 rounded-full" />
              <View className="w-32 h-6 bg-white/20 rounded-lg" />
              <View className="w-10 h-10 bg-white/20 rounded-full" />
            </View>
            
            {[1, 2, 3, 4].map((index) => (
              <View key={index} className="mb-4 bg-white/10 rounded-xl p-4">
                <View className="w-3/4 h-6 bg-white/20 rounded mb-2" />
                <View className="w-full h-4 bg-white/10 rounded mb-2" />
                <View className="w-1/2 h-4 bg-white/10 rounded" />
              </View>
            ))}
          </View>
        );
    }
  };

  const getLoadingMessage = () => {
    if (message) return message;
    
    switch (type) {
      case 'game':
        return 'Preparing synchronicity games...';
      case 'assessment':
        return 'Loading assessment...';
      case 'premium':
        return 'Loading premium features...';
      default:
        return 'Loading...';
    }
  };

  return (
    <ImageBackground source={require("../../../assets/galaxybackground.png")} style={{ flex: 1 }}>
      <SafeAreaView className="flex-1">
        {getTypeSpecificContent()}
        
        {/* Shimmer effect overlay */}
        <View className="absolute inset-0 overflow-hidden">
          <Animated.View style={[shimmerStyle]}>
            <LinearGradient
              colors={['transparent', 'rgba(255,255,255,0.05)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="w-24 h-full"
            />
          </Animated.View>
        </View>
        
        {/* Loading message */}
        <View className="absolute bottom-20 left-0 right-0 items-center">
          <View className="bg-white/10 rounded-2xl px-6 py-4 backdrop-blur">
            <Text className="text-white text-lg font-semibold text-center">
              {getLoadingMessage()}
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
};
