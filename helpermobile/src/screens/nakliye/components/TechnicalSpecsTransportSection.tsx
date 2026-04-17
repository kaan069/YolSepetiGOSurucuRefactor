import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, TextInput, Chip } from 'react-native-paper';

interface TechnicalSpecsTransportSectionProps {
  capacity: string;
  volume: string;
  length: string;
  width: string;
  height: string;
  maxWeight: string;
  hasLift: boolean;
  hasRamp: boolean;
  onCapacityChange: (value: string) => void;
  onVolumeChange: (value: string) => void;
  onLengthChange: (value: string) => void;
  onWidthChange: (value: string) => void;
  onHeightChange: (value: string) => void;
  onMaxWeightChange: (value: string) => void;
  onHasLiftChange: (value: boolean) => void;
  onHasRampChange: (value: boolean) => void;
  errors: Record<string, string>;
}

export default function TechnicalSpecsTransportSection({
  capacity,
  volume,
  length,
  width,
  height,
  maxWeight,
  hasLift,
  hasRamp,
  onCapacityChange,
  onVolumeChange,
  onLengthChange,
  onWidthChange,
  onHeightChange,
  onMaxWeightChange,
  onHasLiftChange,
  onHasRampChange,
  errors,
}: TechnicalSpecsTransportSectionProps) {
  return (
    <View style={styles.formSection}>
      <Text variant="titleSmall" style={styles.subsectionTitle}>Teknik Özellikler</Text>

      <View style={styles.row}>
        <TextInput
          label="Yük Kapasitesi (ton) *"
          value={capacity}
          onChangeText={onCapacityChange}
          keyboardType="numeric"
          style={[styles.halfInput, styles.inputLeft]}
          error={!!errors.capacity}
          placeholder="3.5"
        />
        <TextInput
          label="Hacim (m³) *"
          value={volume}
          onChangeText={onVolumeChange}
          keyboardType="numeric"
          style={[styles.halfInput, styles.inputRight]}
          error={!!errors.volume}
          placeholder="15"
        />
      </View>

      <View style={styles.row}>
        <TextInput
          label="Uzunluk (m)"
          value={length}
          onChangeText={onLengthChange}
          keyboardType="numeric"
          style={[styles.halfInput, styles.inputLeft]}
          placeholder="4.2"
        />
        <TextInput
          label="Genişlik (m)"
          value={width}
          onChangeText={onWidthChange}
          keyboardType="numeric"
          style={[styles.halfInput, styles.inputRight]}
          placeholder="2.1"
        />
      </View>

      <View style={styles.row}>
        <TextInput
          label="Yükseklik (m)"
          value={height}
          onChangeText={onHeightChange}
          keyboardType="numeric"
          style={[styles.halfInput, styles.inputLeft]}
          placeholder="2.2"
        />
        <TextInput
          label="Max Ağırlık (kg)"
          value={maxWeight}
          onChangeText={onMaxWeightChange}
          keyboardType="numeric"
          style={[styles.halfInput, styles.inputRight]}
          placeholder="3500"
        />
      </View>

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
    color: '#666',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
    marginBottom: 16,
    backgroundColor: 'white',
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
