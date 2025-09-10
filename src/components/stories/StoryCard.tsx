import React, { useState } from 'react';
import { View, Text, Pressable, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Story, StoryCategory } from '../../types/stories';
import { useTwinStore } from '../../state/twinStore';
import { useStoryStore } from '../../state/stores/stories/storyStore';

interface StoryCardProps {
  story: Story;
  onPress?: () => void;
  showActions?: boolean;
  compact?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = screenWidth - 32;

export const StoryCard: React.FC<StoryCardProps> = ({
  story,
  onPress,
  showActions = true,
  compact = false,
}) => {
  const [expanded, setExpanded] = useState(false);
  const { userProfile } = useTwinStore();
  const { likeStory, unlikeStory, favoriteStory, unfavoriteStory, viewStory } = useStoryStore();
  
  const currentUserId = userProfile?.id || '';
  const isLiked = story.likes.includes(currentUserId);
  const isFavorited = story.favorites.includes(currentUserId);
  const canExpand = story.content.length > 150;
  const displayContent = expanded || !canExpand 
    ? story.content 
    : story.content.substring(0, 150) + '...';

  const getCategoryIcon = (category: StoryCategory): string => {
    switch (category) {
      case 'childhood': return 'happy-outline';
      case 'milestones': return 'trophy-outline';
      case 'adventures': return 'map-outline';
      case 'synchronicity': return 'radio-outline';
      case 'achievements': return 'star-outline';
      case 'memories': return 'heart-outline';
      default: return 'book-outline';
    }
  };

  const getCategoryColor = (category: StoryCategory): string => {
    switch (category) {
      case 'childhood': return '#FFB347';
      case 'milestones': return '#FFD700';
      case 'adventures': return '#32CD32';
      case 'synchronicity': return '#FF1493';
      case 'achievements': return '#8A2BE2';
      case 'memories': return '#FF69B4';
      default: return '#87CEEB';
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleLike = () => {
    if (isLiked) {
      unlikeStory(story.id, currentUserId);
    } else {
      likeStory(story.id, currentUserId);
    }
  };

  const handleFavorite = () => {
    if (isFavorited) {
      unfavoriteStory(story.id, currentUserId);
    } else {
      favoriteStory(story.id, currentUserId);
    }
  };

  const handlePress = () => {
    if (onPress) {
      viewStory(story.id, currentUserId);
      onPress();
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      className={`mb-4 ${compact ? 'mx-2' : ''}`}
      style={{ width: compact ? cardWidth * 0.8 : undefined }}
    >
      <LinearGradient
        colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)']}
        className="rounded-2xl p-6 border border-white/20"
      >
        {/* Header */}
        <View className="flex-row items-start justify-between mb-4">
          <View className="flex-1">
            <View className="flex-row items-center mb-2">
              {/* Category Icon */}
              <View 
                className="rounded-full p-2 mr-3"
                style={{ backgroundColor: getCategoryColor(story.category) + '30' }}
              >
                <Ionicons 
                  name={getCategoryIcon(story.category) as any} 
                  size={18} 
                  color={getCategoryColor(story.category)} 
                />
              </View>
              
              {/* Milestone Indicator */}
              {story.milestone && (
                <View className="bg-yellow-400/30 rounded-full p-1 mr-2">
                  <Ionicons name="star" size={16} color="#FFD700" />
                </View>
              )}
              
              <Text className="text-white text-lg font-semibold flex-1" numberOfLines={2}>
                {story.title}
              </Text>
            </View>
            
            <View className="flex-row items-center">
              <Text className="text-white/60 text-sm">
                {formatDate(story.timestamp)}
              </Text>
              
              {story.isShared && (
                <>
                  <Text className="text-white/40 mx-2">•</Text>
                  <View className="flex-row items-center">
                    <Ionicons name="people" size={14} color="rgba(255,255,255,0.6)" />
                    <Text className="text-white/60 text-sm ml-1">Shared</Text>
                  </View>
                </>
              )}
              
              {story.location && (
                <>
                  <Text className="text-white/40 mx-2">•</Text>
                  <Ionicons name="location" size={14} color="rgba(255,255,255,0.6)" />
                </>
              )}
            </View>
          </View>
          
          {/* Story Actions */}
          {showActions && (
            <Pressable className="p-1 ml-2">
              <Ionicons name="ellipsis-vertical" size={20} color="rgba(255,255,255,0.7)" />
            </Pressable>
          )}
        </View>

        {/* Media Preview */}
        {story.media.length > 0 && (
          <View className="mb-4">
            {story.media[0].type === 'photo' ? (
              <View className="relative">
                <Image
                  source={{ uri: story.media[0].uri }}
                  className="w-full h-48 rounded-xl"
                  resizeMode="cover"
                />
                {story.media.length > 1 && (
                  <View className="absolute bottom-2 right-2 bg-black/60 rounded-full px-2 py-1">
                    <Text className="text-white text-xs">
                      +{story.media.length - 1}
                    </Text>
                  </View>
                )}
              </View>
            ) : story.media[0].type === 'video' ? (
              <View className="relative bg-black/20 rounded-xl h-48 items-center justify-center">
                <Ionicons name="play-circle" size={64} color="rgba(255,255,255,0.8)" />
                {story.media[0].duration && (
                  <View className="absolute bottom-2 right-2 bg-black/60 rounded px-2 py-1">
                    <Text className="text-white text-xs">
                      {Math.floor(story.media[0].duration / 60)}:{(story.media[0].duration % 60).toString().padStart(2, '0')}
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <View className="bg-purple-500/20 rounded-xl p-4 flex-row items-center">
                <Ionicons name="mic" size={24} color="rgba(255,255,255,0.8)" />
                <Text className="text-white/80 ml-3 flex-1">Audio note</Text>
                {story.media[0].duration && (
                  <Text className="text-white/60 text-sm">
                    {Math.floor(story.media[0].duration / 60)}:{(story.media[0].duration % 60).toString().padStart(2, '0')}
                  </Text>
                )}
              </View>
            )}
          </View>
        )}

        {/* Content */}
        <View className="mb-4">
          <Text className="text-white text-base leading-6">
            {displayContent}
          </Text>
          
          {canExpand && (
            <Pressable onPress={() => setExpanded(!expanded)}>
              <Text className="text-blue-400 text-sm mt-2">
                {expanded ? 'Show less' : 'Read more'}
              </Text>
            </Pressable>
          )}
        </View>

        {/* Tags */}
        {story.tags.length > 0 && (
          <View className="flex-row flex-wrap mb-4">
            {story.tags.slice(0, 3).map((tag, index) => (
              <View key={index} className="bg-white/10 rounded-full px-3 py-1 mr-2 mb-2">
                <Text className="text-white/80 text-xs">#{tag}</Text>
              </View>
            ))}
            {story.tags.length > 3 && (
              <View className="bg-white/10 rounded-full px-3 py-1 mr-2 mb-2">
                <Text className="text-white/60 text-xs">+{story.tags.length - 3}</Text>
              </View>
            )}
          </View>
        )}

        {/* Milestone Info */}
        {story.milestone && (
          <View className="bg-yellow-400/10 border border-yellow-400/30 rounded-xl p-3 mb-4">
            <View className="flex-row items-center">
              <Ionicons name="star" size={20} color="#FFD700" />
              <Text className="text-yellow-300 font-semibold ml-2">
                {story.milestone.type.charAt(0).toUpperCase() + story.milestone.type.slice(1)} Milestone
              </Text>
            </View>
            <Text className="text-yellow-200/80 text-sm mt-1">
              {story.milestone.significance}
            </Text>
          </View>
        )}

        {/* Footer Actions */}
        {showActions && !compact && (
          <View className="flex-row items-center justify-between pt-4 border-t border-white/10">
            <View className="flex-row items-center space-x-6">
              {/* Like Button */}
              <Pressable onPress={handleLike} className="flex-row items-center">
                <Ionicons 
                  name={isLiked ? "heart" : "heart-outline"} 
                  size={20} 
                  color={isLiked ? "#FF1493" : "rgba(255,255,255,0.7)"} 
                />
                <Text className="text-white/70 text-sm ml-2">
                  {story.likes.length}
                </Text>
              </Pressable>
              
              {/* Comment Button */}
              <Pressable className="flex-row items-center">
                <Ionicons name="chatbubble-outline" size={20} color="rgba(255,255,255,0.7)" />
                <Text className="text-white/70 text-sm ml-2">
                  {story.comments.length}
                </Text>
              </Pressable>
              
              {/* Views */}
              <View className="flex-row items-center">
                <Ionicons name="eye-outline" size={20} color="rgba(255,255,255,0.5)" />
                <Text className="text-white/50 text-sm ml-2">
                  {story.views.length}
                </Text>
              </View>
            </View>
            
            {/* Favorite Button */}
            <Pressable onPress={handleFavorite}>
              <Ionicons 
                name={isFavorited ? "bookmark" : "bookmark-outline"} 
                size={20} 
                color={isFavorited ? "#FFD700" : "rgba(255,255,255,0.7)"} 
              />
            </Pressable>
          </View>
        )}
      </LinearGradient>
    </Pressable>
  );
};