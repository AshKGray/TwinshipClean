import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, RefreshControl, ImageBackground, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { TwincidenceCard } from '../../components/twincidences/TwincidenceCard';
import { useTwincidencesStore } from '../../state/twincidencesStore';
import { useTwinStore } from '../../state/twinStore';
import { TwincidenceCategory, DetectionType } from '../../types/twincidences';
import { StoryVaultMigration } from '../../services/migration/storyVaultMigration';

interface TwincidencesScreenProps {
  navigation: any;
}

const CATEGORY_FILTERS: { key: TwincidenceCategory | 'all'; label: string; icon: string; color: string }[] = [
  { key: 'all', label: 'All', icon: 'albums', color: '#8A2BE2' },
  { key: TwincidenceCategory.TWINTUITION_SYNC, label: 'Twintuition', icon: 'flash', color: '#FF1493' },
  { key: TwincidenceCategory.BIOMETRIC_SYNC, label: 'Biometric', icon: 'heart-circle', color: '#FF4500' },
  { key: TwincidenceCategory.LOCATION_COINCIDENCE, label: 'Location', icon: 'location', color: '#32CD32' },
  { key: TwincidenceCategory.MANUAL_ESP, label: 'ESP', icon: 'eye', color: '#9370DB' },
  { key: TwincidenceCategory.MANUAL_DREAM, label: 'Dream', icon: 'moon', color: '#4B0082' },
  { key: TwincidenceCategory.MANUAL_TWIN_TALK, label: 'Twin-Talk', icon: 'people', color: '#FF69B4' },
];

const DETECTION_TYPE_FILTERS: { key: DetectionType | 'all'; label: string }[] = [
  { key: 'all', label: 'All Types' },
  { key: 'automatic', label: 'Auto-Detected' },
  { key: 'manual', label: 'Manual Entries' },
];

