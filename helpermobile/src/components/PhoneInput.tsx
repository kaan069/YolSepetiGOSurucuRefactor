import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { TextInput, Text, Searchbar } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../hooks/useAppTheme';

interface Country {
  code: string;
  dialCode: string;
  flag: string;
  name: string;
}

const COUNTRIES: Country[] = [
  { code: 'TR', dialCode: '+90', flag: '🇹🇷', name: 'Türkiye' },
  { code: 'US', dialCode: '+1', flag: '🇺🇸', name: 'Amerika' },
  { code: 'GB', dialCode: '+44', flag: '🇬🇧', name: 'İngiltere' },
  { code: 'DE', dialCode: '+49', flag: '🇩🇪', name: 'Almanya' },
  { code: 'FR', dialCode: '+33', flag: '🇫🇷', name: 'Fransa' },
  { code: 'IT', dialCode: '+39', flag: '🇮🇹', name: 'İtalya' },
  { code: 'ES', dialCode: '+34', flag: '🇪🇸', name: 'İspanya' },
  { code: 'NL', dialCode: '+31', flag: '🇳🇱', name: 'Hollanda' },
  { code: 'BE', dialCode: '+32', flag: '🇧🇪', name: 'Belçika' },
  { code: 'SE', dialCode: '+46', flag: '🇸🇪', name: 'İsveç' },
  { code: 'NO', dialCode: '+47', flag: '🇳🇴', name: 'Norveç' },
  { code: 'DK', dialCode: '+45', flag: '🇩🇰', name: 'Danimarka' },
  { code: 'AT', dialCode: '+43', flag: '🇦🇹', name: 'Avusturya' },
  { code: 'CH', dialCode: '+41', flag: '🇨🇭', name: 'İsviçre' },
  { code: 'GR', dialCode: '+30', flag: '🇬🇷', name: 'Yunanistan' },
  { code: 'RU', dialCode: '+7', flag: '🇷🇺', name: 'Rusya' },
  { code: 'JP', dialCode: '+81', flag: '🇯🇵', name: 'Japonya' },
  { code: 'CN', dialCode: '+86', flag: '🇨🇳', name: 'Çin' },
  { code: 'AE', dialCode: '+971', flag: '🇦🇪', name: 'BAE' },
  { code: 'SA', dialCode: '+966', flag: '🇸🇦', name: 'Suudi Arabistan' },
  { code: 'EG', dialCode: '+20', flag: '🇪🇬', name: 'Mısır' },
  { code: 'IN', dialCode: '+91', flag: '🇮🇳', name: 'Hindistan' },
  { code: 'PK', dialCode: '+92', flag: '🇵🇰', name: 'Pakistan' },
  { code: 'BD', dialCode: '+880', flag: '🇧🇩', name: 'Bangladeş' },
  { code: 'IR', dialCode: '+98', flag: '🇮🇷', name: 'İran' },
  { code: 'IQ', dialCode: '+964', flag: '🇮🇶', name: 'Irak' },
  { code: 'SY', dialCode: '+963', flag: '🇸🇾', name: 'Suriye' },
  { code: 'AZ', dialCode: '+994', flag: '🇦🇿', name: 'Azerbaycan' },
  { code: 'GE', dialCode: '+995', flag: '🇬🇪', name: 'Gürcistan' },
];

interface PhoneInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onChangeCountry?: (country: Country) => void;
  label?: string;
  placeholder?: string;
  error?: boolean;
  disabled?: boolean;
}

