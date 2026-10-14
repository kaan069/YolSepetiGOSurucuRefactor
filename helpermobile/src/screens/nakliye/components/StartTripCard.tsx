// Nakliye - Yola Çık / Konum Paylaşımı Kartı
import React from 'react';
import { JobSection } from '../../../components/job';
import { FkButton, FkInfoBanner } from '../../../components/fk';
import { colors, spacing } from '../../../theme/design';

interface StartTripCardProps {
  visible: boolean;
  isLocationSharing: boolean;
  loading?: boolean;
  onStartTrip: () => void;
  onStopTrip: () => void;
}

export default function StartTripCard({
  visible,
  isLocationSharing,
  loading = false,
  onStartTrip,
  onStopTrip,
}: StartTripCardProps) {
  if (!visible) return null;

  return (
    <JobSection
      title={isLocationSharing ? 'Konum Paylaşılıyor' : 'Konum Paylaşımı'}
      icon={isLocationSharing ? 'map-marker-radius' : 'map-marker-off-outline'}
      iconColor={isLocationSharing ? colors.success[500] : colors.neutral[400]}
      subtitle={
        isLocationSharing
          ? undefined
          : 'Nakliye günü geldiğinde "Yola Çık" butonuna basarak müşteri ile canlı konum paylaşımı başlatabilirsiniz.'
      }
    >
      {isLocationSharing ? (
        <>
          <FkInfoBanner
            type="success"
            icon="access-point"
            message="Müşteri konumunuzu canlı olarak görebilir"
            style={{ marginBottom: spacing.md }}
          />
          <FkButton variant="danger" icon="stop-circle-outline" fullWidth onPress={onStopTrip}>
            Konum Paylaşımını Durdur
          </FkButton>
        </>
      ) : (
        <FkButton icon="navigation-variant-outline" size="lg" fullWidth onPress={onStartTrip} loading={loading}>
          Yola Çık
        </FkButton>
      )}
    </JobSection>
  );
}
