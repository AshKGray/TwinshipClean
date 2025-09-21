import React, { useRef, useEffect } from "react";
import { NavigationContainer, NavigationContainerRef } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useTwinStore } from "../state/twinStore";
import { useAuthStore } from "../state/authStore";
import { deepLinkService } from "../services/deepLinkService";
import { BMadNavigationTracker } from "../../.bmad-mobile-app/navigation-tracker";
import { MobilePerformanceAgent } from "../../.bmad-mobile-app/mobile-performance.agent";
import { preloadManager } from "../utils/preloadManager";
import { performanceTracker as startupPerformanceTracker } from "../utils/performanceTracker";
import { performanceTracker } from "../utils/performanceMeasurement";
import { ProfiledComponent, PerformanceUtils } from "../utils/performanceProfiler";
import { performanceDashboard } from "../utils/performanceDashboard";

// Import lazy loading utilities
import { lazyWithPreload, lazyScreen, lazyScreenWithSkeleton, lazyWithPreloadAndSkeleton } from "../utils/lazyWithPreload";

// Core Screens (loaded immediately)
import { OnboardingScreen } from "../screens/OnboardingScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { TwinTalkScreen } from "../screens/chat/TwinTalkScreen";

// Pairing Screen (lazy loaded)
const PairScreen = lazyScreen(() => import("../screens/PairScreen").then(m => ({ default: m.PairScreen })));

// Secondary Screens (lazy loaded with enhanced skeletons)
const TwintuitionScreen = lazyScreenWithSkeleton(
  () => import("../screens/TwintuitionScreen").then(m => ({ default: m.TwintuitionScreen })),
  'generic',
  'Loading Twintuition...'
);
const TwinGamesHub = lazyWithPreloadAndSkeleton(
  () => import("../screens/TwinGamesHub").then(m => ({ default: m.TwinGamesHub })),
  'game',
  'Preparing psychic games...',
  'TwinGamesHub'
);
const ResearchScreen = lazyScreenWithSkeleton(
  () => import("../screens/ResearchScreen").then(m => ({ default: m.ResearchScreen })),
  'generic',
  'Loading research dashboard...'
);
const SettingsScreen = lazyScreenWithSkeleton(
  () => import("../screens/SettingsScreen").then(m => ({ default: m.SettingsScreen })),
  'generic',
  'Loading settings...'
);

// Game Screens (lazy loaded with preload)
const CognitiveSyncMaze = lazyWithPreload(() => import("../screens/games/CognitiveSyncMaze").then(m => ({ default: m.CognitiveSyncMaze })));
const EmotionalResonanceMapping = lazyWithPreload(() => import("../screens/games/EmotionalResonanceMapping").then(m => ({ default: m.EmotionalResonanceMapping })));
const IconicDuoMatcher = lazyWithPreload(() => import("../screens/games/IconicDuoMatcher").then(m => ({ default: m.IconicDuoMatcher })));
const TemporalDecisionSync = lazyWithPreload(() => import("../screens/games/TemporalDecisionSync").then(m => ({ default: m.TemporalDecisionSync })));

// Authentication Screens (keep non-lazy for fast auth flow)
import { LoginScreen } from "../screens/auth/LoginScreen";
import { RegisterScreen } from "../screens/auth/RegisterScreen";
import { ForgotPasswordScreen } from "../screens/auth/ForgotPasswordScreen";

