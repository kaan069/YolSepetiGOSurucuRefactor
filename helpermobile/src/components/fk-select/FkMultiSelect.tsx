import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFkTokens } from '../../hooks/useFkTokens';
import FkCheckbox from '../fk-ui/FkCheckbox';
import FkFormError from '../fk-ui/FkFormError';
import FkLabel from '../fk-ui/FkLabel';
import FkModal from '../fk-ui/FkModal';
import { FkSelectOption } from './types';

interface Props<T extends string | number = string> {
  value: T[];
  onChange: (value: T[]) => void;
  options: FkSelectOption<T>[];
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string | null;
  helperText?: string;
  inline?: boolean;
  maxSelected?: number;
  containerStyle?: ViewStyle;
  testID?: string;
}

export default function FkMultiSelect<T extends string | number = string>({
  value,
  onChange,
  options,
  label,
  placeholder = 'Seçiniz',
  required,
  disabled,
  error,
  helperText,
  inline = true,
  maxSelected,
  containerStyle,
  testID,
}: Props<T>) {
  const { tokens } = useFkTokens();
  const [open, setOpen] = useState(false);

  const toggle = useCallback(
    (v: T) => {
      if (disabled) return;
      const has = value.includes(v);
      if (has) {
        onChange(value.filter((x) => x !== v));
      } else {
        if (maxSelected && value.length >= maxSelected) return;
        onChange([...value, v]);
      }
    },
    [value, onChange, disabled, maxSelected],
  );

  const selectedLabel = useMemo(() => {
    if (value.length === 0) return '';
    const lookup = new Map(options.map((o) => [o.value, o.label]));
    return value.map((v) => lookup.get(v) ?? String(v)).join(', ');
  }, [value, options]);

  const renderInline = () => (
    <View style={{ gap: tokens.spacing.sm }}>
      {options.map((opt) => (
        <FkCheckbox
          key={String(opt.value)}
          value={value.includes(opt.value)}
          onChange={() => toggle(opt.value)}
          disabled={disabled || opt.disabled}
          variant="card"
          label={`${opt.icon ? `${opt.icon} ` : ''}${opt.label}`}
        />
      ))}
    </View>
  );

  return (
    <View style={[{ marginBottom: tokens.spacing.md }, containerStyle]} testID={testID}>
      {label ? (
        <FkLabel required={required} disabled={disabled}>
          {label}
        </FkLabel>
      ) : null}

      {inline ? (
        renderInline()
      ) : (
        <Pressable
          onPress={() => !disabled && setOpen(true)}
          disabled={disabled}
          style={[
            styles.trigger,
            {
              backgroundColor: tokens.colors.cardBg,
              borderColor: error ? tokens.colors.error : tokens.colors.border,
              borderRadius: tokens.radius.md,
              opacity: disabled ? 0.6 : 1,
            },
          ]}
        >
          <Text
            numberOfLines={2}
            style={[
              styles.triggerText,
              { color: selectedLabel ? tokens.colors.textPrimary : tokens.colors.textHint },
            ]}
          >
            {selectedLabel || placeholder}
          </Text>
          <MaterialCommunityIcons name="chevron-down" size={22} color={tokens.colors.textSecondary} />
        </Pressable>
      )}

      <FkFormError error={error} helperText={helperText} />

      {!inline ? (
        <FkModal
          visible={open}
          onDismiss={() => setOpen(false)}
          title={label || 'Seçiniz'}
          variant="bottom"
          maxHeightRatio={0.8}
          scrollable
        >
          <View style={{ padding: tokens.spacing.lg, gap: tokens.spacing.sm }}>
            {options.map((opt) => (
              <FkCheckbox
                key={String(opt.value)}
                value={value.includes(opt.value)}
                onChange={() => toggle(opt.value)}
                disabled={disabled || opt.disabled}
                variant="card"
                label={`${opt.icon ? `${opt.icon} ` : ''}${opt.label}`}
              />
            ))}
          </View>
        </FkModal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    minHeight: 52,
  },
  triggerText: { flex: 1, fontSize: 16, marginRight: 8 },
});
