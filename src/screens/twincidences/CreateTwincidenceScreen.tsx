import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  ImageBackground,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTwincidencesStore } from '../../state/twincidencesStore';
import { useTwinStore } from '../../state/twinStore';
import { TwincidenceCategory } from '../../types/twincidences';

interface CreateTwincidenceScreenProps {
  navigation: any;
}

const MANUAL_CATEGORIES: {
  key: TwincidenceCategory;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  description: string;
}[] = [
  {
    key: TwincidenceCategory.MANUAL_ESP,
    label: 'ESP / Telepathy',
    icon: 'eye',
    color: '#9370DB',
    description: 'You knew what your twin was thinking or feeling',
  },
  {
    key: TwincidenceCategory.MANUAL_DREAM,
    label: 'Shared Dream',
    icon: 'moon',
    color: '#4B0082',
    description: 'You and your twin had similar dreams',
  },
  {
    key: TwincidenceCategory.MANUAL_TWIN_TALK,
    label: 'Twin-Talk Moment',
    icon: 'people',
    color: '#FF69B4',
    description: 'Simultaneous thoughts, words, or actions',
  },
  {
    key: TwincidenceCategory.MANUAL_PARALLEL_EXPERIENCE,
    label: 'Parallel Experience',
    icon: 'git-compare',
    color: '#20B2AA',
    description: 'Similar experiences at different times or places',
  },
  {
    key: TwincidenceCategory.MANUAL_OTHER,
    label: 'Other Synchronicity',
    icon: 'sparkles',
    color: '#DDA0DD',
    description: 'Any other meaningful coincidence',
  },
];

