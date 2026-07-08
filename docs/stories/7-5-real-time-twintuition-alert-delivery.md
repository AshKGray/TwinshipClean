# Story 7.5: Real-Time Twintuition Alert Delivery

**Epic**: 7 - Data Synchronization & Backend
**Status**: drafted
**Story ID**: 7-5
**Estimated Effort**: Medium (5-6 hours)

---

## User Story

**As a** user
**I want** instant Twintuition alerts delivered to my twin in real-time
**So that** I feel connected in the moment and can share experiences immediately

## Business Value

Twintuition alerts are the heartbeat of daily engagement. Real-time delivery creates magical moments of connection, driving users to open the app throughout the day and strengthening the twin bond through shared presence.

## Acceptance Criteria

1. ✅ Sending alert writes to Firestore within 500ms
2. ✅ Twin receives alert in real-time (< 500ms latency)
3. ✅ In-app notification banner displays for incoming alert
4. ✅ Alert message encrypted if present
5. ✅ Alerts auto-delete after 24 hours
6. ✅ Mark as seen updates seenAt timestamp
7. ✅ Alert history loads from Firestore on app startup
8. ✅ Offline alerts queue for sync when network returns
9. ✅ Listener updates twintuitionStore automatically
10. ✅ Expired alerts cleaned up on app startup
11. ✅ Alert type, emotion, and intensity synced correctly
12. ✅ Simultaneous alerts (< 30s apart) detected and logged as Twincidence

## Technical Implementation Notes

### Twintuition Sync Service

Create `src/services/firebase/twintuitionSync.ts`:

