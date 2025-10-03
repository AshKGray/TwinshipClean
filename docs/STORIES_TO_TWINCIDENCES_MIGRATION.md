# Stories → Twincidences Migration Complete

## Summary of Changes

The "Stories" feature has been completely removed and replaced with "**Twincidences**" - a privacy-first twin synchronicity detection and logging system.

## What Changed

### ❌ Removed: Stories Feature
- **Old Purpose**: Collaborative storytelling platform
- **Old Data**: User-created stories with photos
- **Why Removed**: Not aligned with core twin connection tracking

### ✅ Replaced With: Twincidences Feature
- **New Purpose**: Log special twin moments and synchronicities
- **Key Features**:
  - Manual entry for special twin moments
  - Automatic detection of simultaneous events (e.g., both twins pressing Twintuition button)
  - Privacy-first with granular consent controls
  - Per-event-type consent (A/B/C system)
  - Dual-consent requirement for sharing
  - Future: HealthKit integration for HR sync, sleep patterns, etc.

## Database Changes

### Removed Tables
- ❌ `stories` table

### New Tables
- ✅ `twincidences` - Logs twin moments/synchronicities
- ✅ `twincidence_consents` - Per-event-type consent preferences
- ✅ `event_type_catalog` - Configurable event types and thresholds

### Migration Applied
- Migration: `20251002185839_replace_stories_with_twincidences`
- Status: ✅ Applied successfully
- Database: `/backend/prisma/dev.db`

## Consent System Architecture

### Three Consent Levels

#### A - Anonymous Research Only
- Data collected locally, aggregated anonymously
- Never linked to identity
- No twin-to-twin sharing
- Used for research insights only

#### B - Share with Twin
- Creates shared Twincidence alerts
- Both twins see the moment
- **Requires dual consent** (both must choose B)
- One twin choosing C blocks all sharing

#### C - No Collection
- Event not detected, stored, or shared
- Complete opt-out
- Overrides any other consent setting

### Dual-Consent Rules

| Twin 1 | Twin 2 | Result |
|--------|--------|--------|
| B | B | ✅ Shared alert created |
| B | A | 📊 Research data only |
| B | C | ❌ Nothing collected |
| A | A | 📊 Anonymous research |
| A | C | ❌ Nothing collected |
| C | C | ❌ Nothing collected |

## Feature Capabilities

### Phase 1: Core (Current)
1. **Manual Entry**
   - Users can manually log special twin moments
   - Add title, description, photos
   - Mark as special/important

2. **Simultaneous Twintuition**
   - Detects when both twins press Twintuition button within 3 seconds
   - Records exact press times and time difference
   - Auto-creates Twincidence if both consented

3. **Consent Management**
   - First-time consent flow when opening Twincidences
   - Per-event-type preferences
   - Change anytime in Settings
   - Pause all detection temporarily

### Phase 2: Advanced Detection (Future)
- Heart rate synchronization (HealthKit)
- Sleep pattern matching (HealthKit)
- Activity synchronization (HealthKit)
- Location coincidences (optional)
- Media synchronization (optional)

## Privacy Guarantees

1. **Default Off** - All detection disabled until explicit consent
2. **On-Device First** - Computation happens locally when possible
3. **Minimal Sync** - Only necessary metadata synced for shared alerts
4. **No Ads** - No advertising, no data sale
5. **User Control** - Pause All, Delete All, Export JSON anytime
6. **Dual Consent** - Sharing requires both twins' agreement
7. **Revocable** - Consent can be changed anytime
8. **Transparent** - Clear explanations for each event type
9. **HealthKit Least Privilege** - Read-only, minimal scope
10. **Audit Trail** - Consent changes are logged

## API Endpoints

### Twincidences
- `POST /api/twincidences/create` - Create manual twincidence
- `GET /api/twincidences/:twinPairId` - Get all twincidences
- `PUT /api/twincidences/:id` - Update twincidence
- `DELETE /api/twincidences/:id` - Delete twincidence

### Detection
- `POST /api/twincidences/detect/twintuition` - Record button press
- `POST /api/twincidences/detect/check-simultaneous` - Check for simultaneous event

### Consent
- `GET /api/twincidences/consent/:userId` - Get all consent preferences
- `POST /api/twincidences/consent` - Set consent for event type
- `PUT /api/twincidences/consent/:eventType` - Update consent
- `DELETE /api/twincidences/consent/:eventType` - Revoke consent

### Event Types
- `GET /api/twincidences/event-types` - Get all event types
- `GET /api/twincidences/event-types/:eventType` - Get specific config

