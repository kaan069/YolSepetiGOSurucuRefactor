import { Platform } from 'react-native';
import { requireNativeModule } from 'expo-modules-core';

const BatteryOptimizationCheck = Platform.OS === 'android'
  ? requireNativeModule('BatteryOptimizationCheck')
  : null;

export function isIgnoringBatteryOptimizations(): boolean {
  if (Platform.OS !== 'android') return true;
  try {
    return BatteryOptimizationCheck?.isIgnoringBatteryOptimizations() ?? true;
  } catch {
    return true;
  }
}
