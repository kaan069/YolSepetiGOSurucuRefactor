import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Checkbox, Menu, Text, TextInput } from 'react-native-paper';
import { useAppTheme } from '../../../../hooks/useAppTheme';
import { PLATFORM_TYPES, SUPPORTED_VEHICLE_TYPES } from '../constants';
import { EditVehicleFormData } from '../types';

interface Props {
  formData: EditVehicleFormData;
  updateField: (field: string) => (value: any) => void;
  toggleSupportedVehicleType: (type: string) => void;
}

export default function TowTruckFieldsCard({
  formData,
  updateField,
  toggleSupportedVehicleType,
}: Props) {
  const { appColors } = useAppTheme();
  const [showPlatformMenu, setShowPlatformMenu] = useState(false);

  return (
    <>
      <Card style={styles.card}>
        <Card.Content style={styles.cardContent}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Teknik Özellikler
          </Text>

          <Menu
            visible={showPlatformMenu}
            onDismiss={() => setShowPlatformMenu(false)}
            anchor={
              <TextInput
                label="Platform Türü"
                value={PLATFORM_TYPES.find((p) => p.value === formData.platformType)?.label || ''}
                onPress={() => setShowPlatformMenu(true)}
                style={styles.input}
                right={
                  <TextInput.Icon
                    icon="chevron-down"
                    onPress={() => setShowPlatformMenu(true)}
                  />
                }
                editable={false}
              />
            }
          >
            {PLATFORM_TYPES.map((type) => (
              <Menu.Item
                key={type.value}
                title={`${type.icon} ${type.label}`}
                onPress={() => {
                  updateField('platformType')(type.value);
                  setShowPlatformMenu(false);
                }}
              />
            ))}
          </Menu>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content style={styles.cardContent}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            🚗 Çekebileceği Araç Türleri *
          </Text>
          <Text
            variant="bodyMedium"
            style={[styles.vehicleTypesHelperText, { color: appColors.text.secondary }]}
          >
            Bu çekici aracın çekebileceği araç türlerini seçin (Birden fazla seçim yapabilirsiniz)
          </Text>

          <View style={styles.vehicleTypesContainer}>
            {SUPPORTED_VEHICLE_TYPES.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={styles.checkboxItem}
                onPress={() => toggleSupportedVehicleType(type.value)}
                activeOpacity={0.7}
              >
                <Checkbox
                  status={
                    formData.supportedVehicleTypes?.includes(type.value) ? 'checked' : 'unchecked'
                  }
                  onPress={() => toggleSupportedVehicleType(type.value)}
                  color="#26a69a"
                />
                <Text style={styles.checkboxLabel}>
                  {type.icon} {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card.Content>
      </Card>
    </>
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
  input: {
    marginBottom: 16,
  },
  vehicleTypesContainer: {
    marginTop: 8,
  },
  vehicleTypesHelperText: {
    marginBottom: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 8,
  },
  checkboxLabel: {
    fontSize: 17,
    marginLeft: 12,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
});
