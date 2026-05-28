import React from 'react';
import { Image, Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFkTokens } from '../../hooks/useFkTokens';
import FkButton from '../fk-ui/FkButton';
import FkFormError from '../fk-ui/FkFormError';
import FkLabel from '../fk-ui/FkLabel';
import { pickImage } from './internal/pickerUtils';

export type FkImageSource = 'camera' | 'gallery' | 'both';

interface Props {
  value: string | null;
  onChange: (uri: string | null) => void;
  label?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  loading?: boolean;
  error?: string | null;
  source?: FkImageSource;
  quality?: number;
  allowsEditing?: boolean;
  aspect?: [number, number];
  previewHeight?: number;
  containerStyle?: ViewStyle;
  emptyText?: string;
  testID?: string;
}

export default function FkImageUpload({
  value,
  onChange,
  label,
  helperText,
  required,
  disabled,
  loading,
  error,
  source = 'both',
  quality,
  allowsEditing,
  aspect,
  previewHeight = 200,
  containerStyle,
  emptyText,
  testID,
}: Props) {
  const { tokens } = useFkTokens();

  const handlePickCamera = async () => {
    if (disabled) return;
    const uri = await pickImage({ source: 'camera', quality, allowsEditing, aspect });
    if (uri) onChange(uri);
  };

  const handlePickGallery = async () => {
    if (disabled) return;
    const uri = await pickImage({ source: 'gallery', quality, allowsEditing, aspect });
    if (uri) onChange(uri);
  };

  const handleRemove = () => {
    if (!disabled) onChange(null);
  };

  return (
    <View style={[{ marginBottom: tokens.spacing.md }, containerStyle]} testID={testID}>
      {label ? <FkLabel required={required} disabled={disabled}>{label}</FkLabel> : null}
      {helperText ? (
        <Text style={[styles.helper, { color: tokens.colors.textSecondary }]}>{helperText}</Text>
      ) : null}

      {loading ? (
        <View style={[styles.loading, { height: previewHeight, backgroundColor: tokens.colors.surfaceMuted, borderRadius: tokens.radius.lg }]}>
          <ActivityIndicator color={tokens.colors.primary} />
        </View>
      ) : value ? (
        <View>
          <View style={{ borderRadius: tokens.radius.lg, overflow: 'hidden' }}>
            <Image source={{ uri: value }} style={{ width: '100%', height: previewHeight }} />
            {!disabled ? (
              <Pressable style={styles.removeBadge} onPress={handleRemove} hitSlop={8}>
                <MaterialCommunityIcons name="close-circle" size={28} color={tokens.colors.error} />
              </Pressable>
            ) : null}
          </View>
          {!disabled && source !== 'camera' ? (
            <View style={[styles.actionsRow, { marginTop: tokens.spacing.md }]}>
              {source === 'both' ? (
                <FkButton variant="secondary" icon="camera" onPress={handlePickCamera} style={styles.actionBtn}>
                  Tekrar Çek
                </FkButton>
              ) : null}
              <FkButton variant="secondary" icon="image" onPress={handlePickGallery} style={styles.actionBtn}>
                Değiştir
              </FkButton>
            </View>
          ) : null}
        </View>
      ) : (
        <View>
          <View style={styles.placeholderRow}>
            {(source === 'camera' || source === 'both') ? (
              <Pressable
                onPress={handlePickCamera}
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
                <MaterialCommunityIcons name="camera" size={28} color={tokens.colors.primary} />
                <Text style={[styles.placeholderText, { color: tokens.colors.primary }]}>Kameradan Çek</Text>
              </Pressable>
            ) : null}
            {(source === 'gallery' || source === 'both') ? (
              <Pressable
                onPress={handlePickGallery}
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
                <MaterialCommunityIcons name="image" size={28} color={tokens.colors.primary} />
                <Text style={[styles.placeholderText, { color: tokens.colors.primary }]}>Galeriden Seç</Text>
              </Pressable>
            ) : null}
          </View>
          {emptyText ? (
            <Text style={[styles.helper, { color: tokens.colors.textHint, marginTop: 8 }]}>{emptyText}</Text>
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
  removeBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#ffffff',
    borderRadius: 14,
  },
  actionsRow: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1 },
  placeholderRow: { flexDirection: 'row', gap: 12 },
  placeholderBtn: {
    flex: 1,
    borderWidth: 2,
    borderStyle: 'dashed',
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: { marginTop: 6, fontWeight: '600', fontSize: 14 },
});
