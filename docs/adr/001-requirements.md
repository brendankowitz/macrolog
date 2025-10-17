# ADR 001: MacroLog Requirements and Architecture

**Status:** Proposed
**Date:** 2025-10-16
**Decision Makers:** Product Team
**Related:** Initial project scope

## Context

We are building MacroLog, a React Native iOS application that simplifies macro tracking by combining AI-powered food photo analysis with Apple Health integration. The goal is to create a frictionless experience where users can photograph their meals, receive instant nutritional analysis with health ratings, and seamlessly sync data with Apple Health.

### Current State
- Web-based prototype exists (phototype/food-tracker-v2.jsx) demonstrating core UI/UX patterns
- Basic health scoring implemented (0-100 scale with ratings: Nutritious/Good/Fair/Limited)
- 7-day progress tracking UI
- Daily goal tracking and visualization

### Required Enhancements
Based on user feedback, the following features need to be added:
1. **7-Day Progress Checks**: Enhanced goal achievement tracking to see if daily targets are met
2. **Historical Navigation**: Ability to scroll through meal history across different dates
3. **Enhanced Health Rating**: Oura Ring-style comprehensive health scoring with multiple dimensions

## Requirements

### 1. Functional Requirements

#### 1.1 Core Features

**F1.1 - Photo Capture & Analysis**
- Users can capture photos of meals using device camera
- Photos are analyzed using OpenAI Vision API for food identification
- AI returns food items with quantities, units, and macro breakdown (calories, protein, carbs, fat)
- Analysis requires active internet connection (online-only mode)
- User can review and edit AI-identified items before logging

**F1.2 - Apple Health Integration**
- **Write**: Log nutrition data (calories, protein, carbs, fat) to Apple Health
- **Read**: Import existing nutrition data from Apple Health (if needed for historical context)
- Request appropriate HealthKit permissions on first launch
- Sync nutrition data immediately upon meal confirmation

**F1.3 - Enhanced Health Rating System**
- Each food item receives a health score (0-100) based on multiple factors:
  - **Nutrient Density** (33%): Vitamins, minerals, fiber content
  - **Processing Level** (33%): Whole foods vs processed/packaged foods
  - **Goal Alignment** (34%): How well item fits user's daily macro/calorie goals
- Meal-level health score calculated as weighted average of all items
- Daily health score calculated as average of all meals
- Visual indicators:
  - 90-100: "Nutritious" (green, 🌟)
  - 70-89: "Good" (blue, ✅)
  - 50-69: "Fair" (yellow, 👍)
  - 0-49: "Limited" (orange, ⚠️)
- **Contextual Encouragement** (Oura-style): AI generates personalized, balanced feedback for each item
  - Highlights positive nutritional aspects
  - Gently notes areas for improvement
  - Encouraging and non-judgmental tone
  - Example: "Your protein shake is excellent for muscle recovery with 25g protein, though it's highly processed. Consider pairing with whole foods for added nutrients."
  - Example: "Grilled chicken is a lean protein powerhouse! Great choice for meeting your goals."
  - Example: "This pizza provides energy but is high in processed carbs and sodium. Balance it with vegetables or save room for a nutrient-dense meal later."

**F1.4 - History & Navigation**
- Users can navigate through historical meal data by date
- Date picker with previous/next day navigation
- View all meals logged on a specific date
- Scroll back through unlimited historical data
- Display meal photos, timestamps, nutrition totals, and health scores

**F1.5 - 7-Day Progress Tracking**
- Dashboard showing last 7 days of tracking
- Daily goal achievement indicators:
  - ✅ Goal met (within 90-110% of target calories)
  - 📊 Logged but goal not met
  - No indicator for days with no data
- Visual progress bars for calories vs goals
- Per-day breakdown of meals, calories, macros, and health rating
- Click/tap any day to view detailed meal history

**F1.6 - Daily Goal Management**
- Users set custom daily targets:
  - Total calories
  - Protein (grams)
  - Carbohydrates (grams)
  - Fat (grams)
- Goals persist across sessions
- Visual comparison of actual vs goal in all views

