// Müşteri bilgileri kartı - Nakliye iş detayı (devam eden işler için)
import React from 'react';
import { View, StyleSheet, Linking, Alert } from 'react-native';
import { Card, Text, Button } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../../../hooks/useAppTheme';

interface JobCustomerInfoCardProps {
  name?: string;
  phone?: string;
  visible: boolean;
}

export default function JobCustomerInfoCard({ name, phone, visible }: JobCustomerInfoCardProps) {
  const { appColors } = useAppTheme();

  if (!visible || (!name && !phone)) return null;

  const handleCall = () => {
    if (!phone) return;
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    Linking.openURL(`tel:${cleanPhone}`).catch(() => Alert.alert('Hata', 'Telefon açılamadı'));
  };

  return (
    <Card style={styles.card}>
      <Card.Title
        title="Müşteri Bilgileri"
        left={() => <MaterialCommunityIcons name="account" size={24} color="#FF9800" />}
      />
      <Card.Content>
        {name && (
          <View style={styles.row}>
            <MaterialCommunityIcons name="account-circle" size={20} color="#666" />
            <Text style={[styles.label, { color: appColors.text.secondary }]}>İsim:</Text>
            <Text style={[styles.value, { color: appColors.text.primary }]}>{name}</Text>
          </View>
        )}
        {phone && (
          <>
            <View style={styles.row}>
              <MaterialCommunityIcons name="phone" size={20} color="#666" />
              <Text style={[styles.label, { color: appColors.text.secondary }]}>Telefon:</Text>
              <Text style={[styles.value, { color: appColors.text.primary }]}>{phone}</Text>
            </View>
            <Button
              mode="contained"
              icon="phone"
              onPress={handleCall}
              style={styles.callButton}
              buttonColor="#FF9800"
            >
              Müşteriyi Ara
            </Button>
          </>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 80,
  },
  value: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  callButton: {
    marginTop: 12,
    borderRadius: 12,
  },
});
