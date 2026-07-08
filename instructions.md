# Twinship Clean Project Instructions

## Project Overview
- Twinship is a cross-platform Expo application that connects twins through shared onboarding flows, social features, and premium content.
- The codebase couples a React Native mobile client with a Node/Express backend for authentication, assessments, and sync services.

## Core Functionalities
- Authentication stack covering registration, login, password recovery, and onboarding journeys.
- Twin discovery, chat, and shared activity experiences driven by Zustand state management and real-time sockets.
- Premium monetization via RevenueCat, with feature flags that gate in-app purchases and subscription perks.
- Content-rich assessments, stories, and games rendered with Skia-driven visual components and NativeWind styling.

## Docs and Libraries
- Primary references: [README](mdc:README.md), [Twinship PRD](mdc:docs/Twinship%20PRD.md), and backend guides in [docs/backend-architecture.md](mdc:docs/backend-architecture.md).
- Client stack: Expo SDK 53, React Native 0.79, React Navigation 7, NativeWind for styling, and Zustand for state.
- Services & tooling: RevenueCat (`react-native-purchases`), Expo Notifications, Socket.IO client, Jest/Testing Library for tests.

## Current File Structure
- `App.tsx` bootstraps navigation and providers for the mobile client.
- `src/` contains application code: `screens/`, `components/`, `state/`, `services/`, `navigation/`, `utils/`.
- `backend/` hosts the Node/Express API, Prisma schema, and service layer sharing auth logic with the app.
- `docs/` aggregates project documentation, PRDs, and process guides.
- Platform folders `ios/` and `android/` store native build assets, while `assets/` houses shared imagery.

