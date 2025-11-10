import React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Twincidence, TwincidenceCategory } from '../../types/twincidences';

interface TwincidenceCardProps {
  twincidence: Twincidence;
  onPress: () => void;
  showActions?: boolean;
}

const CATEGORY_INFO: Record<TwincidenceCategory, { icon: keyof typeof Ionicons.glyphMap; color: string; label: string }> = {
  [TwincidenceCategory.TWINTUITION_SYNC]: { icon: 'flash', color: '#FF1493', label: 'Twintuition' },
  [TwincidenceCategory.BIOMETRIC_SYNC]: { icon: 'heart-circle', color: '#FF4500', label: 'Biometric' },
  [TwincidenceCategory.LOCATION_COINCIDENCE]: { icon: 'location', color: '#32CD32', label: 'Location' },
  [TwincidenceCategory.DIGITAL_BEHAVIOR]: { icon: 'phone-portrait', color: '#1E90FF', label: 'Digital' },
  [TwincidenceCategory.COMMUNICATION_PATTERN]: { icon: 'chatbubbles', color: '#8A2BE2', label: 'Communication' },
  [TwincidenceCategory.ENVIRONMENTAL_MATCHING]: { icon: 'partly-sunny', color: '#FFD700', label: 'Environment' },
  [TwincidenceCategory.MANUAL_ESP]: { icon: 'eye', color: '#9370DB', label: 'ESP' },
  [TwincidenceCategory.MANUAL_DREAM]: { icon: 'moon', color: '#4B0082', label: 'Dream' },
  [TwincidenceCategory.MANUAL_TWIN_TALK]: { icon: 'people', color: '#FF69B4', label: 'Twin-Talk' },
  [TwincidenceCategory.MANUAL_PARALLEL_EXPERIENCE]: { icon: 'git-compare', color: '#20B2AA', label: 'Parallel' },
  [TwincidenceCategory.MANUAL_OTHER]: { icon: 'sparkles', color: '#DDA0DD', label: 'Other' },
};

export const TwincidenceCard: React.FC<TwincidenceCardProps> = ({
  twincidence,
  onPress,
  showActions = false,
}) => {
  const categoryInfo = CATEGORY_INFO[twincidence.category];
  const isAutomated = twincidence.detectionType === 'automatic';
  const hasMedia =
    (twincidence.media?.photos?.length || 0) > 0 ||
    (twincidence.media?.videos?.length || 0) > 0 ||
    (twincidence.media?.voiceNotes?.length || 0) > 0;

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getFirstMediaThumbnail = () => {
    if (twincidence.media?.photos?.[0]) {
      return twincidence.media.photos[0].thumbnail || twincidence.media.photos[0].uri;
    }
    if (twincidence.media?.videos?.[0]) {
      return twincidence.media.videos[0].thumbnail;
    }
    return null;
  };

  const firstMedia = getFirstMediaThumbnail();

  return (
    <Pressable onPress={onPress} className="mb-4">
      <LinearGradient
        colors={
          isAutomated
            ? [categoryInfo.color + '20', categoryInfo.color + '10']
            : ['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)']
        }
        className={`rounded-2xl overflow-hidden border ${
          isAutomated ? 'border-opacity-60' : 'border-white/20'
        }`}
        style={{ borderColor: isAutomated ? categoryInfo.color : undefined }}
      >
        {/* Header */}
        <View className="p-4 pb-3">
          <View className="flex-row items-center justify-between mb-2">
            {/* Category Badge */}
            <View className="flex-row items-center">
              <View
                className="rounded-full p-2 mr-2"
                style={{ backgroundColor: categoryInfo.color + '30' }}
              >
                <Ionicons name={categoryInfo.icon} size={18} color={categoryInfo.color} />
              </View>
              <View>
                <Text className="text-white font-semibold text-sm">{categoryInfo.label}</Text>
                {isAutomated && (
                  <View className="flex-row items-center mt-0.5">
                    <View className="w-1.5 h-1.5 rounded-full bg-green-400 mr-1" />
                    <Text className="text-green-400 text-xs">Auto-detected</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Timestamp */}
            <Text className="text-white/50 text-xs">{formatTimestamp(twincidence.timestamp)}</Text>
          </View>

          {/* Title */}
          <Text className="text-white font-semibold text-base mb-1" numberOfLines={2}>
            {twincidence.title}
          </Text>

          {/* Description */}
          {twincidence.description && (
            <Text className="text-white/70 text-sm leading-5" numberOfLines={2}>
              {twincidence.description}
            </Text>
          )}
        </View>

        {/* Media Preview */}
        {firstMedia && (
          <View className="px-4 pb-3">
            <Image
              source={{ uri: firstMedia }}
              className="w-full h-48 rounded-xl"
              resizeMode="cover"
            />
            {((twincidence.media?.photos?.length || 0) +
              (twincidence.media?.videos?.length || 0) +
              (twincidence.media?.voiceNotes?.length || 0)) > 1 && (
              <View className="absolute bottom-5 right-6 bg-black/70 rounded-full px-3 py-1">
                <Text className="text-white text-xs font-semibold">
                  +{(twincidence.media?.photos?.length || 0) +
                    (twincidence.media?.videos?.length || 0) +
                    (twincidence.media?.voiceNotes?.length || 0) - 1}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Footer */}
        <View className="px-4 pb-3">
          <View className="flex-row items-center justify-between">
            {/* Tags */}
            {twincidence.tags.length > 0 && (
              <View className="flex-row items-center flex-1 mr-2">
                <Ionicons name="pricetag" size={14} color="rgba(255,255,255,0.5)" />
                <Text className="text-white/50 text-xs ml-1" numberOfLines={1}>
                  {twincidence.tags.slice(0, 3).join(', ')}
                </Text>
              </View>
            )}

            {/* Metadata Indicators */}
            <View className="flex-row items-center space-x-3">
              {isAutomated && twincidence.metadata.confidenceScore !== undefined && (
                <View className="flex-row items-center">
                  <Ionicons name="analytics" size={14} color="rgba(255,255,255,0.5)" />
                  <Text className="text-white/50 text-xs ml-1">
                    {Math.round(twincidence.metadata.confidenceScore * 100)}%
                  </Text>
                </View>
              )}

              {hasMedia && (
                <View className="flex-row items-center">
                  <Ionicons name="images" size={14} color="rgba(255,255,255,0.5)" />
                  <Text className="text-white/50 text-xs ml-1">
                    {(twincidence.media?.photos?.length || 0) +
                     (twincidence.media?.videos?.length || 0) +
                     (twincidence.media?.voiceNotes?.length || 0)}
                  </Text>
                </View>
              )}

              {(twincidence.annotations?.length || 0) > 0 && (
                <View className="flex-row items-center">
                  <Ionicons name="chatbox" size={14} color="rgba(255,255,255,0.5)" />
                  <Text className="text-white/50 text-xs ml-1">
                    {twincidence.annotations?.length}
                  </Text>
                </View>
              )}

              {twincidence.favorites.length > 0 && (
                <View className="flex-row items-center">
                  <Ionicons name="heart" size={14} color="#FF1493" />
                  <Text className="text-pink-400 text-xs ml-1">
                    {twincidence.favorites.length}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
};