### Data Management
- `GET /api/twincidences/export/:userId` - Export all data as JSON
- `DELETE /api/twincidences/delete-all/:userId` - Delete all user data

## Frontend Changes Needed

### Rename/Update Files
1. **Screen Names**
   - ❌ `StoriesScreen.tsx` → ✅ `TwincidencesScreen.tsx`
   - Update navigation route name
   - Update tab navigator reference

2. **Store Files**
   - ❌ `storiesStore.ts` → ✅ `twincidencesStore.ts`
   - Add `consentStore.ts`

3. **Component Directories**
   - ❌ `src/components/stories/` → ✅ `src/components/twincidences/`

4. **Service Files**
   - ❌ `storiesService.ts` → ✅ `twincidencesService.ts`
   - Add `consentService.ts`
   - Add `twintuitionService.ts`

### New Components to Create
1. **ConsentMatrixScreen.tsx** - First-time consent flow
2. **ConsentToggle.tsx** - A/B/C toggle component
3. **TwincidenceCard.tsx** - Display individual moments
4. **ManualEntryScreen.tsx** - Create manual twincidence
5. **TwincidenceDetailScreen.tsx** - View full details

### Updated Navigation
```typescript
// Old
<Screen name="Stories" component={StoriesScreen} />

// New
<Screen name="Twincidences" component={TwincidencesScreen} />
```

## Documentation Updated

✅ Files Updated:
1. `/backend/prisma/schema.prisma` - New data models
2. `/docs/TWINCIDENCES_FEATURE.md` - Complete feature spec
3. `/docs/backend-implementation-plan.md` - Updated API routes
4. `/docs/BACKEND_SETUP_COMPLETE.md` - Quick reference
5. `/CLAUDE.md` - Project overview updated
6. `/docs/STORIES_TO_TWINCIDENCES_MIGRATION.md` - This file

## Implementation Checklist

### Backend (In Progress)
- [x] Update Prisma schema
- [x] Run database migration
- [x] Update documentation
- [ ] Implement Twincidences service
- [ ] Implement Consent service
- [ ] Implement Detection service
- [ ] Create API routes
- [ ] Add to server.ts

### Frontend (Not Started)
- [ ] Rename Stories files to Twincidences
- [ ] Create ConsentMatrixScreen
- [ ] Create Consent management UI
- [ ] Implement manual entry screen
- [ ] Update navigation
- [ ] Create Twincidence components
- [ ] Implement twintuition detector
- [ ] Update stores

### Testing (Not Started)
- [ ] Test consent flow
- [ ] Test dual-consent validation
- [ ] Test simultaneous detection
- [ ] Test manual entry
- [ ] Test data export
- [ ] Test pause/delete functionality

## Next Steps

### Immediate
1. Implement backend services for Twincidences
2. Create API routes
3. Test API endpoints

### This Week
1. Update frontend files (rename Stories → Twincidences)
2. Create Consent Matrix UI
3. Implement manual entry screen
4. Build twintuition detector

### Future
1. Add HealthKit integration
2. Implement advanced detectors
3. Build research data pipeline
4. Add location-based events

## Key Differences from Stories

| Aspect | Stories (Old) | Twincidences (New) |
|--------|--------------|-------------------|
| **Purpose** | Storytelling | Synchronicity detection |
| **Creation** | Manual only | Manual + Auto-detected |
| **Privacy** | Basic | Granular consent (A/B/C) |
| **Sharing** | Always shared | Dual-consent required |
| **Data Use** | App only | Research optional |
| **Detection** | None | Real-time event detection |
| **HealthKit** | Not used | Optional integration |
| **Consent** | Implicit | Explicit per event type |

## Important Notes

1. **Default Behavior**: All detection is OFF until user explicitly opts in
2. **Consent Required**: Both twins must consent to "B" for sharing
3. **Privacy First**: On-device processing when possible
4. **User Control**: Can pause, delete, or export anytime
5. **No Data Sale**: No ads, no selling of data
6. **Transparent**: Clear explanations for each event type
7. **Modular**: Easy to add new event detectors in future

## Migration Impact

### Users
- No existing data to migrate (Stories feature wasn't in production)
- New users will see Twincidences instead of Stories
- Consent flow required on first use

### Development
- Clean slate - no legacy data concerns
- Modular architecture for future detectors
- Privacy-first design from the start

### Research
- Opt-in anonymous data collection
- Dual-consent for sharing between twins
- Aggregated insights without personal identification

---

**Status**: Database migration complete ✅
**Next**: Implement backend services and API routes
**Documentation**: Complete and up-to-date ✅
