// İş detayları kartı - Vinç
import React from 'react';
import { InfoRow, JobSection } from '../../../components/job';
import { FkInfoBanner } from '../../../components/fk';
import { colors, spacing } from '../../../theme/design';

interface JobDetailsCardProps {
  orderId: string;
  loadType?: string;
  loadWeight?: string;
  liftHeight?: string;
  floor?: string;
  hasObstacles?: boolean;
  obstacleNote?: string;
}

export default function JobDetailsCard({
  orderId,
  loadType,
  loadWeight,
  liftHeight,
  floor,
  hasObstacles,
  obstacleNote,
}: JobDetailsCardProps) {
  return (
    <JobSection title="Vinç Talebi Detayları" subtitle={`Talep #${orderId.slice(0, 6)}`} icon="crane">
      <InfoRow icon="package-variant-closed" label="Yük Tipi" value={loadType || 'Belirtilmemiş'} divider />
      <InfoRow icon="weight-kilogram" label="Yük Ağırlığı" value={loadWeight ? `${loadWeight} kg` : 'Belirtilmemiş'} divider />
      <InfoRow
        icon="arrow-expand-vertical"
        label="Kaldırma Yüksekliği"
        value={liftHeight ? `${liftHeight} m` : 'Belirtilmemiş'}
        divider
      />
      <InfoRow
        icon="office-building-outline"
        label="Kat Bilgisi"
        value={floor || 'Belirtilmemiş'}
        divider={!!hasObstacles}
      />
      {hasObstacles && (
        <InfoRow icon="alert-outline" label="Engeller" value="Engel var" valueColor={colors.danger[600]} />
      )}
      {hasObstacles && obstacleNote ? (
        <FkInfoBanner type="warning" icon="note-text-outline" message={obstacleNote} style={{ marginTop: spacing.sm }} />
      ) : null}
    </JobSection>
  );
}
