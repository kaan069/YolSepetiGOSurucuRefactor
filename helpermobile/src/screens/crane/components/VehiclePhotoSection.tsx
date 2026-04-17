import React from 'react';
import { View, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import { Button, Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { isPdfFile } from '../../../utils/fileHelpers';

interface VehiclePhotoSectionProps {
  vehiclePhoto: string | null;
  onPhotoChange: (uri: string | null) => void;
  title?: string;
  helperText?: string;
  primaryColor?: string;
}

export default function VehiclePhotoSection({
  vehiclePhoto,
  onPhotoChange,
  title = 'Vinç Fotoğrafı',
  helperText = 'Plaka görünür şekilde vinç fotoğrafı ekleyin',
  primaryColor = '#26a69a',
}: VehiclePhotoSectionProps) {

  const pickImageFromGallery = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert('İzin Gerekli', 'Galeriye erişim izni vermelisiniz.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.3,
      exif: false,
    });

    if (!result.canceled && result.assets[0]) {
      onPhotoChange(result.assets[0].uri);
    }
  };

  const pickImageFromCamera = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert('İzin Gerekli', 'Kamera erişim izni vermelisiniz.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.3,
      exif: false,
    });

    if (!result.canceled && result.assets[0]) {
      onPhotoChange(result.assets[0].uri);
    }
  };

  const pickDocumentFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/jpeg', 'image/png'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];

        if (file.size && file.size > 5 * 1024 * 1024) {
          Alert.alert('Hata', 'Dosya boyutu 5MB\'dan küçük olmalıdır.');
          return;
        }

        const ext = file.name?.toLowerCase().split('.').pop();
        if (!['jpg', 'jpeg', 'png', 'pdf'].includes(ext || '')) {
          Alert.alert('Hata', 'Sadece JPG, PNG ve PDF dosyaları kabul edilir.');
          return;
        }

        onPhotoChange(file.uri);
      }
    } catch (error) {
      Alert.alert('Hata', 'Dosya seçilirken bir hata oluştu.');
    }
  };

  const removePhoto = () => {
    onPhotoChange(null);
  };

  return (
    <View style={styles.formSection}>
      <Text variant="titleMedium" style={styles.subsectionTitle}>
        {title}
      </Text>
      <Text variant="bodyMedium" style={styles.photoHelperText}>
        {helperText}
      </Text>

      {vehiclePhoto ? (
        <View style={styles.photoContainer}>
          {isPdfFile(vehiclePhoto) ? (
            <View style={styles.pdfPreview}>
              <MaterialCommunityIcons name="file-pdf-box" size={48} color="#f44336" />
              <Text style={styles.pdfFileName} numberOfLines={1}>
                {vehiclePhoto.split('/').pop()}
              </Text>
            </View>
          ) : (
            <Image source={{ uri: vehiclePhoto }} style={styles.photoPreview} />
          )}
          <View style={styles.photoActions}>
            <Button
              mode="outlined"
              onPress={pickImageFromGallery}
              style={styles.photoButton}
              icon="image"
            >
              Değiştir
            </Button>
            <Button
              mode="outlined"
              onPress={removePhoto}
              style={styles.photoButton}
              icon="delete"
              textColor="#f44336"
            >
              Sil
            </Button>
          </View>
        </View>
      ) : (
        <View>
          <View style={styles.photoPickerContainer}>
            <TouchableOpacity
              style={styles.photoPickerButton}
              onPress={pickImageFromCamera}
            >
              <MaterialCommunityIcons name="camera" size={32} color={primaryColor} />
              <Text style={[styles.photoPickerText, { color: primaryColor }]}>Kameradan Çek</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.photoPickerButton}
              onPress={pickImageFromGallery}
            >
              <MaterialCommunityIcons name="image" size={32} color={primaryColor} />
              <Text style={[styles.photoPickerText, { color: primaryColor }]}>Galeriden Seç</Text>
            </TouchableOpacity>
          </View>
          <Button
            mode="outlined"
            icon="file-upload"
            onPress={pickDocumentFile}
            style={styles.filePickerButton}
          >
            Dosya Seç (PDF)
          </Button>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  formSection: {
    marginBottom: 24,
  },
  subsectionTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#666',
  },
  photoHelperText: {
    color: '#666',
    marginBottom: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  photoContainer: {
    marginTop: 8,
  },
  photoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
  },
  pdfPreview: {
    width: '100%',
    height: 150,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  pdfFileName: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
    maxWidth: '80%',
  },
  photoActions: {
    flexDirection: 'row',
    gap: 12,
  },
  photoButton: {
    flex: 1,
  },
  photoPickerContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  photoPickerButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPickerText: {
    marginTop: 8,
    fontWeight: '600',
    fontSize: 14,
  },
  filePickerButton: {
    marginTop: 12,
    borderColor: '#666',
  },
});
