# Twincidences Feature - Complete Specification

## Overview

**Twincidences** (formerly "Stories") is a privacy-first twin synchronicity detection and logging system that captures meaningful moments between twins while respecting individual consent preferences.

## Feature Replacement

- ❌ **REMOVED**: Stories feature (collaborative storytelling)
- ✅ **REPLACED WITH**: Twincidences (twin moments/synchronicities)

## Core Concept

Twincidences logs special moments when twins experience synchronicity, including:
- **Manual logs**: User-created entries for special twin moments
- **Detected events**: Automatically captured synchronicities (e.g., simultaneous twintuition button presses)
- **Future detectors**: Heart rate sync, sleep patterns, location coincidences, etc.

## Privacy & Consent Architecture

### Three-Tier Consent System

Every detectable event type requires explicit user consent with three options:

#### A. Anonymous Research Only
- Data is collected locally and aggregated anonymously
- Never linked to user identity
- Used only for research insights
- No twin-to-twin sharing

#### B. Share with Twin
- Event creates a shared Twincidence alert
- Both twins see the moment in their log
- **Requires dual consent** - both twins must choose "B"
- If one twin chooses "C", no sharing occurs

#### C. No Collection
- Event is not detected, stored, or shared
- Complete opt-out for this event type
- Overrides any other consent setting

### Dual-Consent Rules

| Twin 1 | Twin 2 | Result |
|--------|--------|--------|
| B (Share) | B (Share) | ✅ Shared alert created |
| B (Share) | A (Research) | 📊 Research data only, no alert |
| B (Share) | C (No) | ❌ Nothing collected or shared |
| A (Research) | A (Research) | 📊 Anonymous research data |
| A (Research) | C (No) | ❌ Nothing collected |
| C (No) | C (No) | ❌ Nothing collected |

### First-Time Consent Flow

When a user first opens Twincidences:
1. **Welcome Screen**: Explains what Twincidences are
2. **Consent Matrix**: Shows all detectable event types
3. **Per-Event Choice**: User selects A, B, or C for each event type
4. **Plain Language**: Clear explanations for each event type
5. **Save Preferences**: Choices stored and honored system-wide

### Consent Management

Users can change their preferences anytime:
- **Settings > Twincidences > Event Preferences**
- Pause all detection temporarily
- Revoke consent for specific event types
- Re-enable previously disabled events
- View consent history (audit trail)

## Event Types

### Phase 1: Core Events (Minimal HealthKit)

#### 1. Manual Entry
- **Type**: `manual`
- **Detection**: User-created
- **HealthKit Required**: No
- **Description**: Twins manually log special moments
- **Fields**: Title, description, photos (optional)

#### 2. Simultaneous Twintuition
- **Type**: `simultaneous_twintuition`
- **Detection**: On-device, server-confirmed
- **HealthKit Required**: No
- **Description**: Both twins press Twintuition button within threshold
- **Threshold**: Default 3 seconds
- **Data Captured**: Press times, time difference

### Phase 2: Health Events (HealthKit Integration)

#### 3. Heart Rate Synchronization
- **Type**: `hr_sync`
- **Detection**: On-device analysis
- **HealthKit Required**: Yes (HR read-only)
- **Description**: Heart rates align within threshold
- **Threshold**: ±5 BPM for 5+ minutes

#### 4. Sleep Pattern Sync
- **Type**: `sleep_sync`
- **Detection**: On-device analysis
- **HealthKit Required**: Yes (sleep read-only)
- **Description**: Similar sleep/wake times
- **Threshold**: Within 30 minutes

#### 5. Activity Synchronization
- **Type**: `activity_sync`
- **Detection**: On-device analysis
- **HealthKit Required**: Yes (activity read-only)
- **Description**: Similar step counts or workout timing
- **Threshold**: Configurable

### Phase 3: Advanced Events (Future)

#### 6. Location Coincidence
- **Type**: `location_sync`
- **Requires**: Location permission
- **Description**: Twins in same place unexpectedly

#### 7. Media Synchronization
- **Type**: `media_sync`
- **Requires**: Media library permission
- **Description**: Listening to same song, watching same show

## Database Schema

### Twincidence Table
```typescript
interface Twincidence {
  id: string;
  twinPairId: string;
  createdBy?: string; // null for auto-detected

  // Content
  title: string;
  description: string;
  photos?: string[]; // JSON array

  // Event details
  eventType: string; // manual, simultaneous_twintuition, etc.
  detectionMethod?: string; // on_device, server_side, user_reported

  // Timing (for simultaneous events)
  user1EventTime?: DateTime;
  user2EventTime?: DateTime;
  timeDifference?: number; // milliseconds

  // Event-specific data (JSON)
  eventData?: object;

  // Consent & sharing
  sharedWithTwin: boolean;
  user1Consented: boolean;
  user2Consented: boolean;

  // Research
  includedInResearch: boolean;
  anonymizedData?: object;

  // Metadata
  isSpecial: boolean;
  severity?: 'low' | 'medium' | 'high';

  // Timestamps
  createdAt: DateTime;
  updatedAt: DateTime;
  deletedAt?: DateTime; // soft delete
}
```

