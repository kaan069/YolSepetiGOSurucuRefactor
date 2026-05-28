import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Chip, Text } from 'react-native-paper';
import { FkFormSection, FkSelect, FkTextInput } from '../../../../components/fk';
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
    <FkFormSection title="Transfer Bilgileri">
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

      <FkTextInput
        label="Yolcu Kapasitesi"
        required
        value={transferData.passengerCapacity?.toString() || ''}
        onChange={(val) => setFieldValue('passengerCapacity', parseInt(val, 10) || 0)}
        keyboardType="numeric"
        placeholder="16"
      />

      <FkSelect
        label="Araç Sınıfı"
        placeholder="Araç sınıfı seçin"
        value={transferData.vehicleClass || null}
        options={isVip ? TRANSFER_VIP_VEHICLE_CLASSES : TRANSFER_ORGANIZATION_VEHICLE_CLASSES}
        onChange={(val) => setFieldValue('vehicleClass', val)}
      />
    </FkFormSection>
  );
}

const styles = StyleSheet.create({
  chipRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  chipLabel: { marginRight: 8 },
});
