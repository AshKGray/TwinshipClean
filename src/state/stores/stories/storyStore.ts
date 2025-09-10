import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Story, StoryDraft, StoryFilter, StoryStats, StoryCategory, StoryMedia, StoryMilestone } from '../../../types/stories';

interface StoryState {
  // Stories & Drafts
  stories: Story[];
  drafts: StoryDraft[];
  currentDraft: StoryDraft | null;
  
  // UI State
  selectedCategory: StoryCategory | 'all';
  activeFilter: StoryFilter;
  isCreatingStory: boolean;
  isUploadingMedia: boolean;
  uploadProgress: number;
  
  // Search & Filter
  searchText: string;
  filteredStories: Story[];
  
  // Actions - Story Management
  addStory: (story: Omit<Story, 'id' | 'timestamp' | 'lastModified' | 'collaborations' | 'comments' | 'likes' | 'favorites' | 'views'>) => void;
  updateStory: (storyId: string, updates: Partial<Story>) => void;
  deleteStory: (storyId: string) => void;
  shareStory: (storyId: string, twinId: string, permissions?: 'view' | 'comment' | 'edit') => void;
  unshareStory: (storyId: string) => void;
  
  // Actions - Draft Management
  saveDraft: (draft: Omit<StoryDraft, 'id' | 'lastSaved' | 'autoSaved'>) => void;
  updateDraft: (draftId: string, updates: Partial<StoryDraft>) => void;
  deleteDraft: (draftId: string) => void;
  setCurrentDraft: (draft: StoryDraft | null) => void;
  createStoryFromDraft: (draftId: string) => void;
  
  // Actions - Media Management
  addMediaToStory: (storyId: string, media: StoryMedia) => void;
  removeMediaFromStory: (storyId: string, mediaId: string) => void;
  compressMedia: (mediaId: string) => Promise<void>;
  
  // Actions - Engagement
  likeStory: (storyId: string, userId: string) => void;
  unlikeStory: (storyId: string, userId: string) => void;
  favoriteStory: (storyId: string, userId: string) => void;
  unfavoriteStory: (storyId: string, userId: string) => void;
  viewStory: (storyId: string, userId: string) => void;
  
  // Actions - Comments & Collaboration
  addComment: (storyId: string, authorId: string, content: string) => void;
  updateComment: (storyId: string, commentId: string, content: string) => void;
  deleteComment: (storyId: string, commentId: string) => void;
  addCollaboration: (storyId: string, twinId: string, contribution: 'text' | 'media' | 'edit' | 'comment', content?: string) => void;
  
  // Actions - Search & Filter
  setSearchText: (text: string) => void;
  setSelectedCategory: (category: StoryCategory | 'all') => void;
  setActiveFilter: (filter: StoryFilter) => void;
  applyFilters: () => void;
  clearFilters: () => void;
  
  // Actions - UI State
  setIsCreatingStory: (creating: boolean) => void;
  setIsUploadingMedia: (uploading: boolean) => void;
  setUploadProgress: (progress: number) => void;
  
  // Getters
  getStoriesByCategory: (category: StoryCategory) => Story[];
  getSharedStories: () => Story[];
  getStoriesWithMedia: () => Story[];
  getMilestoneStories: () => Story[];
  getStoryStats: () => StoryStats;
  getStoriesForTimeline: () => { [year: number]: Story[] };
  getFavoriteStories: (userId: string) => Story[];
  getRecentStories: (limit?: number) => Story[];
}

