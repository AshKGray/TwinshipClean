import React, { useRef, useEffect } from "react";
import { NavigationContainer, NavigationContainerRef } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useTwinStore } from "../state/twinStore";
import { BMadNavigationTracker } from "../../.bmad-mobile-app/navigation-tracker";
import { MobilePerformanceAgent } from "../../.bmad-mobile-app/mobile-performance.agent";

// Screens
import { OnboardingScreen } from "../screens/OnboardingScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { TwinTalkScreen } from "../screens/chat/TwinTalkScreen";
import { TwintuitionScreen } from "../screens/TwintuitionScreen";
import { PsychicGamesHub } from "../screens/PsychicGamesHub";
import { CognitiveSyncMaze } from "../screens/games/CognitiveSyncMaze";
import { EmotionalResonanceMapping } from "../screens/games/EmotionalResonanceMapping";
import { IconicDuoMatcher } from "../screens/games/IconicDuoMatcher";
import { TemporalDecisionSync } from "../screens/games/TemporalDecisionSync";
import { ResearchScreen } from "../screens/ResearchScreen";
import { SettingsScreen } from "../screens/SettingsScreen";

// Assessment Screens
import { AssessmentIntroScreen } from "../screens/assessment/AssessmentIntroScreen";
import { AssessmentSurveyScreen } from "../screens/assessment/AssessmentSurveyScreen";
import { AssessmentLoadingScreen } from "../screens/assessment/AssessmentLoadingScreen";
import { AssessmentResultsScreen } from "../screens/assessment/AssessmentResultsScreen";
import { AssessmentRecommendationsScreen } from "../screens/assessment/AssessmentRecommendationsScreen";
import { PairComparisonScreen } from "../screens/assessment/PairComparisonScreen";

// Story Screens
import { StoriesScreen } from "../screens/stories/StoriesScreen";
import { CreateStoryScreen } from "../screens/stories/CreateStoryScreen";
import { StoryDetailScreen } from "../screens/stories/StoryDetailScreen";

// Research Screens
import { ConsentScreen } from "../screens/research/ConsentScreen";
import { ResearchParticipationScreen } from "../screens/research/ResearchParticipationScreen";
import { ResearchDashboardScreen } from "../screens/research/ResearchDashboardScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
  Twindex: undefined;
  Twinbox: undefined;
  TwinTalk: undefined;
  Twintuition: undefined;
  Twingames: undefined;
  Twinquiry: undefined;
  Twinsettings: undefined;
  Twinspirations: undefined;
  Twinvitation: undefined;
  // New invitation screens
  SendInvitation: undefined;
  ReceiveInvitation: { token?: string };
  InvitationAnalytics: undefined;
  // Assessment screens
  AssessmentIntro: undefined;
  AssessmentSurvey: undefined;
  AssessmentLoading: { responses: Record<number, number> };
  AssessmentResults: { results: any };
  AssessmentRecommendations: { results: any };
  PairComparison: undefined;
  // Premium screens
  Premium: { feature?: string; source?: 'assessment' | 'settings' | 'dashboard' | 'onboarding' };
  PremiumFeatures: undefined;
  // Story screens
  Stories: undefined;
  CreateStory: { draftId?: string };
  StoryDetail: { storyId: string };
  EditStory: { storyId: string };
  // Missing routes identified in navigation calls
  GameStats: undefined;
  Home: undefined;
  Settings: undefined;
  Recommendations: { sessionId: string };
  AssessmentDetails: { sessionId: string };
  // Research routes
  ConsentScreen: { studyId?: string };
  ResearchParticipationScreen: undefined;
  ResearchDashboardScreen: undefined;
  // Pair route
  Pair: undefined;
};

