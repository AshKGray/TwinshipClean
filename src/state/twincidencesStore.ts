import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Twincidence,
  TwincidenceDraft,
  TwincidenceCategory,
  TwincidenceFilter,
  TwincidenceStats,
  TwincidenceTimelineGroup,
  TwincidencePermissions,
  DetectionType,
} from '../types/twincidences';

interface TwincidencesState {
  // Data
  twincidences: Twincidence[];
  drafts: TwincidenceDraft[];
  currentDraft: TwincidenceDraft | null;
  permissions: TwincidencePermissions;

  // UI State
  selectedCategory: TwincidenceCategory | 'all';
  selectedDetectionType: DetectionType | 'all';
  activeFilter: TwincidenceFilter;
  searchText: string;
  filteredTwincidences: Twincidence[];

  // Loading States
  isCreating: boolean;
  isUploadingMedia: boolean;
  uploadProgress: number;

  // Actions - Twincidence Management
  addTwincidence: (twincidence: Omit<Twincidence, 'id' | 'timestamp' | 'views' | 'favorites' | 'annotations'>) => void;
  updateTwincidence: (id: string, updates: Partial<Twincidence>) => void;
  deleteTwincidence: (id: string) => void;
  getTwincidenceById: (id: string) => Twincidence | undefined;

  // Actions - Draft Management
  saveDraft: (draft: Omit<TwincidenceDraft, 'id' | 'lastSaved' | 'autoSaved'>) => void;
  updateDraft: (id: string, updates: Partial<TwincidenceDraft>) => void;
  deleteDraft: (id: string) => void;
  setCurrentDraft: (draft: TwincidenceDraft | null) => void;
  createTwincidenceFromDraft: (draftId: string) => void;

  // Actions - Annotations & Collaboration
  addAnnotation: (twincidenceId: string, authorId: string, content: string) => void;
  updateAnnotation: (twincidenceId: string, annotationId: string, content: string) => void;
  deleteAnnotation: (twincidenceId: string, annotationId: string) => void;

  // Actions - Engagement
  viewTwincidence: (id: string, userId: string) => void;
  favoriteTwincidence: (id: string, userId: string) => void;
  unfavoriteTwincidence: (id: string, userId: string) => void;

  // Actions - Search & Filter
  setSearchText: (text: string) => void;
  setSelectedCategory: (category: TwincidenceCategory | 'all') => void;
  setSelectedDetectionType: (type: DetectionType | 'all') => void;
  setActiveFilter: (filter: TwincidenceFilter) => void;
  applyFilters: () => void;
  clearFilters: () => void;

  // Actions - Permissions
  updatePermissions: (permissions: Partial<TwincidencePermissions>) => void;
  hasPermission: (category: TwincidenceCategory) => boolean;

  // Actions - UI State
  setIsCreating: (creating: boolean) => void;
  setIsUploadingMedia: (uploading: boolean) => void;
  setUploadProgress: (progress: number) => void;

  // Getters
  getTwincidencesByCategory: (category: TwincidenceCategory) => Twincidence[];
  getAutomatedTwincidences: () => Twincidence[];
  getManualTwincidences: () => Twincidence[];
  getTwincidencesWithMedia: () => Twincidence[];
  getRecentTwincidences: (limit?: number) => Twincidence[];
  getTwincidenceStats: () => TwincidenceStats;
  getTwincidencesGroupedByDate: () => TwincidenceTimelineGroup[];
  getFavoriteTwincidences: (userId: string) => Twincidence[];
}

