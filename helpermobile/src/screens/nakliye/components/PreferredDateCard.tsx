// Tercih edilen tarih kartı - Nakliye işlerinde müşterinin istediği tarihi gösterir
import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { JobSection } from '../../../components/job';
import { FkIconChip, FkPill } from '../../../components/fk';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { ColorScale, spacing, text } from '../../../theme/design';
import { timeSlotLabel } from '../../../constants/backendLabels';

interface PreferredDateCardProps {
  preferredDate: string | null | undefined;
  preferredTimeSlot?: string | null;
  visible?: boolean;
}

// Gün farkını hesapla
const getDaysUntil = (dateString: string): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const targetDate = new Date(dateString);
  targetDate.setHours(0, 0, 0, 0);

  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
};

// Tarihi formatla
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  };
  return date.toLocaleDateString('tr-TR', options);
};

// Zaman dilimi (çeviriler: constants/backendLabels)
const formatTimeSlot = (timeSlot: string | null | undefined): string => (timeSlot ? timeSlotLabel(timeSlot) : '');

export default function PreferredDateCard({ preferredDate, preferredTimeSlot, visible = true }: PreferredDateCardProps) {
  const { appColors } = useAppTheme();

  if (!visible || !preferredDate) return null;

  const daysUntil = getDaysUntil(preferredDate);
  const formattedDate = formatDate(preferredDate);
  const formattedTimeSlot = formatTimeSlot(preferredTimeSlot);

  // Gün farkına göre renk ve metin
  let daysText: string;
  let scale: ColorScale;
  if (daysUntil < 0) {
    daysText = `${Math.abs(daysUntil)} gün önce`;
    scale = 'danger';
  } else if (daysUntil === 0) {
    daysText = 'Bugün';
    scale = 'success';
  } else if (daysUntil === 1) {
    daysText = 'Yarın';
    scale = 'warning';
  } else if (daysUntil <= 7) {
    daysText = `${daysUntil} gün sonra`;
    scale = 'info';
  } else {
    daysText = `${daysUntil} gün sonra`;
    scale = 'neutral';
  }

  return (
    <JobSection title="Talep Edilen Tarih" icon="calendar-clock">
      <View style={styles.row}>
        <FkIconChip icon="calendar-month-outline" color={scale === 'neutral' ? 'primary' : scale} size={48} />
        <View style={styles.texts}>
          <Text style={[styles.date, { color: appColors.text.primary }]}>{formattedDate}</Text>
          {formattedTimeSlot ? (
            <Text style={[styles.slot, { color: appColors.text.secondary }]}>{formattedTimeSlot}</Text>
          ) : null}
        </View>
        <FkPill label={daysText} color={scale} size="sm" />
      </View>
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
  date: {
    ...text.cardTitle,
  },
  slot: {
    ...text.meta,
    marginTop: 2,
  },
});
