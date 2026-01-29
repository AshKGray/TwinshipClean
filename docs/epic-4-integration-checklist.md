# Epic 4 Integration Checklist

## 🎯 Required Steps to Complete Integration

### 1. Update AppNavigator.tsx

**File**: `/src/navigation/AppNavigator.tsx`

#### A. Add lazy load declaration (after line 154)
```typescript
const InsightsDashboard = lazyScreenWithSkeleton(
  () => import("../screens/twincidences/InsightsDashboard").then(m => ({ default: m.InsightsDashboard })),
  'generic',
  'Loading insights...'
);
```

#### B. Add route type (around line 232 in RootStackParamList)
```typescript
InsightsDashboard: undefined;
```

#### C. Register screen (around line 546, after TwincidencePrivacy)
```typescript
<Stack.Screen name="InsightsDashboard" component={InsightsDashboard} />
```

### 2. Update TwincidencesScreen.tsx

**File**: `/src/screens/twincidences/TwincidencesScreen.tsx`

**Line 134** - Replace the `navigateToAnalytics` function:

```typescript
const navigateToAnalytics = () => {
  navigation.navigate('InsightsDashboard'); // Navigate to insights dashboard
};
```

Remove the Alert.alert call.

### 3. Fix TwincidencePrivacy Import Path

**File**: `/src/navigation/AppNavigator.tsx` (line 151)

Current (incorrect):
```typescript
() => import("../screens/settings/TwincidencePrivacyScreen")
```

Should be:
```typescript
() => import("../screens/twincidences/TwincidencePrivacy")
```

### 4. Add Location Permissions to app.json

**File**: `/app.json`

Add to the `expo` object:
```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "Twinship uses your location to detect synchronicities when you and your twin are nearby. This helps identify meaningful coincidences in your twin connection."
      }
    },
    "android": {
      "permissions": [
        "ACCESS_COARSE_LOCATION",
        "ACCESS_FINE_LOCATION"
      ]
    }
  }
}
```

### 5. Configure Firebase Rules

**Firestore Rules** (`firestore.rules`):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Twincidences Collection
    match /twinPairs/{pairId}/twincidences/{twincidenceId} {
      // Allow read if user is part of the twin pair
      allow read: if request.auth != null &&
                     request.auth.uid in get(/databases/$(database)/documents/twinPairs/$(pairId)).data.keys();

      // Allow write if user is part of the twin pair
      allow write: if request.auth != null &&
                      request.auth.uid in get(/databases/$(database)/documents/twinPairs/$(pairId)).data.keys();
    }
  }
}
```

**Storage Rules** (`storage.rules`):

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Twincidence media
    match /twinPairs/{pairId}/twincidences/{twincidenceId}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
                      request.resource.size < 10 * 1024 * 1024; // 10MB limit
    }
  }
}
```

### 6. Test the Integration

Run through these test scenarios:

#### Manual Creation Test
- [ ] Navigate to Twincidences screen
- [ ] Tap "Create" button
- [ ] Select a category (e.g., ESP)
- [ ] Fill in title and description
- [ ] Add a tag
- [ ] Select date
- [ ] Publish twincidence
- [ ] Verify it appears in timeline

#### Search & Filter Test
- [ ] Tap search icon
- [ ] Enter search text
- [ ] Verify results filter correctly
- [ ] Select different category filters
- [ ] Select different detection type filters
- [ ] Clear all filters

#### Detail View Test
- [ ] Tap on a twincidence card
- [ ] View full details
- [ ] Add an annotation
- [ ] Favorite the twincidence
- [ ] Share the twincidence
- [ ] Go back to timeline

#### Analytics Test
- [ ] Tap the analytics icon in stats card
- [ ] View insights dashboard
- [ ] Check synchronicity score
- [ ] View category breakdown
- [ ] Change time period (week/month/year)
- [ ] Check for pattern insights

#### Location Permissions Test
- [ ] Navigate to Privacy screen
- [ ] Toggle "Location Coincidences" on
- [ ] Accept system permission dialog
- [ ] Verify permission is saved
- [ ] Check location is being tracked (console logs)

### 7. Verify Firebase Integration

