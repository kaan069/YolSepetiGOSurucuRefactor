// Yük detayları kartı - Nakliye
import React from 'react';
import { InfoRow, JobSection } from '../../../components/job';
import { FkInfoBanner } from '../../../components/fk';
import { spacing } from '../../../theme/design';

interface LoadDetailsCardProps {
  loadType?: string;
  loadWeight?: string | number;
  loadVolume?: string | number;
  notes?: string;
  distanceToPickup?: number | null;
  // Şehirler arası için boyut alanları
  width?: string | number;
  length?: string | number;
  height?: string | number;
  // Evden eve için ek alanlar
  roomCount?: string;
  floorFrom?: number;
  floorTo?: number;
  hasElevatorFrom?: boolean;
  hasElevatorTo?: boolean;
}

export default function LoadDetailsCard({
  loadType,
  loadWeight,
  loadVolume,
  notes,
  distanceToPickup,
  width,
  length,
  height,
  roomCount,
  floorFrom,
  floorTo,
  hasElevatorFrom,
  hasElevatorTo,
}: LoadDetailsCardProps) {
  const rows: { icon: string; label: string; value: string }[] = [];
  if (loadType) rows.push({ icon: 'package-variant-closed', label: 'Yük Türü', value: loadType });
  if (loadWeight) rows.push({ icon: 'weight-kilogram', label: 'Yük Ağırlığı', value: `${loadWeight} kg` });
  if (loadVolume) rows.push({ icon: 'cube-outline', label: 'Hacim', value: `${loadVolume} m³` });
  if (width || length || height) {
    rows.push({
      icon: 'ruler-square',
      label: 'Boyutlar (E x B x Y)',
      value: `${width || '-'} x ${length || '-'} x ${height || '-'} cm`,
    });
  }
  if (roomCount) rows.push({ icon: 'floor-plan', label: 'Oda Sayısı', value: roomCount });
  if (floorFrom !== undefined && floorFrom !== null) {
    rows.push({
      icon: 'stairs-up',
      label: 'Alınacak Kat',
      value: `${floorFrom}. kat ${hasElevatorFrom ? '(Asansör var)' : '(Asansör yok)'}`,
    });
  }
  if (floorTo !== undefined && floorTo !== null) {
    rows.push({
      icon: 'stairs-down',
      label: 'Bırakılacak Kat',
      value: `${floorTo}. kat ${hasElevatorTo ? '(Asansör var)' : '(Asansör yok)'}`,
    });
  }
  if (distanceToPickup !== null && distanceToPickup !== undefined) {
    rows.push({ icon: 'map-marker-distance', label: 'Müşteriye uzaklığınız', value: `${distanceToPickup.toFixed(0)} km` });
  }

  return (
    <JobSection title="Yük Detayları" icon="package-variant-closed">
      {rows.map((r, i) => (
        <InfoRow key={r.label} icon={r.icon} label={r.label} value={r.value} divider={i < rows.length - 1} />
      ))}
      {notes ? (
        <FkInfoBanner type="neutral" icon="note-text-outline" title="Notlar" message={notes} style={{ marginTop: spacing.sm }} />
      ) : null}
    </JobSection>
  );
}
