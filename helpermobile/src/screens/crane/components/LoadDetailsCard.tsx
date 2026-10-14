// Yük ve vinç detayları kartı
import React from 'react';
import { InfoRow, JobSection } from '../../../components/job';
import { FkInfoBanner } from '../../../components/fk';
import { colors, spacing } from '../../../theme/design';

interface LoadDetailsCardProps {
  loadType?: string;
  loadWeight?: string;
  liftHeight?: string;
  floor?: string;
  hasObstacles?: boolean;
  obstacleNote?: string;
}

export default function LoadDetailsCard({
  loadType,
  loadWeight,
  liftHeight,
  floor,
  hasObstacles,
  obstacleNote,
}: LoadDetailsCardProps) {
  return (
    <JobSection title="Yük ve Vinç Detayları" icon="crane">
      <InfoRow icon="package-variant-closed" label="Yük Tipi" value={loadType || 'Belirtilmemiş'} divider />
      <InfoRow icon="weight-kilogram" label="Yük Ağırlığı" value={`${loadWeight || '?'} kg`} divider />
      <InfoRow icon="arrow-expand-vertical" label="Kaldırma Yüksekliği" value={`${liftHeight || '?'} m`} divider />
      <InfoRow icon="office-building-outline" label="Kat Bilgisi" value={floor || '?'} divider />
      <InfoRow
        icon={hasObstacles ? 'alert-outline' : 'check-circle-outline'}
        label="Engel Durumu"
        value={hasObstacles ? 'Engel var' : 'Engel yok'}
        valueColor={hasObstacles ? colors.danger[600] : colors.success[600]}
      />
      {obstacleNote ? (
        <FkInfoBanner
          type="warning"
          icon="note-text-outline"
          title="Engel Notu"
          message={obstacleNote}
          style={{ marginTop: spacing.sm }}
        />
      ) : null}
    </JobSection>
  );
}
