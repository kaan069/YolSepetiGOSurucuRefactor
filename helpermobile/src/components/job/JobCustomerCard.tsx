import React from 'react';
import { StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import JobSection from './JobSection';
import { FkButton, FkIconChip } from '../fk';
import { useFkTokens } from '../../hooks/useFkTokens';
import { callPhone } from '../../utils/contactActions';
import { colors, shadows, spacing, text } from '../../theme/design';

interface Props {
  name?: string | null;
  phone?: string | null;
  title?: string;
  /** Kartın altına tam genişlikte "Müşteriyi Ara" butonu ekler */
  showCallButton?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Müşteri bilgileri — tüm servislerde tek bileşen (eskiden 8 kopya).
 * Avatar + ad + telefon, sağda yeşil arama butonu (müşteri uygulamasındaki sürücü kartı kalıbı).
 */
export default function JobCustomerCard({
  name,
  phone,
  title = 'Müşteri Bilgileri',
  showCallButton = false,
  style,
}: Props) {
  const { tokens } = useFkTokens();
  if (!name && !phone) return null;

  return (
    <JobSection title={title} icon="account-outline" style={style}>
      <View style={styles.row}>
        <FkIconChip icon="account" size={52} shape="circle" />
        <View style={styles.texts}>
          {name ? (
            <Text style={[styles.name, { color: tokens.colors.textPrimary }]} numberOfLines={1}>
              {name}
            </Text>
          ) : null}
          {phone ? (
            <Text style={[styles.phone, { color: tokens.colors.textSecondary }]}>{phone}</Text>
          ) : null}
        </View>
        {phone ? (
          <TouchableOpacity
            onPress={() => callPhone(phone)}
            style={styles.callCircle}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Müşteriyi ara"
          >
            <MaterialCommunityIcons name="phone" size={22} color={colors.white} />
          </TouchableOpacity>
        ) : null}
      </View>
      {phone && showCallButton ? (
        <FkButton variant="success" icon="phone" onPress={() => callPhone(phone)} fullWidth style={styles.callButton}>
          Müşteriyi Ara
        </FkButton>
      ) : null}
    </JobSection>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  texts: {
    flex: 1,
  },
  name: {
    ...text.cardTitle,
  },
  phone: {
    ...text.body,
    marginTop: 2,
  },
  callCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.success[500],
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  callButton: {
    marginTop: spacing.md,
  },
});
