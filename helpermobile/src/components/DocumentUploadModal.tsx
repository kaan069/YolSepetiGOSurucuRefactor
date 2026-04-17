import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Modal, Portal, Card, Text, Button, Divider } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

interface DocumentItem {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  fileExtension: string;
  uploadedFileName?: string;
}

interface DocumentUploadModalProps {
  visible: boolean;
  document: DocumentItem | null;
  onClose: () => void;
  onFileSelected: (fileName: string) => void;
  onFileDeleted?: () => void;
}

export default function DocumentUploadModal({
  visible,
  document,
  onClose,
  onFileSelected,
  onFileDeleted,
}: DocumentUploadModalProps) {
  if (!document) return null;

  const isImageDocument = document.id === 'license_front' || document.id === 'vehicle_photo';
  const isPdfDocument = document.id === 'tax_certificate';
  const hasUploadedFile = !!document.uploadedFileName;

  const handleCameraCapture = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('İzin Gerekli', 'Kamera erişimi için izin vermeniz gerekiyor.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const fileName = `kamera_${Date.now()}.jpg`;
        onFileSelected(fileName);
      }
    } catch (error) {
      Alert.alert('Hata', 'Fotoğraf çekilirken bir hata oluştu.');
    }
  };

  const handleGalleryPick = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('İzin Gerekli', 'Galeri erişimi için izin vermeniz gerekiyor.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const fileName = result.assets[0].fileName || `galeri_${Date.now()}.jpg`;
        onFileSelected(fileName);
      }
    } catch (error) {
      Alert.alert('Hata', 'Galeri erişimi sırasında bir hata oluştu.');
    }
  };

  const handleDocumentPick = async () => {
    try {
      let allowedTypes: DocumentPicker.DocumentPickerOptions['type'] = '*/*';

      if (isPdfDocument) {
        allowedTypes = 'application/pdf';
      } else if (isImageDocument) {
        allowedTypes = ['image/jpeg', 'image/png'];
      }

      const result = await DocumentPicker.getDocumentAsync({
        type: allowedTypes,
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];

        if (isPdfDocument && file.mimeType !== 'application/pdf') {
          Alert.alert('Hata', 'Vergi levhası PDF formatında olmalıdır.');
          return;
        }

        if (isImageDocument && !file.mimeType?.startsWith('image/')) {
          Alert.alert('Hata', 'Fotoğraf JPG veya PNG formatında olmalıdır.');
          return;
        }

        if (file.size && file.size > 5 * 1024 * 1024) {
          Alert.alert('Hata', 'Dosya boyutu 5MB\'dan küçük olmalıdır.');
          return;
        }

        onFileSelected(file.name);
      }
    } catch (error) {
      Alert.alert('Hata', 'Dosya seçilirken bir hata oluştu.');
    }
  };

  const handleDeleteFile = () => {
    Alert.alert(
      'Dosyayı Sil',
      'Bu dosyayı silmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Sil', style: 'destructive', onPress: () => onFileDeleted?.() },
      ]
    );
  };

  const getInstructions = () => {
    switch (document.id) {
      case 'tax_certificate':
        return 'Vergi levhası PDF şeklinde yüklenmelidir. Belge net ve okunaklı olmalıdır.';
      case 'license_front':
        return 'Ehliyet fotoğrafı net ve okunaklı olmalıdır. Tüm bilgiler görünmeli.';
      case 'vehicle_photo':
        return 'Araç fotoğrafında plaka net görünmelidir. Aracın tamamı çerçevede olmalı.';
      default:
        return '';
    }
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onClose}
        contentContainerStyle={styles.modalContainer}
      >
        <Card style={styles.card}>
          <Card.Content style={styles.content}>

            {/* Header */}
            <View style={styles.header}>
              <MaterialCommunityIcons
                name={document.icon}
                size={40}
                color="#26a69a"
              />
              <Text variant="headlineSmall" style={styles.title}>
                {document.title}
              </Text>
            </View>

            <Divider style={styles.divider} />

            {/* Status */}
            <View style={styles.statusSection}>
              <Text variant="titleMedium" style={styles.statusLabel}>
                Durum:
              </Text>
              {hasUploadedFile ? (
                <View style={styles.statusRow}>
                  <MaterialCommunityIcons name="check-circle" size={20} color="#4CAF50" />
                  <Text style={styles.uploadedText}>{document.uploadedFileName}</Text>
                </View>
              ) : (
                <View style={styles.statusRow}>
                  <MaterialCommunityIcons name="alert-circle" size={20} color="#ff9800" />
                  <Text style={styles.pendingText}>Henüz yüklenmedi</Text>
                </View>
              )}
            </View>

            <Divider style={styles.divider} />

            {/* Instructions */}
            <View style={styles.instructionsSection}>
              <MaterialCommunityIcons name="information" size={20} color="#26a69a" />
              <Text style={styles.instructionsText}>{getInstructions()}</Text>
            </View>

            {/* File Info */}
            <View style={styles.fileInfoSection}>
              <Text style={styles.fileInfoText}>
                • Kabul edilen format: {document.fileExtension}
              </Text>
              <Text style={styles.fileInfoText}>
                • Maksimum dosya boyutu: 5MB
              </Text>
            </View>

            {/* Buttons */}
            <View style={styles.buttonsSection}>
              {hasUploadedFile ? (
                // File uploaded - show replace and delete options
                <View style={styles.uploadedActions}>
                  <Button
                    mode="outlined"
                    onPress={handleDeleteFile}
                    style={styles.deleteButton}
                    icon="delete"
                    textColor="#f44336"
                  >
                    Sil
                  </Button>
                  <Button
                    mode="contained"
                    onPress={handleDocumentPick}
                    style={styles.replaceButton}
                    icon="refresh"
                  >
                    Değiştir
                  </Button>
                </View>
              ) : (
                // No file uploaded - show upload options
                <View style={styles.uploadActions}>
                  {isImageDocument && (
                    <>
                      <Button
                        mode="contained"
                        onPress={handleCameraCapture}
                        style={[styles.actionButton, styles.cameraButton]}
                        icon="camera"
                      >
                        Fotoğraf Çek
                      </Button>
                      <Button
                        mode="contained"
                        onPress={handleGalleryPick}
                        style={[styles.actionButton, styles.galleryButton]}
                        icon="image"
                      >
                        Galeriden Seç
                      </Button>
                    </>
                  )}
                  <Button
                    mode={isImageDocument ? "outlined" : "contained"}
                    onPress={handleDocumentPick}
                    style={[styles.actionButton, isImageDocument ? styles.filePickerButton : styles.primaryButton]}
                    icon="file-upload"
                  >
                    {isPdfDocument ? 'PDF Seç' : 'Dosya Seç'}
                  </Button>
                </View>
              )}

              {/* Cancel Button */}
              <Button
                mode="text"
                onPress={onClose}
                style={styles.cancelButton}
              >
                İptal
              </Button>
            </View>

          </Card.Content>
        </Card>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  content: {
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    marginTop: 12,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#26a69a',
  },
  divider: {
    marginVertical: 16,
  },
  statusSection: {
    marginBottom: 8,
  },
  statusLabel: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  uploadedText: {
    marginLeft: 8,
    color: '#4CAF50',
    fontWeight: '600',
    flex: 1,
  },
  pendingText: {
    marginLeft: 8,
    color: '#ff9800',
    fontWeight: '600',
  },
  instructionsSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  instructionsText: {
    marginLeft: 8,
    color: '#26a69a',
    flex: 1,
    lineHeight: 20,
  },
  fileInfoSection: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  fileInfoText: {
    color: '#666',
    fontSize: 13,
    marginBottom: 4,
  },
  buttonsSection: {
    gap: 16,
  },
  uploadedActions: {
    flexDirection: 'row',
    gap: 12,
  },
  deleteButton: {
    flex: 1,
    borderColor: '#f44336',
  },
  replaceButton: {
    flex: 1,
  },
  uploadActions: {
    gap: 12,
  },
  actionButton: {
    paddingVertical: 12,
  },
  cameraButton: {
    backgroundColor: '#26a69a',
  },
  galleryButton: {
    backgroundColor: '#4CAF50',
  },
  filePickerButton: {
    borderColor: '#666',
  },
  primaryButton: {
    backgroundColor: '#26a69a',
  },
  cancelButton: {
    paddingVertical: 8,
  },
});