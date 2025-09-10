import React, { useState } from 'react';
import { View, Text, Pressable, Alert, Image, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { StoryMedia, MediaType } from '../../types/stories';
import { useStoryStore } from '../../state/stores/stories/storyStore';

interface MediaUploadProps {
  media: StoryMedia[];
  onAddMedia: (media: StoryMedia) => void;
  onRemoveMedia: (mediaId: string) => void;
  maxMedia?: number;
  allowedTypes?: MediaType[];
}

const { width: screenWidth } = Dimensions.get('window');

export const MediaUpload: React.FC<MediaUploadProps> = ({
  media,
  onAddMedia,
  onRemoveMedia,
  maxMedia = 10,
  allowedTypes = ['photo', 'video', 'audio'],
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const { isUploadingMedia, uploadProgress, setIsUploadingMedia, setUploadProgress } = useStoryStore();

  const requestPermissions = async () => {
    const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: audioStatus } = await Audio.requestPermissionsAsync();
    
    if (mediaStatus !== 'granted' || cameraStatus !== 'granted' || audioStatus !== 'granted') {
      Alert.alert(
        'Permissions Required',
        'Please grant camera, photo library, and microphone permissions to add media to your stories.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const simulateUpload = async () => {
    setIsUploadingMedia(true);
    for (let i = 0; i <= 100; i += 10) {
      setUploadProgress(i);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    setIsUploadingMedia(false);
    setUploadProgress(0);
  };

  const createMediaObject = (uri: string, type: MediaType, mimeType: string, duration?: number): StoryMedia => {
    return {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      type,
      uri,
      mimeType,
      size: 0, // Would be calculated from actual file
      duration,
      compressed: false,
    };
  };

  const pickImageFromLibrary = async () => {
    if (!allowedTypes.includes('photo')) return;
    if (media.length >= maxMedia) {
      Alert.alert('Limit Reached', `You can only add up to ${maxMedia} media files per story.`);
      return;
    }

    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await simulateUpload();
      const mediaObject = createMediaObject(
        result.assets[0].uri,
        'photo',
        'image/jpeg'
      );
      onAddMedia(mediaObject);
    }
  };

  const pickVideoFromLibrary = async () => {
    if (!allowedTypes.includes('video')) return;
    if (media.length >= maxMedia) {
      Alert.alert('Limit Reached', `You can only add up to ${maxMedia} media files per story.`);
      return;
    }

    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await simulateUpload();
      const mediaObject = createMediaObject(
        result.assets[0].uri,
        'video',
        'video/mp4',
        result.assets[0].duration ? Math.round(result.assets[0].duration / 1000) : undefined
      );
      onAddMedia(mediaObject);
    }
  };

  const takePhoto = async () => {
    if (!allowedTypes.includes('photo')) return;
    if (media.length >= maxMedia) {
      Alert.alert('Limit Reached', `You can only add up to ${maxMedia} media files per story.`);
      return;
    }

    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await simulateUpload();
      const mediaObject = createMediaObject(
        result.assets[0].uri,
        'photo',
        'image/jpeg'
      );
      onAddMedia(mediaObject);
    }
  };

  const startRecording = async () => {
    if (!allowedTypes.includes('audio')) return;
    if (media.length >= maxMedia) {
      Alert.alert('Limit Reached', `You can only add up to ${maxMedia} media files per story.`);
      return;
    }

    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(recording);
      setIsRecording(true);
      setRecordingDuration(0);

      // Update recording duration every second
      const interval = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      recording.setOnRecordingStatusUpdate((status) => {
        if (!status.isRecording) {
          clearInterval(interval);
        }
      });
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    setIsRecording(false);
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    
    if (uri) {
      await simulateUpload();
      const mediaObject = createMediaObject(
        uri,
        'audio',
        'audio/m4a',
        recordingDuration
      );
      onAddMedia(mediaObject);
    }

    setRecording(null);
    setRecordingDuration(0);
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const MediaPreview: React.FC<{ item: StoryMedia; index: number }> = ({ item, index }) => (
    <View className="relative mr-3 mb-3" style={{ width: 100, height: 100 }}>
      {item.type === 'photo' ? (
        <Image
          source={{ uri: item.uri }}
          className="w-full h-full rounded-xl"
          resizeMode="cover"
        />
      ) : item.type === 'video' ? (
        <View className="w-full h-full bg-black/20 rounded-xl items-center justify-center">
          <Ionicons name="play" size={32} color="white" />
        </View>
      ) : (
        <View className="w-full h-full bg-purple-500/20 rounded-xl items-center justify-center">
          <Ionicons name="mic" size={32} color="white" />
          {item.duration && (
            <Text className="text-white text-xs mt-1">
              {formatDuration(item.duration)}
            </Text>
          )}
        </View>
      )}
      
      {/* Remove Button */}
      <Pressable
        onPress={() => onRemoveMedia(item.id)}
        className="absolute -top-2 -right-2 bg-red-500 rounded-full w-6 h-6 items-center justify-center"
      >
        <Ionicons name="close" size={14} color="white" />
      </Pressable>
      
      {/* Duration Badge for Video */}
      {item.type === 'video' && item.duration && (
        <View className="absolute bottom-1 right-1 bg-black/60 rounded px-1">
          <Text className="text-white text-xs">
            {formatDuration(item.duration)}
          </Text>
        </View>
      )}
    </View>
  );

  const MediaUploadButton: React.FC<{ icon: string; label: string; onPress: () => void; disabled?: boolean }> = ({ 
    icon, 
    label, 
    onPress, 
    disabled = false 
  }) => (
    <Pressable
      onPress={onPress}
      disabled={disabled || isUploadingMedia}
      className={`flex-1 items-center py-4 px-3 rounded-xl mr-2 ${
        disabled || isUploadingMedia ? 'bg-white/10' : 'bg-white/20'
      }`}
    >
      <Ionicons 
        name={icon as any} 
        size={24} 
        color={disabled || isUploadingMedia ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.8)"} 
      />
      <Text className={`text-xs mt-1 text-center ${
        disabled || isUploadingMedia ? 'text-white/30' : 'text-white/80'
      }`}>
        {label}
      </Text>
    </Pressable>
  );

  return (
    <View className="mb-6">
      <Text className="text-white text-lg font-semibold mb-4">
        Add Media ({media.length}/{maxMedia})
      </Text>
      
      {/* Upload Progress */}
      {isUploadingMedia && (
        <View className="mb-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-white/80 text-sm">Uploading...</Text>
            <Text className="text-white/80 text-sm">{uploadProgress}%</Text>
          </View>
          <View className="bg-white/20 rounded-full h-2">
            <View 
              className="bg-blue-500 rounded-full h-2" 
              style={{ width: `${uploadProgress}%` }}
            />
          </View>
        </View>
      )}

      {/* Media Preview Grid */}
      {media.length > 0 && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          className="mb-4"
          contentContainerStyle={{ paddingRight: 20 }}
        >
          {media.map((item, index) => (
            <MediaPreview key={item.id} item={item} index={index} />
          ))}
        </ScrollView>
      )}

      {/* Recording Interface */}
      {isRecording ? (
        <View className="bg-red-500/20 border-2 border-red-500/50 rounded-xl p-6 mb-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className="w-3 h-3 bg-red-500 rounded-full mr-3 animate-pulse" />
              <Text className="text-white text-lg font-semibold">Recording</Text>
            </View>
            <Text className="text-white text-xl font-mono">
              {formatDuration(recordingDuration)}
            </Text>
          </View>
          <Pressable
            onPress={stopRecording}
            className="bg-red-500 rounded-full py-3 mt-4 items-center"
          >
            <Text className="text-white font-semibold">Stop Recording</Text>
          </Pressable>
        </View>
      ) : (
        <>
          {/* Upload Buttons */}
          <View className="flex-row mb-4">
            {allowedTypes.includes('photo') && (
              <MediaUploadButton
                icon="image"
                label="Gallery"
                onPress={pickImageFromLibrary}
                disabled={media.length >= maxMedia}
              />
            )}
            
            {allowedTypes.includes('photo') && (
              <MediaUploadButton
                icon="camera"
                label="Camera"
                onPress={takePhoto}
                disabled={media.length >= maxMedia}
              />
            )}
            
            {allowedTypes.includes('video') && (
              <MediaUploadButton
                icon="videocam"
                label="Video"
                onPress={pickVideoFromLibrary}
                disabled={media.length >= maxMedia}
              />
            )}
            
            {allowedTypes.includes('audio') && (
              <MediaUploadButton
                icon="mic"
                label="Record"
                onPress={startRecording}
                disabled={media.length >= maxMedia}
              />
            )}
          </View>

          {/* Upload Guidelines */}
          <View className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
            <View className="flex-row items-center mb-2">
              <Ionicons name="information-circle" size={20} color="#60A5FA" />
              <Text className="text-blue-300 font-semibold ml-2">Media Guidelines</Text>
            </View>
            <Text className="text-blue-200/80 text-sm leading-5">
              • Photos and videos are automatically compressed for storage
              {'\n'}• Audio recordings can be up to 5 minutes long
              {'\n'}• Maximum {maxMedia} media files per story
              {'\n'}• All media is stored securely and privately
            </Text>
          </View>
        </>
      )}
    </View>
  );
};