export const TwincidencesScreen: React.FC<TwincidencesScreenProps> = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showMigrationPrompt, setShowMigrationPrompt] = useState(false);
  const { userProfile } = useTwinStore();

  const {
    filteredTwincidences,
    selectedCategory,
    selectedDetectionType,
    searchText,
    setSelectedCategory,
    setSelectedDetectionType,
    setSearchText,
    applyFilters,
    clearFilters,
    getTwincidenceStats,
    getRecentTwincidences,
    getTwincidencesGroupedByDate,
  } = useTwincidencesStore();

  const stats = getTwincidenceStats();
  const recentTwincidences = getRecentTwincidences(20);
  const displayTwincidences = showSearch || searchText || selectedCategory !== 'all' || selectedDetectionType !== 'all'
    ? filteredTwincidences
    : recentTwincidences;

  const groupedByDate = getTwincidencesGroupedByDate();

  // Check for Story Vault migration on mount
  useEffect(() => {
    checkForMigration();
  }, []);

  const checkForMigration = async () => {
    try {
      const isComplete = await StoryVaultMigration.isMigrationComplete();
      const hasData = await StoryVaultMigration.hasStoryVaultData();

      if (!isComplete && hasData) {
        setShowMigrationPrompt(true);
      }
    } catch (error) {
      console.error('[TwincidencesScreen] Error checking migration:', error);
    }
  };

  const handleMigration = async () => {
    Alert.alert(
      'Migrate Story Vault?',
      'We found stories in your Story Vault. Would you like to convert them to Twincidences? Your original stories will be archived.',
      [
        { text: 'Later', style: 'cancel', onPress: () => setShowMigrationPrompt(false) },
        {
          text: 'Migrate Now',
          onPress: async () => {
            setShowMigrationPrompt(false);
            setRefreshing(true);

            try {
              const result = await StoryVaultMigration.migrate();
              const summary = StoryVaultMigration.getMigrationSummary(result);

              Alert.alert(
                result.success ? 'Migration Complete!' : 'Migration Issues',
                summary,
                [{ text: 'OK', onPress: () => applyFilters() }]
              );
            } catch (error) {
              Alert.alert('Migration Failed', 'An error occurred during migration. Please try again later.');
            } finally {
              setRefreshing(false);
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    applyFilters();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    applyFilters();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const navigateToCreate = () => {
    navigation.navigate('CreateTwincidence');
  };

  const navigateToDetail = (twincidenceId: string) => {
    navigation.navigate('TwincidenceDetail', { twincidenceId });
  };

  const navigateToPrivacy = () => {
    navigation.navigate('TwincidencePrivacy');
  };

  const navigateToAnalytics = () => {
    // TODO: Implement analytics screen (Story 4.9)
    Alert.alert('Coming Soon', 'Analytics dashboard will be available in the next update!');
  };

  const StatsCard: React.FC = () => (
    <LinearGradient
      colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)']}
      className="rounded-2xl p-4 mb-6 border border-white/20"
    >
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-white font-semibold text-lg">Your Synchronicity</Text>
        <View className="bg-purple-500/30 rounded-full px-3 py-1.5">
          <Text className="text-purple-400 font-bold text-sm">{stats.synchronicityScore}/100</Text>
        </View>
      </View>

      <View className="flex-row items-center justify-between">
        <View className="items-center">
          <Text className="text-white text-2xl font-bold">{stats.totalTwincidences}</Text>
          <Text className="text-white/60 text-sm">Total</Text>
        </View>
        <View className="items-center">
          <Text className="text-white text-2xl font-bold">{stats.twincidencesThisWeek}</Text>
          <Text className="text-white/60 text-sm">This Week</Text>
        </View>
        <View className="items-center">
          <Text className="text-white text-2xl font-bold">{stats.currentStreak}</Text>
          <Text className="text-white/60 text-sm">Day Streak</Text>
        </View>
        <Pressable onPress={navigateToAnalytics} className="items-center">
          <View className="bg-purple-500/30 rounded-full p-2">
            <Ionicons name="analytics" size={20} color="#8A2BE2" />
          </View>
          <Text className="text-purple-400 text-xs mt-1">Insights</Text>
        </Pressable>
      </View>
    </LinearGradient>
  );

  const CategoryFilter: React.FC = () => (
    <View className="mb-4">
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

  const DetectionTypeFilter: React.FC = () => (
    <View className="flex-row items-center mb-6">
      {DETECTION_TYPE_FILTERS.map((filter) => (
        <Pressable
          key={filter.key}
          onPress={() => setSelectedDetectionType(filter.key)}
          className="mr-3"
        >
          <View
            className={`rounded-full px-4 py-2 ${
              selectedDetectionType === filter.key
                ? 'bg-purple-500/40 border border-purple-500/60'
                : 'bg-white/10 border border-white/20'
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                selectedDetectionType === filter.key ? 'text-white' : 'text-white/60'
              }`}
            >
              {filter.label}
            </Text>
          </View>
        </Pressable>
      ))}
    </View>
  );

  const SearchBar: React.FC = () =>
    showSearch ? (
      <View className="mb-6">
        <View className="flex-row items-center bg-white/10 rounded-xl px-4 py-3 border border-white/20">
          <Ionicons name="search" size={20} color="rgba(255,255,255,0.6)" />
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Search twincidences..."
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
        {(searchText || selectedCategory !== 'all' || selectedDetectionType !== 'all') && (
          <Pressable onPress={clearFilters} className="mt-2 flex-row items-center justify-center">
            <Text className="text-blue-400 text-sm">Clear all filters</Text>
          </Pressable>
        )}
      </View>
    ) : null;

  const EmptyState: React.FC = () => (
    <View className="items-center py-12">
      <LinearGradient
        colors={['rgba(138, 43, 226, 0.2)', 'rgba(138, 43, 226, 0.05)']}
        className="rounded-full p-8 mb-6"
      >
        <Ionicons name="sparkles" size={64} color="rgba(138, 43, 226, 0.8)" />
      </LinearGradient>
      <Text className="text-white text-xl font-semibold mb-2 text-center">
        {searchText || selectedCategory !== 'all' || selectedDetectionType !== 'all'
          ? 'No twincidences found'
          : 'Start Logging Synchronicity'}
      </Text>
      <Text className="text-white/60 text-center mb-6 px-8 leading-6">
        {searchText || selectedCategory !== 'all' || selectedDetectionType !== 'all'
          ? 'Try adjusting your search or filters to find what you\'re looking for.'
          : 'Create your first twincidence or enable auto-detection to start discovering amazing synchronicities with your twin!'}
      </Text>
      {!(searchText || selectedCategory !== 'all' || selectedDetectionType !== 'all') && (
        <View className="flex-row space-x-3">
          <Pressable
            onPress={navigateToCreate}
            className="bg-purple-500 rounded-xl px-6 py-3 flex-row items-center"
          >
            <Ionicons name="add" size={20} color="white" />
            <Text className="text-white font-semibold ml-2">Create Manual</Text>
          </Pressable>
          <Pressable
            onPress={navigateToPrivacy}
            className="bg-white/10 rounded-xl px-6 py-3 flex-row items-center border border-white/20"
          >
            <Ionicons name="flash" size={20} color="white" />
            <Text className="text-white font-semibold ml-2">Enable Auto</Text>
          </Pressable>
        </View>
      )}
    </View>
  );

  const MigrationPrompt: React.FC = () =>
    showMigrationPrompt ? (
      <Pressable onPress={handleMigration} className="mb-6">
        <LinearGradient
          colors={['rgba(138, 43, 226, 0.3)', 'rgba(138, 43, 226, 0.1)']}
          className="rounded-2xl p-4 border border-purple-500/40"
        >
          <View className="flex-row items-start">
            <Ionicons name="information-circle" size={24} color="#8A2BE2" />
            <View className="flex-1 ml-3">
              <Text className="text-white font-semibold text-base mb-1">Story Vault Migration</Text>
              <Text className="text-white/70 text-sm mb-3">
                We found stories in your Story Vault. Tap to migrate them to Twincidences!
              </Text>
              <View className="flex-row items-center">
                <Text className="text-purple-400 text-sm font-semibold">Migrate Now</Text>
                <Ionicons name="arrow-forward" size={16} color="#8A2BE2" className="ml-1" />
              </View>
            </View>
          </View>
        </LinearGradient>
      </Pressable>
    ) : null;

  return (
    <ImageBackground source={require("../../../assets/galaxybackground.png")} style={{ flex: 1 }}>
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 py-4">
          <View className="flex-1">
            <Text className="text-white text-2xl font-bold">Twincidences</Text>
            <Text className="text-white/70 text-sm">Your synchronicity timeline</Text>
          </View>

          <View className="flex-row items-center space-x-3">
            <Pressable
              onPress={navigateToPrivacy}
              className="bg-white/10 rounded-full p-3 border border-white/20"
            >
              <Ionicons name="settings" size={20} color="white" />
            </Pressable>

            <Pressable
              onPress={() => setShowSearch(!showSearch)}
              className="bg-white/10 rounded-full p-3 border border-white/20"
            >
              <Ionicons name={showSearch ? 'close' : 'search'} size={20} color="white" />
            </Pressable>

            <Pressable
              onPress={navigateToCreate}
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
          {/* Migration Prompt */}
          <MigrationPrompt />

          {/* Search Bar */}
          <SearchBar />

          {/* Stats Card */}
          {!showSearch && searchText === '' && selectedCategory === 'all' && selectedDetectionType === 'all' && stats.totalTwincidences > 0 && (
            <StatsCard />
          )}

          {/* Category Filter */}
          <CategoryFilter />

          {/* Detection Type Filter */}
          <DetectionTypeFilter />

          {/* Twincidences List */}
          {displayTwincidences.length === 0 ? (
            <EmptyState />
          ) : (
            <View className="pb-6">
              {displayTwincidences.map((twincidence) => (
                <TwincidenceCard
                  key={twincidence.id}
                  twincidence={twincidence}
                  onPress={() => navigateToDetail(twincidence.id)}
                  showActions={true}
                />
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
};
