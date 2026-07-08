import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, ImageBackground, Alert, Share, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTwincidencesStore } from '../../state/twincidencesStore';
import { useTwinStore } from '../../state/twinStore';
import { Twincidence, TwincidenceCategory } from '../../types/twincidences';

interface TwincidenceDetailScreenProps {
  navigation: any;
  route: {
    params: {
      twincidenceId: string;
    };
  };
}

const CATEGORY_INFO: Record<TwincidenceCategory, { icon: keyof typeof Ionicons.glyphMap; color: string; label: string }> = {
  [TwincidenceCategory.TWINTUITION_SYNC]: { icon: 'flash', color: '#FF1493', label: 'Twintuition Sync' },
  [TwincidenceCategory.BIOMETRIC_SYNC]: { icon: 'heart-circle', color: '#FF4500', label: 'Biometric Sync' },
  [TwincidenceCategory.LOCATION_COINCIDENCE]: { icon: 'location', color: '#32CD32', label: 'Location Coincidence' },
  [TwincidenceCategory.DIGITAL_BEHAVIOR]: { icon: 'phone-portrait', color: '#1E90FF', label: 'Digital Behavior' },
  [TwincidenceCategory.COMMUNICATION_PATTERN]: { icon: 'chatbubbles', color: '#8A2BE2', label: 'Communication Pattern' },
  [TwincidenceCategory.ENVIRONMENTAL_MATCHING]: { icon: 'partly-sunny', color: '#FFD700', label: 'Environmental Match' },
  [TwincidenceCategory.MANUAL_ESP]: { icon: 'eye', color: '#9370DB', label: 'ESP / Telepathy' },
  [TwincidenceCategory.MANUAL_DREAM]: { icon: 'moon', color: '#4B0082', label: 'Shared Dream' },
  [TwincidenceCategory.MANUAL_TWIN_TALK]: { icon: 'people', color: '#FF69B4', label: 'Twin-Talk Moment' },
  [TwincidenceCategory.MANUAL_PARALLEL_EXPERIENCE]: { icon: 'git-compare', color: '#20B2AA', label: 'Parallel Experience' },
  [TwincidenceCategory.MANUAL_OTHER]: { icon: 'sparkles', color: '#DDA0DD', label: 'Other Synchronicity' },
};

