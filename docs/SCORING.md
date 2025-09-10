# Twinship Assessment Scoring System Documentation

## Overview

The Twinship assessment scoring system provides comprehensive psychological profiling for twins, measuring various dimensions of twin relationship dynamics, individual personality traits, and relational compatibility. This document outlines the scoring methodology, precision handling, calculation formulas, and edge case management.

## Architecture

### Core Files
- **`src/utils/assessmentScoring.ts`** - Main scoring functions and utilities
- **`src/utils/assessment/scoringAlgorithms.ts`** - Advanced scoring algorithms and reliability calculations
- **`src/utils/pairAnalytics.ts`** - Twin pair comparison and compatibility analysis

### Test Coverage
- **152 tests** covering all scoring functions
- **95%+ code coverage** for core scoring algorithms
- **100% function coverage** for scoringAlgorithms.ts
- Comprehensive edge case testing including null/undefined values, boundary conditions, and mixed data structures

## Scoring Methodology

### 1. Scale Transformation

**Primary Scale: Likert 1-7 to 0-100**
```typescript
transformLikertTo100Scale(value: LikertScale): number
```
- **Input Range**: 1-7 (Likert scale responses)
- **Output Range**: 0-100 (normalized scores)
- **Formula**: `((value - 1) / (7 - 1)) * 100`
- **Precision**: Results rounded to nearest integer

### 2. Reverse Scoring

**Purpose**: Handle negatively-keyed items
```typescript
reverseScoreItem(value: LikertScale): LikertScale
```
- **Formula**: `(maxVal + minVal) - value`
- **Example**: Score of 7 becomes 1, score of 1 becomes 7

### 3. Subscale Calculation

**Weighted Average with Missing Data Handling**
```typescript
calculateSubscaleScore(responses: LikertScale[], reverseItems: boolean[], weights: number[])
```
- **Handles null responses** gracefully with fallback logic
- **Applies reverse scoring** for negatively-keyed items
- **Uses weighted averages** when weights are provided
- **Enforces bounds** (0-100) for all outputs

### 4. Composite Index Calculations

#### Codependency Index (CI)
- **Range**: 0-100
- **Components**: Emotional fusion, identity blurring, separation anxiety, boundary diffusion
- **Interpretation**: Higher scores indicate greater codependency

#### Autonomy & Resilience Index (ARI)  
- **Range**: 0-100
- **Components**: Individual identity, emotional regulation, stress coping, independence
- **Interpretation**: Higher scores indicate greater resilience

#### Transition Risk Score (TRS)
- **Range**: 0-100
- **Components**: Adaptation flexibility, change tolerance, support systems
- **Interpretation**: Higher scores indicate greater vulnerability to life changes

### 5. Reliability Calculations

**Cronbach's Alpha Approximation**
```typescript
// Simplified formula for development reliability
const alpha = Math.max(0.1, (n / (n - 1)) * (1 - (1 / Math.sqrt(n + 1))));
```
- **Minimum reliability**: 0.1 to prevent zero values
- **Scales with item count**: More items = higher reliability
- **Used for**: Test development and quality assurance

## Pair Analytics

### 1. Compatibility Scoring

**Overall Compatibility**: Weighted average of dimension compatibilities
- **Communication Compatibility**: Based on communication style differences
- **Emotional Compatibility**: Based on neuroticism score differences  
- **Independence Compatibility**: Based on autonomy score differences
- **Conflict Resolution Compatibility**: Based on conflict handling differences

**Formula**: `100 - Math.abs(score1 - score2)` for each dimension

### 2. Growth Area Identification

**Shared Growth Areas**: Areas where both twins show challenges
- **Positive traits**: Both score <40 (e.g., communication, boundaries)
- **Negative traits**: Both score >60 (e.g., codependency, neuroticism)
- **Large discrepancies**: >30 point differences between twins

**Individual Growth Areas**: Twin-specific challenges
- **Threshold**: Individual scores <30 on positive traits
- **Categorized by**: Twin1 and Twin2 specific needs

### 3. Risk Assessment

**Automatic Risk Detection**:
- **Severe codependency**: Both twins CI > 70
- **Low resilience**: Both twins ARI < 30  
- **High transition risk**: Both twins TRS > 70
- **Power imbalance**: >40 point difference in power dynamics
- **Communication breakdown**: Both twins communication < 30

## Precision Handling

### 1. Floating-Point Considerations

**Test Assertions**: Use `toBeCloseTo()` instead of exact equality
```typescript
// Correct
expect(result.score).toBeCloseTo(56, 0);

// Incorrect (too precise)
expect(result.score).toBe(56.0000001);
```

### 2. Rounding Standards

