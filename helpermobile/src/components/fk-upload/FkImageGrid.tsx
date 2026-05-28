import React from 'react';
import { Image, Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFkTokens } from '../../hooks/useFkTokens';
import FkFormError from '../fk-ui/FkFormError';
import FkLabel from '../fk-ui/FkLabel';
import { pickImage } from './internal/pickerUtils';

interface Props {
  value: (string | null)[];
  onChange: (next: (string | null)[]) => void;
  slots?: number;
  label?: string;
  helperText?: string;
  source?: 'camera' | 'gallery' | 'both';
  quality?: number;
  disabled?: boolean;
  error?: string | null;
  slotLabelPrefix?: string;
  aspectRatio?: number;
  columns?: number;
  containerStyle?: ViewStyle;
  testID?: string;
}

export default function FkImageGrid({
  value,
  onChange,
  slots = 4,
  label,
  helperText,
  source = 'gallery',
  quality,
  disabled,
  error,
  slotLabelPrefix = 'Görsel',
  aspectRatio = 1.3,
  columns = 2,
  containerStyle,
  testID,
}: Props) {
  const { tokens } = useFkTokens();

  const arr = React.useMemo(() => {
    const out = Array<string | null>(slots).fill(null);
    for (let i = 0; i < Math.min(value.length, slots); i++) out[i] = value[i] ?? null;
    return out;
  }, [value, slots]);

  const handlePick = async (index: number) => {
    if (disabled) return;
    const uri = await pickImage({ source: source === 'both' ? 'gallery' : source, quality });
    if (!uri) return;
    const next = arr.slice();
    next[index] = uri;
    onChange(next);
  };

  const handleRemove = (index: number) => {
    if (disabled) return;
    const next = arr.slice();
    next[index] = null;
    onChange(next);
  };

  const widthPct = `${Math.floor(100 / columns) - 3}%` as const;

  return (
    <View style={containerStyle} testID={testID}>
      {label ? <FkLabel disabled={disabled}>{label}</FkLabel> : null}
      {helperText ? (
        <Text style={[styles.helper, { color: tokens.colors.textSecondary }]}>{helperText}</Text>
      ) : null}

      <View style={styles.grid}>
        {arr.map((uri, index) => (
          <View key={index} style={[styles.slot, { width: widthPct, aspectRatio }]}>
            {uri ? (
              <Pressable
                onPress={() => handleRemove(index)}
                style={[styles.filled, { borderRadius: tokens.radius.lg }]}
              >
                <Image source={{ uri }} style={[styles.image, { borderRadius: tokens.radius.lg }]} />
                {!disabled ? (
                  <View style={styles.removeBadge}>
                    <MaterialCommunityIcons name="close-circle" size={22} color={tokens.colors.error} />
                  </View>
                ) : null}
              </Pressable>
            ) : (
              <Pressable
                onPress={() => handlePick(index)}
                disabled={disabled}
                style={[
                  styles.empty,
                  {
                    backgroundColor: tokens.colors.surfaceMuted,
                    borderColor: tokens.colors.border,
                    borderRadius: tokens.radius.lg,
                    opacity: disabled ? 0.5 : 1,
                  },
                ]}
              >
                <MaterialCommunityIcons name="camera-plus" size={26} color={tokens.colors.textHint} />
                <Text style={[styles.emptyLabel, { color: tokens.colors.textHint }]}>
                  {slotLabelPrefix} {index + 1}
                </Text>
              </Pressable>
            )}
          </View>
        ))}
      </View>

      <FkFormError error={error} />
    </View>
  );
}

const styles = StyleSheet.create({
  helper: { fontSize: 12, marginBottom: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  slot: {},
  filled: { flex: 1, overflow: 'hidden', position: 'relative' },
  image: { width: '100%', height: '100%' },
  removeBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  empty: {
    flex: 1,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyLabel: { fontSize: 11, marginTop: 4 },
});
