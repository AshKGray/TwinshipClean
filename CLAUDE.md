# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Application Overview

### Name of the Application
**Twinship** - A specialized mobile platform for twins to strengthen their bond and connent

### Brief Description
Twinship is a React Native/Expo mobile app designed for twins to connect, communicate, and explore their unique bond through various features including chat, games, assessments, and Twincidences (twin synchronicity moments).

### Business Purpose
Transform the abstract concept of "twin connection" into tangible, measurable insights while providing tools for meaningful interaction. The app serves to:
- **Quantify Twin Bonds**: Convert subjective twin experiences into objective, measurable data through psychological games
- **Enable Meaningful Communication**: Provide purpose-built communication tools designed specifically for twin dynamics
- **Document Twin Moments**: Privacy-first Twincidences system for logging synchronicities and special twin moments with granular consent controls
- **Advance Scientific Research**: Optional participation in twin studies contributing to scientific understanding

### Target Audience
- **Primary**: Twin pairs of all types (identical, fraternal, or other)
- **Age Range**: all ages
- **Geographic Scope**: Both co-located and geographically separated twins
- **Psychographic**: Twins seeking to understand and strengthen their connection through scientific insights and shared experiences

### Current Technical Stack
**Frontend Framework:**
- React Native 0.79.5 with Expo SDK 53.0.22
- TypeScript 5.8.3 for type safety
- React 19.0.0 (latest major version)

**UI/Styling:**
- NativeWind 4.1.23 (Tailwind CSS for React Native)
- Custom celestial/cosmic design system with neon accents
- React Native Reanimated for animations

**State Management:**
- Zustand 5.0.4 with AsyncStorage persistence
- Feature-specific stores (twin, chat, assessment, subscription, etc.)

**Navigation:**
- React Navigation v7 (hybrid bottom tabs + stack navigator)

**AI Integration:**
- Multiple AI providers: OpenAI, Anthropic, Grok
- Secure API key management with expo-secure-store

**Development Tools:**
- Jest 29.7.0 with React Native Testing Library
- ESLint 9.25.0 with TypeScript integration
- BMAD Method for performance monitoring

### Pain Points or Areas for Improvement
**Current Challenges:**
- **Mock Services**: Chat uses EventEmitter-based mock WebSocket (needs real-time backend)
- **Payment Integration**: Premium features scaffolded but need payment system integration
- **Backend Dependencies**: Research telemetry system ready but needs backend endpoints
- **Performance Optimization**: Some areas identified for potential memory and rendering improvements
- **Real-time Sync**: Twin pairing currently uses mock connections for development

**Technical Debt:**
- Some TypeScript errors in BMAD integration
- Need to replace development test codes with production pairing system
- Transition from mock to production-ready AI service integrations

### Goals for Modernization/Enhancement
**Short-term Objectives:**
1. **Production Backend**: Replace mock services with real WebSocket connections and API endpoints
2. **Payment Integration**: Implement full subscription and premium feature payment flow
3. **Performance Optimization**: Address identified performance bottlenecks and memory usage
4. **Test Coverage**: Expand test coverage beyond current 80% threshold
5. **Real-time Features**: Implement true real-time Twintuition alerts and chat synchronization

**Long-term Vision:**
1. **Research Platform**: Full integration with academic research institutions for twin studies
2. **AI Enhancement**: Advanced AI-driven insights from twin interaction patterns
3. **Global Scale**: Multi-language support and international expansion
4. **Advanced Analytics**: Deeper psychological insights and relationship pattern analysis
5. **Community Features**: Twin community platform with shared experiences and events

## Essential Commands

### Development
```bash
# Start development server
npm start

# Run on specific platforms
npm run ios        # iOS simulator
npm run android    # Android emulator
npm run web        # Web browser

# Testing
npm test                # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report

# Code Quality
npm run typecheck       # TypeScript checking
npm run lint            # ESLint checking

# BMAD Method (Build-Measure-Analyze-Deploy)
npm run bmad:build      # Run build phase checks
npm run bmad:measure    # Collect metrics
npm run bmad:analyze    # Analyze performance
npm run bmad:dashboard  # View metrics dashboard
npm run bmad:deploy:staging     # Deploy to staging
npm run bmad:deploy:production  # Deploy to production
```

## Architecture Overview

### State Management Pattern
The app uses Zustand with AsyncStorage persistence. Each feature has its own store in `/src/state/`:
- `twinStore.ts` - Core user profiles and twin connection state
- `chatStore.ts` - Chat messages and real-time communication
- `assessmentStore.ts` - Assessment sessions and results
- `subscriptionStore.ts` - Premium features and subscription state
- `twintuitionStore.ts` - Twin telepathy/intuition features
- `invitationStore.ts` - Pairing and invitation system
- `researchStore.ts` - Research participation and consent
- `telemetryStore.ts` - Analytics and metrics

Stores follow a consistent pattern with persist middleware for offline support.