- **Subscale scores**: Rounded to nearest integer
- **Percentiles**: Rounded to nearest whole number
- **Compatibility metrics**: Rounded for display, precise for calculations

### 3. Edge Case Handling

**Missing Data**:
- **Null responses**: Excluded from calculations
- **Empty arrays**: Return default values (typically 50)
- **Undefined properties**: Fallback to empty arrays with safe defaults

**Boundary Conditions**:
- **Score ranges**: Enforced 0-100 bounds on all outputs
- **Percentile boundaries**: Proper inclusive/exclusive handling
- **Empty datasets**: Graceful degradation with meaningful defaults

## Data Validation

### 1. Assessment Completeness

**Minimum Completion**: 70% of items required for valid results
```typescript
if (completionRate < 0.7) {
  errors.push({ code: 'INSUFFICIENT_COMPLETION', message: 'Assessment requires at least 70% completion' });
}
```

### 2. Response Pattern Detection

**Suspicious Patterns**:
- **All identical responses**: Flags potential inattentive responding
- **Rapid responses**: Average <1000ms per item indicates rushed completion
- **Extreme response bias**: Excessive use of scale endpoints

### 3. Data Quality Metrics

**Quality Assessment**:
- **Completion Rate**: Percentage of items answered
- **Consistency Score**: Reduces with warning flags
- **Recommendation**: Based on errors and warnings

## Score Interpretation Levels

### Standard Ranges
- **Very Low**: 0-15 (Bottom 16th percentile)
- **Low**: 16-36 (16th-37th percentile)  
- **Moderate**: 37-62 (37th-63rd percentile)
- **High**: 63-83 (63rd-84th percentile)
- **Very High**: 84-100 (Top 16th percentile)

### Twin-Specific Interpretations

**Profile Types**:
- **Highly Enmeshed**: High codependency + Low resilience
- **Balanced Independent**: Low codependency + High resilience
- **Transition-Vulnerable**: High transition risk regardless of other scores
- **Moderately Connected**: Balanced scores with growth potential
- **Complex Dynamic**: Unique patterns requiring personalized analysis

## Migration Considerations

### 1. Scoring Changes Impact

**Recent Fixes**:
- **Test expectations**: Corrected calculation from 55 to 56 expectation
- **Reliability formulas**: Updated Cronbach's alpha calculation
- **Boundary conditions**: Fixed interpretScoreLevel boundaries
- **Edge case handling**: Added comprehensive null/undefined protection

### 2. Data Compatibility

**Stored Results**: No breaking changes to stored assessment data
- **Score ranges**: Remain 0-100 for all metrics
- **Data structures**: Maintained backward compatibility
- **API contracts**: No changes to function signatures

### 3. Recommended Actions

**For Existing Data**:
- **Re-scoring not required**: Current stored results remain valid
- **New assessments**: Automatically use improved algorithms
- **Quality improvements**: Better precision and reliability without data migration

## Testing Strategy

### 1. Comprehensive Coverage

**Test Categories**:
- **Core Functions**: 95%+ statement coverage
- **Edge Cases**: Null, undefined, empty data handling
- **Boundary Conditions**: Score limits, percentile calculations
- **Integration**: End-to-end scoring workflows
- **Performance**: Large dataset efficiency testing

### 2. Test Data Quality

**Mock Data Standards**:
- **Realistic ranges**: Scores within expected distributions  
- **Edge cases**: Deliberate null/undefined scenarios
- **Boundary testing**: Exact threshold values
- **Performance data**: Large datasets for efficiency testing

### 3. Validation Process

**Multi-Level Testing**:
1. **Unit Tests**: Individual function validation
2. **Integration Tests**: Complete scoring pipelines  
3. **Performance Tests**: Large-scale processing
4. **Edge Case Tests**: Error condition handling
5. **Regression Tests**: Prevent scoring formula changes

## Future Enhancements

### 1. Normative Data Integration

**Population Norms**: When available, replace approximations with real normative data
- **Percentile calculations**: Based on representative twin samples
- **Age and demographic adjustments**: Tailored norms by population
- **Reliability estimates**: Empirically-derived Cronbach's alpha values

### 2. Advanced Analytics

**Machine Learning Integration**:
- **Pattern recognition**: Identify complex twin dynamics
- **Predictive modeling**: Relationship outcome predictions
- **Personalized recommendations**: AI-driven intervention suggestions

### 3. Real-Time Processing

**Performance Optimizations**:
- **Streaming calculations**: Process responses as received
- **Caching strategies**: Reduce computational overhead
- **Batch processing**: Efficient large-scale analysis

---

*This documentation reflects the current state of the Twinship assessment scoring system as of September 2025. For technical implementation details, refer to the source code and comprehensive test suite.*