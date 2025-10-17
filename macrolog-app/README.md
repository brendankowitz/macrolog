# MacroLog - AI-Powered Macro Tracking App

A React Native iOS app that uses AI vision to analyze meal photos and track macros with Apple Health integration.

## Features

✅ **Implemented:**
- 📸 Photo capture with camera
- ⚙️ Settings screen with API key management
- 🎯 Customizable daily nutrition goals
- 🏠 Home screen with today's stats and recent meals
- 📊 Progress screen with 7-day overview and date navigation
- 🔥 Streak tracking system
- 🏆 Achievement milestones (7, 21, 35, 50, 100, 365 days)
- 💾 Local data persistence with AsyncStorage
- 🎨 Beautiful, polished UI with Oura Ring-style design

🚧 **In Progress:**
- 🤖 OpenAI Vision API integration for meal analysis
- 📝 Meal review and confirmation flow
- 🍎 Apple Health (HealthKit) integration
- 💬 Contextual encouragement messages

## Prerequisites

- Node.js >= 20.19.4
- npm or yarn
- Expo CLI
- iOS device or simulator (for testing)
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

## Installation

1. **Clone the repository:**
   ```bash
   cd macrolog-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```

4. **Run on iOS:**
   ```bash
   npm run ios
   ```

   Or scan the QR code with Expo Go app on your iOS device.

## Getting an OpenAI API Key

1. Go to [https://platform.openai.com/signup](https://platform.openai.com/signup)
2. Create an account and add a payment method
3. Navigate to [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
4. Click "Create new secret key"
5. Copy the key and paste it into the MacroLog Settings screen

**Cost estimate:** ~$1-3/month for typical usage (3 meals/day)

## Project Structure

```
macrolog-app/
├── src/
│   ├── screens/          # Main app screens
│   │   ├── HomeScreen.tsx
│   │   ├── ProgressScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── components/       # Reusable UI components
│   ├── services/         # Business logic and API calls
│   │   └── storage.ts    # AsyncStorage service
│   ├── types/            # TypeScript type definitions
│   │   └── index.ts
│   └── utils/            # Helper functions
│       └── helpers.ts    # Date, health score, streak calculations
├── App.tsx              # Main app entry point with navigation
└── package.json
```

## Configuration

### Daily Goals
Set your personalized nutrition goals in the Settings screen:
- Calories (default: 2000)
- Protein (default: 150g)
- Carbohydrates (default: 200g)
- Fat (default: 65g)

### Achievements
Track your consistency and unlock achievements at these milestones:
- 🔥 Week Warrior - 7 days
- ⭐ Habit Builder - 21 days
- 💪 Streak Master - 35 days
- 🏆 Dedication - 50 days
- 💎 Century Club - 100 days
- 👑 Year Champion - 365 days

## Development Roadmap

### Phase 1: Foundation ✅ COMPLETED
- ✅ Expo project setup with TypeScript
- ✅ Navigation with bottom tabs
- ✅ Settings screen with API key management
- ✅ Daily goals configuration
- ✅ AsyncStorage for local data
- ✅ Home, Progress, Settings screens
- ✅ Streak tracking and achievements

### Phase 2: Core Features (Next)
- [ ] Photo analysis with OpenAI Vision API
- [ ] Meal review and edit flow
- [ ] Local photo storage
- [ ] Health score calculation with 3 factors:
  - Nutrient density
  - Processing level
  - Goal alignment

### Phase 3: Apple Health Integration
- [ ] HealthKit setup
- [ ] Write nutrition data to Apple Health
- [ ] Request permissions
- [ ] Sync error handling

### Phase 4: Polish
- [ ] Contextual encouragement messages
- [ ] Celebration animations for achievements
- [ ] Loading states and error handling
- [ ] Performance optimization

## Tech Stack

- **Framework:** React Native with Expo SDK 51+
- **Language:** TypeScript
- **Navigation:** React Navigation (Bottom Tabs)
- **Storage:** AsyncStorage
- **Camera:** Expo ImagePicker
- **AI:** OpenAI Vision API (gpt-4o)
- **Health:** Apple HealthKit (coming soon)

## Architecture Decisions

See [docs/adr/001-requirements.md](../docs/adr/001-requirements.md) for the complete requirements and architecture documentation.

## Contributing

This is a personal project, but feedback and suggestions are welcome! Please open an issue to discuss any changes.

## License

MIT

## Support

For issues or questions:
1. Check the ADR documentation in `/docs/adr/`
2. Review the OpenAI API key setup guide in Settings
3. Open an issue on GitHub

---

**Note:** This app is designed for iOS only. Android support may be added in future versions.