### Navigation Architecture
Uses React Navigation v7 with a hybrid structure:
- **Main Tab Navigator**: `Twinbox` (chat) and `Twindex` (home)
- **Stack Navigator**: Contains all screens including games, settings, assessments
- **Screen Naming Convention**: Twin-prefixed names (e.g., `Twinbox`, `Twingames`, `Twintuition`)

Navigation tracking is integrated with BMAD performance monitoring in `AppNavigator.tsx`.

### Service Layer Pattern
Services in `/src/services/` handle external integrations and complex logic:
- **AI Services**: `openai.ts`, `anthropic.ts`, `grok.ts` - Multiple AI provider integrations
- **Core Services**: `chatService.ts`, `storageService.ts`, `encryptionService.ts`
- **Feature Services**: `invitationService.ts`, `twintuitionService.ts`, `subscriptionService.ts`
- **Mock WebSocket**: Chat uses EventEmitter-based mock for real-time (replace with Firebase/Socket.io in production)

### Component Organization
Components are feature-grouped in `/src/components/`:
- `assessment/` - Assessment-specific UI components
- `chat/` - Chat interface components
- `games/` - Game-related components
- `premium/` - Subscription and premium features
- `twincidences/` - Twincidence logging and consent management
- `research/` - Research participation components

### Screen Flow Patterns
Key user flows:
1. **Onboarding**: `OnboardingScreen` → Profile setup → Twin type selection → Color theme
2. **Assessment**: `AssessmentIntro` → `AssessmentSurvey` → `AssessmentLoading` → `AssessmentResults`
3. **Games Hub**: `PsychicGamesHub` → Individual game screens (ColorSync, NumberIntuition, etc.)
4. **Premium Conversion**: Multiple entry points → `PremiumScreen` → Subscription flow

### API Integration Strategy
The app supports multiple AI providers with a unified interface:
- Each provider has its own service file with consistent error handling
- API keys are stored securely using `expo-secure-store`
- Fallback mechanisms between providers for reliability

### Performance Monitoring
BMAD Method integration tracks:
- Navigation timing and screen views
- Memory usage and FPS
- API latency and error rates
- User engagement metrics

Performance data flows through `.bmad-mobile-app/navigation-tracker.ts` and `mobile-performance.agent.js`.

### Type Safety Patterns
- Strict TypeScript enabled (`tsconfig.json`)
- Comprehensive type definitions in `/src/types/`
- Navigation param lists defined in `AppNavigator.tsx`
- Zustand stores are fully typed with interfaces

### Testing Strategy
- Jest configured with React Native Testing Library
- Test files co-located with components (`__tests__` directories)
- Mock data available in `/src/tests/mocks/`
- Coverage threshold targets: 80%

## Key Technical Decisions

1. **Expo SDK 53**: Using latest Expo with new architecture enabled
2. **NativeWind**: Tailwind CSS for React Native styling
3. **Zustand over Redux**: Simpler state management with less boilerplate
4. **Multiple AI Providers**: Redundancy and feature diversity (OpenAI, Anthropic, Grok)
5. **Mock Services**: Development-friendly mocks that can be replaced in production
6. **Feature-First Organization**: Code organized by feature rather than file type
7. **React 19.0.0**: Latest React with improved performance and new features
8. **React Native 0.79.5**: Current stable version with latest optimizations
9. **Development Test Codes**: Built-in TEST/TESTTWIN codes for rapid development and testing
10. **Galaxy Background**: Consistent `galaxybackground.png` across all screens for cohesive design

## Critical Files to Understand

- `src/navigation/AppNavigator.tsx` - Central navigation configuration and BMAD integration
- `src/state/twinStore.ts` - Core app state and user profiles
- `src/screens/PairScreen.tsx` - **UPDATED**: Enhanced pairing functionality with test codes and auto-navigation
- `src/screens/HomeScreen.tsx` - Main hub with feature grid
- `src/screens/chat/TwinTalkScreen.tsx` - Chat interface with mock real-time messaging
- `.bmad-core/config/bmad.config.json` - BMAD method configuration
- `app.json` - Expo configuration (note: app identifier is "vibecode")

## New Documentation Files

The `/docs/` directory now contains comprehensive project documentation:

- `Twinship PRD.md` - Complete Product Requirements Document
- `api-documentation.md` - API integration guides and patterns
- `navigation-flow-documentation.md` - Screen flow and navigation patterns
- `performance-analysis-report.md` - Performance metrics and analysis
- `performance-optimization-plan.md` - Optimization strategies and implementation
- `testing-and-build-strategy.md` - Testing approach and build processes
- `ui-component-architecture.md` - Component design patterns and architecture

## Development Workflows

### Adding a New Feature
1. Create feature store in `/src/state/`
2. Add screen in `/src/screens/`
3. Register route in `AppNavigator.tsx`
4. Create service if external integration needed
5. Add types in `/src/types/`
6. Write tests alongside implementation

### **NEW: Development Testing Workflow**
For rapid development and testing of twin features:

1. **Quick Pairing**: Use "TEST" or "TESTTWIN" codes in PairScreen for instant mock twin connection
   - "TEST": Creates you as Jordan, twin as Alex
   - "TESTTWIN": Creates you as Alex, twin as Jordan