export const CreateTwincidenceScreen: React.FC<CreateTwincidenceScreenProps> = ({ navigation }) => {
  const { addTwincidence, saveDraft } = useTwincidencesStore();
  const { userProfile } = useTwinStore();

  const [selectedCategory, setSelectedCategory] = useState<TwincidenceCategory | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [eventDate, setEventDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [photos, setPhotos] = useState<any[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);

  const handlePickImage = async () => {
    if (photos.length >= 10) {
      Alert.alert('Limit Reached', 'You can add up to 10 photos per twincidence.');
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant photo library access to add images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets) {
      const newPhotos = result.assets.map((asset) => ({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        type: 'photo' as const,
        uri: asset.uri,
        size: asset.fileSize || 0,
        mimeType: 'image/jpeg',
        timestamp: new Date().toISOString(),
      }));
      setPhotos([...photos, ...newPhotos].slice(0, 10));
    }
  };

  const handleRemovePhoto = (photoId: string) => {
    setPhotos(photos.filter((p) => p.id !== photoId));
  };

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag) && tags.length < 10) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSaveDraft = () => {
    if (!selectedCategory || !title.trim()) {
      Alert.alert('Missing Information', 'Please select a category and add a title before saving.');
      return;
    }

    saveDraft({
      category: selectedCategory,
      title: title.trim(),
      description: description.trim(),
      tags,
      eventDate: eventDate.toISOString(),
      media: photos.length > 0 ? { photos } : undefined,
    });

    Alert.alert('Draft Saved', 'Your twincidence has been saved as a draft.', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  const handlePublish = () => {
    if (!selectedCategory) {
      Alert.alert('Select Category', 'Please select a category for your twincidence.');
      return;
    }

    if (!title.trim()) {
      Alert.alert('Add Title', 'Please add a title for your twincidence.');
      return;
    }

    if (title.trim().length > 100) {
      Alert.alert('Title Too Long', 'Please keep the title under 100 characters.');
      return;
    }

    if (description.trim().length > 2000) {
      Alert.alert('Description Too Long', 'Please keep the description under 2000 characters.');
      return;
    }

    setIsPublishing(true);

    try {
      addTwincidence({
        category: selectedCategory,
        detectionType: 'manual',
        title: title.trim(),
        description: description.trim() || undefined,
        metadata: {
          eventDate: eventDate.toISOString(),
        },
        media: photos.length > 0 ? { photos } : undefined,
        tags,
        isSharedWithResearch: false,
        privacyLevel: 'twin_only',
        createdBy: userProfile?.id,
      });

      Alert.alert('Twincidence Created!', 'Your synchronicity moment has been logged.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to create twincidence. Please try again.');
    } finally {
      setIsPublishing(false);
    }
  };

  const CategorySelector: React.FC = () => (
    <View className="mb-6">
      <Text className="text-white font-semibold text-lg mb-3">What kind of synchronicity?</Text>
      {MANUAL_CATEGORIES.map((category) => (
        <Pressable
          key={category.key}
          onPress={() => setSelectedCategory(category.key)}
          className="mb-3"
        >
          <LinearGradient
            colors={
              selectedCategory === category.key
                ? [category.color + '30', category.color + '10']
                : ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']
            }
            className={`rounded-2xl p-4 flex-row items-center border ${
              selectedCategory === category.key ? 'border-opacity-60' : 'border-white/20'
            }`}
            style={{ borderColor: selectedCategory === category.key ? category.color : undefined }}
          >
            <View
              className="rounded-full p-3 mr-4"
              style={{ backgroundColor: category.color + '20' }}
            >
              <Ionicons name={category.icon} size={24} color={category.color} />
            </View>

            <View className="flex-1">
              <Text className="text-white font-semibold text-base mb-1">{category.label}</Text>
              <Text className="text-white/60 text-sm">{category.description}</Text>
            </View>

            {selectedCategory === category.key && (
              <Ionicons name="checkmark-circle" size={24} color={category.color} />
            )}
          </LinearGradient>
        </Pressable>
      ))}
    </View>
  );

  return (
    <ImageBackground source={require("../../../assets/galaxybackground.png")} style={{ flex: 1 }}>
      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          {/* Header */}
          <View className="flex-row items-center justify-between px-6 py-4">
            <View className="flex-row items-center flex-1">
              <Pressable onPress={() => navigation.goBack()} className="mr-4">
                <Ionicons name="close" size={24} color="white" />
              </Pressable>
              <View>
                <Text className="text-white text-2xl font-bold">New Twincidence</Text>
                <Text className="text-white/70 text-sm">Log a synchronicity moment</Text>
              </View>
            </View>

            <Pressable onPress={handleSaveDraft} className="bg-white/10 rounded-full px-4 py-2">
              <Text className="text-white font-semibold">Draft</Text>
            </Pressable>
          </View>

          <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
            {/* Category Selector */}
            <CategorySelector />

            {selectedCategory && (
              <>
                {/* Title Input */}
                <View className="mb-6">
                  <Text className="text-white font-semibold text-base mb-2">
                    Title <Text className="text-red-400">*</Text>
                  </Text>
                  <TextInput
                    value={title}
                    onChangeText={setTitle}
                    placeholder="Give this moment a title..."
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    className="bg-white/10 text-white rounded-xl px-4 py-3 border border-white/20"
                    maxLength={100}
                  />
                  <Text className="text-white/40 text-xs mt-1 text-right">
                    {title.length}/100
                  </Text>
                </View>

                {/* Description Input */}
                <View className="mb-6">
                  <Text className="text-white font-semibold text-base mb-2">Description</Text>
                  <TextInput
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Describe what happened..."
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    className="bg-white/10 text-white rounded-xl px-4 py-3 border border-white/20"
                    multiline
                    numberOfLines={6}
                    textAlignVertical="top"
                    maxLength={2000}
                  />
                  <Text className="text-white/40 text-xs mt-1 text-right">
                    {description.length}/2000
                  </Text>
                </View>

                {/* Date Picker */}
                <View className="mb-6">
                  <Text className="text-white font-semibold text-base mb-2">When did this happen?</Text>
                  <Pressable
                    onPress={() => setShowDatePicker(true)}
                    className="bg-white/10 rounded-xl px-4 py-3 border border-white/20 flex-row items-center justify-between"
                  >
                    <View className="flex-row items-center">
                      <Ionicons name="calendar" size={20} color="rgba(255,255,255,0.7)" />
                      <Text className="text-white ml-3">
                        {eventDate.toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.5)" />
                  </Pressable>

                  {showDatePicker && (
                    <DateTimePicker
                      value={eventDate}
                      mode="date"
                      display="default"
                      onChange={(event, date) => {
                        setShowDatePicker(Platform.OS === 'ios');
                        if (date) setEventDate(date);
                      }}
                      maximumDate={new Date()}
                    />
                  )}
                </View>

                {/* Photo Picker */}
                <View className="mb-6">
                  <Text className="text-white font-semibold text-base mb-2">
                    Photos ({photos.length}/10)
                  </Text>
                  <Pressable
                    onPress={handlePickImage}
                    className="bg-white/10 rounded-xl p-4 border border-white/20 border-dashed flex-row items-center justify-center"
                  >
                    <Ionicons name="images" size={24} color="rgba(255,255,255,0.6)" />
                    <Text className="text-white/60 ml-2">Add Photos</Text>
                  </Pressable>

                  {photos.length > 0 && (
                    <View className="flex-row flex-wrap mt-3">
                      {photos.map((photo) => (
                        <View key={photo.id} className="w-1/3 p-1">
                          <View className="relative">
                            <View className="bg-white/10 rounded-xl overflow-hidden aspect-square">
                              {/* Photo preview would go here */}
                              <View className="w-full h-full bg-purple-500/20 items-center justify-center">
                                <Ionicons name="image" size={32} color="rgba(255,255,255,0.5)" />
                              </View>
                            </View>
                            <Pressable
                              onPress={() => handleRemovePhoto(photo.id)}
                              className="absolute top-2 right-2 bg-red-500 rounded-full p-1"
                            >
                              <Ionicons name="close" size={16} color="white" />
                            </Pressable>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </View>

                {/* Tags */}
                <View className="mb-6">
                  <Text className="text-white font-semibold text-base mb-2">
                    Tags ({tags.length}/10)
                  </Text>
                  <View className="flex-row items-center mb-2">
                    <TextInput
                      value={tagInput}
                      onChangeText={setTagInput}
                      placeholder="Add a tag..."
                      placeholderTextColor="rgba(255,255,255,0.5)"
                      className="flex-1 bg-white/10 text-white rounded-xl px-4 py-3 border border-white/20 mr-2"
                      onSubmitEditing={handleAddTag}
                      returnKeyType="done"
                    />
                    <Pressable
                      onPress={handleAddTag}
                      disabled={!tagInput.trim() || tags.length >= 10}
                      className="bg-purple-500 rounded-full p-3"
                    >
                      <Ionicons name="add" size={20} color="white" />
                    </Pressable>
                  </View>

                  {tags.length > 0 && (
                    <View className="flex-row flex-wrap">
                      {tags.map((tag) => (
                        <View
                          key={tag}
                          className="bg-purple-500/30 rounded-full px-3 py-1.5 flex-row items-center mr-2 mb-2"
                        >
                          <Text className="text-purple-300 text-sm mr-1">#{tag}</Text>
                          <Pressable onPress={() => handleRemoveTag(tag)}>
                            <Ionicons name="close-circle" size={16} color="#DDA0DD" />
                          </Pressable>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </>
            )}

            <View className="pb-8" />
          </ScrollView>

          {/* Footer Buttons */}
          {selectedCategory && (
            <View className="px-6 py-4 bg-black/30">
              <Pressable
                onPress={handlePublish}
                disabled={isPublishing || !title.trim()}
                className={`rounded-xl py-4 ${
                  !title.trim() ? 'bg-gray-500' : 'bg-purple-500'
                }`}
              >
                <Text className="text-white font-bold text-center text-lg">
                  {isPublishing ? 'Publishing...' : 'Publish Twincidence'}
                </Text>
              </Pressable>
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
};