export const TwincidenceDetailScreen: React.FC<TwincidenceDetailScreenProps> = ({ navigation, route }) => {
  const { twincidenceId } = route.params;
  const { userProfile } = useTwinStore();
  const {
    getTwincidenceById,
    viewTwincidence,
    favoriteTwincidence,
    unfavoriteTwincidence,
    deleteTwincidence,
    addAnnotation,
  } = useTwincidencesStore();

  const [twincidence, setTwincidence] = useState<Twincidence | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [annotationText, setAnnotationText] = useState('');

  useEffect(() => {
    loadTwincidence();
  }, [twincidenceId]);

  const loadTwincidence = () => {
    const loaded = getTwincidenceById(twincidenceId);
    if (loaded) {
      setTwincidence(loaded);
      setIsFavorited(loaded.favorites.includes(userProfile?.id || ''));

      // Track view
      if (userProfile?.id) {
        viewTwincidence(twincidenceId, userProfile.id);
      }
    } else {
      Alert.alert('Not Found', 'This twincidence could not be found.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    }
  };

  const handleFavorite = () => {
    if (!userProfile?.id) return;

    if (isFavorited) {
      unfavoriteTwincidence(twincidenceId, userProfile.id);
    } else {
      favoriteTwincidence(twincidenceId, userProfile.id);
    }
    setIsFavorited(!isFavorited);
    loadTwincidence();
  };

  const handleShare = async () => {
    if (!twincidence) return;

    try {
      await Share.share({
        message: `${twincidence.title}\n\n${twincidence.description || ''}\n\nShared from Twinship`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Twincidence?',
      'This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteTwincidence(twincidenceId);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleEdit = () => {
    // TODO: Implement edit screen (Story 4.11)
    Alert.alert('Coming Soon', 'Editing will be available in the next update!');
  };

  const handleAddAnnotation = () => {
    if (!annotationText.trim() || !userProfile?.id) return;

    addAnnotation(twincidenceId, userProfile.id, annotationText.trim());
    setAnnotationText('');
    loadTwincidence();
  };

  if (!twincidence) {
    return (
      <ImageBackground source={require("../../../assets/galaxybackground.png")} style={{ flex: 1 }}>
        <SafeAreaView className="flex-1 items-center justify-center">
          <Text className="text-white text-lg">Loading...</Text>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  const categoryInfo = CATEGORY_INFO[twincidence.category];
  const isAutomated = twincidence.detectionType === 'automatic';
  const isOwner = twincidence.createdBy === userProfile?.id;

  const formatFullDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <ImageBackground source={require("../../../assets/galaxybackground.png")} style={{ flex: 1 }}>
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 py-4">
          <Pressable onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </Pressable>

          <View className="flex-row items-center space-x-3">
            <Pressable onPress={handleFavorite} className="p-2">
              <Ionicons
                name={isFavorited ? 'heart' : 'heart-outline'}
                size={24}
                color={isFavorited ? '#FF1493' : 'white'}
              />
            </Pressable>

            <Pressable onPress={handleShare} className="p-2">
              <Ionicons name="share-outline" size={24} color="white" />
            </Pressable>

            {isOwner && twincidence.detectionType === 'manual' && (
              <Pressable onPress={() => Alert.alert('Actions', 'What would you like to do?', [
                { text: 'Edit', onPress: handleEdit },
                { text: 'Delete', onPress: handleDelete, style: 'destructive' },
                { text: 'Cancel', style: 'cancel' },
              ])}>
                <Ionicons name="ellipsis-horizontal" size={24} color="white" />
              </Pressable>
            )}
          </View>
        </View>

        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
          {/* Category Badge */}
          <View className="flex-row items-center mb-4">
            <View
              className="rounded-full p-3 mr-3"
              style={{ backgroundColor: categoryInfo.color + '30' }}
            >
              <Ionicons name={categoryInfo.icon} size={28} color={categoryInfo.color} />
            </View>
            <View className="flex-1">
              <Text className="text-white font-semibold text-lg">{categoryInfo.label}</Text>
              <View className="flex-row items-center mt-1">
                {isAutomated && (
                  <>
                    <View className="w-2 h-2 rounded-full bg-green-400 mr-1.5" />
                    <Text className="text-green-400 text-sm mr-3">Auto-detected</Text>
                  </>
                )}
                <Ionicons name="time" size={14} color="rgba(255,255,255,0.5)" />
                <Text className="text-white/50 text-sm ml-1">{formatFullDate(twincidence.timestamp)}</Text>
              </View>
            </View>
          </View>

          {/* Title */}
          <Text className="text-white text-2xl font-bold mb-4 leading-8">
            {twincidence.title}
          </Text>

          {/* Description */}
          {twincidence.description && (
            <LinearGradient
              colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
              className="rounded-2xl p-4 mb-6 border border-white/20"
            >
              <Text className="text-white/90 text-base leading-6">{twincidence.description}</Text>
            </LinearGradient>
          )}

          {/* Confidence Score (for automated) */}
          {isAutomated && twincidence.metadata.confidenceScore !== undefined && (
            <LinearGradient
              colors={[categoryInfo.color + '20', categoryInfo.color + '10']}
              className="rounded-2xl p-4 mb-6 border border-opacity-60"
              style={{ borderColor: categoryInfo.color }}
            >
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-white font-semibold text-base">Detection Confidence</Text>
                <Text className="text-white text-lg font-bold">
                  {Math.round(twincidence.metadata.confidenceScore * 100)}%
                </Text>
              </View>
              <View className="bg-white/20 rounded-full h-2 overflow-hidden">
                <View
                  className="h-full rounded-full"
                  style={{
                    width: `${twincidence.metadata.confidenceScore * 100}%`,
                    backgroundColor: categoryInfo.color,
                  }}
                />
              </View>
            </LinearGradient>
          )}

          {/* Biometric Data (if available) */}
          {twincidence.metadata.biometricData && (
            <LinearGradient
              colors={['rgba(255,69,0,0.2)', 'rgba(255,69,0,0.1)']}
              className="rounded-2xl p-4 mb-6 border border-orange-500/40"
            >
              <View className="flex-row items-center mb-3">
                <Ionicons name="pulse" size={20} color="#FF4500" />
                <Text className="text-white font-semibold text-base ml-2">Biometric Sync Data</Text>
              </View>
              <Text className="text-white/70 text-sm mb-1">
                Type: {twincidence.metadata.biometricData.type}
              </Text>
              <Text className="text-white/70 text-sm">
                Similarity: {Math.round(twincidence.metadata.biometricData.similarityScore * 100)}%
              </Text>
            </LinearGradient>
          )}

          {/* Twintuition Sync Data (if available) */}
          {twincidence.metadata.twintuitionData && (
            <LinearGradient
              colors={['rgba(255,20,147,0.2)', 'rgba(255,20,147,0.1)']}
              className="rounded-2xl p-4 mb-6 border border-pink-500/40"
            >
              <View className="flex-row items-center mb-3">
                <Ionicons name="flash" size={20} color="#FF1493" />
                <Text className="text-white font-semibold text-base ml-2">Twintuition Sync</Text>
              </View>
              <Text className="text-white/70 text-sm mb-1">
                Time difference: {twincidence.metadata.twintuitionData.deltaSeconds}s
              </Text>
              {twincidence.metadata.twintuitionData.emotionMatch && (
                <View className="flex-row items-center mt-2">
                  <Ionicons name="checkmark-circle" size={16} color="#32CD32" />
                  <Text className="text-green-400 text-sm ml-1">Emotions matched!</Text>
                </View>
              )}
            </LinearGradient>
          )}

          {/* Tags */}
          {twincidence.tags.length > 0 && (
            <View className="mb-6">
              <Text className="text-white font-semibold text-base mb-3">Tags</Text>
              <View className="flex-row flex-wrap">
                {twincidence.tags.map((tag) => (
                  <View
                    key={tag}
                    className="bg-purple-500/30 rounded-full px-3 py-1.5 mr-2 mb-2"
                  >
                    <Text className="text-purple-300 text-sm">#{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Annotations/Comments */}
          <View className="mb-6">
            <Text className="text-white font-semibold text-lg mb-3">
              Notes & Annotations ({twincidence.annotations?.length || 0})
            </Text>

            {/* Existing Annotations */}
            {twincidence.annotations && twincidence.annotations.length > 0 && (
              <View className="mb-4">
                {twincidence.annotations.map((annotation) => (
                  <LinearGradient
                    key={annotation.id}
                    colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
                    className="rounded-xl p-3 mb-2 border border-white/20"
                  >
                    <View className="flex-row items-center justify-between mb-2">
                      <View className="flex-row items-center">
                        <Ionicons name="person-circle" size={20} color="rgba(255,255,255,0.7)" />
                        <Text className="text-white/70 text-sm ml-2">
                          {annotation.authorId === userProfile?.id ? 'You' : 'Your Twin'}
                        </Text>
                      </View>
                      <Text className="text-white/50 text-xs">
                        {new Date(annotation.timestamp).toLocaleDateString()}
                      </Text>
                    </View>
                    <Text className="text-white text-sm leading-5">{annotation.content}</Text>
                  </LinearGradient>
                ))}
              </View>
            )}

            {/* Add Annotation */}
            <View className="bg-white/10 rounded-xl p-3 border border-white/20">
              <TextInput
                value={annotationText}
                onChangeText={setAnnotationText}
                placeholder="Add a note or memory..."
                placeholderTextColor="rgba(255,255,255,0.5)"
                className="text-white mb-2"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
              <Pressable
                onPress={handleAddAnnotation}
                disabled={!annotationText.trim()}
                className={`rounded-lg py-2 ${annotationText.trim() ? 'bg-purple-500' : 'bg-gray-500'}`}
              >
                <Text className="text-white font-semibold text-center">Add Note</Text>
              </Pressable>
            </View>
          </View>

          {/* Metadata Footer */}
          <LinearGradient
            colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']}
            className="rounded-xl p-4 mb-8 border border-white/10"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Ionicons name="eye" size={16} color="rgba(255,255,255,0.5)" />
                <Text className="text-white/50 text-sm ml-2">{twincidence.views.length} views</Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="heart" size={16} color="#FF1493" />
                <Text className="text-pink-400 text-sm ml-2">{twincidence.favorites.length}</Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="chatbox" size={16} color="rgba(255,255,255,0.5)" />
                <Text className="text-white/50 text-sm ml-2">{twincidence.annotations?.length || 0}</Text>
              </View>
            </View>
          </LinearGradient>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
};
