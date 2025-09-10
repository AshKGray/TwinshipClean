import React, { useState } from 'react';
import { View, Text, Pressable, Alert, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StoryEditor } from '../../components/stories/StoryEditor';
import { useTwinStore } from '../../state/twinStore';
import { useStoryStore } from '../../state/stores/stories/storyStore';

interface CreateStoryScreenProps {
  navigation: any;
  route?: {
    params?: {
      draftId?: string;
    };
  };
}

export const CreateStoryScreen: React.FC<CreateStoryScreenProps> = ({ navigation, route }) => {
  const [isSaving, setIsSaving] = useState(false);
  const { userProfile } = useTwinStore();
  const { addStory, drafts, currentDraft, setCurrentDraft, deleteDraft } = useStoryStore();
  
  const draftId = route?.params?.draftId;
  const draft = draftId ? drafts.find(d => d.id === draftId) : currentDraft;

  const handleSave = async (storyData: any) => {
    setIsSaving(true);
    
    try {
      // Add the story
      addStory(storyData);
      
      // Clean up draft if it exists
      if (draft?.id) {
        deleteDraft(draft.id);
      }
      if (currentDraft) {
        setCurrentDraft(null);
      }
      
      // Show success message
      Alert.alert(
        'Story Created!',
        'Your story has been saved successfully.',
        [
          {
            text: 'View Story',
            onPress: () => {
              navigation.replace('StoryDetail', { storyId: 'latest' });
            }
          },
          {
            text: 'Create Another',
            onPress: () => {
              navigation.replace('CreateStory');
            }
          },
          {
            text: 'Back to Stories',
            style: 'default',
            onPress: () => {
              navigation.goBack();
            }
          }
        ],
        { cancelable: false }
      );
      
    } catch (error) {
      console.error('Error saving story:', error);
      Alert.alert(
        'Save Failed',
        'There was an error saving your story. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (currentDraft || draft) {
      Alert.alert(
        'Save Draft?',
        'Do you want to save your progress as a draft before leaving?',
        [
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              if (currentDraft) {
                setCurrentDraft(null);
              }
              navigation.goBack();
            }
          },
          {
            text: 'Save Draft',
            onPress: () => {
              // Draft is auto-saved by the StoryEditor component
              navigation.goBack();
            }
          },
          {
            text: 'Keep Editing',
            style: 'cancel'
          }
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  return (
    <ImageBackground source={require("../../assets/galaxybackground.png")} style={{ flex: 1 }}>
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 py-4 border-b border-white/10">
          <Pressable 
            onPress={handleCancel}
            className="flex-row items-center"
          >
            <Ionicons name="arrow-back" size={24} color="white" />
            <Text className="text-white text-lg font-medium ml-2">Cancel</Text>
          </Pressable>
          
          <Text className="text-white text-xl font-semibold">
            {draft ? 'Edit Draft' : 'New Story'}
          </Text>
          
          <View className="w-20" /> {/* Spacer for centering */}
        </View>

        {/* Loading Overlay */}
        {isSaving && (
          <View className="absolute inset-0 bg-black/50 items-center justify-center z-50">
            <View className="bg-white/10 rounded-2xl p-8 items-center border border-white/20">
              <View className="animate-spin mb-4">
                <Ionicons name="sync" size={32} color="white" />
              </View>
              <Text className="text-white text-lg font-semibold">Saving Story...</Text>
              <Text className="text-white/70 text-sm mt-1">Please wait while we save your story</Text>
            </View>
          </View>
        )}

        {/* Story Editor */}
        <StoryEditor
          draft={draft}
          onSave={handleSave}
          onCancel={handleCancel}
          autoSave={true}
        />
      </SafeAreaView>
    </ImageBackground>
  );
};