const TabNavigator = () => {
  const userProfile = useTwinStore((state) => state.userProfile);
  const themeColor = userProfile?.accentColor || "neon-purple";
  
  const getTabBarColors = () => {
    switch (themeColor) {
      case "neon-pink":
        return { active: "#ff1493", inactive: "#6b7280", background: "rgba(26, 10, 26, 0.9)" };
      case "neon-blue":
        return { active: "#00bfff", inactive: "#6b7280", background: "rgba(10, 26, 46, 0.9)" };
      case "neon-green":
        return { active: "#00ff7f", inactive: "#6b7280", background: "rgba(10, 26, 10, 0.9)" };
      case "neon-yellow":
        return { active: "#ffff00", inactive: "#6b7280", background: "rgba(26, 26, 10, 0.9)" };
      case "neon-purple":
        return { active: "#8a2be2", inactive: "#6b7280", background: "rgba(26, 10, 26, 0.9)" };
      case "neon-orange":
        return { active: "#ff4500", inactive: "#6b7280", background: "rgba(26, 10, 10, 0.9)" };
      case "neon-cyan":
        return { active: "#00ffff", inactive: "#6b7280", background: "rgba(10, 26, 26, 0.9)" };
      case "neon-red":
        return { active: "#ff0000", inactive: "#6b7280", background: "rgba(26, 10, 10, 0.9)" };
      default:
        return { active: "#8a2be2", inactive: "#6b7280", background: "rgba(26, 10, 26, 0.9)" };
    }
  };

  const colors = getTabBarColors();

  return (
    <Tab.Navigator
      initialRouteName="Twinbox"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === "Twinbox") {
            iconName = focused ? "chatbubbles" : "chatbubbles-outline";
          } else if (route.name === "Twindex") {
            iconName = focused ? "grid" : "grid-outline";
          } else {
            iconName = "ellipse";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.active,
        tabBarInactiveTintColor: colors.inactive,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: "rgba(255, 255, 255, 0.1)",
          borderTopWidth: 1,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Twinbox" component={TwinTalkScreen} />
      <Tab.Screen name="Twindex" component={HomeScreen} />
    </Tab.Navigator>
  );
};

