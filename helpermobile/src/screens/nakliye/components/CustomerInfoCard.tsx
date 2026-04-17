// Müşteri bilgileri kartı - Nakliye
import React from 'react';
import { View, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Card, Text, Divider } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface CustomerInfoCardProps {
  name: string;
  phone?: string;
}

export default function CustomerInfoCard({ name, phone }: CustomerInfoCardProps) {
  const handleCall = () => {
    if (phone) Linking.openURL(`tel:${phone}`);
  };

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <MaterialCommunityIcons name="account" size={24} color="#26a69a" />
          <Text variant="titleMedium" style={styles.title}>Müşteri Bilgileri</Text>
        </View>
        <Divider style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.label}>İsim:</Text>
          <Text style={styles.value}>{name}</Text>
        </View>

        {phone && (
          <TouchableOpacity style={styles.phoneRow} onPress={handleCall}>
            <View style={styles.row}>
              <Text style={styles.label}>Telefon:</Text>
              <Text style={[styles.value, styles.phoneLink]}>{phone}</Text>
            </View>
            <MaterialCommunityIcons name="phone" size={20} color="#26a69a" />
          </TouchableOpacity>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    marginLeft: 8,
    fontWeight: 'bold',
    color: '#333',
  },
  divider: {
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#e8f5e9',
    padding: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  phoneLink: {
    color: '#26a69a',
    textDecorationLine: 'underline',
  },
});
