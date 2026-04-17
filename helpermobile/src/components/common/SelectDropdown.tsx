/**
 * SelectDropdown Component
 *
 * Reusable dropdown/select component for forms.
 * Supports search, custom styling, and disabled state.
 */
import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Text, Portal } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../../hooks/useAppTheme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectDropdownProps {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  required?: boolean;
  // Custom styling
  containerStyle?: object;
  labelStyle?: object;
  dropdownStyle?: object;
  // Theme colors
  primaryColor?: string;
  errorColor?: string;
}

export default function SelectDropdown({
  label,
  value,
  options,
  onChange,
  placeholder = 'Seciniz',
  disabled = false,
  error,
  searchable = false,
  searchPlaceholder = 'Ara...',
  required = false,
  containerStyle,
  labelStyle,
  dropdownStyle,
  primaryColor = '#26a69a',
  errorColor = '#f44336',
}: SelectDropdownProps) {
  const { isDarkMode, appColors, cardBg } = useAppTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');

  // Find selected option label
  const selectedLabel = useMemo(() => {
    const selected = options.find((opt) => opt.value === value);
    return selected?.label || '';
  }, [value, options]);

  // Filter options based on search
  const filteredOptions = useMemo(() => {
    if (!searchText.trim()) return options;
    const search = searchText.toLowerCase().trim();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(search) ||
        opt.value.toLowerCase().includes(search)
    );
  }, [options, searchText]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setModalVisible(false);
    setSearchText('');
  };

  const handleOpen = () => {
    if (!disabled) {
      setModalVisible(true);
    }
  };

  const handleClose = () => {
    setModalVisible(false);
    setSearchText('');
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Label */}
      <Text style={[styles.label, { color: appColors.text.secondary }, labelStyle]}>
        {label}
        {required && <Text style={{ color: errorColor }}> *</Text>}
      </Text>

      {/* Dropdown Button */}
      <TouchableOpacity
        style={[
          styles.dropdown,
          { backgroundColor: cardBg },
          dropdownStyle,
          error && { borderColor: errorColor },
          disabled && styles.dropdownDisabled,
        ]}
        onPress={handleOpen}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.dropdownText,
            !value && styles.dropdownPlaceholder,
            disabled && styles.dropdownTextDisabled,
          ]}
          numberOfLines={1}
        >
          {value ? selectedLabel : placeholder}
        </Text>
        <MaterialCommunityIcons
          name="chevron-down"
          size={24}
          color={disabled ? '#ccc' : '#666'}
        />
      </TouchableOpacity>

      {/* Error Text */}
      {error && <Text style={[styles.errorText, { color: errorColor }]}>{error}</Text>}

      {/* Selection Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleClose}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalContainer}
          >
            <SafeAreaView style={[styles.modalContent, { backgroundColor: cardBg }]} edges={['bottom']}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{label}</Text>
                <TouchableOpacity onPress={handleClose} style={[styles.closeButton, { backgroundColor: isDarkMode ? '#2C2C2C' : '#f5f5f5' }]}>
                  <MaterialCommunityIcons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              {/* Search Input */}
              {searchable && (
                <View style={[styles.searchContainer, { backgroundColor: isDarkMode ? '#2C2C2C' : '#f5f5f5' }]}>
                  <MaterialCommunityIcons name="magnify" size={20} color="#999" />
                  <TextInput
                    style={styles.searchInput}
                    placeholder={searchPlaceholder}
                    placeholderTextColor="#999"
                    value={searchText}
                    onChangeText={setSearchText}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {searchText.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchText('')}>
                      <MaterialCommunityIcons name="close-circle" size={18} color="#999" />
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Options List */}
              <ScrollView
                style={styles.optionsList}
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps="handled"
              >
                {filteredOptions.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <MaterialCommunityIcons name="magnify-close" size={48} color="#ccc" />
                    <Text style={styles.emptyText}>Sonuc bulunamadi</Text>
                  </View>
                ) : (
                  filteredOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.optionItem,
                        value === option.value && { backgroundColor: `${primaryColor}15` },
                      ]}
                      onPress={() => handleSelect(option.value)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          value === option.value && { color: primaryColor, fontWeight: '600' },
                        ]}
                      >
                        {option.label}
                      </Text>
                      {value === option.value && (
                        <MaterialCommunityIcons name="check" size={20} color={primaryColor} />
                      )}
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </SafeAreaView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    marginBottom: 6,
    fontWeight: '500',
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dropdownDisabled: {
    backgroundColor: '#f5f5f5',
    borderColor: '#e0e0e0',
  },
  dropdownText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginRight: 8,
  },
  dropdownTextDisabled: {
    color: '#999',
  },
  dropdownPlaceholder: {
    color: '#999',
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    maxHeight: SCREEN_HEIGHT * 0.7,
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: SCREEN_HEIGHT * 0.7,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
    paddingVertical: 4,
  },
  optionsList: {
    maxHeight: SCREEN_HEIGHT * 0.5,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
});
