# MacroLog 🍽️

**AI-Powered Nutrition Tracking for iOS**

MacroLog is a React Native iOS app that uses OpenAI's Vision API to analyze meal photos and automatically log nutrition data to Apple Health. Built with Expo, TypeScript, and featuring intelligent nutrition scoring.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Platform](https://img.shields.io/badge/platform-iOS-lightgrey)
![React Native](https://img.shields.io/badge/React%20Native-0.76.5-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue)

## ✨ Features

### 📸 AI-Powered Meal Analysis
- Snap a photo, AI identifies foods and calculates nutrition
- GPT-4o Vision detects multiple items with portion estimates
- Automatic calories, protein, carbs, and fat calculation

### 🏥 3-Factor Health Rating
Nutrition scoring system:
- **Nutrient Density** (33%): Vitamins, minerals, fiber
- **Processing Level** (33%): Whole foods vs. processed
- **Goal Alignment** (34%): Fit with your targets
- Color-coded badges: Nutritious, Good, Fair, Limited

### 💬 Contextual Encouragement
Motivational feedback for each food item:
> "Your protein shake is excellent for muscle recovery with 25g protein, though it's highly processed. Consider pairing with whole foods for added nutrients."

### ❤️ Apple Health Integration (Optional)
- Auto-sync nutrition data to Apple Health
- Enable/disable anytime
- Works perfectly without Health sync
- Privacy-first: data never leaves your device

### 🔥 Streak Tracking & Achievements
- Track consecutive days of logging
- 6 achievement milestones (7, 21, 35, 50, 100, 365 days)
- Celebratory animations with confetti on unlock
- Personal best tracking

### 📊 Progress Tracking
- 7-day overview with goal indicators (✅/📊)
- Daily summaries: calories, macros, health rating
- Historical navigation: scroll through past dates
- Full meal history with details

### ✏️ Full Editing
- Review and edit all detected foods
- Modify names, portions, units, macros
- Remove incorrect items
- Real-time total calculations

### 🎨 Premium Polish
- 60fps smooth animations throughout
- Pull-to-refresh on all screens
- Achievement celebrations with confetti
- Loading states with pulsing dots
- Professional, modern UI

## 🚀 Quick Start

### Prerequisites
- Node.js v20+
- Expo account (free)
- OpenAI API key ([get one here](https://platform.openai.com/api-keys))
- Apple Developer account for iOS builds ($99/year)

### Installation

```bash
# Navigate to the app directory
cd macrolog-app

# Install dependencies
npm install

# Start development server
npm start

# Run on iOS simulator (press 'i' or run)
npm run ios
```

### Configuration

1. **OpenAI API Key**: Settings → API Key → Enter your key
2. **Daily Goals**: Settings → Daily Goals → Set targets
3. **Apple Health** (optional): Settings → Apple Health → Toggle on

## 🏗️ Building for iOS

See [macrolog-app/EAS-BUILD-SETUP.md](./macrolog-app/EAS-BUILD-SETUP.md) for detailed build instructions.

**Quick Build:**
```bash
# Install EAS CLI
npm install --global eas-cli

# Login to Expo
eas login

# Build for iOS
cd macrolog-app
eas build --profile production --platform ios
```

## 📱 How It Works

1. **Take Photo** → Camera captures meal
2. **AI Analysis** → GPT-4o Vision identifies foods (~3-5s)
3. **Review** → Edit detected items, portions, macros
4. **Log Meal** → Save to local storage + Apple Health
5. **Track Progress** → View stats, streaks, achievements

## 🛠️ Tech Stack

- **React Native + Expo**: Cross-platform framework
- **TypeScript**: Type safety
- **OpenAI GPT-4o**: Vision API for image analysis
- **Apple HealthKit**: Nutrition data sync
- **AsyncStorage**: Local data persistence
- **React Navigation**: Bottom tabs + stack

## 📂 Project Structure

```
macrolog/
├── macrolog-app/                    # Main React Native app
│   ├── src/
│   │   ├── screens/                 # 6 main screens
│   │   ├── components/              # Reusable components
│   │   ├── services/                # Storage, OpenAI, Health
│   │   ├── utils/                   # Helpers, calculations
│   │   └── types/                   # TypeScript definitions
│   ├── docs/                        # Documentation
│   │   ├── adr/                     # Architecture decisions
│   │   ├── PHASE2-COMPLETE.md       # Core features
│   │   ├── PHASE3-COMPLETE.md       # Apple Health
│   │   ├── PHASE4-COMPLETE.md       # Polish & animations
│   │   └── EAS-BUILD-SETUP.md       # Build guide
│   ├── App.tsx                      # Navigation root
│   ├── app.json                     # Expo config
│   ├── eas.json                     # Build profiles
│   └── README.md                    # App-specific docs
└── README.md                        # This file
```

## 🔐 Security & Privacy

- ✅ **Local-first**: All data stored on device
- ✅ **No cloud sync**: Photos never leave your device
- ✅ **User-owned API keys**: You control OpenAI costs
- ✅ **Optional Health sync**: Full user control
- ✅ **Open source**: Review all code

## 📈 Development Progress

- ✅ **Phase 1**: Foundation (React Native + Expo setup)
- ✅ **Phase 2**: Core Features (AI analysis, editing, storage)
- ✅ **Phase 3**: Apple Health Integration (optional sync)
- ✅ **Phase 4**: Polish & Animations (60fps, celebrations)

**Status**: Production-ready! 🎉

## 🗺️ Roadmap

### Completed
- [x] AI meal analysis with GPT-4o
- [x] 3-factor health rating system
- [x] Contextual encouragement messages
- [x] Apple Health integration (optional)
- [x] Streak tracking with achievements
- [x] 7-day progress view with goal indicators
- [x] Full meal editing capabilities
- [x] Pull-to-refresh functionality
- [x] Achievement celebration animations
- [x] 60fps smooth animations

### Future Ideas
- [ ] Dark mode support
- [ ] iOS widget for Today view
- [ ] Meal templates/favorites
- [ ] Export data (CSV/PDF)
- [ ] Barcode scanning
- [ ] Recipe import
- [ ] Social features (optional)
- [ ] Meal planning

## 📝 Documentation

- [Architecture Decisions](./macrolog-app/docs/adr/001-requirements.md)
- [EAS Build Setup](./macrolog-app/EAS-BUILD-SETUP.md)
- [Phase 2: Core Features](./macrolog-app/PHASE2-COMPLETE.md)
- [Phase 3: Apple Health](./macrolog-app/PHASE3-COMPLETE.md)
- [Phase 4: Polish & Animations](./macrolog-app/PHASE4-COMPLETE.md)

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📧 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/macrolog/issues)
- **Documentation**: See `/macrolog-app/docs`
- **Build Help**: See [EAS-BUILD-SETUP.md](./macrolog-app/EAS-BUILD-SETUP.md)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenAI**: GPT-4o Vision API for meal analysis
- **Expo**: Amazing React Native development platform
- **Apple**: HealthKit for nutrition data integration

---

**MacroLog** - *Snap, Analyze, Track* 📸🍽️📊

Made with ❤️ and AI
