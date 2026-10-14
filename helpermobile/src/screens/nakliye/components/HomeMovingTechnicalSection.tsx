import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Chip } from 'react-native-paper';
import { FkTextInput } from '../../../components/fk';
import { colors } from '../../../theme/design';

interface HomeMovingTechnicalSectionProps {
  capacity: string;
  volume: string;
  length: string;
  width: string;
  height: string;
  hasLift: boolean;
  hasRamp: boolean;
  onCapacityChange: (value: string) => void;
  onVolumeChange: (value: string) => void;
  onLengthChange: (value: string) => void;
  onWidthChange: (value: string) => void;
  onHeightChange: (value: string) => void;
  onHasLiftChange: (value: boolean) => void;
  onHasRampChange: (value: boolean) => void;
  errors: Record<string, string>;
}

export default function HomeMovingTechnicalSection({
  capacity,
  volume,
  length,
  width,
  height,
  hasLift,
  hasRamp,
  onCapacityChange,
  onVolumeChange,
  onLengthChange,
  onWidthChange,
  onHeightChange,
  onHasLiftChange,
  onHasRampChange,
  errors,
}: HomeMovingTechnicalSectionProps) {
  return (
    <View style={styles.formSection}>
      <Text variant="titleSmall" style={styles.subsectionTitle}>Teknik Özellikler</Text>

      <View style={styles.row}>
        <FkTextInput
          label="Yük Kapasitesi (ton) *"
          value={capacity}
          onChange={onCapacityChange}
          keyboardType="numeric"
          containerStyle={[styles.halfInput, styles.inputLeft]}
          invalid={!!(!!errors.capacity)}
          placeholder="3.5"
        />
        <FkTextInput
          label="Hacim (m³) *"
          value={volume}
          onChange={onVolumeChange}
          keyboardType="numeric"
          containerStyle={[styles.halfInput, styles.inputRight]}
          invalid={!!(!!errors.volume)}
          placeholder="15"
        />
      </View>

      <View style={styles.row}>
        <FkTextInput
          label="Uzunluk (m)"
          value={length}
          onChange={onLengthChange}
          keyboardType="numeric"
          containerStyle={[styles.halfInput, styles.inputLeft]}
          placeholder="4.2"
        />
        <FkTextInput
          label="Genişlik (m)"
          value={width}
          onChange={onWidthChange}
          keyboardType="numeric"
          containerStyle={[styles.halfInput, styles.inputRight]}
          placeholder="2.1"
        />
      </View>

      <FkTextInput
        label="Yükseklik (m)"
        value={height}
        onChange={onHeightChange}
        keyboardType="numeric"
        containerStyle={styles.input}
        placeholder="2.2"
      />

      {/* Special Features */}
      <View style={styles.checkboxSection}>
        <Text variant="titleSmall" style={styles.subsectionTitle}>Özel Özellikler</Text>
        <View style={styles.checkboxRow}>
          <Chip
            selected={hasLift}
            onPress={() => onHasLiftChange(!hasLift)}
            icon={hasLift ? 'check' : 'plus'}
            mode={hasLift ? 'flat' : 'outlined'}
            style={styles.featureChip}
          >
            Hidrolik Lift
          </Chip>
          <Chip
            selected={hasRamp}
            onPress={() => onHasRampChange(!hasRamp)}
            icon={hasRamp ? 'check' : 'plus'}
            mode={hasRamp ? 'flat' : 'outlined'}
            style={styles.featureChip}
          >
            Rampa
          </Chip>
        </View>
      </View>
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
    color: colors.neutral[500],
  },
  input: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
    marginBottom: 16,
  },
  inputLeft: {
    marginRight: 6,
  },
  inputRight: {
    marginLeft: 6,
  },
  checkboxSection: {
    marginTop: 16,
  },
  checkboxRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  featureChip: {
    marginBottom: 4,
  },
});
