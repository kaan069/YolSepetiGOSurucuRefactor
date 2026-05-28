import React from 'react';
import { Image, Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFkTokens } from '../../hooks/useFkTokens';
import FkButton from '../fk-ui/FkButton';
import FkFormError from '../fk-ui/FkFormError';
import FkLabel from '../fk-ui/FkLabel';
import { isPdfFile } from '../../utils/fileHelpers';
import { pickDocument, pickImage } from './internal/pickerUtils';

interface Props {
  value: string | null;
  onChange: (uri: string | null) => void;
  label?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  loading?: boolean;
  error?: string | null;
  accept?: Array<'image' | 'pdf'>;
  enableCamera?: boolean;
  enableGallery?: boolean;
  enableFile?: boolean;
  maxSizeMB?: number;
  imageQuality?: number;
  previewHeight?: number;
  containerStyle?: ViewStyle;
  testID?: string;
}

export default function FkDocumentUpload({
  value,
  onChange,
  label,
  helperText,
  required,
  disabled,
  loading,
  error,
  accept = ['image', 'pdf'],
  enableCamera = true,
  enableGallery = true,
  enableFile = true,
  maxSizeMB = 5,
  imageQuality,
  previewHeight = 200,
  containerStyle,
  testID,
}: Props) {
  const { tokens } = useFkTokens();
  const acceptImage = accept.includes('image');
  const acceptPdf = accept.includes('pdf');

  const showCamera = enableCamera && acceptImage;
  const showGallery = enableGallery && acceptImage;
  const showFile = enableFile && (acceptPdf || acceptImage);

  const handleCamera = async () => {
    if (disabled) return;
    const uri = await pickImage({ source: 'camera', quality: imageQuality });
    if (uri) onChange(uri);
  };

  const handleGallery = async () => {
    if (disabled) return;
    const uri = await pickImage({ source: 'gallery', quality: imageQuality });
    if (uri) onChange(uri);
  };

  const handleFile = async () => {
    if (disabled) return;
    const doc = await pickDocument({ accept, maxSizeMB });
    if (doc) onChange(doc.uri);
  };

  const handleRemove = () => {
    if (!disabled) onChange(null);
  };

  const renderPreview = () => {
    if (!value) return null;
    if (isPdfFile(value)) {
      return (
        <View
          style={[
            styles.pdfPreview,
            { backgroundColor: tokens.colors.surfaceMuted, borderRadius: tokens.radius.lg, height: previewHeight },
          ]}
        >
          <MaterialCommunityIcons name="file-pdf-box" size={48} color={tokens.colors.error} />
          <Text
            style={[styles.pdfName, { color: tokens.colors.textPrimary }]}
            numberOfLines={1}
          >
            {value.split('/').pop()}
          </Text>
        </View>
      );
    }
    return (
      <View style={{ borderRadius: tokens.radius.lg, overflow: 'hidden' }}>
        <Image source={{ uri: value }} style={{ width: '100%', height: previewHeight }} />
      </View>
    );
  };

  return (
    <View style={[{ marginBottom: tokens.spacing.md }, containerStyle]} testID={testID}>
      {label ? <FkLabel required={required} disabled={disabled}>{label}</FkLabel> : null}
      {helperText ? (
        <Text style={[styles.helper, { color: tokens.colors.textSecondary }]}>{helperText}</Text>
      ) : null}

      {loading ? (
        <View
          style={[
            styles.loading,
            {
              height: previewHeight,
              backgroundColor: tokens.colors.surfaceMuted,
              borderRadius: tokens.radius.lg,
            },
          ]}
        >
          <ActivityIndicator color={tokens.colors.primary} />
        </View>
      ) : value ? (
        <View>
          {renderPreview()}
          {!disabled ? (
            <View style={[styles.actionsRow, { marginTop: tokens.spacing.md }]}>
              {showGallery ? (
                <FkButton variant="secondary" icon="image" onPress={handleGallery} style={styles.actionBtn}>
                  Değiştir
                </FkButton>
              ) : showFile ? (
                <FkButton variant="secondary" icon="refresh" onPress={handleFile} style={styles.actionBtn}>
                  Değiştir
                </FkButton>
              ) : null}
              <FkButton variant="danger" icon="delete" onPress={handleRemove} style={styles.actionBtn}>
                Sil
              </FkButton>
            </View>
          ) : null}
        </View>
      ) : (
        <View>
          {(showCamera || showGallery) ? (
            <View style={styles.placeholderRow}>
              {showCamera ? (
                <Pressable
                  onPress={handleCamera}
                  disabled={disabled}
                  style={[
                    styles.placeholderBtn,
                    {
                      backgroundColor: tokens.colors.surfaceMuted,
                      borderColor: tokens.colors.border,
                      borderRadius: tokens.radius.lg,
                      opacity: disabled ? 0.5 : 1,
                    },
                  ]}
                >
                  <MaterialCommunityIcons name="camera" size={26} color={tokens.colors.primary} />
                  <Text style={[styles.placeholderText, { color: tokens.colors.primary }]}>Fotoğraf Çek</Text>
                </Pressable>
              ) : null}
              {showGallery ? (
                <Pressable
                  onPress={handleGallery}
                  disabled={disabled}
                  style={[
                    styles.placeholderBtn,
                    {
                      backgroundColor: tokens.colors.surfaceMuted,
                      borderColor: tokens.colors.border,
                      borderRadius: tokens.radius.lg,
                      opacity: disabled ? 0.5 : 1,
                    },
                  ]}
                >
                  <MaterialCommunityIcons name="image" size={26} color={tokens.colors.primary} />
                  <Text style={[styles.placeholderText, { color: tokens.colors.primary }]}>Galeriden Seç</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}
          {showFile ? (
            <FkButton
              variant="secondary"
              icon="file-upload"
              onPress={handleFile}
              disabled={disabled}
              style={{ marginTop: showCamera || showGallery ? 12 : 0 }}
              fullWidth
            >
              {acceptPdf && !acceptImage ? 'PDF Seç' : 'Dosya Seç (PDF/Resim)'}
            </FkButton>
          ) : null}
        </View>
      )}

      <FkFormError error={error} />
    </View>
  );
}

const styles = StyleSheet.create({
  helper: { fontSize: 12, marginBottom: 8 },
  loading: { justifyContent: 'center', alignItems: 'center' },
  pdfPreview: { alignItems: 'center', justifyContent: 'center', gap: 8 },
  pdfName: { fontSize: 14, fontWeight: '600', maxWidth: '80%' },
  actionsRow: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1 },
  placeholderRow: { flexDirection: 'row', gap: 12 },
  placeholderBtn: {
    flex: 1,
    borderWidth: 2,
    borderStyle: 'dashed',
    paddingVertical: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: { marginTop: 6, fontWeight: '600', fontSize: 13 },
});
