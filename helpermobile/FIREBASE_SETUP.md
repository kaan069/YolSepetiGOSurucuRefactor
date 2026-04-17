# Firebase Push Notifications - Implementation Guide

## ✅ Current Status

Your app is **fully configured** with native Firebase Cloud Messaging (FCM). All components are in place and working.

## 📦 Installed Dependencies

```json
{
  "@react-native-firebase/app": "^23.4.1",
  "@react-native-firebase/messaging": "^23.4.1"
}
```

## 🔧 Configuration Files

### Android
- **File**: `android/app/google-services.json`
- **Status**: ✅ Configured
- **Location**: Referenced in `app.json` line 43

### iOS
- **File**: `GoogleService-Info.plist`
- **Status**: ✅ Configured
- **Location**: Referenced in `app.json` line 18

### App Config
- **File**: `app.json`
- **Firebase Plugin**: ✅ Added (line 58)
- **Permissions**: ✅ POST_NOTIFICATIONS added for Android 13+

## 🏗️ Architecture

### 1. Firebase Initialization (index.ts)
```typescript
// Firebase is initialized before App loads
if (!firebase.apps.length) {
  console.log('✅ Firebase initialized');
}

// Background handler registered
setupBackgroundNotificationHandler();
```

### 2. FCM Token Management

#### Current Implementation (useNotifications.ts)
The app uses a custom hook that:
- ✅ Gets native FCM token from Firebase (NOT Expo token)
- ✅ Sends token to backend via `authAPI.registerFCMToken()`
- ✅ Supports multi-device with unique device IDs
- ✅ Handles token refresh automatically
- ✅ Registers token on login, removes on logout

#### Alternative Service (fcmService.ts)
A cleaner service-based approach is also available in `src/services/fcmService.ts`:
```typescript
import fcmService from '@/services/fcmService';

// Initialize (call in App.tsx)
await fcmService.initialize();

// Get current token
const token = fcmService.getCurrentToken();

// Delete token on logout
await fcmService.deleteToken();
```

### 3. Notification Handlers

#### Foreground (App Open)
- **File**: `src/lib/notifications.ts` → `setupForegroundNotificationHandler()`
- **Behavior**: Shows notification while app is open
- **Handler**: `messaging().onMessage()`

#### Background (App Minimized)
- **File**: `src/lib/notifications.ts` → `setupBackgroundNotificationHandler()`
- **Behavior**: Handles notifications in background
- **Handler**: `messaging().setBackgroundMessageHandler()`

#### Click Handling
- **App Opened from Notification**: `messaging().getInitialNotification()`
- **App Brought to Foreground**: `messaging().onNotificationOpenedApp()`

### 4. Backend Integration

#### Register FCM Token (authAPI.ts:260)
```typescript
await authAPI.registerFCMToken({
  fcm_token: string,      // FCM token from Firebase
  device_id: string,      // Unique device identifier
  device_type: 'ios' | 'android'
});
```

**Backend Endpoint**: `PUT /auth/notifications/update/`

#### Delete FCM Token (authAPI.ts:291)
```typescript
await authAPI.deleteFCMToken(deviceId);
```

**Backend Endpoint**: `DELETE /auth/notifications/logout/`

## 🚀 Building with EAS

### Development Build
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build for Android
eas build --platform android --profile development

# Build for iOS
eas build --platform ios --profile development
```

### Preview Build (APK)
```bash
# Android APK for testing
eas build --platform android --profile preview

# iOS Ad-Hoc
eas build --platform ios --profile preview
```

### Production Build
```bash
# Android AAB for Play Store
eas build --platform android --profile production

# iOS for App Store
eas build --platform ios --profile production
```

## 📱 Testing Push Notifications

### 1. Get FCM Token
When you run the app, the FCM token is logged:
```
╔════════════════════════════════════════╗
║       FCM TOKEN HAZIR!                ║
╚════════════════════════════════════════╝
🔔 Token: YOUR_FCM_TOKEN_HERE
```

### 2. Send Test Notification (Firebase Console)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Cloud Messaging**
4. Click **Send your first message**
5. Enter notification details:
   - **Title**: Test Notification
   - **Body**: This is a test message
6. Click **Send test message**
7. Paste the FCM token from logs
8. Click **Test**

### 3. Send Test Notification (Backend)

Your backend should send notifications to:
```
https://fcm.googleapis.com/fcm/send
```

**Headers**:
```
Authorization: key=YOUR_SERVER_KEY
Content-Type: application/json
```

**Payload**:
```json
{
  "to": "FCM_TOKEN_HERE",
  "notification": {
    "title": "New Job Request",
    "body": "You have a new tow truck request"
  },
  "data": {
    "type": "new_request",
    "request_id": "123",
    "screen": "JobDetail"
  }
}
```

## 🔔 Notification Payload Structure

### Recommended Format
```json
{
  "notification": {
    "title": "Notification Title",
    "body": "Notification Body"
  },
  "data": {
    "type": "new_request|request_accepted|request_completed|message",
    "request_id": "string",
    "screen": "JobDetail|HomeScreen|etc",
    "params": "{\"id\":\"123\"}"
  }
}
```

### Notification Types
- `new_request`: New job request received
- `request_accepted`: Job request accepted
- `request_completed`: Job completed
- `message`: Chat message received

## 🐛 Troubleshooting

### Token Not Received
1. Check Firebase config files are present
2. Verify permissions in app.json
3. Check device has internet connection
4. Ensure user is logged in (token sent after auth)

### Notifications Not Showing
1. **Android**: Check notification permissions granted
2. **iOS**: Check notification settings in device Settings app
3. Verify backend is sending to correct FCM token
4. Check logs for error messages

### Build Errors
1. **Missing google-services.json**: Download from Firebase Console → Project Settings
2. **Missing GoogleService-Info.plist**: Download from Firebase Console → Project Settings → iOS App
3. **Plugin errors**: Run `npx expo prebuild --clean`

## 📝 Next Steps

### Option 1: Use Current Implementation (Recommended)
The current implementation is production-ready. Just build and deploy:
```bash
eas build --platform android --profile production
eas build --platform ios --profile production
```

### Option 2: Migrate to fcmService
If you prefer a cleaner service-based approach:

1. Update `App.tsx`:
```typescript
import fcmService from './src/services/fcmService';

useEffect(() => {
  if (isAuthenticated) {
    fcmService.initialize();
  }
}, [isAuthenticated]);
```

2. Update `authStore.ts` logout:
```typescript
import fcmService from '../services/fcmService';

logout: async () => {
  // ... existing code ...
  await fcmService.deleteToken();
  // ... rest of logout ...
}
```

## 📚 Resources

- [React Native Firebase Docs](https://rnfirebase.io/)
- [Firebase Console](https://console.firebase.google.com/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [FCM HTTP v1 API](https://firebase.google.com/docs/cloud-messaging/migrate-v1)

## ✨ Summary

Your Firebase implementation is **complete and production-ready**:
- ✅ Native Firebase SDK installed
- ✅ Configuration files in place
- ✅ FCM token retrieval working
- ✅ Backend integration implemented
- ✅ Foreground/background handlers configured
- ✅ Multi-device support enabled
- ✅ EAS build configuration ready

**You're ready to build and deploy!** 🚀
