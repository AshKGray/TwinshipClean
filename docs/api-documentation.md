# Twinship API Documentation

## Overview

This document provides comprehensive documentation for the Twinship React Native application's API integration patterns, service architecture, and state management systems. Twinship is designed for twins to connect, communicate, and explore their unique bond through various features including chat, games, assessments, and stories.

---

## Table of Contents

1. [Service Layer Architecture](#service-layer-architecture)
2. [Multi-Provider AI Integration](#multi-provider-ai-integration)
3. [State Management APIs](#state-management-apis)
4. [Mock Service Architecture](#mock-service-architecture)
5. [Integration Patterns](#integration-patterns)
6. [Security Patterns](#security-patterns)
7. [Migration Guide](#migration-guide)

---

## Service Layer Architecture

### Core Architecture Principles

The Twinship app follows a **Service-Oriented Architecture** with clear separation of concerns:

- **`/src/api/`** - Direct API client wrappers for external services
- **`/src/services/`** - Business logic and orchestration services
- **`/src/state/`** - State management with Zustand stores
- **Mock-first approach** - Development-friendly with production-ready interfaces

### Service Categories

#### 1. AI Integration Services (`/src/api/`)

```typescript
// Core AI service pattern
interface AIService {
  chat(messages: AIMessage[], options?: AIRequestOptions): Promise<AIResponse>;
  complete(prompt: string, options?: AIRequestOptions): Promise<AIResponse>;
}
```

**Available Services:**
- `anthropic.ts` - Anthropic Claude integration
- `openai.ts` - OpenAI GPT integration  
- `grok.ts` - Grok API integration
- `chat-service.ts` - Unified AI chat orchestration
- `image-generation.ts` - Vibecode custom image generation
- `transcribe-audio.ts` - OpenAI Whisper transcription

#### 2. Core Business Services (`/src/services/`)

**Primary Services:**
- `chatService.ts` - Real-time communication (mock WebSocket)
- `invitationService.ts` - Twin pairing and invitation system
- `twintuitionService.ts` - Psychic synchronicity detection
- `storageService.ts` - Multi-tier storage management
- `encryptionService.ts` - End-to-end encryption
- `subscriptionService.ts` - Premium features management
- `telemetryService.ts` - Analytics and metrics collection

#### 3. Feature-Specific Services

**Stories System** (`/src/services/stories/`):
- `storyService.ts` - Story creation and management
- `mediaService.ts` - Photo and media handling
- `migrationService.ts` - Data migration utilities

---

## Multi-Provider AI Integration

### Architecture Overview

Twinship implements a **redundant multi-provider AI strategy** for reliability and feature diversity:

```typescript
// Unified API interface across all providers
export interface AIResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}
```

### Provider Configuration

#### OpenAI Integration
```typescript
// src/api/openai.ts
export const getOpenAIClient = () => {
  const apiKey = process.env.EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY;
  return new OpenAI({ apiKey });
};

// Available models:
// - gpt-4.1-2025-04-14
// - o4-mini-2025-04-16  
// - gpt-4o-2024-11-20 (supports images)
```

#### Anthropic Integration
```typescript
// src/api/anthropic.ts
export const getAnthropicClient = () => {
  const apiKey = process.env.EXPO_PUBLIC_VIBECODE_ANTHROPIC_API_KEY;
  return new Anthropic({ apiKey });
};

// Available models:
// - claude-sonnet-4-20250514
// - claude-3-7-sonnet-latest
// - claude-3-5-haiku-latest
```

#### Grok Integration
```typescript
// src/api/grok.ts - Uses OpenAI-compatible interface
export const getGrokClient = () => {
  const apiKey = process.env.EXPO_PUBLIC_VIBECODE_GROK_API_KEY;
  return new OpenAI({
    apiKey,
    baseURL: "https://api.x.ai/v1"
  });
};

// Available models:
// - grok-3-latest
// - grok-3-fast-latest
// - grok-3-mini-latest
```

### Usage Patterns

#### Basic Chat Integration
```typescript
import { getAnthropicChatResponse } from '../api/chat-service';

// Simple chat response
const response = await getAnthropicChatResponse("Hello, how are you?");
console.log(response.content); // AI response text
console.log(response.usage);   // Token usage statistics
```

#### Multi-Message Conversations
```typescript
import { getOpenAITextResponse } from '../api/chat-service';

const messages = [
  { role: "user", content: "What is twintuition?" },
  { role: "assistant", content: "Twintuition refers to..." },
  { role: "user", content: "How can I improve mine?" }
];

const response = await getOpenAITextResponse(messages, {
  temperature: 0.7,
  maxTokens: 2048,
  model: "gpt-4o"
});
```

#### Error Handling Pattern
```typescript
try {
  const response = await getGrokTextResponse(messages);
  return response.content;
} catch (error) {
  console.error('Grok API Error:', error);
  // Implement fallback to another provider
  return await getOpenAITextResponse(messages);
}
```

### Custom Vibecode Services

#### Image Generation
```typescript
import { generateImage } from '../api/image-generation';

const imageUrl = await generateImage(
  "A cosmic twin connection illustration",
  {
    size: "1024x1024",
    quality: "high",
    format: "png"
  }
);
// Returns direct URL for immediate use in React Native Image components
```

#### Audio Transcription
```typescript
import { transcribeAudio } from '../api/transcribe-audio';

const transcription = await transcribeAudio(localAudioUri);
console.log(transcription); // "Hello twin, I miss you!"
```

---

## State Management APIs

### Zustand Store Architecture

Twinship uses **Zustand** with AsyncStorage persistence for offline-first state management:

```typescript
// Common store pattern
export const useExampleStore = create<ExampleState>()(
  persist(
    (set, get) => ({
      // State and actions
    }),
    {
      name: 'example-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Only persist specific fields
      })
    }
  )
);
```

### Core Stores Overview

#### 1. Twin Store (`twinStore.ts`)
**Purpose:** Core user profiles, twin connection state, and pairing
```typescript
interface TwinState {
  // Profile Management
  userProfile: TwinProfile | null;
  twinProfile: TwinProfile | null;
  isOnboarded: boolean;
  
  // Connection State
  paired: boolean;
  shareCode: string | null;
  invitationStatus: 'none' | 'sent' | 'received' | 'processing' | 'accepted' | 'declined';
  
  // Features
  twintuitionAlerts: TwintuitionAlert[];
  gameResults: PsychicGameResult[];
  stories: Story[];
  
  // Research Integration
  researchParticipation: boolean;
  hasActiveResearchStudies: boolean;
  researchContributions: number;
}
```

**Key Methods:**
```typescript
// Profile management
setUserProfile(profile: TwinProfile): void
setTwinProfile(profile: TwinProfile): void

// Connection management
setPaired(value: boolean): void
setInvitationStatus(status: InvitationStatus): void

// Feature interactions
addTwintuitionAlert(alert: Omit<TwintuitionAlert, "id" | "timestamp">): void
addGameResult(result: Omit<PsychicGameResult, "id" | "timestamp">): void
getTotalSyncScore(): number
```

#### 2. Chat Store (`chatStore.ts`)
**Purpose:** Real-time messaging, typing indicators, and twintuition moments
```typescript
interface ChatState {
  messages: ChatMessage[];
  connection: ChatConnection;
  typingIndicator: TypingIndicator | null;
  twintuitionMoments: TwintuitionMoment[];
  
  // UI State
  isVoiceRecording: boolean;
  showQuickResponses: boolean;
  selectedMessageId: string | null;
}
```

**Key Methods:**
```typescript
addMessage(message: Omit<ChatMessage, 'id' | 'timestamp' | 'isDelivered' | 'isRead'>): void
addReaction(messageId: string, emoji: string, userId: string, userName: string): void
setConnection(connection: Partial<ChatConnection>): void
addTwintuitionMoment(moment: Omit<TwintuitionMoment, 'id' | 'timestamp'>): void
```

#### 3. Assessment Store (`assessmentStore.ts`)
**Purpose:** Personality assessments, results, and analytics
```typescript
// Located in /src/state/stores/assessmentStore.ts
// Manages assessment sessions, scoring, and result storage
```

#### 4. Subscription Store (`subscriptionStore.ts`)
**Purpose:** Premium features, billing, and subscription management
```typescript
// Premium feature gating and subscription state
```

### Store Integration Patterns

#### Cross-Store Communication
```typescript
// Accessing multiple stores in a component
const Example = () => {
  const { userProfile, twinProfile } = useTwinStore();
  const { messages, addMessage } = useChatStore();
  const { isPremium } = useSubscriptionStore();
  
  const sendMessage = (text: string) => {
    if (!userProfile) return;
    
    addMessage({
      text,
      senderId: userProfile.id,
      senderName: userProfile.name,
      type: 'text',
      accentColor: userProfile.accentColor
    });
  };
};
```

#### Persistence Strategy
```typescript
// Selective persistence for security and performance
partialize: (state) => ({
  // Persist user data
  userProfile: state.userProfile,
  twinProfile: state.twinProfile,
  
  // Don't persist temporary/sensitive data
  // messages: state.messages, // Handled separately
  // tempState: state.tempState,
})
```

---

## Mock Service Architecture

### ChatService WebSocket Simulation

The `chatService.ts` implements a **sophisticated mock WebSocket** using EventEmitter for development and testing:

```typescript
class MockWebSocket extends EventEmitter {
  private connected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect() {
    this.connected = true;
    this.emit('connected');
  }

  send(data: any) {
    // Simulate network delay
    setTimeout(() => {
      this.emit('message', data);
    }, Math.random() * 500 + 100);
  }
}
```

### Mock Features

#### 1. Connection Simulation
```typescript
// Automatic connection states
'connecting' → 'connected' → 'disconnected' → 'reconnecting'

// Event handling
this.ws.on('connected', () => {
  useChatStore.getState().setConnection({ status: 'connected' });
  this.processOfflineQueue();
});
```

#### 2. Offline Message Queue
```typescript
async sendMessage(message: ChatMessage) {
  try {
    if (this.ws.connected) {
      this.ws.send({ type: 'message', data: message });
    } else {
      // Queue for offline sending
      this.offlineQueue.push(message);
      await this.saveOfflineMessages();
    }
  } catch (error) {
    // Auto-retry logic
  }
}
```

#### 3. Test Twin Auto-Response
```typescript
private handleTestTwinAutoResponse(userMessage: ChatMessage) {
  const { twinProfile } = useTwinStore.getState();
  
  // Only respond if paired with test twin
  if (!twinProfile?.id.startsWith('test-twin-')) return;
  
  const responses = [
    "I was just thinking about that! 🤯",
    "Wow, we're so in sync right now! ✨",
    "Twin telepathy is strong today 🧠➡️🧠"
  ];
  
  // Intelligent response selection based on keywords
  let response = responses[Math.random() * responses.length];
  
  // Simulate typing indicator
  setTimeout(() => {
    this.sendTestTwinResponse(response);
  }, 1000 + Math.random() * 2000);
}
```

#### 4. Twintuition Detection
```typescript
private checkForTwintuition(message: ChatMessage) {
  const twintuitionKeywords = [
    'thinking the same', 'read my mind', 'telepathy',
    'exactly what I was thinking', 'intuition'
  ];
  
  const hasTwintuitionKeyword = twintuitionKeywords.some(keyword =>
    message.text.toLowerCase().includes(keyword)
  );
  
  if (hasTwintuitionKeyword) {
    chatStore.addTwintuitionMoment({
      message: 'Twin telepathy moment detected! 🔮',
      type: 'intuition',
      confidence: Math.random() * 0.3 + 0.7 // 70-100%
    });
  }
}
```

### Production Migration Path

The mock architecture is designed for easy production migration:

```typescript
// Development
import { MockWebSocket } from './mocks/mockWebSocket';

// Production
import { initializeSocket } from 'socket.io-client';
// OR
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
```

**Migration Checklist:**
- [ ] Replace MockWebSocket with Socket.io or Firebase Realtime Database
- [ ] Update event handlers to match production service
- [ ] Implement server-side twintuition detection
- [ ] Add authentication middleware
- [ ] Set up message encryption in transit

---

## Integration Patterns

### Component → Service Integration

#### 1. Direct Service Usage
```typescript
import { chatService } from '../services/chatService';
import { invitationService } from '../services/invitationService';

const ChatScreen = () => {
  const sendMessage = async (text: string) => {
    await chatService.sendMessage({
      text,
      senderId: user.id,
      senderName: user.name,
      type: 'text',
      accentColor: user.accentColor
    });
  };
  
  const sendInvitation = async (email: string) => {
    const invitation = await invitationService.createInvitation(
      userProfile, 
      { email }
    );
    await invitationService.sendEmailInvitation(invitation);
  };
};
```

#### 2. Store-Mediated Integration
```typescript
// Services update stores, components react to store changes
const TwintuitionService = () => {
  private async triggerAlert(syncEvent: SyncEvent) {
    const store = useTwinStore.getState();
    store.addTwintuitionAlert({
      message: this.generateAlertMessage(syncEvent),
      type: this.mapSyncTypeToAlertType(syncEvent.type),
    });
  }
};

// Component reacts automatically
const AlertsComponent = () => {
  const { twintuitionAlerts } = useTwinStore();
  return alerts.map(alert => <AlertCard key={alert.id} alert={alert} />);
};
```

### Error Handling Patterns

#### 1. Graceful Degradation
```typescript
const useAIResponse = () => {
  const getResponse = async (prompt: string) => {
    const providers = [
      () => getAnthropicChatResponse(prompt),
      () => getOpenAIChatResponse(prompt),
      () => getGrokChatResponse(prompt)
    ];
    
    for (const provider of providers) {
      try {
        return await provider();
      } catch (error) {
        console.warn('Provider failed, trying next...', error);
        continue;
      }
    }
    
    throw new Error('All AI providers failed');
  };
};
```

#### 2. Offline-First Patterns
```typescript
const offlineCapableAction = async (data: any) => {
  try {
    // Try online first
    const result = await apiService.submit(data);
    return result;
  } catch (error) {
    // Queue for later if offline
    await offlineQueue.add(data);
    return { queued: true, error: error.message };
  }
};
```

### Service Orchestration

#### Complex Feature Integration
```typescript
// Example: Sending a message with AI enhancement
const enhancedMessageSend = async (rawText: string) => {
  // 1. AI enhancement (optional)
  let enhancedText = rawText;
  if (premiumUser) {
    try {
      enhancedText = await getAnthropicChatResponse(
        `Enhance this twin message: ${rawText}`
      );
    } catch {
      // Fallback to original
    }
  }
  
  // 2. Send via chat service
  await chatService.sendMessage({
    text: enhancedText,
    // ... other fields
  });
  
  // 3. Track for twintuition
  await twintuitionService.trackMessage(enhancedText);
  
  // 4. Update analytics
  await telemetryService.track('message_sent', {
    enhanced: enhancedText !== rawText,
    length: enhancedText.length
  });
};
```

---

## Security Patterns

### API Key Management

#### Environment Variables
```env
# .env - Not committed to git
EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY=sk-proj-...
EXPO_PUBLIC_VIBECODE_ANTHROPIC_API_KEY=sk-ant-api03-...
EXPO_PUBLIC_VIBECODE_GROK_API_KEY=xai-...
```

#### Secure Storage Integration
```typescript
import * as SecureStore from 'expo-secure-store';

// Runtime key storage
const storeApiKey = async (provider: string, key: string) => {
  await SecureStore.setItemAsync(`${provider}_api_key`, key);
};

const getApiKey = async (provider: string) => {
  return await SecureStore.getItemAsync(`${provider}_api_key`);
};
```

### Encryption Service

#### Multi-Tier Encryption Architecture
```typescript
export class EncryptionService {
  // AES-256-GCM with secure key management
  async encrypt(plaintext: string): Promise<string>
  async decrypt(encryptedData: string): Promise<string>
  
  // Assessment-specific encryption
  async encryptAssessmentData(data: any, assessmentId: string, userId: string): Promise<string>
  async decryptAssessmentData(encrypted: string, assessmentId: string, userId: string): Promise<any>
  
  // Key rotation and management
  async rotateMasterKey(): Promise<void>
  async clearKeys(): Promise<void>
}
```

#### Usage Patterns
```typescript
// Automatic encryption for sensitive data
import { EncryptionService } from '../services/encryptionService';

const storeSensitiveData = async (assessmentResults: any) => {
  const encrypted = await EncryptionService.encryptAssessmentData(
    assessmentResults,
    assessmentId,
    userId
  );
  
  await storageService.setSecure('assessment_results', encrypted);
};
```

### Storage Service Security

#### Multi-Tier Storage Architecture
```typescript
interface StorageOptions {
  encrypt?: boolean;         // Apply encryption
  compress?: boolean;        // Apply compression
  tier?: 'standard' | 'secure' | 'temp' | 'persistent';
  ttl?: number;             // Time to live
  backup?: boolean;         // Create backup
}

// Usage examples
await storageService.set('user_preferences', data, { tier: 'standard' });
await storageService.setSecure('assessment_data', data); // Auto-encrypted
await storageService.set('temp_data', data, { tier: 'temp', ttl: 3600000 });
```

#### Automatic Cleanup and Security
```typescript
// Automatic expired data cleanup
const cleanupResult = await storageService.cleanup();
console.log(`Removed ${cleanupResult.removed} items, freed ${cleanupResult.freed} bytes`);

// Export for backup/migration
const exportData = await storageService.exportAll();
// Returns decrypted data for authorized migration
```

### Privacy Patterns

#### Data Minimization
```typescript
// Store only necessary data
const privacyAwareBehaviorTracking = async (event: BehaviorEvent) => {
  const sanitizedEvent = {
    ...event,
    // Remove PII
    location: event.location ? 'REDACTED' : undefined,
    metadata: {
      // Keep only anonymous analytics
      timeOfDay: new Date().getHours(),
      dayOfWeek: new Date().getDay()
    }
  };
  
  await storageService.set('behavior_event', sanitizedEvent, {
    tier: 'temp',
    ttl: 24 * 60 * 60 * 1000 // 24 hours
  });
};
```

#### Consent Management
```typescript
const trackWithConsent = async (event: AnalyticsEvent) => {
  const { researchParticipation } = useTwinStore.getState();
  
  if (researchParticipation) {
    await telemetryService.track(event);
  } else {
    // Local-only analytics
    await localAnalytics.track(event);
  }
};
```

---

## Migration Guide

### From Mock to Production

#### 1. WebSocket Migration
```typescript
// Current: Mock WebSocket
class MockWebSocket extends EventEmitter { ... }

// Target: Socket.io
import { io, Socket } from 'socket.io-client';

class ProductionWebSocket {
  private socket: Socket;
  
  connect() {
    this.socket = io(process.env.WEBSOCKET_URL, {
      auth: { token: await getAuthToken() }
    });
    
    this.socket.on('message', (data) => {
      // Same event handling as mock
      this.handleIncomingMessage(data);
    });
  }
}
```

#### 2. AI Service Migration
```typescript
// Current: Direct client usage
const response = await getOpenAIClient().chat.completions.create(...);

// Target: Backend proxy for security
const response = await fetch('/api/ai/chat', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${userToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    provider: 'openai',
    messages,
    options
  })
});
```

#### 3. Storage Migration
```typescript
// Current: Local storage with encryption
await storageService.setSecure(key, data);

// Target: Hybrid local + cloud storage
const cloudSyncService = {
  async set(key: string, data: any) {
    // Store locally first
    await storageService.setSecure(key, data);
    
    // Sync to cloud if connected
    if (await isOnline()) {
      await syncToCloud(key, data);
    }
  }
};
```

### API Evolution Path

#### Phase 1: Mock Services (Current)
- ✅ Local development and testing
- ✅ Offline-first functionality
- ✅ Full feature simulation
- ✅ No external dependencies

#### Phase 2: Hybrid Services
- 🔄 Backend API integration
- 🔄 Real-time WebSocket connection
- 🔄 Cloud storage synchronization
- 🔄 Enhanced security measures

#### Phase 3: Production Services
- ⏳ Full cloud deployment
- ⏳ Scalable infrastructure
- ⏳ Advanced analytics
- ⏳ Premium service integrations

### Testing Strategy

#### Service Layer Testing
```typescript
// Mock service tests
describe('ChatService', () => {
  it('should queue messages when offline', async () => {
    chatService.disconnect();
    await chatService.sendMessage(testMessage);
    expect(chatService.offlineQueue).toContain(testMessage);
  });
  
  it('should detect twintuition keywords', async () => {
    const message = { text: "I was just thinking the same thing!" };
    await chatService.sendMessage(message);
    
    const { twintuitionMoments } = useChatStore.getState();
    expect(twintuitionMoments).toHaveLength(1);
  });
});
```

#### Integration Testing
```typescript
// Store + Service integration tests
describe('TwintuitionFlow', () => {
  it('should trigger alert and update store', async () => {
    await twintuitionService.trackBehavior({
      type: 'app_interaction',
      action: 'open_app'
    });
    
    const { twintuitionAlerts } = useTwinStore.getState();
    expect(twintuitionAlerts.length).toBeGreaterThan(0);
  });
});
```

---

## Best Practices

### API Integration
1. **Always implement fallback providers** for critical AI services
2. **Use environment variables** for all API keys and endpoints
3. **Implement rate limiting** and retry logic with exponential backoff
4. **Cache responses** when appropriate to reduce API costs
5. **Monitor usage and costs** across all providers

### State Management
1. **Partition store data** - only persist what's necessary
2. **Use selective persistence** to avoid storing sensitive data
3. **Implement optimistic updates** for better UX
4. **Handle offline states** gracefully
5. **Validate data integrity** on store rehydration

### Security
1. **Never store API keys** in version control
2. **Use secure storage** for sensitive user data
3. **Implement proper encryption** for assessment data
4. **Follow data minimization** principles
5. **Obtain explicit consent** for analytics/research data

### Development
1. **Mock services first** for rapid development
2. **Design for production migration** from the start
3. **Test offline scenarios** extensively
4. **Document API contracts** clearly
5. **Monitor and log** service interactions

---

## Conclusion

The Twinship API architecture provides a robust, scalable foundation for twin-focused social networking features. The mock-first approach enables rapid development while maintaining production-ready interfaces. The multi-provider AI integration ensures reliability and feature diversity, while the comprehensive security layer protects user privacy and data integrity.

This architecture supports the app's unique twin-centric features while providing clear migration paths to production-scale infrastructure.