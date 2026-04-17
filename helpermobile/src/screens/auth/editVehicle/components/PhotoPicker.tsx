import React from 'react';
import { View, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../../../../hooks/useAppTheme';
import { isPdfFile } from '../../../../utils/fileHelpers';

interface Props {
  title: string;
  helperText: string;
  photoUri: string | null;
  loading?: boolean;
  onPickCamera: () => void;
  onPickGallery: () => void;
  onPickDocument: () => void;
  onRemove: () => void;
  replaceMode?: 'gallery' | 'document';
}

export default function PhotoPicker({
  title,
  helperText,
  photoUri,
  loading = false,
  onPickCamera,
  onPickGallery,
  onPickDocument,
  onRemove,
  replaceMode = 'gallery',
}: Props) {
  const { appColors } = useAppTheme();

  const replaceHandler = replaceMode === 'document' ? onPickDocument : onPickGallery;
  const replaceIcon = replaceMode === 'document' ? 'refresh' : 'image';

  return (
    <Card style={styles.card}>
      <Card.Content style={styles.cardContent}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          {title}
        </Text>
        <Text
          variant="bodySmall"
          style={[
            styles.helperText,
            { fontWeight: '700', fontSize: 15, color: appColors.text.secondary },
          ]}
        >
          {helperText}
        </Text>

        {loading ? (
          <View style={styles.photoLoadingContainer}>
            <Text>Fotoğraf yükleniyor...</Text>
          </View>
        ) : photoUri ? (
          <View style={styles.photoContainer}>
            {isPdfFile(photoUri) ? (
              <View style={styles.pdfPreview}>
                <MaterialCommunityIcons name="file-pdf-box" size={48} color="#f44336" />
                <Text style={styles.pdfFileName} numberOfLines={1}>
                  {photoUri.split('/').pop()}
                </Text>
              </View>
            ) : (
              <Image source={{ uri: photoUri }} style={styles.photoPreview} />
            )}
            <View style={styles.photoActions}>
              <Button
                mode="outlined"
                onPress={replaceHandler}
                style={styles.photoButton}
                icon={replaceIcon}
              >
                Değiştir
              </Button>
              <Button
                mode="outlined"
                onPress={onRemove}
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
              <TouchableOpacity style={styles.photoPickerButton} onPress={onPickCamera}>
                <MaterialCommunityIcons name="camera" size={32} color="#26a69a" />
                <Text style={styles.photoPickerText}>Kameradan Çek</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.photoPickerButton} onPress={onPickGallery}>
                <MaterialCommunityIcons name="image" size={32} color="#26a69a" />
                <Text style={styles.photoPickerText}>Galeriden Seç</Text>
              </TouchableOpacity>
            </View>
            <Button
              mode="outlined"
              icon="file-upload"
              onPress={onPickDocument}
              style={styles.filePickerButton}
            >
              Dosya Seç (PDF)
            </Button>
          </View>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    elevation: 2,
    marginBottom: 16,
  },
  cardContent: {
    padding: 20,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#26a69a',
  },
  helperText: {
    marginBottom: 12,
  },
  photoLoadingContainer: {
    padding: 20,
    alignItems: 'center',
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
    color: '#26a69a',
    fontWeight: '600',
    fontSize: 14,
  },
  filePickerButton: {
    marginTop: 12,
    borderColor: '#666',
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
});
