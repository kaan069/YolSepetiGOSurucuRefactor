/**
 * ExtraEquipmentSection Component
 *
 * Araçta ek ekipman varsa (has_extra_attachments=true) ekipman tiplerini rozet olarak listeler.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { JobSection } from '../../../components/job';
import { FkPill } from '../../../components/fk';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { spacing } from '../../../theme/design';

interface ExtraEquipmentSectionProps {
  /** Ekstra ekipman var mı? */
  hasExtraAttachments: boolean;
  /** Ekipman tipleri listesi */
  attachmentTypes?: string[];
}

export default function ExtraEquipmentSection({ hasExtraAttachments, attachmentTypes }: ExtraEquipmentSectionProps) {
  const { appColors } = useAppTheme();
  if (!hasExtraAttachments) return null;
  return (
    <JobSection title="Ekstra Ekipmanlar" icon="toolbox-outline">
      {attachmentTypes && attachmentTypes.length > 0 ? (
        <View style={styles.pills}>
          {attachmentTypes.map((attachment, index) => (
            <FkPill key={index} label={attachment} color="primary" />
          ))}
        </View>
      ) : (
        <Text style={{ color: appColors.text.secondary, fontSize: 13 }}>Ekipman bilgisi belirtilmemiş</Text>
      )}
    </JobSection>
  );
}

const styles = StyleSheet.create({
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