#### Create Test Data
```typescript
// In a test script or debug menu
import { twincidenceService } from './src/services/twincidenceService';

await twincidenceService.createTwincidence('your-twin-pair-id', {
  category: TwincidenceCategory.MANUAL_ESP,
  detectionType: 'manual',
  title: 'Test Twincidence',
  description: 'This is a test',
  metadata: { eventDate: new Date().toISOString() },
  tags: ['test'],
  privacyLevel: 'twin_only',
  isSharedWithResearch: false,
  createdBy: 'user-id',
});
```

#### Verify Real-time Sync
- [ ] Open app on two devices with same twin pair
- [ ] Create twincidence on device 1
- [ ] Verify it appears on device 2 automatically
- [ ] Add annotation on device 2
- [ ] Verify it appears on device 1

### 8. Optional: HealthKit Setup (Dev Build Only)

If you want to implement HealthKit integration:

#### A. Install Dependencies
```bash
npm install react-native-health
# OR
expo install expo-apple-healthkit
```

#### B. Add Info.plist Permissions
```xml
<key>NSHealthShareUsageDescription</key>
<string>Twinship needs access to your health data to detect biometric synchronicities with your twin.</string>
<key>NSHealthUpdateUsageDescription</key>
<string>Twinship needs to update health data to track your synchronicities.</string>
```

#### C. Enable HealthKit Capability
- Open `ios/YourApp.xcworkspace` in Xcode
- Select target → Signing & Capabilities
- Click "+ Capability" and add "HealthKit"

#### D. Implement Service Methods
Replace stub methods in `/src/services/healthKitService.ts` with actual implementations using the library documentation.

---

## ✅ Completion Checklist

### Code Changes
- [ ] Updated AppNavigator.tsx (lazy load, route type, screen registration)
- [ ] Fixed TwincidencesScreen analytics navigation
- [ ] Fixed TwincidencePrivacy import path
- [ ] Added location permissions to app.json

### Firebase Configuration
- [ ] Deployed Firestore rules
- [ ] Deployed Storage rules
- [ ] Verified rules in Firebase Console

### Testing
- [ ] Manual creation works
- [ ] Search and filter work
- [ ] Detail view works
- [ ] Analytics dashboard loads
- [ ] Privacy permissions toggle
- [ ] Location tracking works on device
- [ ] Real-time sync verified (if possible)

### Optional (Phase 2)
- [ ] HealthKit implementation (dev build required)
- [ ] PDF export library integration
- [ ] Push notifications setup
- [ ] Background sync worker

---

## 🐛 Troubleshooting

### "InsightsDashboard not found"
- Check that lazy load is added to AppNavigator
- Check that route type is added to RootStackParamList
- Check that screen is registered in Stack.Navigator

### "Cannot read property 'navigate'"
- Check navigation prop is passed correctly
- Check route name matches exactly (case-sensitive)

### Location Not Working
- Check permissions in app.json
- Check system permissions granted on device
- Check console logs for error messages
- Location API only works on physical devices (not simulator)

### Firebase Errors
- Check Firebase rules are deployed
- Check user is authenticated
- Check twinPairId is valid
- Check network connection

### Images Not Uploading
- Check Firebase Storage rules
- Check file size under 10MB
- Check internet connection
- Check storage quota in Firebase Console

---

## 📞 Next Steps After Integration

1. **Test thoroughly** on both iOS and Android
2. **Monitor Firebase usage** (reads/writes, storage)
3. **Gather user feedback** on auto-detection accuracy
4. **Iterate on confidence score algorithms**
5. **Add more pattern detection insights**
6. **Consider implementing push notifications**
7. **Plan for HealthKit integration** (if desired)

---

## 📚 Documentation

Refer to these docs for more details:
- `epic-4-implementation-summary.md` - Complete technical documentation
- `epic-4-quick-reference.md` - Quick reference guide
- Individual story docs in `/docs/stories/` - Detailed story specs

---

**Status**: Ready for Integration
**Estimated Time**: 30-60 minutes
**Difficulty**: Easy (mostly copy-paste)

*Epic 4 - Twincidences System*
*Integration Checklist*