**F1.7 - Streak Tracking & Achievements**
- Track consecutive days of meal logging (streak counter)
- A "day" counts toward streak if user logs at least one meal
- Streak resets to 0 if a day is missed (no meals logged)
- Display current streak prominently on Home and Progress screens
- Achievement milestones with badges/celebrations:
  - 🔥 **7 Days**: "Week Warrior" - One full week of consistency
  - ⭐ **21 Days**: "Habit Builder" - Three weeks of tracking
  - 💪 **35 Days**: "Streak Master" - Five weeks strong
  - 🏆 **50 Days**: "Dedication" - 50 days of commitment
  - 💎 **100 Days**: "Century Club" - 100 days milestone
  - 👑 **365 Days**: "Year Champion" - Full year of tracking
- Achievement unlocks trigger celebration animations/confetti
- View all achievements (locked/unlocked) in Settings or dedicated screen
- Personal best streak tracking (highest streak ever achieved)

#### 1.2 User Stories

**US1: Quick Meal Logging**
- As a user, I want to take a photo of my meal and have it automatically analyzed so I can quickly log my nutrition without manual entry.
- Acceptance: Photo → AI analysis → Review → Confirm → Logged to Apple Health (< 30 seconds)

**US2: Health-Conscious Eating**
- As a user, I want to see a health rating for each food item and meal so I can make better nutritional choices.
- Acceptance: Each item shows health score with reasoning; meal shows aggregate score

**US3: Progress Monitoring**
- As a user, I want to see my last 7 days of progress with goal indicators so I can track my consistency and identify patterns.
- Acceptance: Visual 7-day view with goal achievement markers, clickable to see details

**US4: Historical Review**
- As a user, I want to scroll back through my meal history to review what I ate on specific dates.
- Acceptance: Date navigation (prev/next), view any historical date, see all meals and photos

**US5: Goal Setting & Tracking**
- As a user, I want to set and adjust my daily nutrition goals so the app can provide relevant feedback.
- Acceptance: Editable goals in settings, reflected in all progress views

**US6: Streak Motivation**
- As a user, I want to see my logging streak and earn achievements so I stay motivated to track consistently.
- Acceptance: Current streak visible on home screen; celebration when milestones reached; view all achievements

### 2. Non-Functional Requirements

#### 2.1 Platform & Technology

**NFR1: Platform**
- iOS only (initial version)
- React Native with Expo
- Built using Expo EAS Build for native compilation
- Minimum iOS version: 14.0+

**NFR2: Technology Stack**
- **Framework**: React Native (latest stable)
- **Build System**: Expo SDK 51+ with EAS Build
- **AI Analysis**: OpenAI Vision API (gpt-4-vision or gpt-4o)
- **Health Integration**: expo-health-connect or react-native-health (HealthKit)
- **Local Storage**: AsyncStorage for app data (API keys, goals, settings)
- **Photo Storage**: Expo FileSystem / ImagePicker for local photo storage
- **Navigation**: React Navigation (if multi-screen, or use modals/tabs)
- **UI Components**: React Native core components with custom styling

#### 2.2 Performance

**NFR3: Response Time**
- Photo analysis: < 10 seconds (dependent on OpenAI API)
- Local data operations: < 500ms
- Apple Health sync: < 2 seconds

**NFR4: Reliability**
- App must handle API failures gracefully (error messages, retry options)
- Data must not be lost if sync fails (queue for retry)
- Offline photo capture allowed, but analysis requires connectivity

#### 2.3 Security & Privacy

**NFR5: Data Privacy**
- API keys stored securely in local device storage
- No user data sent to third-party servers except OpenAI for analysis
- Meal photos stored locally on device only
- Nutrition data written to Apple Health (user controls sharing)
- Clear privacy policy regarding data usage

**NFR6: API Key Management**
- Users provide their own OpenAI API key
- Keys stored in AsyncStorage (encrypted if possible)
- Show/hide toggle for key entry
- Validation that key works before enabling analysis

#### 2.4 Usability

**NFR7: User Experience**
- Intuitive tab navigation (Home, Progress, Settings)
- Clear visual feedback for all actions
- Loading states during analysis
- Success confirmation after logging
- Responsive to different iPhone screen sizes

