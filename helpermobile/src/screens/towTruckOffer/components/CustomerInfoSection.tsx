/**
 * CustomerInfoSection Component
 *
 * Müşteri bilgilerini gösteren bileşen.
 * İsim, telefon numarası ve müşteriyi arama butonu içerir.
 *
 * NOT: Bu bileşen sadece iş kabul edildikten sonra (status !== 'pending') gösterilir.
 * Gizlilik nedeniyle pending durumundaki işlerde müşteri bilgileri gizlenir.
 */
import React from 'react';
import { View, StyleSheet, Linking, Alert } from 'react-native';
import { Text, Button } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { logger } from '../../../utils/logger';

interface CustomerInfoSectionProps {
  /** Müşteri adı soyadı */
  customerName?: string;
  /** Müşteri telefon numarası */
  customerPhone?: string;
}

export default function CustomerInfoSection({
  customerName,
  customerPhone,
}: CustomerInfoSectionProps) {
  // Müşteri bilgisi yoksa gösterme
  if (!customerName && !customerPhone) {
    return null;
  }

  // Müşteriyi ara
  const handleCallCustomer = () => {
    if (!customerPhone) return;

    const phoneUrl = `tel:${customerPhone}`;
    Linking.openURL(phoneUrl).catch((err) => {
      logger.error('orders', 'Telefon ama hatas');
      Alert.alert('Hata', 'Telefon uygulaması açılamadı.');
    });
  };

  return (
    <View style={styles.section}>
      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <MaterialCommunityIcons name="account" size={20} color="#26a69a" />
        <Text style={styles.sectionTitle}>Müşteri Bilgileri</Text>
      </View>

      {/* Section Content */}
      <View style={styles.sectionContent}>
        {/* İsim Soyisim */}
        {customerName && (
          <View style={styles.infoRow}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="account-circle" size={18} color="#26a69a" />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>İsim Soyisim</Text>
              <Text style={styles.infoValue}>{customerName}</Text>
            </View>
          </View>
        )}

        {/* Telefon */}
        {customerPhone && (
          <>
            <View style={styles.infoRow}>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="phone" size={18} color="#26a69a" />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Telefon</Text>
                <Text style={styles.infoValue}>{customerPhone}</Text>
              </View>
            </View>

            {/* Müşteriyi Ara Butonu */}
            <Button
              mode="contained"
              icon="phone"
              onPress={handleCallCustomer}
              style={styles.callButton}
              buttonColor="#4CAF50"
            >
              Müşteriyi Ara
            </Button>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 12,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  sectionContent: {
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
    lineHeight: 20,
  },
  callButton: {
    marginTop: 8,
    borderRadius: 8,
  },
});
