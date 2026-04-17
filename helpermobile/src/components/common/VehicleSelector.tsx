/**
 * VehicleSelector Component
 *
 * Tüm servis tipleri için ortak araç seçici component.
 * Çekici, Vinç, Nakliye ve Yol Yardım araçları için kullanılabilir.
 */
import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  Pressable,
  Dimensions,
} from 'react-native';
import { Text, RadioButton } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../../hooks/useAppTheme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Araç tipi - tüm servisler için ortak
export interface Vehicle {
  id?: number;  // TowTruck için opsiyonel
  brand: string;
  model: string;
  plate_number?: string;  // Bazı servisler için opsiyonel (CraneListItem)
  year?: number;
  color?: string;
  verification_status?: 'pending' | 'approved' | 'rejected';
  // Nakliye araçları için
  capacity_type?: 'small' | 'medium' | 'large';
  max_volume?: number;
  max_weight?: number;
  has_helper?: boolean;
  // Çekici araçları için
  availibility_vehicles_types?: string[];
  // Vinç araçları için
  max_height?: number;
}

// Servis tipi
export type VehicleServiceType = 'towTruck' | 'crane' | 'nakliye' | 'roadAssistance' | 'transfer';

interface VehicleSelectorProps {
  vehicles: Vehicle[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  serviceType: VehicleServiceType;
  title?: string;
  emptyMessage?: string;
  primaryColor?: string;
  loading?: boolean;
  onAddVehicle?: () => void;
}

// Servis tipine göre ikon ve başlık
const SERVICE_CONFIG: Record<VehicleServiceType, { icon: string; title: string }> = {
  towTruck: { icon: 'tow-truck', title: 'Çekici Seçin' },
  crane: { icon: 'crane', title: 'Vinç Seçin' },
  nakliye: { icon: 'truck-delivery', title: 'Araç Seçin' },
  roadAssistance: { icon: 'car-wrench', title: 'Araç Seçin' },
  transfer: { icon: 'car-estate', title: 'Transfer Aracı Seçin' },
};


export default function VehicleSelector({
  vehicles,
  selectedId,
  onSelect,
  serviceType,
  title,
  emptyMessage = 'Kayıtlı aracınız bulunmuyor',
  primaryColor = '#26a69a',
  loading = false,
  onAddVehicle,
}: VehicleSelectorProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const { isDarkMode, appColors, cardBg } = useAppTheme();

  const themeColors = {
    bg: cardBg,
    inputBg: isDarkMode ? '#2a2a2a' : '#fafafa',
    inputBorder: isDarkMode ? '#444' : '#e0e0e0',
    loadingBg: isDarkMode ? '#2a2a2a' : '#f5f5f5',
    emptyBg: isDarkMode ? '#2a1a00' : '#FFF8E1',
    modalBg: isDarkMode ? '#1E1E1E' : '#fff',
    modalBorder: isDarkMode ? '#333' : '#f0f0f0',
    dragHandle: isDarkMode ? '#555' : '#ddd',
    closeBtnBg: isDarkMode ? '#333' : '#f5f5f5',
    separator: isDarkMode ? '#333' : '#f5f5f5',
    selectedItem: isDarkMode ? '#1a2e1a' : '#E8F5E9',
  };

  const config = SERVICE_CONFIG[serviceType];
  const displayTitle = title || config.title;

  // Seçili araç
  const selectedVehicle = useMemo(
    () => vehicles.find((v) => v.id === selectedId),
    [vehicles, selectedId]
  );

  // Onaylı araç sayısı - verification_status yoksa approved kabul et
  const approvedCount = useMemo(
    () => vehicles.filter((v) => !v.verification_status || v.verification_status === 'approved').length,
    [vehicles]
  );

  const handleOpenModal = useCallback(() => {
    setModalVisible(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalVisible(false);
  }, []);

  const handleSelectVehicle = useCallback(
    (vehicleId: number) => {
      onSelect(vehicleId);
      setModalVisible(false);
    },
    [onSelect]
  );

  // Araç item'ını render et - sadece marka, model, plaka
  const renderVehicleItem = useCallback(
    ({ item }: { item: Vehicle }) => {
      const vehicleId = item.id ?? 0;
      const isSelected = vehicleId === selectedId;
      // verification_status yoksa approved kabul et
      const isApproved = !item.verification_status || item.verification_status === 'approved';

      return (
        <TouchableOpacity
          style={[
            styles.vehicleItem,
            isSelected && { backgroundColor: themeColors.selectedItem },
          ]}
          onPress={() => isApproved && item.id && handleSelectVehicle(item.id)}
          activeOpacity={0.7}
          disabled={!isApproved || !item.id}
        >
          {/* Radio Button */}
          <RadioButton
            value={vehicleId.toString()}
            status={isSelected ? 'checked' : 'unchecked'}
            onPress={() => isApproved && item.id && handleSelectVehicle(item.id)}
            color={primaryColor}
            disabled={!isApproved || !item.id}
          />

          {/* Araç Bilgileri - sadece marka, model, plaka */}
          <View style={styles.vehicleInfo}>
            <Text style={[styles.vehicleName, { color: isSelected ? primaryColor : appColors.text.primary }]}>
              {item.brand} {item.model}
            </Text>

            {item.plate_number && (
              <Text style={[styles.vehiclePlate, { color: appColors.text.secondary }]}>{item.plate_number}</Text>
            )}

            {/* Onay Durumu - sadece pending/rejected ise göster */}
            {item.verification_status && item.verification_status !== 'approved' && (
              <View style={[styles.statusBadge, styles.pendingBadge]}>
                <MaterialCommunityIcons name="clock-outline" size={12} color="#ff9800" />
                <Text style={styles.pendingText}>Onay Bekliyor</Text>
              </View>
            )}
          </View>

          {/* Seçim İkonu */}
          {isSelected && (
            <MaterialCommunityIcons name="check-circle" size={24} color={primaryColor} />
          )}
        </TouchableOpacity>
      );
    },
    [selectedId, primaryColor, handleSelectVehicle]
  );

  // Seçili araç gösterimi - sadece marka, model, plaka
  const renderSelectedDisplay = () => {
    if (!selectedVehicle) {
      return (
        <Text style={[styles.placeholderText, { color: appColors.text.disabled }]}>Araç seçin...</Text>
      );
    }

    return (
      <View style={styles.selectedInfo}>
        <Text style={[styles.selectedName, { color: appColors.text.primary }]}>
          {selectedVehicle.brand} {selectedVehicle.model}
        </Text>
        {selectedVehicle.plate_number && (
          <Text style={[styles.selectedMeta, { color: appColors.text.secondary }]}>
            {selectedVehicle.plate_number}
          </Text>
        )}
      </View>
    );
  };

  // Yükleniyor durumu
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: themeColors.bg }]}>
        <View style={styles.headerRow}>
          <View style={[styles.iconContainer, { backgroundColor: `${primaryColor}15` }]}>
            <MaterialCommunityIcons name={config.icon} size={20} color={primaryColor} />
          </View>
          <Text style={[styles.title, { color: appColors.text.primary }]}>{displayTitle}</Text>
        </View>
        <View style={[styles.loadingBox, { backgroundColor: themeColors.loadingBg }]}>
          <Text style={[styles.loadingText, { color: appColors.text.disabled }]}>Araçlar yükleniyor...</Text>
        </View>
      </View>
    );
  }

  // Boş durum
  if (vehicles.length === 0 || approvedCount === 0) {
    return (
      <View style={[styles.container, { backgroundColor: themeColors.bg }]}>
        <View style={styles.headerRow}>
          <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? '#2a1a00' : '#FFF3E0' }]}>
            <MaterialCommunityIcons name="alert-circle-outline" size={20} color="#FF9800" />
          </View>
          <Text style={[styles.title, { color: appColors.text.primary }]}>{displayTitle}</Text>
        </View>
        <View style={[styles.emptyBox, { backgroundColor: themeColors.emptyBg }]}>
          <Text style={styles.emptyText}>
            {vehicles.length === 0 ? emptyMessage : 'Onaylı aracınız bulunmuyor'}
          </Text>
          <Text style={styles.emptySubtext}>
            {vehicles.length === 0
              ? 'Profil ayarlarından araç ekleyebilirsiniz'
              : 'Araçlarınız onay sürecinde'}
          </Text>
          {onAddVehicle && (
            <TouchableOpacity
              style={styles.addVehicleButton}
              onPress={onAddVehicle}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="plus" size={18} color="#fff" />
              <Text style={styles.addVehicleButtonText}>Araç Ekle</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: themeColors.bg }]}>
      {/* Başlık */}
      <View style={styles.headerRow}>
        <View style={[styles.iconContainer, { backgroundColor: `${primaryColor}15` }]}>
          <MaterialCommunityIcons name={config.icon} size={20} color={primaryColor} />
        </View>
        <Text style={[styles.title, { color: appColors.text.primary }]}>{displayTitle}</Text>
      </View>

      {/* Seçim Butonu */}
      <TouchableOpacity
        style={[
          styles.selectorButton,
          { backgroundColor: themeColors.inputBg, borderColor: selectedVehicle ? primaryColor : themeColors.inputBorder },
        ]}
        onPress={handleOpenModal}
        activeOpacity={0.7}
      >
        <View style={styles.selectorContent}>
          {renderSelectedDisplay()}
          <MaterialCommunityIcons
            name="chevron-down"
            size={24}
            color={selectedVehicle ? primaryColor : appColors.text.disabled}
          />
        </View>
      </TouchableOpacity>

      {/* Araç Seçim Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <Pressable style={styles.modalOverlay} onPress={handleCloseModal}>
          <Pressable style={[styles.modalContent, { backgroundColor: themeColors.modalBg }]} onPress={(e) => e.stopPropagation()}>
            <SafeAreaView edges={['bottom']}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <View style={[styles.modalDragHandle, { backgroundColor: themeColors.dragHandle }]} />
              </View>

              <View style={[styles.modalTitleRow, { borderBottomColor: themeColors.modalBorder }]}>
                <MaterialCommunityIcons name={config.icon} size={24} color={primaryColor} />
                <Text style={[styles.modalTitle, { color: appColors.text.primary }]}>{displayTitle}</Text>
                <TouchableOpacity
                  onPress={handleCloseModal}
                  style={[styles.closeButton, { backgroundColor: themeColors.closeBtnBg }]}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <MaterialCommunityIcons name="close" size={22} color={appColors.text.secondary} />
                </TouchableOpacity>
              </View>

              {/* Araç Listesi */}
              <FlatList
                data={vehicles}
                keyExtractor={(item) => (item.id ?? 0).toString()}
                renderItem={renderVehicleItem}
                ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: themeColors.separator }]} />}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                style={{ maxHeight: SCREEN_HEIGHT * 0.5 }}
              />
            </SafeAreaView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Selector Button
  selectorButton: {
    borderWidth: 1.5,
    borderRadius: 12,
  },
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  placeholderText: {
    fontSize: 15,
  },
  selectedInfo: {
    flex: 1,
  },
  selectedName: {
    fontSize: 15,
    fontWeight: '600',
  },
  selectedMeta: {
    fontSize: 13,
    marginTop: 2,
  },
  // Loading & Empty
  loadingBox: {
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
  },
  emptyBox: {
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F57C00',
  },
  emptySubtext: {
    fontSize: 13,
    color: '#FF9800',
    marginTop: 4,
  },
  addVehicleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#26a69a',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 12,
    gap: 6,
  },
  addVehicleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.7,
  },
  modalHeader: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  modalDragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 12,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingVertical: 8,
    paddingBottom: 24,
  },
  separator: {
    height: 1,
    marginHorizontal: 20,
  },
  // Vehicle Item
  vehicleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginHorizontal: 8,
    borderRadius: 12,
  },
  vehicleInfo: {
    flex: 1,
    marginLeft: 8,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: '600',
  },
  vehiclePlate: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 6,
  },
  pendingBadge: {
    backgroundColor: '#fff3e0',
  },
  pendingText: {
    fontSize: 11,
    color: '#ff9800',
    fontWeight: '500',
  },
});