**NFR8: Accessibility**
- Support for iOS VoiceOver
- Adequate touch target sizes (44x44 minimum)
- Sufficient color contrast ratios
- Readable font sizes

### 3. Data Architecture

#### 3.1 Local Data Storage (AsyncStorage)

**User Settings**
```json
{
  "openai_api_key": "sk-...",
  "daily_goals": {
    "calories": 2000,
    "protein": 150,
    "carbs": 200,
    "fat": 65
  },
  "streak": {
    "currentStreak": 12,
    "longestStreak": 28,
    "lastLoggedDate": "2025-10-16",
    "achievements": [
      {
        "id": "week_warrior",
        "name": "Week Warrior",
        "description": "7 days of consistency",
        "threshold": 7,
        "unlockedDate": "2025-10-10",
        "unlocked": true
      },
      {
        "id": "habit_builder",
        "name": "Habit Builder",
        "threshold": 21,
        "unlocked": false
      }
    ]
  }
}
```

**Logged Meals**
```json
{
  "meals": [
    {
      "id": "uuid",
      "timestamp": "2025-10-16T12:30:00Z",
      "imageUri": "file://path/to/photo.jpg",
      "items": [
        {
          "id": "uuid",
          "name": "Grilled Chicken Breast",
          "amount": 6,
          "unit": "oz",
          "calories": 280,
          "protein": 52,
          "carbs": 0,
          "fat": 6,
          "healthScore": 95,
          "healthBreakdown": {
            "nutrientDensity": 98,
            "processingLevel": 95,
            "goalAlignment": 92
          },
          "healthReason": "Lean protein, nutrient-dense, minimally processed",
          "encouragement": "Grilled chicken is a lean protein powerhouse! Excellent for muscle building and recovery while staying within your calorie goals."
        }
      ],
      "totalCalories": 545,
      "totalProtein": 57,
      "totalCarbs": 45,
      "totalFat": 8.5,
      "healthScore": 91,
      "syncedToAppleHealth": true
    }
  ]
}
```

#### 3.2 Apple Health Integration

**Data Types to Write**
- Dietary Energy (Calories)
- Dietary Protein
- Dietary Carbohydrates
- Dietary Fat (Total)

**Optional: Data Types to Read**
- Historical nutrition data (for displaying comprehensive history)

**Metadata**
- Each HealthKit entry tagged with source: "MacroLog"
- Timestamp matches meal timestamp

#### 3.3 Photo Storage

- Photos stored in app's document directory via Expo FileSystem
- Organized by date: `/meals/YYYY-MM-DD/[timestamp].jpg`
- Reference stored in meal object as file URI
- Photos NOT synced to Apple Health (local only)

### 4. API Integration

#### 4.1 OpenAI Vision API

**Endpoint**: `https://api.openai.com/v1/chat/completions`

#### 4.2 Getting an OpenAI API Key

Users must obtain their own OpenAI API key to use the meal analysis feature. Here's the step-by-step guide to provide to users:

