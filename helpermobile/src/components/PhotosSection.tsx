import React, { useState } from 'react';
import {
  View,
  Image,
  ScrollView,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import CollapsibleCard from './common/CollapsibleCard';
import { RequestPhoto } from '../api/types';

interface PhotosSectionProps {
  photos?: RequestPhoto[];
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const THUMBNAIL_SIZE = 80;

export default function PhotosSection({ photos }: PhotosSectionProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (!photos || photos.length === 0) {
    return null;
  }

  const customerPhotos = photos.filter(p => p.uploaded_by !== 'driver');
  const driverPhotos = photos.filter(p => p.uploaded_by === 'driver');
  const hasGroups = driverPhotos.length > 0 && customerPhotos.length > 0;

  const openPhoto = (index: number) => setSelectedIndex(index);
  const closePhoto = () => setSelectedIndex(null);

  const goNext = () => {
    if (selectedIndex !== null && selectedIndex < photos.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  };

  const goPrev = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  const renderPhotoRow = (items: typeof photos, startIndex: number) => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.thumbnailRow}
    >
      {items.map((photo) => {
        const globalIndex = photos.findIndex(p => p.id === photo.id);
        return (
          <TouchableOpacity
            key={photo.id}
            onPress={() => openPhoto(globalIndex)}
            activeOpacity={0.8}
            style={styles.thumbnailWrapper}
          >
            <Image
              source={{ uri: photo.image_url }}
              style={styles.thumbnail}
              resizeMode="cover"
            />
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  return (
    <>
      <CollapsibleCard
        title={`Fotoğraflar (${photos.length})`}
        icon="image-multiple"
        iconColor="#1565c0"
        defaultExpanded={true}
      >
        {hasGroups ? (
          <>
            <Text style={styles.groupLabel}>Müşteri Fotoğrafları ({customerPhotos.length})</Text>
            {renderPhotoRow(customerPhotos, 0)}
            <View style={{ height: 12 }} />
            <Text style={styles.groupLabel}>Sürücü Fotoğrafları ({driverPhotos.length})</Text>
            {renderPhotoRow(driverPhotos, customerPhotos.length)}
          </>
        ) : (
          renderPhotoRow(photos, 0)
        )}
      </CollapsibleCard>

      <Modal
        visible={selectedIndex !== null}
        transparent
        animationType="fade"
        onRequestClose={closePhoto}
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <StatusBar backgroundColor="rgba(0,0,0,0.95)" barStyle="light-content" />

          {/* Kapat butonu */}
          <TouchableOpacity style={styles.closeButton} onPress={closePhoto}>
            <MaterialCommunityIcons name="close" size={30} color="#fff" />
          </TouchableOpacity>

          {/* Fotoğraf sayacı */}
          {selectedIndex !== null && (
            <Text style={styles.counter}>
              {selectedIndex + 1} / {photos.length}
            </Text>
          )}

          {/* Ana fotoğraf */}
          {selectedIndex !== null && (
            <TouchableOpacity
              style={styles.imageContainer}
              onPress={closePhoto}
              activeOpacity={1}
            >
              <Image
                source={{ uri: photos[selectedIndex].image_url }}
                style={styles.fullImage}
                resizeMode="contain"
              />
            </TouchableOpacity>
          )}

          {/* Sol ok */}
          {selectedIndex !== null && selectedIndex > 0 && (
            <TouchableOpacity style={styles.arrowLeft} onPress={goPrev}>
              <MaterialCommunityIcons name="chevron-left" size={40} color="#fff" />
            </TouchableOpacity>
          )}

          {/* Sağ ok */}
          {selectedIndex !== null && selectedIndex < photos.length - 1 && (
            <TouchableOpacity style={styles.arrowRight} onPress={goNext}>
              <MaterialCommunityIcons name="chevron-right" size={40} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  groupLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6,
  },
  thumbnailRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  thumbnailWrapper: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  thumbnail: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    borderRadius: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 48,
    right: 16,
    zIndex: 10,
    padding: 8,
  },
  counter: {
    position: 'absolute',
    top: 52,
    alignSelf: 'center',
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    zIndex: 10,
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.8,
  },
  arrowLeft: {
    position: 'absolute',
    left: 8,
    top: '50%',
    padding: 12,
    zIndex: 10,
  },
  arrowRight: {
    position: 'absolute',
    right: 8,
    top: '50%',
    padding: 12,
    zIndex: 10,
  },
});
