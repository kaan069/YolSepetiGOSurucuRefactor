import { registerRootComponent } from 'expo';
import firebase from '@react-native-firebase/app';
import { setupBackgroundNotificationHandler } from './src/lib/notifications';
import './src/tasks/backgroundLocation'; // Arka plan konum task'ını kaydet (registerRootComponent'dan önce)

import App from './src/App';

// Firebase'i ilk önce initialize et (native config dosyalarından otomatik)
if (!firebase.apps.length) {
  console.log('✅ Firebase initialized in index.ts');
} else {
  console.log('✅ Firebase already initialized');
}

// Firebase background notification handler'ı kaydet
// Bu, App render olmadan önce yapılmalı
setupBackgroundNotificationHandler();

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
