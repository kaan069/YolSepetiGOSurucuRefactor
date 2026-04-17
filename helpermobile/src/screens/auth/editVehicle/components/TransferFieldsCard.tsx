import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Chip, Text, TextInput } from 'react-native-paper';
import SelectDropdown from '../../../../components/common/SelectDropdown';
import { TransferVehicleInfo } from '../../../../store/useVehicleStore';
import {
  TRANSFER_ORGANIZATION_VEHICLE_CLASSES,
  TRANSFER_VIP_VEHICLE_CLASSES,
} from '../constants';
import { EditVehicleFormData } from '../types';

interface Props {
  formData: EditVehicleFormData;
  setFieldValue: (field: string, value: any) => void;
}

export default function TransferFieldsCard({ formData, setFieldValue }: Props) {
  const transferData = formData as Partial<TransferVehicleInfo>;
  const isVip = transferData.transferType === 'vip';

  return (
    <Card style={styles.card}>
      <Card.Content style={styles.cardContent}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Transfer Bilgileri
        </Text>

        <View style={styles.chipRow}>
          <Text variant="bodyMedium" style={styles.chipLabel}>
            Transfer Tipi:
          </Text>
          <Chip
            style={{ backgroundColor: isVip ? '#FFF3E0' : '#E8F5E9' }}
            textStyle={{ color: isVip ? '#E65100' : '#2E7D32' }}
          >
            {isVip ? '⭐ VIP' : '🚌 Servis/Organizasyon'}
          </Chip>
        </View>

        <TextInput
          label="Yolcu Kapasitesi *"
          value={transferData.passengerCapacity?.toString() || ''}
          onChangeText={(val) => setFieldValue('passengerCapacity', parseInt(val) || 0)}
          keyboardType="numeric"
          style={styles.input}
          placeholder="16"
        />

        <SelectDropdown
          label="Araç Sınıfı"
          value={transferData.vehicleClass || ''}
          options={isVip ? TRANSFER_VIP_VEHICLE_CLASSES : TRANSFER_ORGANIZATION_VEHICLE_CLASSES}
          onChange={(val) => setFieldValue('vehicleClass', val)}
          placeholder="Araç sınıfı seçin"
        />
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
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  chipLabel: {
    marginRight: 8,
  },
  input: {
    marginBottom: 16,
  },
});
