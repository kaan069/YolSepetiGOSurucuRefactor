/**
 * CommissionPaymentCard
 *
 * Vinç, Nakliye, Yol Yardım işleri için sürücünün komisyon ödemesi yapacağı kart.
 * Müşteri teklifi kabul ettikten sonra sürücü platforma komisyon öder ve iş başlar.
 *
 * Props:
 * - visible: Kartın görünürlüğü
 * - serviceType: 'crane' | 'nakliye' | 'roadAssistance'
 * - jobDetails: İş bilgileri
 * - onPayCommission: Komisyon ödeme fonksiyonu
 * - distanceKm: Müşteriye mesafe (opsiyonel)
 * - estimatedDuration: Tahmini süre (opsiyonel)
 */
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import PaymentLogos from './PaymentLogos';
import { FkButton, FkCard, FkIconChip, FkInfoBanner } from '../fk';
import { InfoRow, JobSection } from '../job';
import { useAppTheme } from '../../hooks/useAppTheme';
import { colors, spacing, text } from '../../theme/design';
import type { ServiceGroup } from '../../constants/serviceTypes';
import { SERVICE_LABEL, SERVICE_ICON } from '../../constants/serviceTypeUI';

/**
 * Commission card yalnızca şu 4 servis için render edilir (callers:
 * CraneJobDetailScreen / NakliyeJobDetailScreen / RoadAssistanceJobDetailScreen /
 * TransferJobDetailScreen). `CommissionServiceType` canonical `ServiceGroup`
 * union'ından bu subset'e daraltılmıştır.
 *
 * Not: Label'lar commission context'ine özel " Hizmeti" suffix ile gösterilir
 * (ör. "Vinç" -> "Vinç Hizmeti"). Icon'lar canonical `SERVICE_ICON` ile birebir.
 */
export type CommissionServiceType = Extract<
  ServiceGroup,
  'crane' | 'nakliye' | 'roadAssistance' | 'transfer'
>;

export interface CommissionJobDetails {
  finalPrice?: number | string;
  commissionAmount?: number;
  commissionVatRate?: number;
  commissionVatAmount?: number;
  commissionTotalWithVat?: number;
  customerName?: string;
  description?: string;
}

interface CommissionPaymentCardProps {
  visible: boolean;
  serviceType: CommissionServiceType;
  jobDetails: CommissionJobDetails;
  onPayCommission: () => void;
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

export default function CommissionPaymentCard({
  visible,
  serviceType,
  jobDetails,
  onPayCommission,
  distanceKm,
  estimatedDuration,
}: CommissionPaymentCardProps) {
  const { appColors } = useAppTheme();

  if (!visible) return null;

  const finalPrice = typeof jobDetails.finalPrice === 'string'
    ? parseFloat(jobDetails.finalPrice)
    : jobDetails.finalPrice || 0;

  // Backend'den gelen komisyon tutarını kullan
  const commissionAmount = jobDetails.commissionAmount || 0;
  const commissionVatRate = jobDetails.commissionVatRate;
  const commissionVatAmount = jobDetails.commissionVatAmount || 0;
  const commissionTotalWithVat = jobDetails.commissionTotalWithVat || commissionAmount;
  const hasVatInfo = jobDetails.commissionVatAmount !== undefined && jobDetails.commissionVatAmount > 0;
  const driverEarnings = finalPrice - commissionTotalWithVat;

  return (
    <View style={styles.container}>
      {/* Başarı mesajı */}
      <FkCard variant="highlighted" padding={spacing.lg} style={styles.block}>
        <View style={styles.successHeader}>
          <FkIconChip icon="check-circle" color="success" variant="solid" size={64} shape="circle" />
          <Text style={[styles.successTitle, { color: appColors.text.primary }]}>Teklifiniz Kabul Edildi!</Text>
          <Text style={[styles.successSubtitle, { color: appColors.text.secondary }]}>
            Müşteri teklifinizi onayladı. İşe başlamak için komisyonu ödemeniz gerekmektedir.
          </Text>
        </View>
      </FkCard>

      {/* Özet */}
      <JobSection title={`${SERVICE_LABEL[serviceType]} Hizmeti`} icon={SERVICE_ICON[serviceType]}>
        {distanceKm !== null && distanceKm !== undefined && (
          <InfoRow icon="map-marker-distance" label="Mesafe" value={`${distanceKm.toFixed(1)} km`} divider />
        )}
        {estimatedDuration ? (
          <InfoRow icon="clock-outline" label="Tahmini Süre" value={`${estimatedDuration} saat`} divider />
        ) : null}
        <InfoRow
          icon="cash"
          label="Kazancınız"
          value={`${formatCurrency(driverEarnings)} ₺`}
          valueColor={colors.success[600]}
          emphasize
        />
      </JobSection>

      {/* Komisyon dökümü */}
      <JobSection title="Ödeme Özeti" icon="receipt-text-outline">
        <InfoRow label="İş Toplam Tutarı" value={`${formatCurrency(finalPrice)} ₺`} />
        <InfoRow label="Platform Komisyonu" value={`-${formatCurrency(commissionAmount)} ₺`} valueColor={colors.danger[600]} />
        {hasVatInfo && (
          <>
            <InfoRow
              label={`KDV${commissionVatRate != null ? ` (%${commissionVatRate})` : ''}`}
              value={`-${formatCurrency(commissionVatAmount)} ₺`}
              valueColor={colors.danger[600]}
              divider
            />
            <InfoRow
              label="Toplam Komisyon"
              value={`-${formatCurrency(commissionTotalWithVat)} ₺`}
              valueColor={colors.danger[700]}
              emphasize
              divider
            />
          </>
        )}
        <InfoRow
          label="Net Kazancınız"
          value={`${formatCurrency(driverEarnings)} ₺`}
          valueColor={colors.success[600]}
          emphasize
          style={styles.netRow}
        />
      </JobSection>

      {/* Ödeme butonu */}
      <FkButton icon="credit-card-outline" size="lg" fullWidth onPress={onPayCommission} style={styles.block}>
        Komisyonu Öde ve İşe Başla
      </FkButton>

      <FkInfoBanner
        type="info"
        icon="shield-check-outline"
        message="Ödeme tamamlandığında iş otomatik olarak başlayacaktır. Kartınızdan iyzico güvencesi ile tahsil edilecektir."
        style={styles.block}
      />

      {/* Visa / MasterCard / iyzico Logoları */}
      <PaymentLogos size="medium" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  block: {
    marginBottom: spacing.md,
  },
  successHeader: {
    alignItems: 'center',
  },
  successTitle: {
    ...text.section,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  successSubtitle: {
    ...text.body,
    marginTop: spacing.xs,
    textAlign: 'center',
    lineHeight: 20,
  },
  netRow: {
    marginTop: spacing.xs,
  },
});