### TwincidenceConsent Table
```typescript
interface TwincidenceConsent {
  id: string;
  userId: string;
  eventType: string;

  // Consent level
  consentLevel: 'A' | 'B' | 'C';
  // A = anonymous_research_only
  // B = share_with_twin
  // C = no_collection

  // Audit
  consentedAt: DateTime;
  updatedAt: DateTime;
  revokedAt?: DateTime;
  previousConsent?: string;
}
```

### EventTypeCatalog Table
```typescript
interface EventTypeCatalog {
  id: string;
  eventType: string;

  // Display
  displayName: string;
  description: string;
  icon?: string;
  category: string; // twintuition, health, activity, etc.

  // Configuration
  detectionEnabled: boolean;
  requiresHealthKit: boolean;
  requiresLocation: boolean;
  thresholds?: object; // JSON config

  // Research
  researchEnabled: boolean;
  minimumDataPoints: number;

  // Metadata
  isActive: boolean;
  sortOrder: number;

  createdAt: DateTime;
  updatedAt: DateTime;
}
```

## API Endpoints

### Consent Management
- `GET /api/twincidences/consent/:userId` - Get all consent preferences
- `POST /api/twincidences/consent` - Set consent for event type
- `PUT /api/twincidences/consent/:eventType` - Update consent
- `DELETE /api/twincidences/consent/:eventType` - Revoke consent

### Event Type Catalog
- `GET /api/twincidences/event-types` - Get all available event types
- `GET /api/twincidences/event-types/:eventType` - Get specific event type config

### Twincidences
- `POST /api/twincidences/create` - Create manual twincidence
- `GET /api/twincidences/:twinPairId` - Get all twincidences for twin pair
- `GET /api/twincidences/:id` - Get specific twincidence
- `PUT /api/twincidences/:id` - Update twincidence
- `DELETE /api/twincidences/:id` - Delete (soft delete) twincidence

### Detection Events
- `POST /api/twincidences/detect/twintuition` - Record twintuition button press
- `POST /api/twincidences/detect/check-simultaneous` - Check for simultaneous event

### Data Export
- `GET /api/twincidences/export/:userId` - Export all user's twincidences as JSON
- `DELETE /api/twincidences/delete-all/:userId` - Delete all user's twincidences

## UI Components

### 1. Twincidences Screen (Main)
- **Header**: "Twincidences" title
- **Timeline View**: Chronological list of moments
- **Filter Options**: By event type, date range
- **Add Button** (+): Create manual twincidence
- **Special Highlights**: Starred/special moments prominently displayed

### 2. Consent Matrix Screen
- **Event Type Cards**: One per detectable event
- **Three-Option Toggle**: A, B, C for each event
- **Explanations**: Plain language for each choice
- **Visual Indicators**: Icons showing current consent state
- **Save Button**: Persist preferences

### 3. Manual Entry Screen
- **Title Input**: Short title for the moment
- **Description**: Detailed description
- **Photo Upload**: Optional photos
- **Mark as Special**: Toggle for important moments
- **Save Button**: Create twincidence

### 4. Twincidence Detail Screen
- **Header**: Event type badge
- **Content**: Title, description, photos
- **Timing**: If simultaneous, show both press times and difference
- **Metadata**: Creation date, who logged it
- **Actions**: Edit (if manual), Delete, Share externally

### 5. Settings Integration
- **Twincidences Preferences**
  - Event type consent matrix
  - Pause all detection toggle
  - Notification preferences
  - Export data button
  - Delete all data button

## Detection Logic

### Simultaneous Twintuition Flow

```
User 1 presses Twintuition button
  ↓
Record timestamp locally
  ↓
Send to server: { userId, timestamp, twinPairId }
  ↓
Server checks if twin pressed within threshold (3s)
  ↓
If YES and both consented to "B":
  ↓
  Create Twincidence with:
  - user1EventTime
  - user2EventTime
  - timeDifference
  - eventType: simultaneous_twintuition
  ↓
  Send push notification to both twins
  ↓
  Display in Twincidences log
  ↓
If consent mismatch:
  ↓
  Store only research data (if A) or nothing (if C)
```

### On-Device Detection (Future)

```
Background detector runs (respecting consent)
  ↓
Compute locally (privacy-first)
  ↓
If threshold met:
  ↓
  Check consent level
  ↓
  If B (share) and twin also B:
    ↓
    Send minimal metadata to server
    ↓
    Create shared Twincidence
  ↓
  If A (research):
    ↓
    Upload anonymized aggregate only
  ↓
  If C (no collection):
    ↓
    Discard all data
```