**Step 1: Create an OpenAI Account**
1. Go to [https://platform.openai.com/signup](https://platform.openai.com/signup)
2. Sign up with email, Google, Microsoft, or Apple account
3. Verify your email address if required

**Step 2: Add Payment Method**
1. OpenAI requires a payment method for API access
2. Navigate to [https://platform.openai.com/settings/organization/billing/overview](https://platform.openai.com/settings/organization/billing/overview)
3. Click "Add payment method"
4. Enter credit/debit card information
5. Optionally set usage limits to control costs (recommended: $5-10/month for personal use)

**Step 3: Generate API Key**
1. Go to [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Click "Create new secret key"
3. Give it a name (e.g., "MacroLog App")
4. Set permissions to "All" or specific to just "Model capabilities"
5. Click "Create secret key"
6. **IMPORTANT**: Copy the key immediately - it will only be shown once
7. Store it securely (you'll paste it into the MacroLog app)

**Step 4: Configure in MacroLog**
1. Open MacroLog app
2. Go to Settings tab
3. Paste your API key in the "OpenAI API Key" field
4. Tap "Save API Key"
5. Green checkmark confirms it's configured

**Cost Estimates**
- Model used: GPT-4o (recommended for vision tasks)
- Approximate cost per image analysis: $0.01 - $0.03
- Average user logging 3 meals/day: ~$1-3/month
- Users can monitor usage at [https://platform.openai.com/usage](https://platform.openai.com/usage)

**Security Notes**
- Never share your API key with others
- If compromised, immediately revoke it at [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- MacroLog stores the key locally on your device only
- The key is used exclusively for analyzing your meal photos

**Request Structure**
```json
{
  "model": "gpt-4o",
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "Analyze this meal photo and return a JSON array of food items with name, amount, unit, calories, protein, carbs, fat, healthScore (0-100), healthBreakdown (nutrientDensity, processingLevel, goalAlignment each 0-100), healthReason, and encouragement (personalized positive feedback that highlights nutritional benefits and gently notes any areas for improvement in a supportive tone). User goals: 2000 cal, 150g protein, 200g carbs, 65g fat."
        },
        {
          "type": "image_url",
          "image_url": {
            "url": "data:image/jpeg;base64,..."
          }
        }
      ]
    }
  ],
  "max_tokens": 1000
}
```

**Expected Response**
```json
{
  "choices": [
    {
      "message": {
        "content": "[{\"name\":\"Grilled Chicken Breast\",\"amount\":6,\"unit\":\"oz\",\"calories\":280,\"protein\":52,\"carbs\":0,\"fat\":6,\"healthScore\":95,\"healthBreakdown\":{\"nutrientDensity\":98,\"processingLevel\":95,\"goalAlignment\":92},\"healthReason\":\"Lean protein, nutrient-dense, minimally processed\",\"encouragement\":\"Grilled chicken is a lean protein powerhouse! Excellent for muscle building and recovery while staying within your calorie goals.\"}]"
      }
    }
  ]
}
```

### 5. User Interface Design

#### 5.1 Screen Structure

**Home Tab**
- Current streak display with fire emoji (🔥 12 day streak)
- Large "Take Photo" button (primary CTA)
- Today's quick stats (calories, protein with progress vs goals)
- Today's health rating badge
- Recent meals preview (3 most recent)
- Warning if API key not configured
- Achievement notification badge when new milestone is close or unlocked

**Progress Tab**
- Current streak display with longestStreak comparison (e.g., "🔥 12 days | Best: 28")
- Date navigation (< Today >)
- Current date summary card:
  - Total calories vs goal with progress bar
  - Protein, carbs, fat vs goals
  - Health rating
- 7-Day overview section:
  - List of last 7 days
  - Each showing: date, meal count, calories, goal indicator (✅/📊), health rating
  - Clickable to switch viewed date
- Meals section for selected date:
  - List of all meals with photos
  - Thumbnails, timestamps, nutrition, health score

**Settings Tab**
- API Key configuration:
  - Input field with show/hide toggle
  - Save button
  - Status indicator
  - Link/button to "How to get an API key" guide
- Daily Goals:
  - Calories input
  - Protein/Carbs/Fat inputs in grid
- Achievements section:
  - Grid of achievement badges (locked/unlocked)
  - Current streak and personal best
  - Progress to next milestone
- App info and links

**Meal Confirmation Flow**
1. Photo preview
2. "Analyzing" loading state with animation
3. Review screen:
   - Meal photo
   - Nutrition summary card with health score
   - Expandable list of identified items with:
     - Individual health scores
     - Contextual encouragement message
     - Edit/remove options for each item
   - "Log Meal" button
4. Success confirmation
5. Return to Home

#### 5.2 Design System

**Colors**
- Primary: Blue (#3B82F6) / Indigo (#4F46E5)
- Success: Green (#10B981)
- Warning: Yellow/Orange (#F59E0B)
- Health Score Colors:
  - Nutritious: Green (#059669)
  - Good: Blue (#2563EB)
  - Fair: Yellow (#D97706)
  - Limited: Orange (#EA580C)

**Typography**
- Headings: Bold, 24-32px
- Body: Regular, 14-16px
- Labels: Medium, 12-14px
- System font (San Francisco on iOS)

**Components**
- Rounded cards (border-radius: 16-24px)
- Soft shadows
- Progress bars with smooth animations
- Tab bar with icons + labels
- Bottom sheet modals for confirmations

### 6. Development Phases

#### Phase 1: Foundation (Week 1-2)
- Set up Expo project with EAS Build
- Implement basic navigation (3 tabs)
- Create Settings screen with API key management
- Implement daily goals configuration
- Set up AsyncStorage for local data

#### Phase 2: Core Features (Week 3-4)
- Implement photo capture with Expo ImagePicker
- Integrate OpenAI Vision API for analysis
- Build meal confirmation/review flow
- Set up local meal storage with FileSystem

#### Phase 3: Apple Health Integration (Week 5)
- Add HealthKit library (expo-health-connect or react-native-health)
- Request permissions
- Implement nutrition data writing to Apple Health
- Handle sync errors and retries

#### Phase 4: Health Rating System (Week 6)
- Enhance OpenAI prompt to return health breakdown
- Calculate multi-factor health scores
- Display health ratings with visual indicators
- Add health score reasoning/explanations

#### Phase 5: Progress & History (Week 7-8)
- Build 7-day progress dashboard
- Implement date navigation
- Add goal achievement indicators
- Create historical meal viewing
- Display aggregate statistics
- Implement streak tracking logic
- Build achievement system with milestones
- Add celebration animations for unlocks

#### Phase 6: Polish & Testing (Week 9-10)
- UI/UX refinements
- Error handling and edge cases
- Performance optimization
- Testing on real devices
- Beta testing with users

### 7. Risks & Mitigations

**R1: OpenAI API Costs**
- Risk: Per-image analysis costs could accumulate quickly
- Mitigation: User provides own API key; display usage warnings

**R2: API Analysis Accuracy**
- Risk: AI may misidentify foods or estimate portions incorrectly
- Mitigation: Always allow user to review and edit before logging

**R3: Apple Health Permission Denial**
- Risk: Users may deny HealthKit permissions
- Mitigation: Graceful degradation - still allow local tracking without sync

**R4: Photo Storage Growth**
- Risk: Photos consume significant device storage over time
- Mitigation: Implement optional photo deletion for old meals; compress images

**R5: Internet Dependency**
- Risk: Analysis requires connectivity; users may want to log offline
- Mitigation: Clear messaging; future enhancement could add manual entry fallback

### 8. Success Metrics

**Engagement**
- Daily active users
- Meals logged per day per user
- 7-day retention rate
- Average streak length
- Achievement unlock rate

**Accuracy**
- % of meals edited before logging (target: < 30%)
- User feedback on AI accuracy

**Health Impact**
- Average daily health score trend
- % of days meeting goals

**Technical**
- Average analysis time
- Apple Health sync success rate
- App crash rate

### 9. Future Enhancements (Out of Scope)

- Android support
- Barcode scanning for packaged foods
- Manual meal entry (no photo)
- Recipe builder
- Social features / meal sharing
- Nutritionist AI chat
- Integration with fitness trackers
- Meal planning and suggestions
- Export data to CSV/PDF

## Decision

We will proceed with building MacroLog as a React Native iOS app using Expo EAS Build with the requirements and architecture outlined above. The app will focus on:

1. Frictionless photo-based macro logging with AI
2. Comprehensive health rating system with contextual encouragement (Oura-style)
3. Apple Health integration for nutrition data
4. Local photo storage with historical navigation
5. Enhanced 7-day progress tracking with goal indicators
6. Streak tracking and achievement system for motivation

## Consequences

### Positive
- Clear technical direction and scope
- Proven technology stack (React Native + Expo)
- User controls their data and API costs
- Seamless iOS ecosystem integration
- Rich health insights beyond basic macro tracking

### Negative
- Requires users to provide OpenAI API key (friction)
- Online-only for analysis (no offline meal logging)
- iOS-only limits potential user base
- Photo storage could grow large over time

### Neutral
- Need to maintain single codebase for mobile
- Dependent on OpenAI API stability and pricing
- HealthKit requires native module integration

## Notes

- The web prototype (phototype/food-tracker-v2.jsx) serves as the UI/UX reference
- Health rating algorithm may need tuning based on user feedback
- Consider adding workout/exercise tracking in future versions to provide more holistic health picture