// Assessment Screens (lazy loaded with assessment skeletons)
const AssessmentIntroScreen = lazyScreenWithSkeleton(
  () => import("../screens/assessment/AssessmentIntroScreen").then(m => ({ default: m.AssessmentIntroScreen })),
  'assessment',
  'Preparing assessment...'
);
const AssessmentSurveyScreen = lazyScreenWithSkeleton(
  () => import("../screens/assessment/AssessmentSurveyScreen").then(m => ({ default: m.AssessmentSurveyScreen })),
  'assessment',
  'Loading assessment questions...'
);
const AssessmentLoadingScreen = lazyScreenWithSkeleton(
  () => import("../screens/assessment/AssessmentLoadingScreen").then(m => ({ default: m.AssessmentLoadingScreen })),
  'assessment',
  'Processing responses...'
);
const AssessmentResultsScreen = lazyScreenWithSkeleton(
  () => import("../screens/assessment/AssessmentResultsScreen").then(m => ({ default: m.AssessmentResultsScreen })),
  'assessment',
  'Analyzing results...'
);
const AssessmentResultsScreen_Premium = lazyScreenWithSkeleton(
  () => import("../screens/assessment/AssessmentResultsScreen_Premium").then(m => ({ default: m.AssessmentResultsScreen })),
  'assessment',
  'Preparing premium insights...'
);
const AssessmentRecommendationsScreen = lazyScreenWithSkeleton(
  () => import("../screens/assessment/AssessmentRecommendationsScreen").then(m => ({ default: m.AssessmentRecommendationsScreen })),
  'assessment',
  'Generating recommendations...'
);
const PairComparisonScreen = lazyScreenWithSkeleton(
  () => import("../screens/assessment/PairComparisonScreen").then(m => ({ default: m.PairComparisonScreen })),
  'assessment',
  'Loading comparison...'
);

const PremiumDashboardScreen = lazyScreenWithSkeleton(
  () => import("../screens/premium/PremiumDashboardScreen").then(m => ({ default: m.PremiumDashboardScreen })),
  'premium',
  'Loading premium analytics...'
);

const StoriesScreen = lazyScreenWithSkeleton(
  () => import("../screens/stories/StoriesScreen").then(m => ({ default: m.StoriesScreen })),
  'generic',
  'Loading stories...'
);
const CreateStoryScreen = lazyScreenWithSkeleton(
  () => import("../screens/stories/CreateStoryScreen").then(m => ({ default: m.CreateStoryScreen })),
  'generic',
  'Preparing story editor...'
);
const StoryDetailScreen = lazyScreenWithSkeleton(
  () => import("../screens/stories/StoryDetailScreen").then(m => ({ default: m.StoryDetailScreen })),
  'generic',
  'Loading story details...'
);
const EditStoryScreen = lazyScreenWithSkeleton(
  () => import("../screens/stories/EditStoryScreen").then(m => ({ default: m.EditStoryScreen })),
  'generic',
  'Preparing story editor...'
);

// Story Screens removed - integrated into Twincidence Log

// Premium Screen (lazy loaded with premium skeleton)  
const PremiumScreen = lazyScreenWithSkeleton(
  () => import("../screens/premium/PremiumScreen").then(m => ({ default: m.PremiumScreen })),
  'premium',
  'Loading premium features...'
);

// Research Screens (lazy loaded)
const ConsentScreen = lazyScreenWithSkeleton(
  () => import("../screens/research/ConsentScreen").then(m => ({ default: m.ConsentScreen })),
  'generic',
  'Loading consent form...'
);
const ResearchParticipationScreen = lazyScreenWithSkeleton(
  () => import("../screens/research/ResearchParticipationScreen").then(m => ({ default: m.ResearchParticipationScreen })),
  'generic',
  'Loading research participation...'
);
const ResearchDashboardScreen = lazyScreenWithSkeleton(
  () => import("../screens/research/ResearchDashboardScreen").then(m => ({ default: m.ResearchDashboardScreen })),
  'generic',
  'Loading research dashboard...'
);
const ResearchVoluntaryScreen = lazyScreenWithSkeleton(
  () => import("../screens/research/ResearchVoluntaryScreen").then(m => ({ default: m.ResearchVoluntaryScreen })),
  'generic',
  'Loading research information...'
);

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