2. **Auto-Navigation**: Successful pairing automatically navigates to TwinTalk
3. **Mock Chat**: Test twins automatically send welcome messages
4. **Profile Testing**: Mock profiles with realistic data for comprehensive testing

### Modifying Navigation
- Update `RootStackParamList` type in `AppNavigator.tsx`
- Add screen to appropriate section (Main stack or Tab navigator)
- Ensure BMAD tracking captures new routes
- **Test navigation flows** using development codes for rapid iteration

### Working with AI Services
- API keys must be in `.env` (not committed)
- Use `expo-secure-store` for runtime key storage
- Follow existing error handling patterns in service files
- Test with mock responses first
- **Use test twin conversations** to verify AI integrations

### **NEW: Testing PairScreen Changes**
When modifying PairScreen functionality:

1. Test both "TEST" and "TESTTWIN" codes
2. Verify auto-navigation to TwinTalk works
3. Ensure status text updates appropriately
4. Test Enter key submission in code input
5. Verify background image displays correctly (`galaxybackground.png`)
6. Check console logs for debugging information

## Current State Notes

- **Major Navigation Improvements**: PairScreen Connect button functionality has been fully implemented with TEST/TESTTWIN development codes for easy testing
- **Enhanced Development Workflow**: Development mode allows instant pairing with mock twins using "TEST" or "TESTTWIN" codes
- **Background Standardization**: All screens now consistently use `galaxybackground.png` as the background image
- **Auto-Navigation**: PairScreen now automatically navigates to TwinTalk after successful pairing
- **Enhanced Error Handling**: Comprehensive logging and error handling throughout the pairing flow
- **Enter Key Support**: TextInput in PairScreen supports Enter key submission for better UX
- **Updated Dependencies**: React Native 0.79.5, React 19.0.0, and latest Expo SDK 53
- **Comprehensive Documentation**: Added multiple documentation files covering performance, testing, and architecture
- Premium features and subscription system are scaffolded but need payment integration
- Chat uses mock WebSocket - needs real-time backend in production
- Research telemetry system is ready but needs backend endpoints

## Recent Bug Fixes & Enhancements

### PairScreen Improvements (Critical)
- **Fixed Connect Button**: Previously non-functional Connect button now works properly
- **Test Codes Implementation**: "TEST" creates Jordan/Alex pair, "TESTTWIN" creates Alex/Jordan pair
- **Auto-Navigation**: Successful pairing automatically navigates to TwinTalk screen after 1.5s delay
- **Status Updates**: Real-time status text updates during connection process
- **Enter Key Support**: Users can press Enter in code input field to submit
- **Enhanced Debugging**: Comprehensive console logging for troubleshooting

### Development Testing Features
- **Mock Twin Creation**: Instant twin profiles with realistic data for testing
- **Chat Integration**: Test twins automatically send welcome messages
- **Profile Generation**: Automatic user profile creation when using test codes
- **Connection Status Sync**: Proper state management between stores

## Updated Dependencies & Package Information

### Major Version Updates
- **React**: Upgraded to 19.0.0 (latest major version)
- **React Native**: Updated to 0.79.5 (current stable)
- **Expo SDK**: 53.0.22 (latest with new architecture support)

### Key Development Dependencies
- **TypeScript**: 5.8.3 (latest stable)
- **Jest**: 29.7.0 with React Native Testing Library
- **ESLint**: 9.25.0 with TypeScript integration
- **NativeWind**: 4.1.23 (Tailwind for React Native)

### New Patches
- `react-native@0.79.2.patch` - Custom modifications for project needs
- `expo-asset@11.1.5.patch` - Asset handling improvements

## Troubleshooting Guide

### Common Development Issues

#### PairScreen Navigation Problems
- **Issue**: Connect button not working
- **Solution**: Ensure TEST/TESTTWIN codes are entered correctly, check console logs
- **Debug**: Look for "=== CONNECT FUNCTION CALLED ===" in console

#### Background Image Not Loading
- **Issue**: Galaxy background not displaying
- **Solution**: Verify `galaxybackground.png` exists in `/assets/` directory
- **Path**: `require("../../assets/galaxybackground.png")`

#### Mock Twin Chat Not Working
- **Issue**: Test twin not sending messages
- **Solution**: Check `useChatStore` import and message creation in `createDevPair`
- **Timing**: Welcome message sent after 400ms delay

#### Auto-Navigation Failing
- **Issue**: Not navigating to TwinTalk after pairing
- **Solution**: Verify navigation object has `navigate` method, check route name "TwinTalk"
- **Timing**: Navigation triggered after 1.5s delay

### State Management Issues
- **Zustand Persistence**: Clear AsyncStorage if state becomes corrupted
- **Store Sync**: Ensure both `twinStore` and `tempTwinStore` are updated
- **Profile Creation**: Mock profiles include all required fields (id, name, age, etc.)

## Task Master AI Instructions
**Import Task Master's development workflow commands and guidelines, treat as if import is in the main CLAUDE.md file.**
@./.taskmaster/CLAUDE.md
