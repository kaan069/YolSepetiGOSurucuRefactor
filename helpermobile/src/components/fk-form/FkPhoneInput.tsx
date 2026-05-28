import React, { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput as RNTextInput,
  View,
} from 'react-native';
import { TextInput as PaperTextInput, Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFkTokens } from '../../hooks/useFkTokens';
import FkFormError from '../fk-ui/FkFormError';
import FkLabel from '../fk-ui/FkLabel';
import FkModal from '../fk-ui/FkModal';

export interface FkCountry {
  code: string;
  dialCode: string;
  flag: string;
  name: string;
}

export const FK_COUNTRIES: FkCountry[] = [
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

const formatTrPhone = (raw: string): string => {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 0) return '';
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  if (digits.length <= 8) return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`;
};

interface Props {
  value: string;
  onChange: (digits: string) => void;
  onChangeCountry?: (country: FkCountry) => void;
  defaultCountry?: string;
  label?: string;
  required?: boolean;
  placeholder?: string;
  error?: string | null;
  helperText?: string;
  disabled?: boolean;
  maxDigits?: number;
  onBlur?: () => void;
  testID?: string;
}

export default function FkPhoneInput({
  value,
  onChange,
  onChangeCountry,
  defaultCountry = 'TR',
  label = 'Telefon Numarası',
  required,
  placeholder = 'Telefon numaranızı giriniz',
  error,
  helperText,
  disabled,
  maxDigits = 10,
  onBlur,
  testID,
}: Props) {
  const { tokens } = useFkTokens();
  const [country, setCountry] = useState<FkCountry>(
    FK_COUNTRIES.find((c) => c.code === defaultCountry) ?? FK_COUNTRIES[0],
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [search, setSearch] = useState('');
  const [focused, setFocused] = useState(false);

  const filtered = useMemo(() => {
    if (!search) return FK_COUNTRIES;
    const q = search.toLowerCase();
    return FK_COUNTRIES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.dialCode.includes(search),
    );
  }, [search]);

  const formatted = useMemo(() => formatTrPhone(value), [value]);

  const handleSelect = useCallback(
    (c: FkCountry) => {
      setCountry(c);
      setModalVisible(false);
      setSearch('');
      onChangeCountry?.(c);
    },
    [onChangeCountry],
  );

  const handleChangeText = useCallback(
    (text: string) => {
      const digits = text.replace(/[^0-9]/g, '');
      if (digits.startsWith('0')) return;
      if (digits.length > maxDigits) return;
      onChange(digits);
    },
    [onChange, maxDigits],
  );

  const handleFocus = useCallback(() => setFocused(true), []);
  const handleBlur = useCallback(() => {
    setFocused(false);
    onBlur?.();
  }, [onBlur]);

  const borderColor = error
    ? tokens.colors.error
    : focused
    ? tokens.colors.primary
    : tokens.colors.borderStrong;

  return (
    <View style={{ marginBottom: tokens.spacing.md }} testID={testID}>
      {label ? <FkLabel required={required}>{label}</FkLabel> : null}

      <View
        style={[
          styles.inputRow,
          {
            backgroundColor: tokens.colors.cardBg,
            borderColor,
            borderWidth: error || focused ? 2 : 1,
            borderRadius: tokens.radius.md,
          },
        ]}
      >
        <Pressable
          style={[
            styles.countrySelector,
            { borderRightColor: tokens.colors.border, backgroundColor: tokens.colors.surfaceMuted },
          ]}
          onPress={() => !disabled && setModalVisible(true)}
          disabled={disabled}
        >
          <Text style={[styles.dialCode, { color: tokens.colors.textPrimary }]}>
            {country.dialCode}
          </Text>
          <MaterialCommunityIcons name="chevron-down" size={18} color={tokens.colors.textSecondary} />
        </Pressable>

        <PaperTextInput
          value={formatted}
          onChangeText={handleChangeText}
          placeholder={placeholder}
          keyboardType="phone-pad"
          mode="flat"
          style={styles.textInput}
          underlineColor="transparent"
          activeUnderlineColor="transparent"
          disabled={disabled}
          dense
          maxLength={13}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      </View>

      <FkFormError error={error} helperText={helperText} />

      <FkModal
        visible={modalVisible}
        onDismiss={() => setModalVisible(false)}
        title="Alan Kodu Seçin"
        scrollable={false}
        variant="center"
        maxHeightRatio={0.75}
      >
        <View style={{ padding: tokens.spacing.lg }}>
          <View
            style={[
              styles.searchBox,
              { backgroundColor: tokens.colors.surfaceMuted, borderRadius: tokens.radius.md },
            ]}
          >
            <MaterialCommunityIcons name="magnify" size={18} color={tokens.colors.textSecondary} />
            <RNTextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Ülke veya kod ara..."
              placeholderTextColor={tokens.colors.textHint}
              style={[styles.searchInput, { color: tokens.colors.textPrimary }]}
            />
          </View>
        </View>
        <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
          {filtered.map((c) => {
            const selected = country.code === c.code;
            return (
              <Pressable
                key={c.code}
                onPress={() => handleSelect(c)}
                style={[
                  styles.countryItem,
                  selected && { backgroundColor: tokens.colors.successSoft },
                ]}
              >
                <View style={styles.countryInfo}>
                  <View
                    style={[
                      styles.dialBadge,
                      { backgroundColor: tokens.colors.surfaceMuted, borderRadius: tokens.radius.sm },
                    ]}
                  >
                    <Text style={[styles.dialBadgeText, { color: tokens.colors.textPrimary }]}>
                      {c.dialCode}
                    </Text>
                  </View>
                  <Text style={[styles.countryName, { color: tokens.colors.textPrimary }]}>
                    {c.name}
                  </Text>
                </View>
                {selected ? (
                  <MaterialCommunityIcons name="check" size={20} color={tokens.colors.primary} />
                ) : null}
              </Pressable>
            );
          })}
        </ScrollView>
      </FkModal>
    </View>
  );
}

const styles = StyleSheet.create({
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRightWidth: 1,
    gap: 4,
  },
  dialCode: { fontSize: 16, fontWeight: '600' },
  textInput: { flex: 1, fontSize: 16, height: 50, backgroundColor: 'transparent' },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15 },
  list: { maxHeight: 380, paddingHorizontal: 12 },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginVertical: 2,
    borderRadius: 10,
  },
  countryInfo: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  dialBadge: { paddingHorizontal: 10, paddingVertical: 6, minWidth: 60, alignItems: 'center' },
  dialBadgeText: { fontSize: 14, fontWeight: '600' },
  countryName: { fontSize: 15, fontWeight: '500', flex: 1 },
});
