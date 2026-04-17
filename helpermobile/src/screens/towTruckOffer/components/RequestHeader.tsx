/**
 * RequestHeader Component
 *
 * Çekici talebi ekranının üst kısmında talep numarasını gösteren bileşen.
 * Talep ID'sini 4 haneli formatta gösterir (örn: #0231)
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface RequestHeaderProps {
  /** Talep ID numarası */
  requestId: number;
}

export default function RequestHeader({ requestId }: RequestHeaderProps) {
  // ID'yi 4 haneli formata çevir (örn: 231 -> 0231)
  const formattedId = requestId.toString().padStart(4, '0');

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <MaterialCommunityIcons name="clipboard-text" size={24} color="#26a69a" />
        <Text style={styles.text}>Talep #{formattedId}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 12,
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  text: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
});
