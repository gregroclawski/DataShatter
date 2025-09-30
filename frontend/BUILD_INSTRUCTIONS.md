# iOS AdMob Development Build Instructions

## Prerequisites
- Computer with Terminal/Command Prompt
- Expo account (free at expo.dev)

## Steps

### 1. Install Required Tools
```bash
npm install -g @expo/cli eas-cli
```

### 2. Navigate to Project
```bash
cd /path/to/your/frontend/folder
```

### 3. Login to Expo
```bash
eas login
```
*Enter your Expo account credentials*

### 4. Create Development Build
```bash
EAS_NO_VCS=1 eas build --profile development --platform ios
```

### 5. Install on iPhone
- Build will provide download link
- Install on your device (not Expo Go)
- Test AdMob ads in Revival System

## Your AdMob Configuration
- App ID: ca-app-pub-9692390081647816~7941119756
- Ad Unit ID: ca-app-pub-9692390081647816/9535889564
- Integration: Complete and ready for testing

## Expected Result
- Build time: ~10-15 minutes
- Download link for iOS app with working AdMob
- Revenue generation from completed ads