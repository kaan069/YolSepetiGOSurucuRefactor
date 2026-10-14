/**
 * InsurancePricingCard
 *
 * Sigortalı işler için backend'den gelen pricing bilgisini gösterir.
 * Backend ne gönderirse onu satır satır gösterir.
 */
import React from 'react';
import { InsurancePricingInfo } from '../../api/types';
import { InfoRow, JobSection } from '../job';
import { colors, spacing } from '../../theme/design';

interface InsurancePricingCardProps {
  pricing: InsurancePricingInfo;
}

const formatCurrency = (amount: string | number): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0';
  return num.toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export default function InsurancePricingCard({ pricing }: InsurancePricingCardProps) {
  const vatAmount = parseFloat(pricing.total_with_vat) - parseFloat(pricing.total_amount);

  return (
    <JobSection title="Fiyat Detayı" icon="shield-check-outline">
      <InfoRow label="Temel Fiyat" value={`${formatCurrency(pricing.base_price)} ₺`} />
      <InfoRow label="Platform Komisyonu" value={`-${formatCurrency(pricing.platform_commission)} ₺`} valueColor={colors.danger[600]} />
      <InfoRow
        label="Sigorta Komisyonu"
        value={`-${formatCurrency(pricing.insurance_commission)} ₺`}
        valueColor={colors.danger[600]}
        divider
      />
      <InfoRow label="Ara Toplam (KDV Hariç)" value={`${formatCurrency(pricing.total_amount)} ₺`} />
      <InfoRow label={`KDV (%${pricing.vat_rate})`} value={`${formatCurrency(vatAmount)} ₺`} divider />
      <InfoRow
        label="Genel Toplam (KDV Dahil)"
        value={`${formatCurrency(pricing.total_with_vat)} ₺`}
        valueColor={colors.primary[600]}
        emphasize
        style={{ marginTop: spacing.xs }}
      />
    </JobSection>
  );
}
