# BreakApp Mobile Application

React Native mobile application for BreakApp using Expo.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm start
```

3. Run on specific platform:
```bash
# iOS
npm run ios

# Android
npm run android

# Web
npm run web
```

## Development

### Running Tests
```bash
npm test
```

### Project Structure
```
mobile/
├── src/
│   ├── screens/           # Screen components
│   ├── components/        # Reusable components
│   ├── services/          # API services
│   ├── store/             # Redux store
│   └── utils/             # Utility functions
├── assets/                # Images, fonts, etc.
└── App.tsx                # Main app component
```

## Requirements

- Node.js 18+
- Expo CLI
- iOS Simulator (for iOS development)
- Android Studio / Android Emulator (for Android development)

## Environment Variables

Create a `.env` file in the mobile directory with:
```
API_BASE_URL=http://localhost:3000/api/v1
```