export const AppNavigator = () => {
  const isOnboarded = useTwinStore((state) => state.isOnboarded);
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);
  const routeNameRef = useRef<string | undefined>(undefined);
  const bmadTracker = useRef(new BMadNavigationTracker());
  const performanceAgent = useRef(new MobilePerformanceAgent());

  // BMAD Navigation Tracking
  useEffect(() => {
    // Performance monitoring interval
    const interval = setInterval(() => {
      // Measure current performance metrics
      const memoryUsage = (performance as any).memory?.usedJSHeapSize / 1048576; // MB
      if (memoryUsage) {
        performanceAgent.current.measure('memory', memoryUsage);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        routeNameRef.current = navigationRef.current?.getCurrentRoute()?.name;
      }}
      onStateChange={async () => {
        const previousRouteName = routeNameRef.current;
        const currentRouteName = navigationRef.current?.getCurrentRoute()?.name;
        const currentRoute = navigationRef.current?.getCurrentRoute();

        if (previousRouteName !== currentRouteName && currentRouteName) {
          // Track screen view with BMAD
          bmadTracker.current.trackScreenView(currentRouteName, currentRoute?.params);
          
          // Track navigation timing
          if (previousRouteName) {
            const navStartTime = Date.now();
            requestAnimationFrame(() => {
              const navEndTime = Date.now();
              const duration = navEndTime - navStartTime;
              bmadTracker.current.trackNavigationTime(previousRouteName, currentRouteName, duration);
              performanceAgent.current.measure('renderTime', duration);
            });
          }

          // Log analytics (can be sent to backend)
          console.log('[BMAD] Screen View:', currentRouteName);
          
          // Export metrics periodically
          if (Math.random() < 0.1) { // 10% chance to export
            const analytics = bmadTracker.current.getNavigationAnalytics();
            const perfAnalysis = performanceAgent.current.analyze();
            console.log('[BMAD] Navigation Analytics:', analytics);
            console.log('[BMAD] Performance Analysis:', perfAnalysis);
          }
        }

        // Save the current route name for comparison next time
        routeNameRef.current = currentRouteName;
      }}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isOnboarded ? (
          <Stack.Screen name="Onboarding">
            {(props) => (
              <OnboardingScreen
                {...props}
                onComplete={() => {}}
              />
            )}
          </Stack.Screen>
        ) : (
          <>
            <Stack.Screen name="Main" component={TabNavigator} />
            <Stack.Screen name="TwinTalk" component={TwinTalkScreen} />
            <Stack.Screen name="Twintuition" component={TwintuitionScreen} />
            <Stack.Screen name="Twingames" component={PsychicGamesHub} />
            <Stack.Screen name="Twinquiry" component={ResearchScreen} />
            <Stack.Screen name="Twinsettings" component={SettingsScreen} />
            <Stack.Screen name="Twinspirations" component={StoriesScreen} />
            <Stack.Screen name="CreateStory" component={CreateStoryScreen} />
            <Stack.Screen name="StoryDetail" component={StoryDetailScreen} />
            <Stack.Screen name="EditStory" component={CreateStoryScreen} />
            <Stack.Screen name="Twinvitation" component={require("../screens/PairScreen").PairScreen} />
            {/* New invitation screens */}
            <Stack.Screen 
              name="SendInvitation" 
              component={require('../screens/InvitationScreen').InvitationScreen}
              initialParams={{ mode: 'send' }}
            />
            <Stack.Screen 
              name="ReceiveInvitation" 
              component={require('../screens/InvitationScreen').InvitationScreen}
              initialParams={{ mode: 'receive' }}
            />
            <Stack.Screen 
              name="InvitationAnalytics" 
              component={require('../screens/InvitationAnalyticsScreen').InvitationAnalyticsScreen}
            />
            {/* Assessment Screens */}
            <Stack.Screen name="AssessmentIntro" component={AssessmentIntroScreen} />
            <Stack.Screen name="AssessmentSurvey" component={AssessmentSurveyScreen} />
            <Stack.Screen name="AssessmentLoading" component={AssessmentLoadingScreen} />
            <Stack.Screen name="AssessmentResults" component={AssessmentResultsScreen} />
            <Stack.Screen name="AssessmentRecommendations" component={AssessmentRecommendationsScreen} />
            <Stack.Screen name="PairComparison" component={PairComparisonScreen} />
            {/* Premium Screens */}
            <Stack.Screen 
              name="Premium" 
              component={require('../screens/premium/PremiumDashboardScreen').PremiumDashboardScreen}
            />
            <Stack.Screen 
              name="PremiumFeatures" 
              component={require('../screens/premium/PremiumDashboardScreen').PremiumDashboardScreen}
            />
            {/* Psychic Game Screens */}
            <Stack.Screen name="PsychicGamesHub" component={PsychicGamesHub} />
            <Stack.Screen name="CognitiveSyncMaze" component={CognitiveSyncMaze} />
            <Stack.Screen name="EmotionalResonanceMapping" component={EmotionalResonanceMapping} />
            <Stack.Screen name="IconicDuoMatcher" component={IconicDuoMatcher} />
            <Stack.Screen name="TemporalDecisionSync" component={TemporalDecisionSync} />
            <Stack.Screen name="cognitive_sync_maze" component={CognitiveSyncMaze} />
            <Stack.Screen name="emotional_resonance" component={EmotionalResonanceMapping} />
            <Stack.Screen name="temporal_decision" component={TemporalDecisionSync} />
            <Stack.Screen name="iconic_duo" component={IconicDuoMatcher} />
            {/* Research Screens */}
            <Stack.Screen name="ConsentScreen" component={ConsentScreen} />
            <Stack.Screen name="ResearchParticipationScreen" component={ResearchParticipationScreen} />
            <Stack.Screen name="ResearchDashboardScreen" component={ResearchDashboardScreen} />
            {/* Missing route placeholders - redirect to proper screens */}
            <Stack.Screen name="GameStats" component={PsychicGamesHub} />
            <Stack.Screen name="Home" component={TabNavigator} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="Recommendations" component={AssessmentRecommendationsScreen} />
            <Stack.Screen name="AssessmentDetails" component={AssessmentResultsScreen} />
            <Stack.Screen name="Pair" component={require("../screens/PairScreen").PairScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};