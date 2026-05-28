import React, { useMemo } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Alert } from 'react-native';
import { useFkTokens } from '../../hooks/useFkTokens';
import { getCityNames, getDistrictsByCity } from '../../data/turkeyLocations';
import FkSelect from '../fk-select/FkSelect';
import FkTextInput from '../fk-form/FkTextInput';

export interface FkLocationValue {
  city: string;
  district: string;
  address: string;
}

interface Props {
  value: FkLocationValue;
  onChange: (next: FkLocationValue) => void;
  errors?: Partial<Record<keyof FkLocationValue, string>>;
  required?: boolean;
  disabled?: boolean;
  addressLabel?: string;
  addressMultiline?: boolean;
  containerStyle?: ViewStyle;
  testID?: string;
}

export default function FkLocationInput({
  value,
  onChange,
  errors,
  required,
  disabled,
  addressLabel = 'Adres',
  addressMultiline = true,
  containerStyle,
  testID,
}: Props) {
  const { tokens } = useFkTokens();

  const cityOptions = useMemo(
    () => getCityNames().map((c) => ({ value: c, label: c })),
    [],
  );

  const districtOptions = useMemo(
    () => (value.city ? getDistrictsByCity(value.city).map((d) => ({ value: d, label: d })) : []),
    [value.city],
  );

  return (
    <View style={containerStyle} testID={testID}>
      <View style={[styles.row, { gap: tokens.spacing.md }]}>
        <View style={styles.col}>
          <FkSelect
            label="İl"
            placeholder="Seçiniz"
            required={required}
            disabled={disabled}
            value={value.city || null}
            options={cityOptions}
            onChange={(city) => onChange({ ...value, city, district: '' })}
            searchable
            searchPlaceholder="İl ara..."
            error={errors?.city}
          />
        </View>
        <View style={styles.col}>
          <FkSelect
            label="İlçe"
            placeholder="Seçiniz"
            required={required}
            disabled={disabled || !value.city}
            value={value.district || null}
            options={districtOptions}
            onChange={(district) => onChange({ ...value, district })}
            searchable
            searchPlaceholder="İlçe ara..."
            error={errors?.district}
            emptyMessage={value.city ? 'İlçe bulunamadı' : 'Önce il seçin'}
          />
        </View>
      </View>

      <FkTextInput
        label={addressLabel}
        required={required}
        disabled={disabled}
        value={value.address}
        onChange={(address) => onChange({ ...value, address })}
        multiline={addressMultiline}
        numberOfLines={addressMultiline ? 3 : 1}
        error={errors?.address}
      />
    </View>
  );
}

export function showDistrictRequiresCityHint() {
  Alert.alert('Uyarı', 'Önce il seçiniz');
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  col: { flex: 1 },
});
