# EAS Build Setup Instructions

This guide will help you set up Expo Application Services (EAS) Build for MacroLog.

## Prerequisites

1. **Expo Account**: Create a free account at [expo.dev](https://expo.dev)
2. **Apple Developer Account**: Required for iOS builds ($99/year)
3. **Node.js**: Already installed
4. **Git**: Keep your project in version control

## Initial Setup

### 1. Install EAS CLI

```bash
npm install --global eas-cli
```

### 2. Login to Expo

```bash
eas login
```

### 3. Initialize Your Project

The project ID has already been configured in `app.json`. Run:

```bash
eas init --id 93595aa1-0e5e-48ee-9219-c3cddb73a82f
```

This command is **safe to run** and will not expose any credentials. It simply links your local project to the Expo project.

## Configuration Files

### app.json
- **Already configured** with project ID
- Contains iOS HealthKit entitlements
- Has camera and photo permissions
- **Update `owner`** field with your Expo username
- **Update `bundleIdentifier`** to match your Apple Developer account

### eas.json
- **Already created** with build profiles:
  - `development`: For testing with Expo Go
  - `preview`: Internal distribution (TestFlight)
  - `production`: App Store releases

## Building for iOS

### Development Build (Simulator)

```bash
eas build --profile development --platform ios
```

### Preview Build (Device/TestFlight)

```bash
eas build --profile preview --platform ios
```

### Production Build (App Store)

```bash
eas build --profile production --platform ios
```

## Important Security Notes

### ✅ Safe to Commit
- `app.json` (project ID is public info)
- `eas.json` (build configuration)
- `.gitignore` (protects secrets)

### ❌ NEVER Commit
- `.env` files with API keys
- Apple certificates/provisioning profiles (EAS handles these)
- Any files with passwords or tokens

### Credentials Management

EAS automatically manages your iOS credentials:
- **Apple Team ID**
- **Distribution certificates**
- **Provisioning profiles**

These are stored securely on Expo's servers and **never** committed to Git.

## Environment Variables

For sensitive data like OpenAI API keys:

1. **Development**: Use a `.env` file (already in .gitignore):
   ```
   OPENAI_API_KEY=sk-...
   ```

2. **Production**: Use EAS Secrets:
   ```bash
   eas secret:create --scope project --name OPENAI_API_KEY --value sk-...
   ```

## Before Your First Build

### Update app.json

1. **Owner**: Change `"your-expo-username"` to your actual Expo username
2. **Bundle Identifier**: Change `"com.yourcompany.macrolog"` to your unique identifier
   - Format: `com.yourname.macrolog` or `com.yourcompany.macrolog`
   - Must match your Apple Developer account

### Update eas.json (Optional)

If submitting to App Store, update the `submit.production.ios` section:
- `appleId`: Your Apple ID email
- `ascAppId`: Your App Store Connect app ID (found in App Store Connect)
- `appleTeamId`: Your Apple Developer Team ID

## Building Workflow

### First Time
```bash
# 1. Install EAS CLI (if not done)
npm install --global eas-cli

# 2. Login
eas login

# 3. Initialize (already done, but you can run again)
eas init --id 93595aa1-0e5e-48ee-9219-c3cddb73a82f

# 4. Configure credentials (EAS will prompt)
eas build:configure

# 5. Build for development
eas build --profile development --platform ios
```

### Subsequent Builds
```bash
# Development build
eas build --profile development --platform ios

# Preview build (for TestFlight)
eas build --profile preview --platform ios

# Production build (for App Store)
eas build --profile production --platform ios
```

## Submitting to App Store

```bash
# After a production build completes
eas submit --platform ios
```

## Troubleshooting

### "No credentials found"
Run: `eas build:configure`

### "Bundle identifier mismatch"
Update `ios.bundleIdentifier` in `app.json`

### "Team not found"
Ensure you have an active Apple Developer account

### Build fails
Check build logs: `eas build:list`

## Resources

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [iOS Credentials](https://docs.expo.dev/app-signing/managed-credentials/)
- [Submit to App Store](https://docs.expo.dev/submit/introduction/)
- [HealthKit Setup](https://docs.expo.dev/versions/latest/sdk/health/)

## Next Steps

1. Update `owner` in `app.json` with your Expo username
2. Update `bundleIdentifier` in `app.json`
3. Run `eas build:configure` to set up credentials
4. Run your first build: `eas build --profile development --platform ios`
5. Install the build on your device or simulator
6. Test the app with real camera and HealthKit integration

## Notes

- EAS Build happens in the cloud, so you don't need a Mac for iOS builds
- Builds typically take 10-20 minutes
- You get free build minutes with Expo (check your account for limits)
- HealthKit only works on physical iOS devices (not simulators)
