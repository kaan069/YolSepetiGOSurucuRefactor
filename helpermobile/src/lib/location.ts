import * as Location from 'expo-location';
import { ensureForegroundPermission } from '../utils/locationPermission';

export async function askLocationPermission(): Promise<boolean> {
  return ensureForegroundPermission();
}

export async function getCurrentPosition() {
  const granted = await askLocationPermission();
  if (!granted) throw new Error('Konum izni reddedildi');
  const pos = await Location.getCurrentPositionAsync({});
  return {
    latitude: pos.coords.latitude,
    longitude: pos.coords.longitude,
  };
}