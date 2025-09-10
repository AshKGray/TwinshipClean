import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, RefreshControl, Dimensions, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StoryCard } from '../../components/stories/StoryCard';
import { useTwinStore } from '../../state/twinStore';
import { useStoryStore } from '../../state/stores/stories/storyStore';
import { StoryCategory } from '../../types/stories';

interface StoriesScreenProps {
  navigation: any;
}

const { width: screenWidth } = Dimensions.get('window');

const CATEGORY_FILTERS: { key: StoryCategory | 'all'; label: string; icon: string; color: string }[] = [
  { key: 'all', label: 'All', icon: 'albums', color: '#8A2BE2' },
  { key: 'childhood', label: 'Childhood', icon: 'happy', color: '#FFB347' },
  { key: 'milestones', label: 'Milestones', icon: 'trophy', color: '#FFD700' },
  { key: 'adventures', label: 'Adventures', icon: 'map', color: '#32CD32' },
  { key: 'synchronicity', label: 'Twin Sync', icon: 'radio', color: '#FF1493' },
  { key: 'achievements', label: 'Achievements', icon: 'star', color: '#8A2BE2' },
  { key: 'memories', label: 'Memories', icon: 'heart', color: '#FF69B4' },
];

export const StoriesScreen: React.FC<StoriesScreenProps> = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const { userProfile } = useTwinStore();
  const {
    filteredStories,
    selectedCategory,
    searchText,
    isCreatingStory,
    setSelectedCategory,
    setSearchText,
    applyFilters,
    clearFilters,
    getStoryStats,
    getRecentStories,
  } = useStoryStore();

  const stats = getStoryStats();
  const recentStories = getRecentStories(5);
  const displayStories = showSearch || searchText || selectedCategory !== 'all' 
    ? filteredStories 
    : recentStories;

  useEffect(() => {
    applyFilters();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    applyFilters();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const navigateToCreateStory = () => {
    navigation.navigate('CreateStory');
  };

  const navigateToStoryDetail = (storyId: string) => {
    navigation.navigate('StoryDetail', { storyId });
  };

  const navigateToTimeline = () => {
    // Navigate to timeline view (to be implemented)
    console.log('Navigate to timeline');
  };

  const StatsCard: React.FC = () => (
    <LinearGradient
      colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)']}
      className="rounded-2xl p-4 mb-6 border border-white/20"
    >
      <Text className="text-white font-semibold text-lg mb-3">Your Story Journey</Text>
      <View className="flex-row items-center justify-between">
        <View className="items-center">
          <Text className="text-white text-2xl font-bold">{stats.totalStories}</Text>
          <Text className="text-white/60 text-sm">Total Stories</Text>
        </View>
        <View className="items-center">
          <Text className="text-white text-2xl font-bold">{stats.storiesThisMonth}</Text>
          <Text className="text-white/60 text-sm">This Month</Text>
        </View>
        <View className="items-center">
          <Text className="text-white text-2xl font-bold">{stats.milestoneCount}</Text>
          <Text className="text-white/60 text-sm">Milestones</Text>
        </View>
        <Pressable onPress={navigateToTimeline} className="items-center">
          <View className="bg-purple-500/30 rounded-full p-2">
            <Ionicons name="timeline" size={20} color="#8A2BE2" />
          </View>
          <Text className="text-purple-400 text-xs mt-1">Timeline</Text>
        </Pressable>
      </View>
    </LinearGradient>
  );

  const CategoryFilter: React.FC = () => (
    <View className="mb-6">
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 4 }}
      >
        {CATEGORY_FILTERS.map((filter) => (
          <Pressable
            key={filter.key}
            onPress={() => setSelectedCategory(filter.key)}
            className={`mr-3 ${selectedCategory === filter.key ? 'opacity-100' : 'opacity-70'}`}
          >
            <LinearGradient
              colors={
                selectedCategory === filter.key
                  ? [filter.color + '40', filter.color + '20']
                  : ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']
              }
              className={`rounded-xl px-4 py-2 flex-row items-center border ${
                selectedCategory === filter.key ? 'border-opacity-60' : 'border-white/10'
              }`}
              style={{ borderColor: selectedCategory === filter.key ? filter.color : undefined }}
            >
              <Ionicons 
                name={filter.icon as any} 
                size={18} 
                color={selectedCategory === filter.key ? filter.color : 'rgba(255,255,255,0.7)'} 
              />
              <Text 
                className={`ml-2 font-medium ${
                  selectedCategory === filter.key ? 'text-white' : 'text-white/70'
                }`}
              >
                {filter.label}
              </Text>
            </LinearGradient>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );

  const SearchBar: React.FC = () => (
    showSearch ? (
      <View className="mb-6">
        <View className="flex-row items-center bg-white/10 rounded-xl px-4 py-3 border border-white/20">
          <Ionicons name="search" size={20} color="rgba(255,255,255,0.6)" />
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Search your stories..."
            placeholderTextColor="rgba(255,255,255,0.5)"
            className="flex-1 text-white ml-3"
            autoFocus
          />
          {searchText.length > 0 && (
            <Pressable onPress={() => setSearchText('')} className="ml-2">
              <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.6)" />
            </Pressable>
          )}
        </View>
        {(searchText || selectedCategory !== 'all') && (
          <Pressable 
            onPress={clearFilters}
            className="mt-2 flex-row items-center justify-center"
          >
            <Text className="text-blue-400 text-sm">Clear filters</Text>
          </Pressable>
        )}
      </View>
    ) : null
  );

  const EmptyState: React.FC = () => (
    <View className="items-center py-12">
      <LinearGradient
        colors={['rgba(138, 43, 226, 0.2)', 'rgba(138, 43, 226, 0.05)']}
        className="rounded-full p-8 mb-6"
      >
        <Ionicons name="book-outline" size={64} color="rgba(138, 43, 226, 0.8)" />
      </LinearGradient>
      <Text className="text-white text-xl font-semibold mb-2 text-center">
        {searchText || selectedCategory !== 'all' 
          ? 'No stories found' 
          : 'Start Your Story Journey'}
      </Text>
      <Text className="text-white/60 text-center mb-6 px-8 leading-6">
        {searchText || selectedCategory !== 'all'
          ? 'Try adjusting your search or filters to find the stories you\'re looking for.'
          : 'Document your twin journey with photos, videos, and memories. Create your first story and start building your digital scrapbook.'}
      </Text>
      {!(searchText || selectedCategory !== 'all') && (
        <Pressable
          onPress={navigateToCreateStory}
          className="bg-purple-500 rounded-xl px-6 py-3 flex-row items-center"
        >
          <Ionicons name="add" size={20} color="white" />
          <Text className="text-white font-semibold ml-2">Create First Story</Text>
        </Pressable>
      )}
    </View>
  );

  return (
    <ImageBackground source={require("../../assets/galaxybackground.png")} style={{ flex: 1 }}>
      <SafeAreaView className="flex-1">
        <View className="flex-1">
          {/* Header */}
          <View className="flex-row items-center justify-between px-6 py-4">
            <View className="flex-1">
              <Text className="text-white text-2xl font-bold">Twin Stories</Text>
              <Text className="text-white/70 text-sm">
                Your shared journey together
              </Text>
            </View>
            
            <View className="flex-row items-center space-x-3">
              <Pressable
                onPress={() => setShowSearch(!showSearch)}
                className="bg-white/10 rounded-full p-3 border border-white/20"
              >
                <Ionicons 
                  name={showSearch ? "close" : "search"} 
                  size={20} 
                  color="white" 
                />
              </Pressable>
              
              <Pressable
                onPress={navigateToCreateStory}
                className="bg-purple-500 rounded-full p-3"
              >
                <Ionicons name="add" size={20} color="white" />
              </Pressable>
            </View>
          </View>

          <ScrollView
            className="flex-1 px-6"
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="white"
                colors={['#8A2BE2']}
              />
            }
          >
            {/* Search Bar */}
            <SearchBar />

            {/* Stats Card - Only show when not searching/filtering */}
            {!showSearch && searchText === '' && selectedCategory === 'all' && stats.totalStories > 0 && (
              <StatsCard />
            )}

            {/* Category Filter */}
            <CategoryFilter />

            {/* Stories List */}
            {displayStories.length === 0 ? (
              <EmptyState />
            ) : (
              <View className="pb-6">
                {/* Section Header */}
                {!showSearch && searchText === '' && selectedCategory === 'all' && (
                  <View className="flex-row items-center justify-between mb-4">
                    <Text className="text-white text-lg font-semibold">Recent Stories</Text>
                    {stats.totalStories > 5 && (
                      <Pressable onPress={() => setShowSearch(true)}>
                        <Text className="text-purple-400 text-sm">View all</Text>
                      </Pressable>
                    )}
                  </View>
                )}
                
                {displayStories.map((story) => (
                  <StoryCard
                    key={story.id}
                    story={story}
                    onPress={() => navigateToStoryDetail(story.id)}
                    showActions={true}
                  />
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
};