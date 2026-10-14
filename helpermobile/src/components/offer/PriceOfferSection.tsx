import React, { useState } from 'react';
import { StyleProp, StyleSheet, Text, TextInput, View, ViewStyle } from 'react-native';
import { JobSection, InfoRow } from '../job';
import { FkFormError, FkInfoBanner } from '../fk';
import { useFkTokens } from '../../hooks/useFkTokens';
import { digitsOnly, formatThousands } from '../../utils/priceFormat';
import { getFieldBoxStyle } from '../fk-form/fieldStyles';
import { colors, radius, spacing, text } from '../../theme/design';

export interface PriceOfferInfoRow {
  label: string;
  value: string;
  icon?: string;
}

interface Props {
  /** Ham rakam string'i ("2500") — formatlı gösterim bileşen içinde yapılır */
  value: string;
  /** Her zaman yalnızca rakam döner (binlik ayraç state'e sızmaz) */
  onChange: (digits: string) => void;
  title?: string;
  hint?: string;
  placeholder?: string;
  error?: string | null;
  /** Fiyat girişinin üstünde bilgi satırları (mesafe, süre vb.) */
  infoRows?: PriceOfferInfoRow[];
  /** Komisyon notunu göster */
  showCommissionNote?: boolean;
  /** Girişin altına ek içerik (kazanç dökümü vb.) */
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * Fiyat teklifi bölümü — tüm teklif ekranlarında tek bileşen (eskiden 5 kopya).
 * Büyük, ortalanmış ₺ girişi; binlik ayraçlı gösterim, ham rakam state.
 */
export default function PriceOfferSection({
  value,
  onChange,
  title = 'Fiyat Teklifiniz',
  hint,
  placeholder = '0',
  error,
  infoRows,
  showCommissionNote = true,
  children,
  style,
}: Props) {
  const { tokens, isDarkMode } = useFkTokens();
  const [focused, setFocused] = useState(false);

  return (
    <JobSection title={title} icon="cash-multiple" subtitle={hint} style={style}>
      {infoRows && infoRows.length > 0 ? (
        <View style={[styles.infoBox, { backgroundColor: tokens.colors.surfaceMuted }]}>
          {infoRows.map((r) => (
            <InfoRow key={r.label} label={r.label} value={r.value} icon={r.icon} />
          ))}
        </View>
      ) : null}

      {showCommissionNote ? (
        <FkInfoBanner
          type="warning"
          message="Vereceğiniz teklif içinde platform komisyonu dahildir, bunu göz önünde bulundurarak teklif verin."
          style={styles.note}
        />
      ) : null}

      <View
        style={[
          styles.inputBox,
          getFieldBoxStyle(tokens.colors, isDarkMode, { focused, error: !!error }),
        ]}
      >
        <Text style={[styles.currency, { color: focused ? tokens.colors.primary : colors.neutral[400] }]}>₺</Text>
        <TextInput
          value={formatThousands(value)}
          onChangeText={(t) => onChange(digitsOnly(t))}
          keyboardType="number-pad"
          placeholder={placeholder}
          placeholderTextColor={colors.neutral[300]}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          selectionColor={tokens.colors.primary}
          style={[styles.input, { color: tokens.colors.textPrimary }]}
          maxLength={11}
        />
        <Text style={[styles.suffix, { color: tokens.colors.textSecondary }]}>TL</Text>
      </View>
      <FkFormError error={error} />

      {children}
    </JobSection>
  );
}

const styles = StyleSheet.create({
  infoBox: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginBottom: spacing.md,
  },
  note: {
    marginBottom: spacing.md,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    minHeight: 64,
  },
  currency: {
    fontSize: 26,
    fontWeight: '700',
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    ...text.priceLarge,
    fontSize: 28,
    paddingVertical: 10,
  },
  suffix: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
});