export const useTwincidencesStore = create<TwincidencesState>()(
  persist(
    (set, get) => ({
      // Initial State
      twincidences: [],
      drafts: [],
      currentDraft: null,
      permissions: {
        twintuitionSync: false,
        biometricTracking: false,
        locationTracking: false,
        digitalBehavior: false,
        communicationPattern: false,
        environmentalMatching: false,
        researchParticipation: false,
        lastUpdated: new Date().toISOString(),
        consentDate: new Date().toISOString(),
        nextReviewDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
      },
      selectedCategory: 'all',
      selectedDetectionType: 'all',
      activeFilter: {},
      searchText: '',
      filteredTwincidences: [],
      isCreating: false,
      isUploadingMedia: false,
      uploadProgress: 0,

      // Twincidence Management
      addTwincidence: (twincidenceData) => {
        const twincidence: Twincidence = {
          ...twincidenceData,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          timestamp: new Date().toISOString(),
          views: [],
          favorites: [],
          annotations: [],
        };

        set((state) => ({
          twincidences: [twincidence, ...state.twincidences],
        }));

        get().applyFilters();
      },

      updateTwincidence: (id, updates) => {
        set((state) => ({
          twincidences: state.twincidences.map((t) =>
            t.id === id
              ? { ...t, ...updates, editedAt: new Date().toISOString() }
              : t
          ),
        }));
        get().applyFilters();
      },

      deleteTwincidence: (id) => {
        set((state) => ({
          twincidences: state.twincidences.filter((t) => t.id !== id),
        }));
        get().applyFilters();
      },

      getTwincidenceById: (id) => {
        return get().twincidences.find((t) => t.id === id);
      },

      // Draft Management
      saveDraft: (draftData) => {
        const draft: TwincidenceDraft = {
          ...draftData,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          lastSaved: new Date().toISOString(),
          autoSaved: false,
        };

        set((state) => ({
          drafts: [draft, ...state.drafts.slice(0, 9)], // Keep max 10 drafts
        }));
      },

      updateDraft: (id, updates) => {
        set((state) => ({
          drafts: state.drafts.map((draft) =>
            draft.id === id
              ? { ...draft, ...updates, lastSaved: new Date().toISOString(), autoSaved: true }
              : draft
          ),
        }));
      },

      deleteDraft: (id) => {
        set((state) => ({
          drafts: state.drafts.filter((draft) => draft.id !== id),
          currentDraft: state.currentDraft?.id === id ? null : state.currentDraft,
        }));
      },

      setCurrentDraft: (draft) => {
        set({ currentDraft: draft });
      },

      createTwincidenceFromDraft: (draftId) => {
        const draft = get().drafts.find((d) => d.id === draftId);
        if (!draft) return;

        const { id, lastSaved, autoSaved, ...twincidenceData } = draft;
        get().addTwincidence({
          ...twincidenceData,
          detectionType: 'manual',
          metadata: {
            eventDate: twincidenceData.eventDate,
          },
          tags: twincidenceData.tags,
          isSharedWithResearch: false,
          privacyLevel: 'twin_only',
        });

        get().deleteDraft(draftId);
      },

      // Annotations & Collaboration
      addAnnotation: (twincidenceId, authorId, content) => {
        const annotation = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          authorId,
          content,
          timestamp: new Date().toISOString(),
        };

        set((state) => ({
          twincidences: state.twincidences.map((t) =>
            t.id === twincidenceId
              ? {
                  ...t,
                  annotations: [...(t.annotations || []), annotation],
                  editedAt: new Date().toISOString(),
                }
              : t
          ),
        }));
      },

      updateAnnotation: (twincidenceId, annotationId, content) => {
        set((state) => ({
          twincidences: state.twincidences.map((t) =>
            t.id === twincidenceId
              ? {
                  ...t,
                  annotations: (t.annotations || []).map((a) =>
                    a.id === annotationId
                      ? { ...a, content, isEdited: true }
                      : a
                  ),
                  editedAt: new Date().toISOString(),
                }
              : t
          ),
        }));
      },

      deleteAnnotation: (twincidenceId, annotationId) => {
        set((state) => ({
          twincidences: state.twincidences.map((t) =>
            t.id === twincidenceId
              ? {
                  ...t,
                  annotations: (t.annotations || []).filter((a) => a.id !== annotationId),
                  editedAt: new Date().toISOString(),
                }
              : t
          ),
        }));
      },

      // Engagement
      viewTwincidence: (id, userId) => {
        set((state) => ({
          twincidences: state.twincidences.map((t) =>
            t.id === id
              ? {
                  ...t,
                  views: [...t.views, { userId, timestamp: new Date().toISOString() }],
                }
              : t
          ),
        }));
      },

      favoriteTwincidence: (id, userId) => {
        set((state) => ({
          twincidences: state.twincidences.map((t) =>
            t.id === id
              ? {
                  ...t,
                  favorites: [...new Set([...t.favorites, userId])],
                }
              : t
          ),
        }));
      },

      unfavoriteTwincidence: (id, userId) => {
        set((state) => ({
          twincidences: state.twincidences.map((t) =>
            t.id === id
              ? {
                  ...t,
                  favorites: t.favorites.filter((fId) => fId !== userId),
                }
              : t
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

      setSelectedDetectionType: (type) => {
        set({ selectedDetectionType: type });
        get().applyFilters();
      },

      setActiveFilter: (filter) => {
        set({ activeFilter: filter });
        get().applyFilters();
      },

      applyFilters: () => {
        const { twincidences, selectedCategory, selectedDetectionType, activeFilter, searchText } = get();

        let filtered = [...twincidences];

        // Apply category filter
        if (selectedCategory !== 'all') {
          filtered = filtered.filter((t) => t.category === selectedCategory);
        }

        // Apply detection type filter
        if (selectedDetectionType !== 'all') {
          filtered = filtered.filter((t) => t.detectionType === selectedDetectionType);
        }

        // Apply search text
        if (searchText.trim()) {
          const searchLower = searchText.toLowerCase();
          filtered = filtered.filter(
            (t) =>
              t.title.toLowerCase().includes(searchLower) ||
              t.description?.toLowerCase().includes(searchLower) ||
              t.tags.some((tag) => tag.toLowerCase().includes(searchLower))
          );
        }

        // Apply additional filters
        if (activeFilter.categories?.length) {
          filtered = filtered.filter((t) => activeFilter.categories!.includes(t.category));
        }

        if (activeFilter.detectionTypes?.length) {
          filtered = filtered.filter((t) => activeFilter.detectionTypes!.includes(t.detectionType));
        }

        if (activeFilter.tags?.length) {
          filtered = filtered.filter((t) =>
            t.tags.some((tag) => activeFilter.tags!.includes(tag))
          );
        }

        if (activeFilter.dateRange) {
          const start = new Date(activeFilter.dateRange.start);
          const end = new Date(activeFilter.dateRange.end);
          filtered = filtered.filter((t) => {
            const tDate = new Date(t.timestamp);
            return tDate >= start && tDate <= end;
          });
        }

        if (activeFilter.hasMedia) {
          filtered = filtered.filter(
            (t) =>
              (t.media?.photos?.length || 0) > 0 ||
              (t.media?.videos?.length || 0) > 0 ||
              (t.media?.voiceNotes?.length || 0) > 0
          );
        }

        if (activeFilter.minConfidence !== undefined) {
          filtered = filtered.filter(
            (t) => (t.metadata.confidenceScore || 0) >= activeFilter.minConfidence!
          );
        }

        set({ filteredTwincidences: filtered });
      },

      clearFilters: () => {
        set({
          selectedCategory: 'all',
          selectedDetectionType: 'all',
          activeFilter: {},
          searchText: '',
          filteredTwincidences: get().twincidences,
        });
      },

      // Permissions
      updatePermissions: (permissions) => {
        set((state) => ({
          permissions: {
            ...state.permissions,
            ...permissions,
            lastUpdated: new Date().toISOString(),
          },
        }));
      },

      hasPermission: (category) => {
        const { permissions } = get();
        switch (category) {
          case TwincidenceCategory.TWINTUITION_SYNC:
            return permissions.twintuitionSync;
          case TwincidenceCategory.BIOMETRIC_SYNC:
            return permissions.biometricTracking;
          case TwincidenceCategory.LOCATION_COINCIDENCE:
            return permissions.locationTracking;
          case TwincidenceCategory.DIGITAL_BEHAVIOR:
            return permissions.digitalBehavior;
          case TwincidenceCategory.COMMUNICATION_PATTERN:
            return permissions.communicationPattern;
          case TwincidenceCategory.ENVIRONMENTAL_MATCHING:
            return permissions.environmentalMatching;
          default:
            return true; // Manual entries don't need permissions
        }
      },

      // UI State
      setIsCreating: (creating) => {
        set({ isCreating: creating });
      },

      setIsUploadingMedia: (uploading) => {
        set({ isUploadingMedia: uploading });
      },

      setUploadProgress: (progress) => {
        set({ uploadProgress: progress });
      },

      // Getters
      getTwincidencesByCategory: (category) => {
        return get().twincidences.filter((t) => t.category === category);
      },

      getAutomatedTwincidences: () => {
        return get().twincidences.filter((t) => t.detectionType === 'automatic');
      },

      getManualTwincidences: () => {
        return get().twincidences.filter((t) => t.detectionType === 'manual');
      },

      getTwincidencesWithMedia: () => {
        return get().twincidences.filter(
          (t) =>
            (t.media?.photos?.length || 0) > 0 ||
            (t.media?.videos?.length || 0) > 0 ||
            (t.media?.voiceNotes?.length || 0) > 0
        );
      },

      getRecentTwincidences: (limit = 20) => {
        return get()
          .twincidences.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, limit);
      },

      getTwincidenceStats: (): TwincidenceStats => {
        const twincidences = get().twincidences;
        const now = new Date();
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const categoryCounts = twincidences.reduce((counts, t) => {
          counts[t.category] = (counts[t.category] || 0) + 1;
          return counts;
        }, {} as Record<TwincidenceCategory, number>);

        const automatedTwincidences = twincidences.filter((t) => t.detectionType === 'automatic');
        const averageConfidence =
          automatedTwincidences.length > 0
            ? automatedTwincidences.reduce((sum, t) => sum + (t.metadata.confidenceScore || 0), 0) /
              automatedTwincidences.length
            : 0;

        // Calculate streaks
        const sortedDates = [...new Set(twincidences.map((t) => t.timestamp.split('T')[0]))].sort();
        let currentStreak = 0;
        let longestStreak = 0;
        let tempStreak = 0;

        for (let i = 0; i < sortedDates.length; i++) {
          if (i === 0 || new Date(sortedDates[i]).getTime() - new Date(sortedDates[i - 1]).getTime() === 86400000) {
            tempStreak++;
          } else {
            longestStreak = Math.max(longestStreak, tempStreak);
            tempStreak = 1;
          }
        }
        longestStreak = Math.max(longestStreak, tempStreak);

        // Current streak (from today backwards)
        const today = new Date().toISOString().split('T')[0];
        if (sortedDates[sortedDates.length - 1] === today) {
          currentStreak = 1;
          for (let i = sortedDates.length - 2; i >= 0; i--) {
            if (new Date(today).getTime() - new Date(sortedDates[i]).getTime() === currentStreak * 86400000) {
              currentStreak++;
            } else {
              break;
            }
          }
        }

        // Top categories
        const topCategories = Object.entries(categoryCounts)
          .map(([category, count]) => ({ category: category as TwincidenceCategory, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        // Synchronicity score (0-100)
        const synchronicityScore = Math.min(
          100,
          Math.round((twincidences.length / 30) * 10 + averageConfidence * 50 + currentStreak * 5)
        );

        return {
          totalTwincidences: twincidences.length,
          twincidencesThisMonth: twincidences.filter((t) => new Date(t.timestamp) >= thisMonth).length,
          twincidencesThisWeek: twincidences.filter((t) => new Date(t.timestamp) >= thisWeek).length,
          categoryCounts,
          automatedCount: automatedTwincidences.length,
          manualCount: twincidences.filter((t) => t.detectionType === 'manual').length,
          averageConfidenceScore: averageConfidence,
          longestStreak,
          currentStreak,
          synchronicityScore,
          topCategories,
        };
      },

      getTwincidencesGroupedByDate: (): TwincidenceTimelineGroup[] => {
        const twincidences = get().twincidences;
        const grouped = twincidences.reduce((acc, t) => {
          const date = t.timestamp.split('T')[0];
          if (!acc[date]) {
            acc[date] = [];
          }
          acc[date].push(t);
          return acc;
        }, {} as Record<string, Twincidence[]>);

        return Object.entries(grouped)
          .map(([date, twincidences]) => {
            const automated = twincidences.filter((t) => t.detectionType === 'automatic').length;
            const manual = twincidences.filter((t) => t.detectionType === 'manual').length;
            const categoryCounts = twincidences.reduce((counts, t) => {
              counts[t.category] = (counts[t.category] || 0) + 1;
              return counts;
            }, {} as Record<TwincidenceCategory, number>);
            const topCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] as TwincidenceCategory;

            return {
              date,
              twincidences,
              dayStats: {
                total: twincidences.length,
                automated,
                manual,
                topCategory,
              },
            };
          })
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      },

      getFavoriteTwincidences: (userId) => {
        return get().twincidences.filter((t) => t.favorites.includes(userId));
      },
    }),
    {
      name: 'twincidence-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        twincidences: state.twincidences,
        drafts: state.drafts,
        permissions: state.permissions,
        selectedCategory: state.selectedCategory,
        selectedDetectionType: state.selectedDetectionType,
      }),
    }
  )
);
