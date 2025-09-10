import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  Pressable, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StoryCategory, StoryMedia, StoryMilestone, StoryDraft } from '../../types/stories';
import { MediaUpload } from './MediaUpload';
import { useStoryStore } from '../../state/stores/stories/storyStore';
import { useTwinStore } from '../../state/twinStore';

interface StoryEditorProps {
  draft?: StoryDraft;
  onSave?: (storyData: any) => void;
  onCancel?: () => void;
  autoSave?: boolean;
}

const CATEGORIES: { key: StoryCategory; label: string; icon: string; color: string }[] = [
  { key: 'childhood', label: 'Childhood', icon: 'happy', color: '#FFB347' },
  { key: 'milestones', label: 'Milestones', icon: 'trophy', color: '#FFD700' },
  { key: 'adventures', label: 'Adventures', icon: 'map', color: '#32CD32' },
  { key: 'synchronicity', label: 'Twin Sync', icon: 'radio', color: '#FF1493' },
  { key: 'achievements', label: 'Achievements', icon: 'star', color: '#8A2BE2' },
  { key: 'memories', label: 'Memories', icon: 'heart', color: '#FF69B4' },
  { key: 'other', label: 'Other', icon: 'book', color: '#87CEEB' },
];

const MILESTONE_TYPES = [
  'birthday', 'anniversary', 'achievement', 'first', 'last', 'custom'
];

