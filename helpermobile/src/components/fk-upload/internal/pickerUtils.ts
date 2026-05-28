import { Alert, Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

export const DEFAULT_MAX_FILE_MB = 5;
export const DEFAULT_ALLOWED_EXT = ['jpg', 'jpeg', 'png', 'pdf'] as const;

export async function ensureMediaLibraryPermission(): Promise<boolean> {
  if (Platform.OS !== 'ios') return true;
  const res = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!res.granted) {
    Alert.alert('İzin Gerekli', 'Galeriye erişim izni vermelisiniz.');
    return false;
  }
  return true;
}

export async function ensureCameraPermission(): Promise<boolean> {
  const res = await ImagePicker.requestCameraPermissionsAsync();
  if (!res.granted) {
    Alert.alert('İzin Gerekli', 'Kamera erişim izni vermelisiniz.');
    return false;
  }
  return true;
}

export interface PickImageOptions {
  source: 'camera' | 'gallery';
  quality?: number;
  allowsEditing?: boolean;
  aspect?: [number, number];
}

export async function pickImage(opts: PickImageOptions): Promise<string | null> {
  const { source, quality = 0.5, allowsEditing = false, aspect } = opts;

  if (source === 'camera') {
    const ok = await ensureCameraPermission();
    if (!ok) return null;
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing,
      aspect,
      quality,
      exif: false,
    });
    if (!result.canceled && result.assets[0]) return result.assets[0].uri;
    return null;
  }

  const ok = await ensureMediaLibraryPermission();
  if (!ok) return null;
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing,
    aspect,
    quality,
    exif: false,
  });
  if (!result.canceled && result.assets[0]) return result.assets[0].uri;
  return null;
}

export interface PickedDocument {
  uri: string;
  name: string;
  size?: number;
  mimeType?: string;
}

export interface PickDocumentOptions {
  accept?: Array<'image' | 'pdf'>;
  maxSizeMB?: number;
}

export async function pickDocument(opts: PickDocumentOptions = {}): Promise<PickedDocument | null> {
  const accept = opts.accept ?? ['image', 'pdf'];
  const maxSizeMB = opts.maxSizeMB ?? DEFAULT_MAX_FILE_MB;
  const maxBytes = maxSizeMB * 1024 * 1024;

  const types: string[] = [];
  if (accept.includes('pdf')) types.push('application/pdf');
  if (accept.includes('image')) types.push('image/jpeg', 'image/png');

  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: types.length === 1 ? types[0] : types,
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets || result.assets.length === 0) return null;

    const file = result.assets[0];
    if (file.size && file.size > maxBytes) {
      Alert.alert('Hata', `Dosya boyutu ${maxSizeMB}MB'dan küçük olmalıdır.`);
      return null;
    }

    const ext = file.name?.toLowerCase().split('.').pop() ?? '';
    const allowedExt: string[] = [];
    if (accept.includes('image')) allowedExt.push('jpg', 'jpeg', 'png');
    if (accept.includes('pdf')) allowedExt.push('pdf');
    if (!allowedExt.includes(ext)) {
      const human = allowedExt.map((e) => e.toUpperCase()).join(', ');
      Alert.alert('Hata', `Sadece ${human} dosyaları kabul edilir.`);
      return null;
    }

    return { uri: file.uri, name: file.name, size: file.size, mimeType: file.mimeType };
  } catch {
    Alert.alert('Hata', 'Dosya seçilirken bir hata oluştu.');
    return null;
  }
}
