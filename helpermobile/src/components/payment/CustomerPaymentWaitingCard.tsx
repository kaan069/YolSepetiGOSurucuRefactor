/**
 * CustomerPaymentWaitingCard
 *
 * Çekici işleri için müşterinin ödeme yapmasını bekleyen kart.
 * Müşteri teklifi kabul ettikten sonra web'den kartla ödeme yapacak.
 * Ödeme yapıldığında iş otomatik olarak "Devam Eden"e geçer.
 *
 * Props:
 * - visible: Kartın görünürlüğü
 * - jobDetails: İş bilgileri
 * - distanceKm: Müşteriye mesafe (opsiyonel)
 * - estimatedDuration: Tahmini süre (opsiyonel)
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { FkCard, FkIconChip, FkInfoBanner } from '../fk';
import { InfoRow, JobSection } from '../job';
import { useAppTheme } from '../../hooks/useAppTheme';
import { colors, spacing, text } from '../../theme/design';

export interface CustomerPaymentJobDetails {
  finalPrice?: number | string;
  driverEarnings?: number | string;
  customerName?: string;
  description?: string;
  vehicleType?: string;
}

interface CustomerPaymentWaitingCardProps {
  visible: boolean;
  jobDetails: CustomerPaymentJobDetails;
  distanceKm?: number | null;
  estimatedDuration?: number | string | null;
}

const formatCurrency = (amount: number | string): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return num.toLocaleString('tr-TR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};

export default function CustomerPaymentWaitingCard({
  visible,
  jobDetails,
  distanceKm,
  estimatedDuration,
}: CustomerPaymentWaitingCardProps) {
  const { appColors } = useAppTheme();

  if (!visible) return null;

  const driverEarnings = typeof jobDetails.driverEarnings === 'string'
    ? parseFloat(jobDetails.driverEarnings)
    : jobDetails.driverEarnings || 0;

  const finalPrice = typeof jobDetails.finalPrice === 'string'
    ? parseFloat(jobDetails.finalPrice)
    : jobDetails.finalPrice || driverEarnings;

  return (
    <View style={styles.container}>
      {/* Başarı mesajı */}
      <FkCard variant="highlighted" padding={spacing.lg} style={styles.block}>
        <View style={styles.center}>
          <FkIconChip icon="check-circle" color="success" variant="solid" size={64} shape="circle" />
          <Text style={[styles.title, { color: appColors.text.primary }]}>Teklifiniz Kabul Edildi!</Text>
          <Text style={[styles.subtitle, { color: appColors.text.secondary }]}>
            Müşteri teklifinizi onayladı. Müşterinin ödeme yapmasını bekliyorsunuz.
          </Text>
        </View>
      </FkCard>

      {/* Bekleme durumu */}
      <FkCard style={styles.block}>
        <View style={styles.waitingRow}>
          <ActivityIndicator size="large" color={colors.secondary[500]} />
          <View style={styles.flex}>
            <Text style={[styles.waitingTitle, { color: appColors.text.primary }]}>Müşteri Ödemesi Bekleniyor</Text>
            <Text style={[styles.waitingSubtitle, { color: appColors.text.secondary }]}>
              Müşteri web'den veya araçta ödeme yapacak
            </Text>
          </View>
        </View>
      </FkCard>

      {/* Özet */}
      <JobSection
        title={`Çekici Hizmeti${jobDetails.vehicleType ? ` - ${jobDetails.vehicleType}` : ''}`}
        icon="tow-truck"
      >
        {distanceKm !== null && distanceKm !== undefined && (
          <InfoRow icon="map-marker-distance" label="Mesafe" value={`${distanceKm.toFixed(1)} km`} divider />
        )}
        {estimatedDuration ? (
          <InfoRow icon="clock-outline" label="Tahmini Süre" value={`${estimatedDuration} dk`} divider />
        ) : null}
        <InfoRow
          icon="cash"
          label="Kazancınız"
          value={`${formatCurrency(driverEarnings)} ₺`}
          valueColor={colors.success[600]}
          emphasize
        />
      </JobSection>

      {/* Müşteri ödeme seçenekleri */}
      <JobSection title="Müşteri Ödeme Seçenekleri" icon="credit-card-check-outline">
        <View style={styles.optionRow}>
          <FkIconChip icon="web" color="info" size={40} />
          <View style={styles.flex}>
            <Text style={[styles.optionLabel, { color: appColors.text.primary }]}>Web'den Ödeme</Text>
            <Text style={[styles.optionDesc, { color: appColors.text.secondary }]}>Takip linki üzerinden kredi kartı ile</Text>
          </View>
        </View>
      </JobSection>

      <FkInfoBanner
        type="info"
        message={'Müşteri ödeme yaptığında size bildirim gönderilecek ve iş otomatik olarak "Devam Eden" sekmesine geçecektir.'}
        style={styles.block}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.sm,
  },
  block: {
    marginBottom: spacing.md,
  },
  flex: {
    flex: 1,
  },
  center: {
    alignItems: 'center',
  },
  title: {
    ...text.section,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    ...text.body,
    marginTop: spacing.xs,
    textAlign: 'center',
    lineHeight: 20,
  },
  waitingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  waitingTitle: {
    ...text.cardTitle,
  },
  waitingSubtitle: {
    ...text.meta,
    marginTop: 2,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  optionDesc: {
    ...text.meta,
    marginTop: 2,
  },
});
