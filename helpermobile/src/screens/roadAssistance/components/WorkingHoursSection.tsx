import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, TextInput, Switch, useTheme } from 'react-native-paper';

interface WorkingHoursSectionProps {
  is24Hours: boolean;
  workingHoursStart?: string;
  workingHoursEnd?: string;
  onIs24HoursChange: (value: boolean) => void;
  onWorkingHoursStartChange: (value: string) => void;
  onWorkingHoursEndChange: (value: string) => void;
}

export default function WorkingHoursSection({
  is24Hours,
  workingHoursStart,
  workingHoursEnd,
  onIs24HoursChange,
  onWorkingHoursStartChange,
  onWorkingHoursEndChange,
}: WorkingHoursSectionProps) {
  const theme = useTheme();

  return (
    <View style={styles.formSection}>
      <Text variant="titleSmall" style={styles.subsectionTitle}>Çalışma Saatleri</Text>

      <View style={styles.switchRow}>
        <Text variant="bodyMedium">7/24 Hizmet</Text>
        <Switch
          value={is24Hours}
          onValueChange={onIs24HoursChange}
          color={theme.colors.primary}
        />
      </View>

      {!is24Hours && (
        <View style={styles.row}>
          <TextInput
            label="Başlangıç Saati"
            value={workingHoursStart || ''}
            onChangeText={onWorkingHoursStartChange}
            style={[styles.halfInput, styles.inputLeft]}
            placeholder="08:00"
          />
          <TextInput
            label="Bitiş Saati"
            value={workingHoursEnd || ''}
            onChangeText={onWorkingHoursEndChange}
            style={[styles.halfInput, styles.inputRight]}
            placeholder="22:00"
          />
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
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 12,
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
});