export const useStoryStore = create<StoryState>()(
  persist(
    (set, get) => ({
      // Initial state
      stories: [],
      drafts: [],
      currentDraft: null,
      selectedCategory: 'all',
      activeFilter: {},
      isCreatingStory: false,
      isUploadingMedia: false,
      uploadProgress: 0,
      searchText: '',
      filteredStories: [],
      
      // Story Management
      addStory: (storyData) => {
        const story: Story = {
          ...storyData,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          timestamp: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          collaborations: [],
          comments: [],
          likes: [],
          favorites: [],
          views: [],
        };
        
        set((state) => ({
          stories: [story, ...state.stories],
        }));
        
        // Auto-apply filters after adding
        get().applyFilters();
      },
      
      updateStory: (storyId, updates) => {
        set((state) => ({
          stories: state.stories.map((story) =>
            story.id === storyId
              ? { ...story, ...updates, lastModified: new Date().toISOString() }
              : story
          ),
        }));
        get().applyFilters();
      },
      
      deleteStory: (storyId) => {
        set((state) => ({
          stories: state.stories.filter((story) => story.id !== storyId),
        }));
        get().applyFilters();
      },
      
      shareStory: (storyId, twinId, permissions = 'view') => {
        set((state) => ({
          stories: state.stories.map((story) =>
            story.id === storyId
              ? {
                  ...story,
                  isShared: true,
                  sharedWith: [...new Set([...story.sharedWith, twinId])],
                  sharePermissions: permissions,
                  lastModified: new Date().toISOString(),
                }
              : story
          ),
        }));
      },
      
      unshareStory: (storyId) => {
        set((state) => ({
          stories: state.stories.map((story) =>
            story.id === storyId
              ? {
                  ...story,
                  isShared: false,
                  sharedWith: [],
                  lastModified: new Date().toISOString(),
                }
              : story
          ),
        }));
      },
      
      // Draft Management
      saveDraft: (draftData) => {
        const draft: StoryDraft = {
          ...draftData,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          lastSaved: new Date().toISOString(),
          autoSaved: false,
        };
        
        set((state) => ({
          drafts: [draft, ...state.drafts.slice(0, 9)], // Keep max 10 drafts
        }));
      },
      
      updateDraft: (draftId, updates) => {
        set((state) => ({
          drafts: state.drafts.map((draft) =>
            draft.id === draftId
              ? { ...draft, ...updates, lastSaved: new Date().toISOString(), autoSaved: true }
              : draft
          ),
        }));
      },
      
      deleteDraft: (draftId) => {
        set((state) => ({
          drafts: state.drafts.filter((draft) => draft.id !== draftId),
          currentDraft: state.currentDraft?.id === draftId ? null : state.currentDraft,
        }));
      },
      
      setCurrentDraft: (draft) => {
        set({ currentDraft: draft });
      },
      
      createStoryFromDraft: (draftId) => {
        const draft = get().drafts.find(d => d.id === draftId);
        if (!draft) return;
        
        const { id, lastSaved, autoSaved, ...storyData } = draft;
        get().addStory({
          ...storyData,
          authorId: 'current-user', // This should come from user context
          isShared: false,
          isPrivate: false,
          sharedWith: [],
          sharePermissions: 'view',
        });
        
        get().deleteDraft(draftId);
      },
      
      // Media Management
      addMediaToStory: (storyId, media) => {
        set((state) => ({
          stories: state.stories.map((story) =>
            story.id === storyId
              ? { 
                  ...story, 
                  media: [...story.media, media],
                  lastModified: new Date().toISOString(),
                }
              : story
          ),
        }));
      },
      
      removeMediaFromStory: (storyId, mediaId) => {
        set((state) => ({
          stories: state.stories.map((story) =>
            story.id === storyId
              ? { 
                  ...story, 
                  media: story.media.filter(m => m.id !== mediaId),
                  lastModified: new Date().toISOString(),
                }
              : story
          ),
        }));
      },
      
      compressMedia: async (mediaId) => {
        // This would integrate with a media compression service
        set({ isUploadingMedia: true, uploadProgress: 0 });
        
        // Simulated compression process
        for (let i = 0; i <= 100; i += 10) {
          set({ uploadProgress: i });
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        set({ isUploadingMedia: false, uploadProgress: 0 });
      },
      
      // Engagement
      likeStory: (storyId, userId) => {
        set((state) => ({
          stories: state.stories.map((story) =>
            story.id === storyId
              ? { 
                  ...story, 
                  likes: [...new Set([...story.likes, userId])],
                }
              : story
          ),
        }));
      },
      
      unlikeStory: (storyId, userId) => {
        set((state) => ({
          stories: state.stories.map((story) =>
            story.id === storyId
              ? { 
                  ...story, 
                  likes: story.likes.filter(id => id !== userId),
                }
              : story
          ),
        }));
      },
      
      favoriteStory: (storyId, userId) => {
        set((state) => ({
          stories: state.stories.map((story) =>
            story.id === storyId
              ? { 
                  ...story, 
                  favorites: [...new Set([...story.favorites, userId])],
                }
              : story
          ),
        }));
      },
      
      unfavoriteStory: (storyId, userId) => {
        set((state) => ({
          stories: state.stories.map((story) =>
            story.id === storyId
              ? { 
                  ...story, 
                  favorites: story.favorites.filter(id => id !== userId),
                }
              : story
          ),
        }));
      },
      
      viewStory: (storyId, userId) => {
        set((state) => ({
          stories: state.stories.map((story) =>
            story.id === storyId
              ? { 
                  ...story, 
                  views: [...story.views, { userId, timestamp: new Date().toISOString() }],
                }
              : story
          ),
        }));
      },
      
      // Comments & Collaboration
      addComment: (storyId, authorId, content) => {
        const comment = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          authorId,
          content,
          timestamp: new Date().toISOString(),
        };
        
        set((state) => ({
          stories: state.stories.map((story) =>
            story.id === storyId
              ? { 
                  ...story, 
                  comments: [...story.comments, comment],
                  lastModified: new Date().toISOString(),
                }
              : story
          ),
        }));
      },
      
      updateComment: (storyId, commentId, content) => {
        set((state) => ({
          stories: state.stories.map((story) =>
            story.id === storyId
              ? { 
                  ...story, 
                  comments: story.comments.map(comment =>
                    comment.id === commentId
                      ? { ...comment, content, isEdited: true }
                      : comment
                  ),
                  lastModified: new Date().toISOString(),
                }
              : story
          ),
        }));
      },
      
      deleteComment: (storyId, commentId) => {
        set((state) => ({
          stories: state.stories.map((story) =>
            story.id === storyId
              ? { 
                  ...story, 
                  comments: story.comments.filter(comment => comment.id !== commentId),
                  lastModified: new Date().toISOString(),
                }
              : story
          ),
        }));
      },
      
      addCollaboration: (storyId, twinId, contribution, content) => {
        const collaboration = {
          twinId,
          contributedAt: new Date().toISOString(),
          contribution,
          content,
        };
        
        set((state) => ({
          stories: state.stories.map((story) =>
            story.id === storyId
              ? { 
                  ...story, 
                  collaborations: [...story.collaborations, collaboration],
                  lastModified: new Date().toISOString(),
                }
              : story
          ),
        }));
      },
      
      // Search & Filter
      setSearchText: (text) => {
        set({ searchText: text });
        get().applyFilters();
      },
      
      setSelectedCategory: (category) => {
        set({ selectedCategory: category });
        get().applyFilters();
      },
      
      setActiveFilter: (filter) => {
        set({ activeFilter: filter });
        get().applyFilters();
      },
      
      applyFilters: () => {
        const { stories, selectedCategory, activeFilter, searchText } = get();
        
        let filtered = [...stories];
        
        // Apply category filter
        if (selectedCategory !== 'all') {
          filtered = filtered.filter(story => story.category === selectedCategory);
        }
        
        // Apply search text
        if (searchText.trim()) {
          const searchLower = searchText.toLowerCase();
          filtered = filtered.filter(story =>
            story.title.toLowerCase().includes(searchLower) ||
            story.content.toLowerCase().includes(searchLower) ||
            story.tags.some(tag => tag.toLowerCase().includes(searchLower))
          );
        }
        
        // Apply additional filters
        if (activeFilter.categories?.length) {
          filtered = filtered.filter(story => activeFilter.categories!.includes(story.category));
        }
        
        if (activeFilter.tags?.length) {
          filtered = filtered.filter(story =>
            story.tags.some(tag => activeFilter.tags!.includes(tag))
          );
        }
        
        if (activeFilter.dateRange) {
          const start = new Date(activeFilter.dateRange.start);
          const end = new Date(activeFilter.dateRange.end);
          filtered = filtered.filter(story => {
            const storyDate = new Date(story.timestamp);
            return storyDate >= start && storyDate <= end;
          });
        }
        
        if (activeFilter.milestoneOnly) {
          filtered = filtered.filter(story => !!story.milestone);
        }
        
        if (activeFilter.sharedOnly) {
          filtered = filtered.filter(story => story.isShared);
        }
        
        if (activeFilter.hasMedia) {
          filtered = filtered.filter(story => story.media.length > 0);
        }
        
        set({ filteredStories: filtered });
      },
      
      clearFilters: () => {
        set({
          selectedCategory: 'all',
          activeFilter: {},
          searchText: '',
          filteredStories: get().stories,
        });
      },
      
      // UI State
      setIsCreatingStory: (creating) => {
        set({ isCreatingStory: creating });
      },
      
      setIsUploadingMedia: (uploading) => {
        set({ isUploadingMedia: uploading });
      },
      
      setUploadProgress: (progress) => {
        set({ uploadProgress: progress });
      },
      
      // Getters
      getStoriesByCategory: (category) => {
        return get().stories.filter(story => story.category === category);
      },
      
      getSharedStories: () => {
        return get().stories.filter(story => story.isShared);
      },
      
      getStoriesWithMedia: () => {
        return get().stories.filter(story => story.media.length > 0);
      },
      
      getMilestoneStories: () => {
        return get().stories.filter(story => !!story.milestone);
      },
      
      getStoryStats: (): StoryStats => {
        const stories = get().stories;
        const now = new Date();
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        return {
          totalStories: stories.length,
          storiesThisMonth: stories.filter(s => new Date(s.timestamp) >= thisMonth).length,
          categoryCounts: stories.reduce((counts, story) => {
            counts[story.category] = (counts[story.category] || 0) + 1;
            return counts;
          }, {} as Record<StoryCategory, number>),
          totalMedia: stories.reduce((sum, story) => sum + story.media.length, 0),
          totalViews: stories.reduce((sum, story) => sum + story.views.length, 0),
          totalLikes: stories.reduce((sum, story) => sum + story.likes.length, 0),
          collaborationCount: stories.reduce((sum, story) => sum + story.collaborations.length, 0),
          milestoneCount: stories.filter(s => !!s.milestone).length,
        };
      },
      
      getStoriesForTimeline: () => {
        const stories = get().stories;
        return stories.reduce((timeline, story) => {
          const year = new Date(story.timestamp).getFullYear();
          if (!timeline[year]) timeline[year] = [];
          timeline[year].push(story);
          return timeline;
        }, {} as { [year: number]: Story[] });
      },
      
      getFavoriteStories: (userId) => {
        return get().stories.filter(story => story.favorites.includes(userId));
      },
      
      getRecentStories: (limit = 10) => {
        return get().stories
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, limit);
      },
    }),
    {
      name: 'story-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        stories: state.stories,
        drafts: state.drafts,
        selectedCategory: state.selectedCategory,
      }),
    }
  )
);