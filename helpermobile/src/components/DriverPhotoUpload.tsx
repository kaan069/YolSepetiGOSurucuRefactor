import React, { useState } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TextInput,
  Dimensions,
} from 'react-native';
import { Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import * as ImagePicker from 'expo-image-picker';
import CollapsibleCard from './common/CollapsibleCard';
import { commonAPI } from '../api/requests/common';
import { RequestPhoto } from '../api/types';

interface DriverPhotoUploadProps {
  requestId: number;
  existingPhotos?: RequestPhoto[];
  onPhotosUploaded?: () => void;
}

const MAX_PHOTOS = 10;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const GRID_GAP = 8;
const COLUMNS = 4;
const SCREEN_PADDING = 32;
const THUMB_SIZE = (Dimensions.get('window').width - SCREEN_PADDING * 2 - GRID_GAP * (COLUMNS - 1)) / COLUMNS;

export default function DriverPhotoUpload({
  requestId,
  existingPhotos = [],
  onPhotosUploaded,
}: DriverPhotoUploadProps) {
  const [pendingPhotos, setPendingPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [description, setDescription] = useState('');

  const driverPhotos = existingPhotos.filter(p => p.uploaded_by === 'driver');
  const totalPhotos = driverPhotos.length + pendingPhotos.length;
  const canAddMore = totalPhotos < MAX_PHOTOS;
  const hasPending = pendingPhotos.length > 0;

  const requestPermission = async (type: 'camera' | 'gallery') => {
    const { status } = type === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin Gerekli', `${type === 'camera' ? 'Kamera' : 'Galeri'} erişimi için izin vermeniz gerekiyor.`);
      return false;
    }
    return true;
  };

  const pickFromCamera = async () => {
    if (!canAddMore) return;
    if (!(await requestPermission('camera'))) return;
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.3,
      exif: false,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      if (asset.fileSize && asset.fileSize > MAX_FILE_SIZE) {
        Alert.alert('Dosya Çok Büyük', 'Fotoğraf 5MB\'dan küçük olmalıdır.');
        return;
      }
      setPendingPhotos(prev => [...prev, asset.uri]);
    }
  };

  const pickFromGallery = async () => {
    if (!canAddMore) return;
    if (!(await requestPermission('gallery'))) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.3,
      allowsMultipleSelection: true,
      selectionLimit: MAX_PHOTOS - totalPhotos,
      exif: false,
    });
    if (!result.canceled && result.assets.length > 0) {
      const validUris: string[] = [];
      for (const asset of result.assets) {
        if (asset.fileSize && asset.fileSize > MAX_FILE_SIZE) continue;
        validUris.push(asset.uri);
      }
      if (validUris.length > 0) {
        setPendingPhotos(prev => [...prev, ...validUris]);
      }
    }
  };

  const removePendingPhoto = (index: number) => {
    setPendingPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const uploadPhotos = async () => {
    if (!hasPending) return;
    setUploading(true);
    try {
      await commonAPI.uploadDriverPhotos(requestId, pendingPhotos, description || undefined);
      setPendingPhotos([]);
      setDescription('');
      Alert.alert('Başarılı', 'Fotoğraflar yüklendi.');
      onPhotosUploaded?.();
    } catch (error: any) {
      const msg = error?.response?.data?.error || error?.response?.data?.message || 'Fotoğraf yüklenirken bir hata oluştu.';
      Alert.alert('Hata', msg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <CollapsibleCard
      title="Saha Fotoğrafı"
      icon="camera-burst"
      iconColor="#e65100"
      defaultExpanded={true}
    >
      {/* Bilgilendirme */}
      <View style={styles.infoBox}>
        <MaterialCommunityIcons name="alert-decagram" size={18} color="#e65100" />
        <Text style={styles.infoText}>
          Sahada gördüğünüz durum müşterinin bildirdiğinden farklıysa fotoğraf çekerek bize bildirin.
        </Text>
      </View>

      {/* Fotoğraf Grid */}
      {(driverPhotos.length > 0 || hasPending) && (
        <View style={styles.grid}>
          {driverPhotos.map(photo => (
            <View key={photo.id} style={styles.thumbContainer}>
              <Image source={{ uri: photo.image_url }} style={styles.thumb} resizeMode="cover" />
              <View style={styles.uploadedBadge}>
                <MaterialCommunityIcons name="check-circle" size={14} color="#fff" />
              </View>
            </View>
          ))}
          {pendingPhotos.map((uri, index) => (
            <View key={`pending-${index}`} style={styles.thumbContainer}>
              <Image source={{ uri }} style={styles.thumb} resizeMode="cover" />
              <TouchableOpacity style={styles.removeBtn} onPress={() => removePendingPhoto(index)}>
                <MaterialCommunityIcons name="close-circle" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Kamera + Galeri butonları */}
      {canAddMore && (
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={pickFromCamera} disabled={uploading}>
            <MaterialCommunityIcons name="camera" size={22} color="#e65100" />
            <Text style={styles.actionBtnText}>Fotoğraf Çek</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.actionBtnGallery]} onPress={pickFromGallery} disabled={uploading}>
            <MaterialCommunityIcons name="image-plus" size={22} color="#1565c0" />
            <Text style={[styles.actionBtnText, { color: '#1565c0' }]}>Galeriden Seç</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Fotoğraf sayacı */}
      {totalPhotos > 0 && (
        <Text style={styles.counter}>{totalPhotos} / {MAX_PHOTOS} fotoğraf</Text>
      )}

      {/* Açıklama + Gönder */}
      {hasPending && (
        <View style={styles.sendSection}>
          <View style={styles.descriptionWrapper}>
            <MaterialCommunityIcons name="pencil-outline" size={18} color="#999" style={styles.descriptionIcon} />
            <TextInput
              style={styles.descriptionInput}
              placeholder="Açıklama yazın... (opsiyonel)"
              placeholderTextColor="#bbb"
              value={description}
              onChangeText={setDescription}
              multiline
              maxLength={500}
            />
          </View>

          <TouchableOpacity
            style={[styles.sendBtn, uploading && styles.disabledBtn]}
            onPress={uploadPhotos}
            disabled={uploading}
            activeOpacity={0.8}
          >
            {uploading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <MaterialCommunityIcons name="send" size={20} color="#fff" />
                <Text style={styles.sendBtnText}>
                  {pendingPhotos.length} Fotoğraf Gönder
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </CollapsibleCard>
  );
}

const styles = StyleSheet.create({
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff8e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#5d4037',
    lineHeight: 17,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
  thumbContainer: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 10,
    overflow: 'hidden',
  },
  thumb: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  uploadedBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: '#43a047',
    borderRadius: 10,
    padding: 2,
  },
  removeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    padding: 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#e65100',
    backgroundColor: '#fff3e0',
  },
  actionBtnGallery: {
    borderColor: '#1565c0',
    backgroundColor: '#e3f2fd',
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#e65100',
  },
  counter: {
    fontSize: 11,
    color: '#999',
    textAlign: 'right',
    marginTop: 6,
  },
  sendSection: {
    marginTop: 14,
    gap: 10,
  },
  descriptionWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  descriptionIcon: {
    marginTop: 10,
    marginRight: 8,
  },
  descriptionInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    minHeight: 44,
    maxHeight: 80,
    textAlignVertical: 'top',
    paddingVertical: 8,
  },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#e65100',
    paddingVertical: 14,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#e65100',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  sendBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  disabledBtn: {
    opacity: 0.6,
  },
});