```typescript
import {
  collection,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  type Unsubscribe,
  deleteDoc,
  getDocs
} from 'firebase/firestore';
import { db } from './firebase.config';
import { firestoreService } from './firestore';
import { EncryptionService } from './encryption';
import { getAlertsPath } from '@/models/firebase/collections';
import type { TwintuitionAlertDoc } from '@/models/firebase/schema';
import type { TwintuitionAlert } from '@/types';
import { useTwintuitionStore } from '@/state/twintuitionStore';
import { useTwinStore } from '@/state/twinStore';
import * as SecureStore from 'expo-secure-store';
import { v4 as uuidv4 } from 'uuid';

class TwintuitionSyncService {
  private encryptionService: EncryptionService;
  private listener: Unsubscribe | null = null;

  constructor() {
    this.encryptionService = new EncryptionService();
  }

  /**
   * Send Twintuition alert
   */
  async sendAlert(twinPairId: string, alert: TwintuitionAlert): Promise<void> {
    try {
      const { userProfile, twinProfile } = useTwinStore.getState();
      if (!userProfile || !twinProfile) {
        throw new Error('User or twin profile not found');
      }

      // Get encryption key
      const encryptionKey = await SecureStore.getItemAsync(`encryption_key_${userProfile.id}`);
      if (!encryptionKey) throw new Error('Encryption key not found');

      // Encrypt message if present
      let encryptedMessage: string | undefined;
      if (alert.message) {
        encryptedMessage = await this.encryptionService.encrypt(alert.message, encryptionKey);
      }

      // Calculate expiration (24 hours from now)
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      // Create alert document
      const alertDoc: Omit<TwintuitionAlertDoc, 'id' | 'createdAt' | 'sentAt'> = {
        type: alert.type,
        emotion: alert.emotion,
        intensity: alert.intensity,
        message: encryptedMessage,
        senderId: userProfile.id,
        recipientId: twinProfile.id,
        expiresAt: Timestamp.fromDate(expiresAt),
        isDeleted: false,
      };

      const alertsPath = getAlertsPath(twinPairId);
      await firestoreService.createDocument(alertsPath, alert.id, {
        ...alertDoc,
        sentAt: serverTimestamp(),
      });

      console.log('Twintuition alert sent:', alert.id);
    } catch (error) {
      console.error('Error sending alert:', error);
      throw error;
    }
  }

  /**
   * Subscribe to incoming Twintuition alerts
   */
  subscribeToAlerts(
    twinPairId: string,
    userId: string,
    callback: (alerts: TwintuitionAlert[]) => void
  ): Unsubscribe {
    const alertsPath = getAlertsPath(twinPairId);
    const collectionRef = collection(db, alertsPath);

    // Query: Get non-deleted alerts where user is recipient, ordered by sentAt descending
    const q = query(
      collectionRef,
      where('recipientId', '==', userId),
      where('isDeleted', '==', false),
      orderBy('sentAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const encryptionKey = await SecureStore.getItemAsync(`encryption_key_${userId}`);
        if (!encryptionKey) {
          console.error('Encryption key not found');
          return;
        }

        const alerts: TwintuitionAlert[] = await Promise.all(
          snapshot.docs.map(async (doc) => {
            const data = doc.data() as TwintuitionAlertDoc;

            // Decrypt message if present
            let decryptedMessage: string | undefined;
            if (data.message) {
              decryptedMessage = await this.encryptionService.decrypt(
                data.message,
                encryptionKey
              );
            }

            return {
              id: doc.id,
              type: data.type,
              emotion: data.emotion,
              intensity: data.intensity,
              message: decryptedMessage,
              senderId: data.senderId,
              recipientId: data.recipientId,
              sentAt: firestoreService.timestampToISO(data.sentAt as Timestamp),
              seenAt: data.seenAt ? firestoreService.timestampToISO(data.seenAt as Timestamp) : undefined,
              respondedAt: data.respondedAt ? firestoreService.timestampToISO(data.respondedAt as Timestamp) : undefined,
              expiresAt: firestoreService.timestampToISO(data.expiresAt),
            } as TwintuitionAlert;
          })
        );

        callback(alerts);

        // Check for new alerts to trigger notification
        const newAlerts = alerts.filter(a => !a.seenAt);
        if (newAlerts.length > 0) {
          // Trigger in-app notification for newest alert
          useTwintuitionStore.getState().showNotification(newAlerts[0]);
        }
      },
      (error) => {
        console.error('Error in alerts snapshot:', error);
      }
    );

    this.listener = unsubscribe;
    return unsubscribe;
  }

  /**
   * Mark alert as seen
   */
  async markAlertAsSeen(twinPairId: string, alertId: string): Promise<void> {
    try {
      const alertsPath = getAlertsPath(twinPairId);
      await firestoreService.updateDocument(alertsPath, alertId, {
        seenAt: serverTimestamp(),
      });

      console.log('Alert marked as seen:', alertId);
    } catch (error) {
      console.error('Error marking alert as seen:', error);
      throw error;
    }
  }

  /**
   * Delete expired alerts (older than 24 hours)
   */
  async deleteExpiredAlerts(twinPairId: string): Promise<void> {
    try {
      const alertsPath = getAlertsPath(twinPairId);
      const collectionRef = collection(db, alertsPath);

      // Query alerts where expiresAt < now
      const now = Timestamp.now();
      const q = query(
        collectionRef,
        where('expiresAt', '<', now)
      );

      const snapshot = await getDocs(q);

      // Delete each expired alert
      const deletePromises = snapshot.docs.map(doc =>
        deleteDoc(doc.ref)
      );

      await Promise.all(deletePromises);

      console.log(`Deleted ${snapshot.docs.length} expired alerts`);
    } catch (error) {
      console.error('Error deleting expired alerts:', error);
      throw error;
    }
  }

  /**
   * Detect simultaneous alerts for Twincidences
   * Returns pairs of alerts sent within 30 seconds of each other
   */
  async detectSimultaneousAlerts(
    twinPairId: string,
    userId: string,
    twinId: string
  ): Promise<Array<[TwintuitionAlert, TwintuitionAlert]>> {
    try {
      const alertsPath = getAlertsPath(twinPairId);

      // Get recent alerts from both twins (last 24 hours)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentAlerts = await firestoreService.queryCollection<TwintuitionAlertDoc>(
        alertsPath,
        [
          where('sentAt', '>', Timestamp.fromDate(oneDayAgo)),
          orderBy('sentAt', 'desc')
        ]
      );

      // Separate alerts by sender
      const userAlerts = recentAlerts.filter(a => a.senderId === userId);
      const twinAlerts = recentAlerts.filter(a => a.senderId === twinId);

      // Find simultaneous pairs (< 30 seconds apart)
      const simultaneousPairs: Array<[TwintuitionAlert, TwintuitionAlert]> = [];

      for (const userAlert of userAlerts) {
        for (const twinAlert of twinAlerts) {
          const userTime = (userAlert.sentAt as Timestamp).toMillis();
          const twinTime = (twinAlert.sentAt as Timestamp).toMillis();
          const timeDiff = Math.abs(userTime - twinTime);

          if (timeDiff < 30000) { // 30 seconds in milliseconds
            // Decrypt and convert to TwintuitionAlert type
            // (Simplified for brevity, actual implementation would decrypt)
            simultaneousPairs.push([userAlert as any, twinAlert as any]);
          }
        }
      }

      return simultaneousPairs;
    } catch (error) {
      console.error('Error detecting simultaneous alerts:', error);
      return [];
    }
  }

  /**
   * Unsubscribe from listener
   */
  unsubscribe(): void {
    if (this.listener) {
      this.listener();
      this.listener = null;
    }
  }
}

// Export singleton instance
export const twintuitionSyncService = new TwintuitionSyncService();
```

### Update Twintuition Store

Modify `src/state/twintuitionStore.ts`:

```typescript
// Add notification state
showNotification: (alert: TwintuitionAlert) => {
  set({ latestAlert: alert, showNotificationBanner: true });

  // Auto-hide after 10 seconds
  setTimeout(() => {
    set({ showNotificationBanner: false });
  }, 10000);
},

// Add Firebase sync
subscribeToFirestore: (twinPairId: string, userId: string) => {
  const unsubscribe = twintuitionSyncService.subscribeToAlerts(
    twinPairId,
    userId,
    (alerts) => {
      set({ alerts });
    }
  );

  set({ firestoreUnsubscribe: unsubscribe });
},
```

### In-App Notification Banner

Create `src/components/TwintuitionNotification.tsx`:

```typescript
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTwintuitionStore } from '@/state/twintuitionStore';
import { Ionicons } from '@expo/vector-icons';

export function TwintuitionNotification() {
  const { latestAlert, showNotificationBanner, showNotification } = useTwintuitionStore();

  if (!showNotificationBanner || !latestAlert) return null;

  const emotionIcon = getEmotionIcon(latestAlert.emotion);

  return (
    <View className="absolute top-16 left-4 right-4 bg-stellar-blue/90 rounded-lg p-4 shadow-lg">
      <Pressable onPress={() => showNotification(null)}>
        <View className="flex-row items-center">
          <Ionicons name={emotionIcon} size={24} color="#fff" />
          <Text className="ml-3 text-white font-semibold flex-1">
            Your twin is thinking of you
          </Text>
          <Ionicons name="close" size={20} color="#fff" />
        </View>

        {latestAlert.message && (
          <Text className="text-white/80 mt-2">
            {latestAlert.message}
          </Text>
        )}
      </Pressable>
    </View>
  );
}

function getEmotionIcon(emotion?: string): string {
  switch (emotion) {
    case 'joy': return 'happy-outline';
    case 'sadness': return 'sad-outline';
    case 'anger': return 'flame-outline';
    case 'fear': return 'warning-outline';
    default: return 'heart-outline';
  }
}
```

## Dependencies

### Upstream Dependencies
- Story 7.1: Firebase Project Setup and Configuration
- Story 7.2: User Authentication with Firebase
- Story 7.3: Firestore Data Models and Schema
- Epic 3: Twintuition Real-Time System (UI components)

### Downstream Dependencies
- Story 4.5: Automatic Twintuition Sync Detection (for Twincidences)
- Story 7.7: Offline Support and Sync Queue

## Files to Create/Modify

### New Files:
- `src/services/firebase/twintuitionSync.ts` - Alert synchronization service
- `src/components/TwintuitionNotification.tsx` - In-app notification banner

### Modified Files:
- `src/state/twintuitionStore.ts` - Add Firebase sync actions
- `src/screens/TwintuitionScreen.tsx` - Use sync service
- `App.tsx` - Initialize alert listener and cleanup expired alerts

## Testing Strategy

### Unit Tests
- ✅ sendAlert encrypts message if present
- ✅ markAlertAsSeen updates seenAt timestamp
- ✅ deleteExpiredAlerts removes old alerts
- ✅ detectSimultaneousAlerts finds pairs < 30s apart
- ✅ Alert notification triggers on new alert

### Integration Tests
- ✅ Send alert syncs to Firestore < 500ms
- ✅ Twin receives alert in real-time < 500ms
- ✅ In-app notification displays
- ✅ Mark as seen updates Firestore
- ✅ Expired alerts deleted on startup
- ✅ Listener updates twintuitionStore

### E2E Tests
- ✅ Send alert → Twin sees notification banner
- ✅ Mark alert as seen → seenAt timestamp updated
- ✅ Wait 24 hours (mocked) → Alert deleted
- ✅ Both twins send alert within 30s → Detected as simultaneous

### Manual Testing Checklist
- [ ] Send Twintuition alert, verify twin receives < 500ms
- [ ] Verify in-app notification banner displays
- [ ] Mark alert as seen, verify seenAt in Firestore
- [ ] Verify encrypted message in Firestore Console
- [ ] Test expiration cleanup (mock 24-hour passage)
- [ ] Measure delivery latency with network throttling

## Definition of Done

- [ ] All acceptance criteria met and verified
- [ ] Unit tests written and passing
- [ ] Integration tests written and passing
- [ ] E2E tests written and passing
- [ ] Manual testing checklist completed
- [ ] Real-time delivery latency < 500ms
- [ ] Encryption verified
- [ ] Cleanup process tested
- [ ] Code reviewed and approved
- [ ] Documentation updated
- [ ] Sprint status updated to "done"

## Risk & Mitigation

**Risk**: Real-time latency > 500ms on poor networks
- **Mitigation**: Optimistic updates, offline queue, show sending indicator

**Risk**: Excessive alert volume causes Firestore cost spike
- **Mitigation**: Monitor usage, implement rate limiting if needed

---

**Related Documentation**:
- [Epic 7 Tech Spec](/docs/tech-spec-epic-7.md)
- [Firestore Real-Time Listeners](https://firebase.google.com/docs/firestore/query-data/listen)

**Story Owner**: Backend Team
**Last Updated**: 2025-11-18
