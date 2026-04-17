import React from 'react';
import { StyleSheet, View, TouchableOpacity, Image } from 'react-native';
import { Card, Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../../../../hooks/useAppTheme';
import { INTERIOR_PHOTO_SLOT_COUNT } from '../constants';

interface Props {
  interiorPhotos: (string | null)[];
  onPickPhoto: (index: number) => void;
  onRemovePhoto: (index: number) => void;
}

export default function TransferInteriorPhotosCard({
  interiorPhotos,
  onPickPhoto,
  onRemovePhoto,
}: Props) {
  const { isDarkMode, appColors } = useAppTheme();

  return (
    <Card style={styles.card}>
      <Card.Content style={styles.cardContent}>
        <Text variant="titleMedium" style={[styles.sectionTitle, { color: '#FFB300' }]}>
          ⭐ Araç İçi Görselleri
        </Text>
        <Text
          variant="bodySmall"
          style={{ color: appColors.text.secondary, marginBottom: 12 }}
        >
          Müşterilerin aracınızın içini görebilmesi için görseller ekleyin
        </Text>
        <View style={styles.grid}>
          {Array.from({ length: INTERIOR_PHOTO_SLOT_COUNT }, (_, index) => (
            <View key={index} style={styles.slot}>
              {interiorPhotos[index] ? (
                <TouchableOpacity
                  onPress={() => onRemovePhoto(index)}
                  style={styles.filledSlot}
                >
                  <Image
                    source={{ uri: interiorPhotos[index]! }}
                    style={styles.slotImage}
                  />
                  <View style={styles.removeBadge}>
                    <MaterialCommunityIcons
                      name="close-circle"
                      size={22}
                      color="#f44336"
                    />
                  </View>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={() => onPickPhoto(index)}
                  style={[
                    styles.emptySlot,
                    { backgroundColor: isDarkMode ? '#2A2A2A' : '#f5f5f5' },
                  ]}
                >
                  <MaterialCommunityIcons name="camera-plus" size={28} color="#999" />
                  <Text style={styles.emptySlotLabel}>Görsel {index + 1}</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
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
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  slot: {
    width: '47%',
    aspectRatio: 1.3,
  },
  filledSlot: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  slotImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  removeBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  emptySlot: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySlotLabel: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
});