export const StoryEditor: React.FC<StoryEditorProps> = ({
  draft,
  onSave,
  onCancel,
  autoSave = true,
}) => {
  const [title, setTitle] = useState(draft?.title || '');
  const [content, setContent] = useState(draft?.content || '');
  const [category, setCategory] = useState<StoryCategory>(draft?.category || 'memories');
  const [tags, setTags] = useState<string[]>(draft?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [media, setMedia] = useState<StoryMedia[]>(draft?.media || []);
  const [showMilestone, setShowMilestone] = useState(!!draft?.milestone);
  const [milestone, setMilestone] = useState<Partial<StoryMilestone>>(draft?.milestone || {});
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);

  const { saveDraft, updateDraft, currentDraft, setCurrentDraft } = useStoryStore();
  const { userProfile } = useTwinStore();

  // Auto-save functionality
  useEffect(() => {
    if (!autoSave || (!title.trim() && !content.trim())) return;
    
    const autoSaveTimer = setTimeout(() => {
      const draftData = {
        title: title.trim(),
        content: content.trim(),
        category,
        tags,
        media,
        milestone: showMilestone ? milestone as StoryMilestone : undefined,
      };

      if (currentDraft?.id) {
        updateDraft(currentDraft.id, draftData);
      } else if (title.trim() || content.trim()) {
        saveDraft(draftData);
        // Note: In a real implementation, you'd get the new draft ID from the store
        setLastAutoSave(new Date());
      }
    }, 3000); // Auto-save after 3 seconds of inactivity

    return () => clearTimeout(autoSaveTimer);
  }, [title, content, category, tags, media, milestone, showMilestone]);

  const addTag = () => {
    const newTag = tagInput.trim().toLowerCase();
    if (newTag && !tags.includes(newTag) && tags.length < 10) {
      setTags([...tags, newTag]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const addMedia = (newMedia: StoryMedia) => {
    setMedia([...media, newMedia]);
  };

  const removeMedia = (mediaId: string) => {
    setMedia(media.filter(m => m.id !== mediaId));
  };

  const validateStory = (): boolean => {
    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please add a title for your story.');
      return false;
    }
    if (!content.trim()) {
      Alert.alert('Missing Content', 'Please add some content to your story.');
      return false;
    }
    if (showMilestone && (!milestone.type || !milestone.significance)) {
      Alert.alert('Incomplete Milestone', 'Please complete the milestone information or turn off milestone marking.');
      return false;
    }
    return true;
  };

  const handleSave = () => {
    if (!validateStory()) return;

    const storyData = {
      title: title.trim(),
      content: content.trim(),
      category,
      tags,
      media,
      milestone: showMilestone ? milestone as StoryMilestone : undefined,
      authorId: userProfile?.id || '',
      isShared: false,
      isPrivate: false,
      sharedWith: [],
      sharePermissions: 'view' as const,
    };

    if (onSave) {
      onSave(storyData);
    }
  };

  const CategorySelector: React.FC = () => (
    <View className="mb-6">
      <Text className="text-white text-lg font-semibold mb-3">Category</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {CATEGORIES.map((cat) => (
          <Pressable
            key={cat.key}
            onPress={() => setCategory(cat.key)}
            className={`mr-3 ${category === cat.key ? 'opacity-100' : 'opacity-60'}`}
          >
            <LinearGradient
              colors={
                category === cat.key 
                  ? [cat.color + '40', cat.color + '20'] 
                  : ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']
              }
              className={`rounded-xl p-4 items-center border-2 ${
                category === cat.key ? 'border-opacity-60' : 'border-white/10'
              }`}
              style={{ borderColor: category === cat.key ? cat.color : undefined }}
            >
              <Ionicons 
                name={cat.icon as any} 
                size={28} 
                color={category === cat.key ? cat.color : 'rgba(255,255,255,0.7)'} 
              />
              <Text 
                className={`mt-2 text-sm font-medium ${
                  category === cat.key ? 'text-white' : 'text-white/70'
                }`}
              >
                {cat.label}
              </Text>
            </LinearGradient>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );

  const MilestoneEditor: React.FC = () => (
    <View className="mb-6">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-white text-lg font-semibold">Milestone</Text>
        <Pressable
          onPress={() => setShowMilestone(!showMilestone)}
          className={`flex-row items-center px-3 py-1 rounded-full ${
            showMilestone ? 'bg-yellow-400/30' : 'bg-white/10'
          }`}
        >
          <Ionicons 
            name={showMilestone ? 'star' : 'star-outline'} 
            size={16} 
            color={showMilestone ? '#FFD700' : 'rgba(255,255,255,0.7)'} 
          />
          <Text className={`ml-1 text-sm ${showMilestone ? 'text-yellow-300' : 'text-white/70'}`}>
            Mark as milestone
          </Text>
        </Pressable>
      </View>

      {showMilestone && (
        <View className="bg-yellow-400/10 border border-yellow-400/30 rounded-xl p-4">
          {/* Milestone Type */}
          <View className="mb-4">
            <Text className="text-yellow-300 font-semibold mb-2">Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {MILESTONE_TYPES.map((type) => (
                <Pressable
                  key={type}
                  onPress={() => setMilestone({ ...milestone, type: type as any })}
                  className={`mr-2 px-3 py-2 rounded-full border ${
                    milestone.type === type
                      ? 'bg-yellow-400/30 border-yellow-400/60'
                      : 'bg-white/10 border-white/20'
                  }`}
                >
                  <Text 
                    className={`text-sm ${
                      milestone.type === type ? 'text-yellow-300' : 'text-white/70'
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Milestone Date */}
          <View className="mb-4">
            <Text className="text-yellow-300 font-semibold mb-2">Date</Text>
            <TextInput
              value={milestone.date}
              onChangeText={(text) => setMilestone({ ...milestone, date: text })}
              placeholder="When did this milestone happen?"
              placeholderTextColor="rgba(255,255,255,0.4)"
              className="bg-white/10 rounded-xl px-4 py-3 text-white"
            />
          </View>

          {/* Milestone Significance */}
          <View>
            <Text className="text-yellow-300 font-semibold mb-2">Significance</Text>
            <TextInput
              value={milestone.significance}
              onChangeText={(text) => setMilestone({ ...milestone, significance: text })}
              placeholder="Why is this milestone important?"
              placeholderTextColor="rgba(255,255,255,0.4)"
              className="bg-white/10 rounded-xl px-4 py-3 text-white"
              multiline
              numberOfLines={2}
            />
          </View>
        </View>
      )}
    </View>
  );

  const TagEditor: React.FC = () => (
    <View className="mb-6">
      <Text className="text-white text-lg font-semibold mb-3">Tags</Text>
      
      {/* Tag Input */}
      <View className="flex-row items-center mb-3">
        <TextInput
          value={tagInput}
          onChangeText={setTagInput}
          onSubmitEditing={addTag}
          placeholder="Add a tag..."
          placeholderTextColor="rgba(255,255,255,0.5)"
          className="flex-1 bg-white/10 rounded-xl px-4 py-3 text-white mr-3"
          maxLength={20}
        />
        <Pressable
          onPress={addTag}
          disabled={!tagInput.trim() || tags.length >= 10}
          className={`px-4 py-3 rounded-xl ${
            tagInput.trim() && tags.length < 10 ? 'bg-blue-500' : 'bg-white/20'
          }`}
        >
          <Ionicons 
            name="add" 
            size={20} 
            color={tagInput.trim() && tags.length < 10 ? 'white' : 'rgba(255,255,255,0.5)'} 
          />
        </Pressable>
      </View>

      {/* Tags Display */}
      {tags.length > 0 && (
        <View className="flex-row flex-wrap">
          {tags.map((tag, index) => (
            <View key={index} className="bg-blue-500/30 rounded-full px-3 py-1 mr-2 mb-2 flex-row items-center">
              <Text className="text-blue-300 text-sm">#{tag}</Text>
              <Pressable onPress={() => removeTag(tag)} className="ml-2">
                <Ionicons name="close" size={14} color="rgba(59, 130, 246, 0.8)" />
              </Pressable>
            </View>
          ))}
        </View>
      )}
      
      {tags.length >= 10 && (
        <Text className="text-orange-400 text-sm mt-2">
          Maximum 10 tags reached
        </Text>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Auto-save Indicator */}
        {lastAutoSave && (
          <View className="bg-green-500/20 rounded-xl p-3 mb-4 flex-row items-center">
            <Ionicons name="cloud-done" size={20} color="#10B981" />
            <Text className="text-green-400 text-sm ml-2">
              Draft auto-saved at {lastAutoSave.toLocaleTimeString()}
            </Text>
          </View>
        )}

        {/* Title Input */}
        <View className="mb-6">
          <Text className="text-white text-lg font-semibold mb-3">Title</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Give your story a memorable title..."
            placeholderTextColor="rgba(255,255,255,0.5)"
            className="bg-white/10 rounded-xl px-4 py-4 text-white text-lg font-medium"
            maxLength={100}
          />
          <Text className="text-white/40 text-sm mt-1 text-right">
            {title.length}/100
          </Text>
        </View>

        {/* Category Selector */}
        <CategorySelector />

        {/* Content Input */}
        <View className="mb-6">
          <Text className="text-white text-lg font-semibold mb-3">Your Story</Text>
          <View className="bg-white/10 rounded-xl p-4 border border-white/20">
            <TextInput
              value={content}
              onChangeText={setContent}
              placeholder="Share your twin journey, memories, or special moments... What made this experience unique to your twin bond?"
              placeholderTextColor="rgba(255,255,255,0.5)"
              className="text-white text-base leading-6"
              multiline
              numberOfLines={8}
              textAlignVertical="top"
              maxLength={2000}
            />
          </View>
          <Text className="text-white/40 text-sm mt-1 text-right">
            {content.length}/2000
          </Text>
        </View>

        {/* Media Upload */}
        <MediaUpload
          media={media}
          onAddMedia={addMedia}
          onRemoveMedia={removeMedia}
          maxMedia={8}
        />

        {/* Milestone Editor */}
        <MilestoneEditor />

        {/* Tag Editor */}
        <TagEditor />

        {/* Action Buttons */}
        <View className="flex-row space-x-4 py-6">
          {onCancel && (
            <Pressable
              onPress={onCancel}
              className="flex-1 bg-white/10 rounded-xl py-4 items-center border border-white/20"
            >
              <Text className="text-white/80 text-lg font-semibold">Cancel</Text>
            </Pressable>
          )}
          
          <Pressable
            onPress={handleSave}
            disabled={!title.trim() || !content.trim()}
            className={`flex-1 rounded-xl py-4 items-center ${
              title.trim() && content.trim() 
                ? 'bg-purple-500' 
                : 'bg-white/20'
            }`}
          >
            <Text className="text-white text-lg font-semibold">
              Save Story
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};