// Telefon numarasını görsel olarak formatla (555 123 45 67)
const formatPhoneNumber = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 0) return '';
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  if (digits.length <= 8) return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`;
};

export default function PhoneInput({
  value,
  onChangeText,
  onChangeCountry,
  label = 'Telefon Numarası',
  placeholder = 'Telefon numarası girin',
  error = false,
  disabled = false,
}: PhoneInputProps) {
  const { isDarkMode, appColors, cardBg } = useAppTheme();
  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0]); // Default: Türkiye
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCountries = searchQuery
    ? COUNTRIES.filter(
        (country) =>
          country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          country.dialCode.includes(searchQuery)
      )
    : COUNTRIES;

  const handleSelectCountry = (country: Country) => {
    setSelectedCountry(country);
    setModalVisible(false);
    setSearchQuery('');
    if (onChangeCountry) {
      onChangeCountry(country);
    }
  };

  const handleChangeText = (text: string) => {
    // Boşlukları ve diğer karakterleri kaldır, sadece rakamları al
    const numbersOnly = text.replace(/[^0-9]/g, '');

    // Başında 0 varsa reddet
    if (numbersOnly.startsWith('0')) {
      return;
    }

    // Maksimum 10 haneli numara (Türkiye için)
    if (numbersOnly.length > 10) {
      return;
    }

    // Ham değeri parent'a gönder (formatlanmamış)
    onChangeText(numbersOnly);
  };

  const getFormattedNumber = () => {
    return value ? `${selectedCountry.dialCode}${value}` : '';
  };

  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: appColors.text.secondary }]}>{label}</Text>}

      <View style={[styles.inputRow, { backgroundColor: cardBg }, isFocused && styles.inputRowFocused, error && styles.inputRowError]}>
        {/* Ülke Kodu Seçici - Bayrak yok, sadece alan kodu */}
        <TouchableOpacity
          style={styles.countrySelector}
          onPress={() => !disabled && setModalVisible(true)}
          disabled={disabled}
        >
          <Text style={styles.dialCode}>{selectedCountry.dialCode}</Text>
          <MaterialCommunityIcons name="chevron-down" size={18} color="#888" />
        </TouchableOpacity>

        {/* Telefon Numarası Input */}
        <TextInput
          value={formatPhoneNumber(value)}
          onChangeText={handleChangeText}
          placeholder="Telefon numaranızı giriniz"
          keyboardType="phone-pad"
          mode="flat"
          style={styles.textInput}
          underlineColor="transparent"
          activeUnderlineColor="transparent"
          disabled={disabled}
          dense
          maxLength={13}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
      </View>

      {/* Ülke Seçim Modal - Modern Tasarım */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <TouchableOpacity activeOpacity={1} style={[styles.modalContent, { backgroundColor: cardBg }]}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>Alan Kodu Seçin</Text>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <MaterialCommunityIcons name="magnify" size={20} color="#888" style={styles.searchIcon} />
              <Searchbar
                placeholder="Ülke veya kod ara..."
                onChangeText={setSearchQuery}
                value={searchQuery}
                style={[styles.searchBar, { backgroundColor: isDarkMode ? '#2C2C2C' : '#f5f5f5' }]}
                inputStyle={styles.searchInput}
                iconColor="transparent"
              />
            </View>

            {/* Country List */}
            <ScrollView style={styles.countryList} showsVerticalScrollIndicator={false}>
              {filteredCountries.map((country) => {
                const isSelected = selectedCountry.code === country.code;
                return (
                  <TouchableOpacity
                    key={country.code}
                    style={[
                      styles.countryItem,
                      isSelected && styles.countryItemSelected,
                    ]}
                    onPress={() => handleSelectCountry(country)}
                    activeOpacity={0.6}
                  >
                    <View style={styles.countryInfo}>
                      <View style={styles.dialCodeBadge}>
                        <Text style={[styles.dialCodeText, isSelected && styles.dialCodeTextSelected]}>
                          {country.dialCode}
                        </Text>
                      </View>
                      <Text style={[styles.countryName, isSelected && styles.countryNameSelected]}>
                        {country.name}
                      </Text>
                    </View>
                    {isSelected && (
                      <MaterialCommunityIcons
                        name="check"
                        size={22}
                        color="#26a69a"
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
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
    marginBottom: 8,
    marginLeft: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    overflow: 'hidden',
  },
  inputRowFocused: {
    borderColor: '#26a69a',
    borderWidth: 2,
  },
  inputRowError: {
    borderColor: '#B00020',
    borderWidth: 2,
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: '#f8f9fa',
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
    gap: 4,
  },
  dialCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    height: 50,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 16,
    width: '100%',
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#ddd',
    borderRadius: 2,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  searchContainer: {
    position: 'relative',
    marginHorizontal: 16,
    marginVertical: 12,
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    top: 14,
    zIndex: 1,
  },
  searchBar: {
    elevation: 0,
    borderRadius: 10,
    height: 46,
  },
  searchInput: {
    fontSize: 15,
    marginLeft: 24,
  },
  countryList: {
    flex: 1,
    paddingHorizontal: 8,
  },
  countryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    marginVertical: 2,
    borderRadius: 10,
  },
  countryItemSelected: {
    backgroundColor: '#e8f5e9',
  },
  countryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  dialCodeBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 60,
    alignItems: 'center',
  },
  dialCodeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
  },
  dialCodeTextSelected: {
    color: '#26a69a',
  },
  countryName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  countryNameSelected: {
    color: '#1b5e20',
    fontWeight: '600',
  },
});
