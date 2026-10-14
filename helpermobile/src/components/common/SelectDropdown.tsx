/**
 * SelectDropdown — eski API, FkSelect'in ince sarmalayıcısı.
 *
 * Görünüm ve davranış FkSelect ile aynıdır (alttan açılan liste, arama).
 * Yeni kodda doğrudan FkSelect kullanın.
 */
import React from 'react';
import { ViewStyle } from 'react-native';
import FkSelect from '../fk-select/FkSelect';

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
  containerStyle?: object;
  /** Artık kullanılmıyor — görünüm FkSelect'ten gelir */
  labelStyle?: object;
  /** Artık kullanılmıyor — görünüm FkSelect'ten gelir */
  dropdownStyle?: object;
  /** Artık kullanılmıyor — renk temadan gelir */
  primaryColor?: string;
  /** Artık kullanılmıyor — renk temadan gelir */
  errorColor?: string;
}

export default function SelectDropdown({
  label,
  value,
  options,
  onChange,
  placeholder = 'Seçiniz',
  disabled = false,
  error,
  searchable = false,
  searchPlaceholder = 'Ara...',
  required = false,
  containerStyle,
}: SelectDropdownProps) {
  return (
    <FkSelect<string>
      label={label}
      value={value}
      options={options}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      error={error}
      searchable={searchable}
      searchPlaceholder={searchPlaceholder}
      required={required}
      containerStyle={containerStyle as ViewStyle}
    />
  );
}