type RootStackParamList = {
  // Authentication screens
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  
  Onboarding: undefined;
  Main: undefined;
  Twindex: undefined;
  Twinbox: undefined;
  Twgames: undefined;
  Twinalert: undefined;
  TwinTalk: undefined;
  Twintuition: undefined;
  Twingames: undefined;
  Twinquiry: undefined;
  Twinsettings: undefined;
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
  AssessmentRecommendations: { results?: any; sessionId?: string };
  PairComparison: undefined;
  // Premium screens
  Premium: { feature?: string; source?: 'assessment' | 'settings' | 'dashboard' | 'onboarding' };
  PremiumFeatures: undefined;
  PremiumDashboard: undefined;
  // Story screens removed - integrated into Twincidence Log
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
  ResearchVoluntary: undefined;
  ResearchParticipation: undefined;
  // Pair route
  Pair: undefined;
  // Story routes
  Stories: undefined;
  CreateStory: { draftId?: string } | undefined;
  StoryDetail: { storyId: string };
  EditStory: { storyId: string };
};

const TabNavigator = () => {
  const userProfile = useTwinStore((state) => state.userProfile);
  const themeColor = userProfile?.accentColor || "neon-purple";
  
  // Preload heavy screens when tab navigator mounts
  useEffect(() => {
    // Preload game screens using preload manager
    const preloadGameScreens = async () => {
      const componentsToPreload = [
        { name: 'TwinGamesHub', component: TwinGamesHub as any },
        { name: 'CognitiveSyncMaze', component: CognitiveSyncMaze as any },
        { name: 'EmotionalResonanceMapping', component: EmotionalResonanceMapping as any },
        { name: 'IconicDuoMatcher', component: IconicDuoMatcher as any },
        { name: 'TemporalDecisionSync', component: TemporalDecisionSync as any },
      ];
      
      await preloadManager.preloadComponents(componentsToPreload);
      
      // Log preload status for debugging
      const status = preloadManager.getStatus();
      console.log('[AppNavigator] Preload status:', status);
      
      // Generate performance report after preloading
      setTimeout(() => {
        const report = performanceTracker.generateReport();
        console.log(report);
      }, 5000);
    };
    
    // Preload after a short delay to avoid impacting initial render
    const timeoutId = setTimeout(preloadGameScreens, 2000);
    return () => clearTimeout(timeoutId);
  }, []);
  
  const getTabBarColors = () => {
    switch (themeColor) {
      case "neon-pink":
        return { active: "#ff1493", inactive: "#9ca3af", background: "rgba(26, 10, 26, 0.95)" };
      case "neon-blue":
        return { active: "#00bfff", inactive: "#9ca3af", background: "rgba(10, 26, 46, 0.95)" };
      case "neon-green":
        return { active: "#00ff7f", inactive: "#9ca3af", background: "rgba(10, 26, 10, 0.95)" };
      case "neon-yellow":
        return { active: "#ffff00", inactive: "#9ca3af", background: "rgba(26, 26, 10, 0.95)" };
      case "neon-purple":
        return { active: "#8a2be2", inactive: "#9ca3af", background: "rgba(26, 10, 26, 0.95)" };
      case "neon-orange":
        return { active: "#ff4500", inactive: "#9ca3af", background: "rgba(26, 10, 10, 0.95)" };
      case "neon-cyan":
        return { active: "#00ffff", inactive: "#9ca3af", background: "rgba(10, 26, 26, 0.95)" };
      case "neon-red":
        return { active: "#ff0000", inactive: "#9ca3af", background: "rgba(26, 10, 10, 0.95)" };
      default:
        return { active: "#8a2be2", inactive: "#9ca3af", background: "rgba(26, 10, 26, 0.95)" };
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
          } else if (route.name === "Twgames") {
            iconName = focused ? "game-controller" : "game-controller-outline";
          } else if (route.name === "Twinalert") {
            iconName = "flash";
          } else if (route.name === "Twintuition") {
            iconName = focused ? "library" : "library-outline";
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
          borderTopColor: colors.active,
          borderTopWidth: 2,
          shadowColor: colors.active,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 10,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarActiveTintColor: colors.active,
        tabBarInactiveTintColor: colors.inactive,
        headerShown: false,
      })}
    >
      <Tab.Screen name="Twindex">
        {(props) => (
          <ProfiledComponent id="HomeScreen">
            <HomeScreen {...props} />
          </ProfiledComponent>
        )}
      </Tab.Screen>
      <Tab.Screen name="Twgames">
        {(props) => (
          <ProfiledComponent id="TwinGamesHub">
            <TwinGamesHub {...props} />
          </ProfiledComponent>
        )}
      </Tab.Screen>
      <Tab.Screen name="Twinalert" component={TwintuitionScreen} />
      <Tab.Screen name="Twintuition" component={TwintuitionScreen} />
      <Tab.Screen name="Twinbox">
        {(props) => (
          <ProfiledComponent id="TwinTalkScreen">
            <TwinTalkScreen {...props} />
          </ProfiledComponent>
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

export const AppNavigator = () => {
  const isOnboarded = useTwinStore((state) => state.isOnboarded);
  const { isAuthenticated, isLoading, initializeAuth } = useAuthStore();
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);
  const routeNameRef = useRef<string | undefined>(undefined);
  const bmadTracker = useRef(new BMadNavigationTracker());
  const performanceAgent = useRef(new MobilePerformanceAgent());

  // Initialize authentication and deep links
  useEffect(() => {
    initializeAuth();
    deepLinkService.initialize();
  }, []);

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
        // Mark navigation as ready for startup performance tracking
        startupPerformanceTracker.mark('navigationReady');
        console.log('[AppNavigator] Navigation container ready');
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
            const startupMetrics = startupPerformanceTracker.exportForBMAD();

            console.log('[BMAD] Navigation Analytics:', analytics);
            console.log('[BMAD] Performance Analysis:', perfAnalysis);
            console.log('[BMAD] Startup Metrics:', startupMetrics);

            // Export performance dashboard data
            const dashboardData = performanceDashboard.exportDashboardData();
            console.log('[BMAD] Performance Dashboard:', dashboardData);

            // Log React Profiler metrics in development
            if (__DEV__) {
              PerformanceUtils.logReport();

              // Log comprehensive startup report
              const startupReport = startupPerformanceTracker.generateStartupReport();
              console.log('[BMAD] Startup Performance Report:', startupReport);

              // Generate performance alerts
              const alerts = performanceDashboard.generateAlerts();
              if (alerts.length > 0) {
                console.warn('[BMAD] Performance Alerts:', alerts);
              }
            }
          }
        }

        // Save the current route name for comparison next time
        routeNameRef.current = currentRouteName;
      }}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          // Authentication Flow
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          </>
        ) : !isOnboarded ? (
          // Onboarding Flow  
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
            <Stack.Screen name="Twingames" component={TwinGamesHub} />
            <Stack.Screen name="Twinquiry" component={ResearchScreen} />
            <Stack.Screen name="Twinsettings" component={SettingsScreen} />
            {/* Story screens removed - functionality integrated into Twincidence Log */}
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
              component={PremiumScreen}
            />
            <Stack.Screen
              name="PremiumFeatures"
              component={PremiumScreen}
            />
            <Stack.Screen name="PremiumDashboard" component={PremiumDashboardScreen} />
            {/* Twin Connection Game Screens */}
            <Stack.Screen name="TwinGamesHub" component={TwinGamesHub} />
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
            <Stack.Screen name="ResearchVoluntary" component={ResearchVoluntaryScreen} />
            <Stack.Screen name="ResearchParticipation" component={ResearchParticipationScreen} />
            {/* Missing route placeholders - redirect to proper screens */}
            <Stack.Screen name="GameStats" component={TwinGamesHub} />
            <Stack.Screen name="Home" component={TabNavigator} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="Recommendations" component={AssessmentRecommendationsScreen} />
            <Stack.Screen name="AssessmentDetails" component={AssessmentResultsScreen_Premium} />
            <Stack.Screen name="Pair" component={require("../screens/PairScreen").PairScreen} />
            {/* Story Screens */}
            <Stack.Screen name="Stories" component={StoriesScreen} />
            <Stack.Screen name="CreateStory" component={CreateStoryScreen} />
            <Stack.Screen name="StoryDetail" component={StoryDetailScreen} />
            <Stack.Screen name="EditStory" component={EditStoryScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};