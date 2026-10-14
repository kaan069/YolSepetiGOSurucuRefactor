// Problem detayları kartı
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { getProblemLabel, getProblemIcon, getVehicleTypeLabel } from '../constants';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { InfoRow, JobSection } from '../../../components/job';
import { FkInfoBanner, FkPill } from '../../../components/fk';
import { spacing } from '../../../theme/design';

interface ProblemDetailsCardProps {
  vehicleType?: string;
  problemTypes?: string[];
  problemDescription?: string;
  additionalNotes?: string;
}

export default function ProblemDetailsCard({
  vehicleType,
  problemTypes,
  problemDescription,
  additionalNotes,
}: ProblemDetailsCardProps) {
  const { appColors } = useAppTheme();

  return (
    <JobSection title="Problem Detayları" subtitle="Müşterinin bildirdiği sorun" icon="car-wrench">
      {vehicleType ? (
        <InfoRow icon="car-outline" label="Araç Tipi" value={getVehicleTypeLabel(vehicleType)} divider />
      ) : null}

      <Text style={[styles.label, { color: appColors.text.secondary }]}>Sorun Türü</Text>
      <View style={styles.pills}>
        {problemTypes && problemTypes.length > 0 ? (
          problemTypes.map((type, index) => (
            <FkPill key={index} icon={getProblemIcon(type)} label={getProblemLabel(type)} color="secondary" />
          ))
        ) : (
          <Text style={[styles.empty, { color: appColors.text.disabled }]}>Belirtilmemiş</Text>
        )}
      </View>

      {problemDescription ? (
        <FkInfoBanner type="neutral" icon="text-box-outline" title="Açıklama" message={problemDescription} style={styles.block} />
      ) : null}
      {additionalNotes ? (
        <FkInfoBanner type="neutral" icon="note-text-outline" title="Ek Notlar" message={additionalNotes} style={styles.block} />
      ) : null}
    </JobSection>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 13,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  empty: {
    fontSize: 13,
  },
  block: {
    marginTop: spacing.sm + 4,
  },
});
