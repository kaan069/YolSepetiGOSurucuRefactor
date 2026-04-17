/**
 * EmployeeSelector Component
 *
 * Firma sahiplerinin teklif gönderirken opsiyonel eleman seçimi yapmasını sağlar.
 * VehicleSelector pattern'ini takip eder ama daha basittir.
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
import { Employee } from '../../api/types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface EmployeeSelectorProps {
  employees: Employee[];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  loading?: boolean;
}

export default function EmployeeSelector({
  employees,
  selectedId,
  onSelect,
  loading = false,
}: EmployeeSelectorProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const { isDarkMode, appColors, cardBg } = useAppTheme();

  const primaryColor = '#26a69a';

  const themeColors = {
    bg: cardBg,
    inputBg: isDarkMode ? '#2a2a2a' : '#fafafa',
    inputBorder: isDarkMode ? '#444' : '#e0e0e0',
    loadingBg: isDarkMode ? '#2a2a2a' : '#f5f5f5',
    modalBg: isDarkMode ? '#1E1E1E' : '#fff',
    modalBorder: isDarkMode ? '#333' : '#f0f0f0',
    dragHandle: isDarkMode ? '#555' : '#ddd',
    closeBtnBg: isDarkMode ? '#333' : '#f5f5f5',
    separator: isDarkMode ? '#333' : '#f5f5f5',
    selectedItem: isDarkMode ? '#1a2e1a' : '#E8F5E9',
  };

  const selectedEmployee = useMemo(
    () => employees.find((e) => e.id === selectedId),
    [employees, selectedId]
  );

  // "Ben yapacagim" + eleman listesi
  const allOptions = useMemo(() => {
    const selfOption: Employee = {
      id: 0, // 0 = "Ben yapacagim" (null olarak gonderilecek)
      first_name: 'Ben',
      last_name: 'yapacağım',
      phone_number: '',
      tc_no: '',
    };
    return [selfOption, ...employees];
  }, [employees]);

  const handleOpenModal = useCallback(() => {
    setModalVisible(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalVisible(false);
  }, []);

  const handleSelect = useCallback(
    (employeeId: number) => {
      onSelect(employeeId === 0 ? null : employeeId);
      setModalVisible(false);
    },
    [onSelect]
  );

  const renderItem = useCallback(
    ({ item }: { item: Employee }) => {
      const isSelected = item.id === 0 ? selectedId === null : item.id === selectedId;
      const isSelf = item.id === 0;

      return (
        <TouchableOpacity
          style={[
            styles.employeeItem,
            isSelected && { backgroundColor: themeColors.selectedItem },
          ]}
          onPress={() => handleSelect(item.id)}
          activeOpacity={0.7}
        >
          <RadioButton
            value={item.id.toString()}
            status={isSelected ? 'checked' : 'unchecked'}
            onPress={() => handleSelect(item.id)}
            color={primaryColor}
          />
          <View style={styles.employeeInfo}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[styles.employeeName, { color: isSelected ? primaryColor : appColors.text.primary }]}>
                {item.first_name} {item.last_name}
              </Text>
              {!isSelf && item.user_is_online !== undefined && (
                <View style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: item.user_is_online ? '#4CAF50' : '#9E9E9E',
                  marginLeft: 8,
                }} />
              )}
            </View>
            {!isSelf && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                {item.phone_number ? (
                  <Text style={[styles.employeePhone, { color: appColors.text.secondary }]}>
                    {item.phone_number}
                  </Text>
                ) : null}
                {item.is_available !== undefined && (
                  <View style={{
                    backgroundColor: item.is_available ? '#E8F5E9' : '#FFF3E0',
                    paddingHorizontal: 5,
                    paddingVertical: 1,
                    borderRadius: 4,
                  }}>
                    <Text style={{
                      fontSize: 10,
                      fontWeight: '600',
                      color: item.is_available ? '#2E7D32' : '#E65100',
                    }}>
                      {item.is_available ? 'Müsait' : 'İşte'}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
          {isSelected && (
            <MaterialCommunityIcons name="check-circle" size={24} color={primaryColor} />
          )}
        </TouchableOpacity>
      );
    },
    [selectedId, handleSelect, appColors, themeColors]
  );

  const renderSelectedDisplay = () => {
    if (!selectedEmployee) {
      return (
        <Text style={[styles.selectedName, { color: appColors.text.primary }]}>
          Ben yapacağım
        </Text>
      );
    }

    return (
      <View style={styles.selectedInfo}>
        <Text style={[styles.selectedName, { color: appColors.text.primary }]}>
          {selectedEmployee.first_name} {selectedEmployee.last_name}
        </Text>
        {selectedEmployee.phone_number ? (
          <Text style={[styles.selectedMeta, { color: appColors.text.secondary }]}>
            {selectedEmployee.phone_number}
          </Text>
        ) : null}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: themeColors.bg }]}>
        <View style={styles.headerRow}>
          <View style={[styles.iconContainer, { backgroundColor: `${primaryColor}15` }]}>
            <MaterialCommunityIcons name="account-group" size={20} color={primaryColor} />
          </View>
          <Text style={[styles.title, { color: appColors.text.primary }]}>Eleman Seçin (Opsiyonel)</Text>
        </View>
        <View style={[styles.loadingBox, { backgroundColor: themeColors.loadingBg }]}>
          <Text style={[styles.loadingText, { color: appColors.text.disabled }]}>Elemanlar yükleniyor...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: themeColors.bg }]}>
      <View style={styles.headerRow}>
        <View style={[styles.iconContainer, { backgroundColor: `${primaryColor}15` }]}>
          <MaterialCommunityIcons name="account-group" size={20} color={primaryColor} />
        </View>
        <Text style={[styles.title, { color: appColors.text.primary }]}>Eleman Seçin (Opsiyonel)</Text>
      </View>

      <TouchableOpacity
        style={[
          styles.selectorButton,
          { backgroundColor: themeColors.inputBg, borderColor: selectedEmployee ? primaryColor : themeColors.inputBorder },
        ]}
        onPress={handleOpenModal}
        activeOpacity={0.7}
      >
        <View style={styles.selectorContent}>
          {renderSelectedDisplay()}
          <MaterialCommunityIcons
            name="chevron-down"
            size={24}
            color={selectedEmployee ? primaryColor : appColors.text.disabled}
          />
        </View>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <Pressable style={styles.modalOverlay} onPress={handleCloseModal}>
          <Pressable style={[styles.modalContent, { backgroundColor: themeColors.modalBg }]} onPress={(e) => e.stopPropagation()}>
            <SafeAreaView edges={['bottom']}>
              <View style={styles.modalHeader}>
                <View style={[styles.modalDragHandle, { backgroundColor: themeColors.dragHandle }]} />
              </View>

              <View style={[styles.modalTitleRow, { borderBottomColor: themeColors.modalBorder }]}>
                <MaterialCommunityIcons name="account-group" size={24} color={primaryColor} />
                <Text style={[styles.modalTitle, { color: appColors.text.primary }]}>Eleman Seçin</Text>
                <TouchableOpacity
                  onPress={handleCloseModal}
                  style={[styles.closeButton, { backgroundColor: themeColors.closeBtnBg }]}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <MaterialCommunityIcons name="close" size={22} color={appColors.text.secondary} />
                </TouchableOpacity>
              </View>

              <FlatList
                data={allOptions}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
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
  loadingBox: {
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
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
  employeeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginHorizontal: 8,
    borderRadius: 12,
  },
  employeeInfo: {
    flex: 1,
    marginLeft: 8,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: '600',
  },
  employeePhone: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
});
