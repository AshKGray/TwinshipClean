// Add these types and methods to your existing twinStore.ts

// New types for relationship dynamics
export interface RelationshipDynamicsData {
  pattern: {
    type: 'healthy_leader_follower' | 'complementary_partners' | 'synchronized_equals' | 'dominant_submissive' | 'chaotic_collaboration';
    confidence: number;
    lastAnalyzed: string;
  } | null;
  metrics: {
    powerBalance: number;
    decisionSynchrony: number;
    valueAlignment: number;
    stressResilience: number;
    adaptability: number;
  } | null;
  insights: {
    text: string;
    category: 'power' | 'values' | 'stress' | 'sync' | 'general';
    timestamp: string;
  }[];
  recommendations: string[];
}

// Add to TwinState interface:
interface TwinState {
  // ... existing state ...
  
  // Relationship Dynamics
  relationshipDynamics: RelationshipDynamicsData;
  
  // New actions
  updateRelationshipDynamics: (data: Partial<RelationshipDynamicsData>) => void;
  addRelationshipInsight: (insight: string, category: RelationshipDynamicsData['insights'][0]['category']) => void;
  clearRelationshipDynamics: () => void;
}

// Add to the store implementation:
export const useTwinStore = create<TwinState>()(
  persist(
    (set, get) => ({
      // ... existing state ...
      
      // Initialize relationship dynamics
      relationshipDynamics: {
        pattern: null,
        metrics: null,
        insights: [],
        recommendations: []
      },
      hasRelationshipDynamics: false,
      
      // ... existing actions ...
      
      // New relationship dynamics actions
      updateRelationshipDynamics: (data) => {
        set((state) => ({
          relationshipDynamics: {
            ...state.relationshipDynamics,
            ...data,
            pattern: data.pattern ? {
              ...data.pattern,
              lastAnalyzed: new Date().toISOString()
            } : state.relationshipDynamics.pattern
          }
        }));
      },
      
      addRelationshipInsight: (text, category) => {
        set((state) => ({
          relationshipDynamics: {
            ...state.relationshipDynamics,
            insights: [
              {
                text,
                category,
                timestamp: new Date().toISOString()
              },
              ...state.relationshipDynamics.insights.slice(0, 19) // Keep last 20
            ]
          }
        }));
      },
      
      clearRelationshipDynamics: () => {
        set({
          relationshipDynamics: {
            pattern: null,
            metrics: null,
            insights: [],
            recommendations: []
          }
        });
      },
      
      setHasRelationshipDynamics: (hasAccess) => {
        set({ hasRelationshipDynamics: hasAccess });
      },
      
      // Update signOut to clear relationship data
      signOut: () => set({ 
        // ... existing signOut logic ...
        relationshipDynamics: {
          pattern: null,
          metrics: null,
          insights: [],
          recommendations: []
        }
      }),
    }),
    {
      name: "twin-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // ... existing partialize ...
        relationshipDynamics: state.relationshipDynamics, // Add this
      }),
    }
  )
);