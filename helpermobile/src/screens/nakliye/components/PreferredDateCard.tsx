// Tercih edilen tarih kartı - Nakliye işlerinde müşterinin istediği tarihi gösterir
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../../../hooks/useAppTheme';

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

// Zaman dilimini Türkçeye çevir
const formatTimeSlot = (timeSlot: string | null | undefined): string => {
  if (!timeSlot) return '';

  const timeSlotMap: Record<string, string> = {
    'morning': 'Sabah (08:00 - 12:00)',
    'afternoon': 'Öğleden Sonra (12:00 - 17:00)',
    'evening': 'Akşam (17:00 - 21:00)',
    'flexible': 'Esnek',
  };

  return timeSlotMap[timeSlot] || timeSlot;
};

export default function PreferredDateCard({ preferredDate, preferredTimeSlot, visible = true }: PreferredDateCardProps) {
  const { appColors } = useAppTheme();

  if (!visible || !preferredDate) return null;

  const daysUntil = getDaysUntil(preferredDate);
  const formattedDate = formatDate(preferredDate);
  const formattedTimeSlot = formatTimeSlot(preferredTimeSlot);

  // Gün farkına göre renk ve metin belirle
  let daysText = '';
  let daysColor = '#666';
  let iconColor = '#FF9800';

  if (daysUntil < 0) {
    daysText = `(${Math.abs(daysUntil)} gün önce)`;
    daysColor = '#f44336';
    iconColor = '#f44336';
  } else if (daysUntil === 0) {
    daysText = '(Bugün)';
    daysColor = '#4CAF50';
    iconColor = '#4CAF50';
  } else if (daysUntil === 1) {
    daysText = '(Yarın)';
    daysColor = '#FF9800';
    iconColor = '#FF9800';
  } else if (daysUntil <= 7) {
    daysText = `(${daysUntil} gün sonra)`;
    daysColor = '#2196F3';
    iconColor = '#2196F3';
  } else {
    daysText = `(${daysUntil} gün sonra)`;
    daysColor = '#666';
    iconColor = '#FF9800';
  }

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <MaterialCommunityIcons name="calendar-clock" size={24} color={iconColor} />
          <Text style={[styles.title, { color: appColors.text.primary }]}>Talep Edilen Tarih</Text>
        </View>

        <View style={styles.dateContainer}>
          <Text style={[styles.dateText, { color: appColors.text.primary }]}>{formattedDate}</Text>
          <Text style={[styles.daysText, { color: daysColor }]}>{daysText}</Text>
        </View>

        {formattedTimeSlot && (
          <View style={styles.timeSlotContainer}>
            <MaterialCommunityIcons name="clock-outline" size={18} color="#666" />
            <Text style={[styles.timeSlotText, { color: appColors.text.secondary }]}>{formattedTimeSlot}</Text>
          </View>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  dateText: {
    fontSize: 15,
    fontWeight: '500',
  },
  daysText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  timeSlotContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  timeSlotText: {
    fontSize: 14,
    marginLeft: 6,
  },
});