## Privacy Guarantees

1. **Default Off**: All detection disabled until explicit consent
2. **On-Device First**: Computation happens locally when possible
3. **Minimal Sync**: Only necessary metadata synced for shared alerts
4. **No Ads**: No advertising, no data sale
5. **User Control**: Pause All, Delete All, Export JSON anytime
6. **Dual Consent**: Sharing requires both twins' agreement
7. **Revocable**: Consent can be changed anytime
8. **Transparent**: Clear explanations for each event type
9. **HealthKit Least Privilege**: Read-only, minimal scope
10. **Audit Trail**: Consent changes are logged

## Implementation Phases

### Phase 1: Foundation (Current Sprint)
- ✅ Database schema (Twincidence, TwincidenceConsent, EventTypeCatalog)
- ⏳ Consent Matrix UI
- ⏳ Manual entry functionality
- ⏳ Basic timeline view
- ⏳ Simultaneous twintuition detector

### Phase 2: Notifications & Sync
- Push notification pipeline
- Real-time sync of shared twincidences
- Dual consent validation
- Export/Delete functionality

### Phase 3: Advanced Detection
- HealthKit integration (HR, sleep, activity)
- On-device processing
- Research data aggregation
- Location-based events (optional)

### Phase 4: Polish & Scale
- Enhanced UI/UX
- Performance optimization
- Analytics dashboard
- Multi-language support

## File Structure

```
backend/
├── prisma/
│   └── schema.prisma (✅ Updated with Twincidence models)
├── src/
│   ├── routes/
│   │   ├── twincidences.routes.ts (TODO)
│   │   ├── consent.routes.ts (TODO)
│   │   └── event-types.routes.ts (TODO)
│   ├── services/
│   │   ├── twincidences.service.ts (TODO)
│   │   ├── consent.service.ts (TODO)
│   │   ├── detection.service.ts (TODO)
│   │   └── twintuition-detector.service.ts (TODO)
│   └── utils/
│       └── dual-consent-checker.ts (TODO)

frontend/
├── src/
│   ├── screens/
│   │   ├── Twincidences/
│   │   │   ├── TwincidencesScreen.tsx (TODO - rename from Stories)
│   │   │   ├── ConsentMatrixScreen.tsx (TODO)
│   │   │   ├── ManualEntryScreen.tsx (TODO)
│   │   │   └── TwincidenceDetailScreen.tsx (TODO)
│   ├── components/
│   │   ├── twincidences/
│   │   │   ├── TwincidenceCard.tsx (TODO)
│   │   │   ├── ConsentToggle.tsx (TODO)
│   │   │   └── EventTypeBadge.tsx (TODO)
│   ├── services/
│   │   ├── twincidencesService.ts (TODO)
│   │   ├── consentService.ts (TODO)
│   │   └── twintuitionService.ts (TODO)
│   └── state/
│       ├── twincidencesStore.ts (TODO - rename from storiesStore)
│       └── consentStore.ts (TODO)
```

## Testing Checklist

### Manual Testing
- [ ] Create manual twincidence
- [ ] Add photos to twincidence
- [ ] Mark twincidence as special
- [ ] Delete twincidence
- [ ] Edit twincidence
- [ ] Filter by event type
- [ ] View timeline

### Consent Testing
- [ ] Set consent to A (research only)
- [ ] Set consent to B (share with twin)
- [ ] Set consent to C (no collection)
- [ ] Change consent preference
- [ ] Pause all detection
- [ ] Resume detection
- [ ] Export consent history

### Dual Consent Testing
- [ ] Both twins choose B → shared alert created
- [ ] One B, one A → only research data
- [ ] One B, one C → nothing collected
- [ ] Both A → anonymous research only
- [ ] Both C → complete opt-out

### Twintuition Detection Testing
- [ ] Both twins press within 3s → twincidence created
- [ ] Both twins press >3s apart → no twincidence
- [ ] One twin presses → nothing happens
- [ ] Consent mismatch → follows rules above

### Data Management Testing
- [ ] Export all data as JSON
- [ ] Delete single twincidence
- [ ] Delete all twincidences
- [ ] Verify soft delete (not permanent)

## Next Steps

1. **Update existing "Stories" references** in frontend to "Twincidences"
2. **Run database migration** to create new tables
3. **Implement consent API** endpoints
4. **Build Consent Matrix UI** as first-time experience
5. **Implement manual entry** screen
6. **Build twintuition detector** logic
7. **Test dual consent** validation thoroughly

---

**Note**: This feature prioritizes user privacy and consent above all else. Every decision should default to "no data collection" unless the user explicitly opts in.
