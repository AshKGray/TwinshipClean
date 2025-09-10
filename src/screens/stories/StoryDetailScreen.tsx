import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Pressable, 
  ScrollView, 
  Image, 
  Dimensions,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ImageBackground
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTwinStore } from '../../state/twinStore';
import { useStoryStore } from '../../state/stores/stories/storyStore';
import { Story, StoryCategory } from '../../types/stories';

interface StoryDetailScreenProps {
  navigation: any;
  route: {
    params: {
      storyId: string;
    };
  };
}

const { width: screenWidth } = Dimensions.get('window');

export const StoryDetailScreen: React.FC<StoryDetailScreenProps> = ({ navigation, route }) => {
  const { storyId } = route.params;
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const { userProfile, twinProfile } = useTwinStore();
  const { 
    stories, 
    likeStory, 
    unlikeStory, 
    favoriteStory, 
    unfavoriteStory,
    shareStory,
    unshareStory,
    addComment,
    deleteStory,
    viewStory
  } = useStoryStore();

  const story = storyId === 'latest' 
    ? stories[0] 
    : stories.find(s => s.id === storyId);

  const currentUserId = userProfile?.id || '';
  const isAuthor = story?.authorId === currentUserId;
  const isLiked = story?.likes.includes(currentUserId) || false;
  const isFavorited = story?.favorites.includes(currentUserId) || false;

  useEffect(() => {
    if (story && currentUserId) {
      viewStory(story.id, currentUserId);
    }
  }, [story, currentUserId]);

  if (!story) {
    return (
      <ImageBackground source={require("../../assets/galaxybackground.png")} style={{ flex: 1 }}>
        <SafeAreaView className="flex-1 items-center justify-center">
          <Ionicons name="book-outline" size={64} color="rgba(255,255,255,0.5)" />
          <Text className="text-white text-xl font-semibold mt-4">Story not found</Text>
          <Pressable
            onPress={() => navigation.goBack()}
            className="bg-purple-500 rounded-xl px-6 py-3 mt-6"
          >
            <Text className="text-white font-semibold">Go Back</Text>
          </Pressable>
        </SafeAreaView>
      </ImageBackground>
    );
  }

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
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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

  const handleShare = () => {
    if (story.isShared) {
      unshareStory(story.id);
    } else if (twinProfile) {
      shareStory(story.id, twinProfile.id);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Story',
      'Are you sure you want to delete this story? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            deleteStory(story.id);
            navigation.goBack();
          }
        }
      ]
    );
  };

  const handleAddComment = () => {
    if (newComment.trim()) {
      addComment(story.id, currentUserId, newComment.trim());
      setNewComment('');
    }
  };

  const MediaViewer: React.FC = () => {
    if (story.media.length === 0) return null;

    const currentMedia = story.media[currentMediaIndex];

    return (
      <View className="mb-6">
        <View className="relative">
          {currentMedia.type === 'photo' ? (
            <Image
              source={{ uri: currentMedia.uri }}
              className="w-full h-80 rounded-2xl"
              resizeMode="cover"
            />
          ) : currentMedia.type === 'video' ? (
            <View className="w-full h-80 bg-black/20 rounded-2xl items-center justify-center">
              <Ionicons name="play-circle" size={80} color="rgba(255,255,255,0.8)" />
              {currentMedia.duration && (
                <Text className="text-white mt-2">
                  {Math.floor(currentMedia.duration / 60)}:{(currentMedia.duration % 60).toString().padStart(2, '0')}
                </Text>
              )}
            </View>
          ) : (
            <View className="w-full h-32 bg-purple-500/20 rounded-2xl items-center justify-center">
              <Ionicons name="mic" size={40} color="rgba(255,255,255,0.8)" />
              <Text className="text-white/80 mt-2">Audio Note</Text>
              {currentMedia.duration && (
                <Text className="text-white/60 text-sm">
                  {Math.floor(currentMedia.duration / 60)}:{(currentMedia.duration % 60).toString().padStart(2, '0')}
                </Text>
              )}
            </View>
          )}

          {/* Media Navigation */}
          {story.media.length > 1 && (
            <>
              {currentMediaIndex > 0 && (
                <Pressable
                  onPress={() => setCurrentMediaIndex(currentMediaIndex - 1)}
                  className="absolute left-4 top-1/2 -translate-y-2 bg-black/50 rounded-full p-2"
                >
                  <Ionicons name="chevron-back" size={24} color="white" />
                </Pressable>
              )}
              
              {currentMediaIndex < story.media.length - 1 && (
                <Pressable
                  onPress={() => setCurrentMediaIndex(currentMediaIndex + 1)}
                  className="absolute right-4 top-1/2 -translate-y-2 bg-black/50 rounded-full p-2"
                >
                  <Ionicons name="chevron-forward" size={24} color="white" />
                </Pressable>
              )}

              {/* Media Counter */}
              <View className="absolute bottom-4 right-4 bg-black/60 rounded-full px-3 py-1">
                <Text className="text-white text-sm">
                  {currentMediaIndex + 1} / {story.media.length}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Media Thumbnails */}
        {story.media.length > 1 && (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            className="mt-4"
            contentContainerStyle={{ paddingHorizontal: 4 }}
          >
            {story.media.map((media, index) => (
              <Pressable
                key={media.id}
                onPress={() => setCurrentMediaIndex(index)}
                className={`mr-2 rounded-lg overflow-hidden ${
                  index === currentMediaIndex ? 'opacity-100 border-2 border-white' : 'opacity-60'
                }`}
                style={{ width: 60, height: 60 }}
              >
                {media.type === 'photo' ? (
                  <Image
                    source={{ uri: media.uri }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                ) : media.type === 'video' ? (
                  <View className="w-full h-full bg-black/20 items-center justify-center">
                    <Ionicons name="play" size={20} color="white" />
                  </View>
                ) : (
                  <View className="w-full h-full bg-purple-500/20 items-center justify-center">
                    <Ionicons name="mic" size={16} color="white" />
                  </View>
                )}
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>
    );
  };

  const CommentsSection: React.FC = () => (
    <View>
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-white text-lg font-semibold">
          Comments ({story.comments.length})
        </Text>
        <Pressable onPress={() => setShowComments(!showComments)}>
          <Ionicons 
            name={showComments ? "chevron-up" : "chevron-down"} 
            size={24} 
            color="rgba(255,255,255,0.7)" 
          />
        </Pressable>
      </View>

      {showComments && (
        <>
          {/* Add Comment */}
          <View className="bg-white/10 rounded-xl p-4 mb-4 border border-white/20">
            <TextInput
              value={newComment}
              onChangeText={setNewComment}
              placeholder="Add a comment..."
              placeholderTextColor="rgba(255,255,255,0.5)"
              className="text-white mb-3"
              multiline
              numberOfLines={3}
            />
            <Pressable
              onPress={handleAddComment}
              disabled={!newComment.trim()}
              className={`self-end px-4 py-2 rounded-xl ${
                newComment.trim() ? 'bg-purple-500' : 'bg-white/20'
              }`}
            >
              <Text className="text-white font-medium">Post</Text>
            </Pressable>
          </View>

          {/* Comments List */}
          {story.comments.map((comment) => (
            <View key={comment.id} className="bg-white/5 rounded-xl p-4 mb-3">
              <View className="flex-row items-start">
                <View className="bg-purple-500/30 rounded-full w-8 h-8 items-center justify-center mr-3">
                  <Text className="text-white text-sm font-bold">
                    {comment.authorId === currentUserId ? 'Y' : 'T'}
                  </Text>
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center mb-1">
                    <Text className="text-white font-medium">
                      {comment.authorId === currentUserId ? 'You' : twinProfile?.name || 'Twin'}
                    </Text>
                    <Text className="text-white/50 text-xs ml-2">
                      {formatDate(comment.timestamp)}
                    </Text>
                    {comment.isEdited && (
                      <Text className="text-white/40 text-xs ml-1">(edited)</Text>
                    )}
                  </View>
                  <Text className="text-white/90">{comment.content}</Text>
                </View>
              </View>
            </View>
          ))}

          {story.comments.length === 0 && (
            <Text className="text-white/60 text-center py-8">
              No comments yet. Be the first to share your thoughts!
            </Text>
          )}
        </>
      )}
    </View>
  );

  return (
    <ImageBackground source={require("../../assets/galaxybackground.png")} style={{ flex: 1 }}>
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 py-4">
          <Pressable onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </Pressable>
          
          <View className="flex-row items-center space-x-3">
            {isAuthor && (
              <Pressable
                onPress={() => navigation.navigate('EditStory', { storyId: story.id })}
                className="p-2"
              >
                <Ionicons name="pencil" size={20} color="rgba(255,255,255,0.7)" />
              </Pressable>
            )}
            
            <Pressable className="p-2">
              <Ionicons name="share-outline" size={20} color="rgba(255,255,255,0.7)" />
            </Pressable>
            
            {isAuthor && (
              <Pressable onPress={handleDelete} className="p-2">
                <Ionicons name="trash-outline" size={20} color="rgba(255, 99, 99, 0.8)" />
              </Pressable>
            )}
          </View>
        </View>

        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
            {/* Story Header */}
            <View className="mb-6">
              <View className="flex-row items-center mb-3">
                {/* Category Badge */}
                <View 
                  className="rounded-full p-2 mr-3"
                  style={{ backgroundColor: getCategoryColor(story.category) + '30' }}
                >
                  <Ionicons 
                    name={getCategoryIcon(story.category) as any} 
                    size={20} 
                    color={getCategoryColor(story.category)} 
                  />
                </View>

                {/* Milestone Star */}
                {story.milestone && (
                  <View className="bg-yellow-400/30 rounded-full p-1 mr-3">
                    <Ionicons name="star" size={18} color="#FFD700" />
                  </View>
                )}

                {/* Share Status */}
                {story.isShared && (
                  <View className="bg-green-500/30 rounded-full px-3 py-1">
                    <Text className="text-green-300 text-xs font-medium">Shared</Text>
                  </View>
                )}
              </View>

              <Text className="text-white text-2xl font-bold mb-2">
                {story.title}
              </Text>

              <View className="flex-row items-center text-white/60">
                <Text className="text-white/60 text-sm">
                  {formatDate(story.timestamp)}
                </Text>
                {story.location && (
                  <>
                    <Text className="text-white/40 mx-2">•</Text>
                    <Ionicons name="location" size={14} color="rgba(255,255,255,0.6)" />
                    <Text className="text-white/60 text-sm ml-1">
                      {story.location.placeName || 'Location tagged'}
                    </Text>
                  </>
                )}
              </View>
            </View>

            {/* Media Viewer */}
            <MediaViewer />

            {/* Story Content */}
            <View className="mb-6">
              <Text className="text-white text-lg leading-7">
                {story.content}
              </Text>
            </View>

            {/* Tags */}
            {story.tags.length > 0 && (
              <View className="flex-row flex-wrap mb-6">
                {story.tags.map((tag, index) => (
                  <View key={index} className="bg-blue-500/20 rounded-full px-3 py-1 mr-2 mb-2">
                    <Text className="text-blue-300 text-sm">#{tag}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Milestone Info */}
            {story.milestone && (
              <LinearGradient
                colors={['rgba(255, 215, 0, 0.15)', 'rgba(255, 215, 0, 0.05)']}
                className="rounded-2xl p-6 mb-6 border border-yellow-400/30"
              >
                <View className="flex-row items-center mb-3">
                  <Ionicons name="star" size={24} color="#FFD700" />
                  <Text className="text-yellow-300 font-semibold text-lg ml-3">
                    {story.milestone.type.charAt(0).toUpperCase() + story.milestone.type.slice(1)} Milestone
                  </Text>
                </View>
                <Text className="text-yellow-200/90 text-base leading-6 mb-2">
                  {story.milestone.significance}
                </Text>
                {story.milestone.date && (
                  <Text className="text-yellow-200/70 text-sm">
                    Date: {new Date(story.milestone.date).toLocaleDateString()}
                  </Text>
                )}
              </LinearGradient>
            )}

            {/* Story Stats & Actions */}
            <LinearGradient
              colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
              className="rounded-2xl p-6 mb-6 border border-white/20"
            >
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center space-x-6">
                  {/* Like */}
                  <Pressable onPress={handleLike} className="flex-row items-center">
                    <Ionicons 
                      name={isLiked ? "heart" : "heart-outline"} 
                      size={24} 
                      color={isLiked ? "#FF1493" : "rgba(255,255,255,0.7)"} 
                    />
                    <Text className="text-white/80 ml-2">{story.likes.length}</Text>
                  </Pressable>

                  {/* Comments */}
                  <Pressable 
                    onPress={() => setShowComments(!showComments)}
                    className="flex-row items-center"
                  >
                    <Ionicons name="chatbubble-outline" size={24} color="rgba(255,255,255,0.7)" />
                    <Text className="text-white/80 ml-2">{story.comments.length}</Text>
                  </Pressable>

                  {/* Views */}
                  <View className="flex-row items-center">
                    <Ionicons name="eye-outline" size={24} color="rgba(255,255,255,0.5)" />
                    <Text className="text-white/60 ml-2">{story.views.length}</Text>
                  </View>
                </View>

                <View className="flex-row items-center space-x-3">
                  {/* Share with Twin */}
                  {isAuthor && twinProfile && (
                    <Pressable onPress={handleShare}>
                      <Ionicons 
                        name={story.isShared ? "people" : "person-add-outline"} 
                        size={24} 
                        color={story.isShared ? "#10B981" : "rgba(255,255,255,0.7)"} 
                      />
                    </Pressable>
                  )}

                  {/* Favorite */}
                  <Pressable onPress={handleFavorite}>
                    <Ionicons 
                      name={isFavorited ? "bookmark" : "bookmark-outline"} 
                      size={24} 
                      color={isFavorited ? "#FFD700" : "rgba(255,255,255,0.7)"} 
                    />
                  </Pressable>
                </View>
              </View>
            </LinearGradient>

            {/* Comments Section */}
            <CommentsSection />

            <View className="h-6" /> {/* Bottom spacing */}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
};