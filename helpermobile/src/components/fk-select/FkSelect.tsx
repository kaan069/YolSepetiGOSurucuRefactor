import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFkTokens } from '../../hooks/useFkTokens';
import FkFormError from '../fk-ui/FkFormError';
import FkModal from '../fk-ui/FkModal';
import SelectList from './internal/SelectList';
import { colors } from '../../theme/design';
import { fieldStyles, getFieldBoxStyle, getFieldLabelColor } from '../fk-form/fieldStyles';
import { FkSelectOption } from './types';

interface Props<T extends string | number = string> {
  value: T | null | undefined;
  onChange: (value: T) => void;
  options: FkSelectOption<T>[];
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string | null;
  helperText?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  modalTitle?: string;
  emptyMessage?: string;
  containerStyle?: ViewStyle;
  testID?: string;
}

export default function FkSelect<T extends string | number = string>({
  value,
  onChange,
  options,
  label,
  placeholder = 'Seçiniz',
  required,
  disabled,
  error,
  helperText,
  searchable,
  searchPlaceholder,
  modalTitle,
  emptyMessage,
  containerStyle,
  testID,
}: Props<T>) {
  const { tokens, isDarkMode } = useFkTokens();
  const [open, setOpen] = useState(false);

  const selectedLabel = useMemo(() => {
    if (value === null || value === undefined || value === '') return '';
    const opt = options.find((o) => o.value === value);
    return opt ? `${opt.icon ? `${opt.icon} ` : ''}${opt.label}` : '';
  }, [value, options]);

  const isSelected = useCallback((v: T) => v === value, [value]);
  const handlePick = useCallback(
    (v: T) => {
      onChange(v);
      setOpen(false);
    },
    [onChange],
  );

  return (
    <View style={[fieldStyles.container, containerStyle]} testID={testID}>
      {label ? (
        <Text style={[fieldStyles.label, { color: getFieldLabelColor(tokens.colors, isDarkMode, disabled) }]}>
          {label}
          {required ? <Text style={{ color: colors.danger[500] }}> *</Text> : null}
        </Text>
      ) : null}

      <Pressable
        onPress={() => !disabled && setOpen(true)}
        disabled={disabled}
        style={[
          fieldStyles.box,
          styles.trigger,
          getFieldBoxStyle(tokens.colors, isDarkMode, { focused: open, error: !!error, disabled }),
        ]}
      >
        <Text
          numberOfLines={1}
          style={[
            styles.triggerText,
            {
              color: selectedLabel ? tokens.colors.textPrimary : colors.neutral[400],
            },
          ]}
        >
          {selectedLabel || placeholder}
        </Text>
        <MaterialCommunityIcons
          name="chevron-down"
          size={22}
          color={disabled ? colors.neutral[300] : colors.neutral[500]}
        />
      </Pressable>

      <FkFormError error={error} helperText={helperText} />

      <FkModal
        visible={open}
        onDismiss={() => setOpen(false)}
        title={modalTitle || label || 'Seçiniz'}
        variant="bottom"
        maxHeightRatio={0.92}
      >
        <SelectList
          options={options}
          selected={value ?? null}
          isSelected={isSelected}
          onPick={handlePick}
          searchable={searchable}
          searchPlaceholder={searchPlaceholder}
          emptyMessage={emptyMessage}
        />
      </FkModal>
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  triggerText: {
    flex: 1,
    fontSize: 16,
    marginRight: 8,
  },
});
