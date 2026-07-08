# BMAD Quick Fixes - Priority Action Items

## Critical Path to Clean Build (Est. 5-6 hours)

### 1. Backend Message Routes (30 min) - HIGHEST PRIORITY

**File**: `/backend/src/routes/messageRoutes.ts`

**Fix query parameter type safety** (Lines 36-40):
```typescript
// Current (broken):
const { limit, offset, before, after, messageType } = req.query;
const history = await messageService.getMessageHistory({
  twinPairId,
  limit: limit ? parseInt(limit) : undefined,  // Type error
  offset: offset ? parseInt(offset) : undefined,  // Type error
  before: before ? new Date(before) : undefined,  // Type error
  after: after ? new Date(after) : undefined,  // Type error
  messageType: messageType,  // Type error
});

// Fixed:
const { limit, offset, before, after, messageType } = req.query;
const history = await messageService.getMessageHistory({
  twinPairId,
  limit: limit ? parseInt(limit as string) : undefined,
  offset: offset ? parseInt(offset as string) : undefined,
  before: before ? new Date(before as string) : undefined,
  after: after ? new Date(after as string) : undefined,
  messageType: messageType as MessageType | undefined,
});
```

**Add user type guards** (Lines 69, 166, 198):
```typescript
// Current (broken):
const userId = req.user.id;  // req.user possibly undefined

// Fixed:
if (!req.user) {
  return res.status(401).json({ success: false, error: 'Unauthorized' });
}
const userId = req.user.id;
```

### 2. Backend Stripe Service (15 min)

**File**: `/backend/src/services/stripe.service.ts:346`

**Fix API method name**:
```typescript
// Current (broken):
const invoice = await stripe.invoices.retrieveUpcoming({
  customer: customerId,
});

// Fixed (check Stripe SDK version):
const invoice = await stripe.invoices.upcoming({
  customer: customerId,
});
// OR
const invoice = await stripe.invoices.retrieve('upcoming', {
  customer: customerId,
});
```

### 3. Backend Test Configuration (30 min)

**File**: `/backend/jest.config.js` (create or update)

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
  ],
};
```

**Install ts-jest**:
```bash
cd backend
npm install --save-dev ts-jest @types/jest
```

### 4. Frontend Assessment Types (2-3 hours)

**File**: `/src/types/assessment.ts` or `/src/types/assessment/types.ts`

**Add missing exports**:
```typescript
export interface AssessmentItemBank {
  // Add definition
}

export interface TwinSubscales {
  // Add definition
}

export interface BigFiveTraits {
  // Add definition
}
```

**File**: `/src/utils/assessmentScoring.ts`

Fix score property access (~20 locations):
```typescript
// Current (broken):
result.score  // Property doesn't exist on union type

// Fixed:
'score' in result ? result.score : result.rawScore
// OR restructure types to always have .score
```

### 5. ESLint Migration (1 hour)

**File**: `/eslint.config.js` (create new)

```javascript
import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';

export default [
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      'import/first': 'off',
      // Add other rules
    },
  },
  {
    ignores: [
      'dist/*',
      'rootStore.example.ts',
      'nativewind-env.d.ts',
    ],
  },
];
```

**Update package.json**:
```bash
npm install --save-dev @eslint/js @typescript-eslint/eslint-plugin @typescript-eslint/parser
```

---

## Quick Wins (Under 1 hour total)

### 1. Backend Test Type Safety (15 min)

**File**: `/backend/src/tests/typingIndicator.test.ts:63`
```typescript
// Current:
.catch((error) => {  // implicit any

// Fixed:
.catch((error: Error) => {
```

**File**: `/backend/src/tests/stripe.service.test.ts:97`
```typescript
// Add proper types to mock objects
const mockSubscription: Partial<Stripe.Subscription> = {
  id: 'sub_123',
  current_period_start: Math.floor(Date.now() / 1000),  // Unix timestamp
  // ... other fields
};
```

### 2. Performance Profiler React 19 Fix (10 min)

**File**: `/src/utils/performanceProfiler.tsx:99`

React 19 changed Profiler callback signature. Update:
```typescript
// Current (broken):
onRender={(id, phase, actualDuration, baseDuration, startTime, commitTime, interactions) => {

// Fixed (React 19):
onRender={(id, phase, actualDuration, baseDuration, startTime, commitTime) => {
  // Remove 'interactions' parameter (no longer provided)
```

### 3. PDF Export Fix (5 min)

**File**: `/src/utils/pdfExportService.ts:65`
```typescript
// Current:
import * as FileSystem from 'expo-file-system';
const path = FileSystem.documentDirectory + filename;  // Property doesn't exist

// Fixed:
import { documentDirectory } from 'expo-file-system';
const path = documentDirectory + filename;
```

---

## Validation Commands

Run these after each fix:

```bash
# Backend fixes
cd backend
npm run typecheck          # Should reduce errors
npm test                   # Should pass after Jest config

# Frontend fixes
npm run typecheck          # Should reduce errors
npm test                   # Should still pass

# Full validation
npm run bmad:build         # After ALL fixes complete
```

---

## Progress Tracker

- [ ] messageRoutes.ts query params (8 errors)
- [ ] stripe.service.ts API method (1 error)
- [ ] Backend Jest configuration
- [ ] performanceProfiler.tsx React 19 (1 error)
- [ ] pdfExportService.ts export (1 error)
- [ ] Backend test any types (2 errors)
- [ ] Assessment types infrastructure (3 exports)
- [ ] Assessment scoring fixes (~180 errors)
- [ ] ESLint migration
- [ ] Full typecheck pass (0 errors)

**Current**: 216 errors → **Target**: 0 errors

---

**Document Created**: 2025-10-07
**Estimated Total Time**: 5-6 hours (including testing)
**Priority**: Complete items 1-3 before next commit
