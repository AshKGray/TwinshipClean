import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, Alert, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { StoryEditor } from '../../components/stories/StoryEditor';
import { useStoryStore } from '../../state/stores/stories/storyStore';
import { StoryDraft } from '../../types/stories';

interface EditStoryRouteParams {
  storyId?: string;
}

export const EditStoryScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { storyId }: EditStoryRouteParams = route.params || {};

  const { stories, updateStory } = useStoryStore();
  const [isSaving, setIsSaving] = useState(false);

  const story = stories.find((s) => s.id === storyId);

  const editorDraft = useMemo<StoryDraft | undefined>(() => {
    if (!story) return undefined;

    return {
      id: story.id,
      title: story.title,
      content: story.content,
      category: story.category,
      tags: story.tags,
      media: story.media,
      milestone: story.milestone,
      location: story.location,
      lastSaved: story.lastModified,
      autoSaved: false,
    };
  }, [story]);

  const handleSave = async (updatedStory: any) => {
    if (!story) return;

    setIsSaving(true);

    try {
      updateStory(story.id, {
        title: updatedStory.title,
        content: updatedStory.content,
        category: updatedStory.category,
        tags: updatedStory.tags,
        media: updatedStory.media,
        milestone: updatedStory.milestone,
        location: updatedStory.location,
      });

      Alert.alert(
        'Story Updated',
        'Your story has been updated successfully.',
        [
          {
            text: 'View Story',
            onPress: () => navigation.replace('StoryDetail', { storyId: story.id }),
          },
          {
            text: 'Done',
            style: 'default',
            onPress: () => navigation.goBack(),
          },
        ],
        { cancelable: false }
      );
    } catch (error) {
      console.error('Failed to update story:', error);
      Alert.alert('Update Failed', 'Unable to update your story. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Discard changes?',
      'Any unsaved edits will be lost.',
      [
        { text: 'Keep Editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
      ]
    );
  };

  if (!story || !editorDraft) {
    return (
      <ImageBackground source={require('../../assets/galaxybackground.png')} style={{ flex: 1 }}>
        <SafeAreaView className="flex-1 items-center justify-center px-6">
          <Ionicons name="book-outline" size={56} color="rgba(255,255,255,0.6)" />
          <Text className="text-white text-xl font-semibold mt-4">Story unavailable</Text>
          <Text className="text-white/70 text-center mt-2">
            We couldn't find the story you're trying to edit.
          </Text>
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

  return (
    <ImageBackground source={require('../../assets/galaxybackground.png')} style={{ flex: 1 }}>
      <SafeAreaView className="flex-1">
        <View className="flex-row items-center justify-between px-6 py-4 border-b border-white/10">
          <Pressable onPress={handleCancel} className="flex-row items-center">
            <Ionicons name="arrow-back" size={24} color="white" />
            <Text className="text-white text-lg font-medium ml-2">Cancel</Text>
          </Pressable>

          <Text className="text-white text-xl font-semibold">Edit Story</Text>

          <View className="w-20" />
        </View>

        {isSaving && (
          <View className="absolute inset-0 bg-black/50 items-center justify-center z-50">
            <View className="bg-white/10 rounded-2xl p-8 items-center border border-white/20">
              <View className="animate-spin mb-4">
                <Ionicons name="sync" size={32} color="white" />
              </View>
              <Text className="text-white text-lg font-semibold">Updating Story...</Text>
              <Text className="text-white/70 text-sm mt-1">Please wait while we save your changes</Text>
            </View>
          </View>
        )}

        <StoryEditor
          draft={editorDraft}
          onSave={handleSave}
          onCancel={handleCancel}
          autoSave={false}
        />
      </SafeAreaView>
    </ImageBackground>
  );
};

