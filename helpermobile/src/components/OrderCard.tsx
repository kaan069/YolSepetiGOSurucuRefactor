import React from 'react';
import { Card, Text, Button, useTheme } from 'react-native-paper';
import { OrdersJob } from '../screens/orders/types';
import { View, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../hooks/useAppTheme';

// Tercih edilen tarihi formatla ve gün farkını hesapla
const formatPreferredDate = (dateString: string | undefined): { formatted: string; daysText: string; color: string } | null => {
  if (!dateString) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const targetDate = new Date(dateString);
  targetDate.setHours(0, 0, 0, 0);

  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Tarih formatla
  const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  const formatted = targetDate.toLocaleDateString('tr-TR', options);

  // Gün farkına göre metin ve renk
  let daysText = '';
  let color = '#666';

  if (diffDays < 0) {
    daysText = `(${Math.abs(diffDays)} gün önce)`;
    color = '#f44336';
  } else if (diffDays === 0) {
    daysText = '(Bugün)';
    color = '#4CAF50';
  } else if (diffDays === 1) {
    daysText = '(Yarın)';
    color = '#FF9800';
  } else if (diffDays <= 7) {
    daysText = `(${diffDays} gün sonra)`;
    color = '#2196F3';
  } else {
    daysText = `(${diffDays} gün sonra)`;
    color = '#666';
  }

  return { formatted, daysText, color };
};

// Component props interface.
// Component prop'ları için arayüz.
interface Props {
  item: OrdersJob; // The job data to display. // Görüntülenecek iş verisi.
  onPress: () => void; // Function to call when the card is pressed. // Kart tıklandığında çağrılacak fonksiyon.
  onDismiss?: () => void; // Optional function to dismiss the job. // İşi gizlemek için opsiyonel fonksiyon.
}

// This component displays a single job item in a card format.
// Bu component, tek bir iş kalemini kart formatında görüntüler.
export default function OrderCard({ item, onPress, onDismiss }: Props) {
  const theme = useTheme();
  const { isDarkMode, appColors, cardBg } = useAppTheme();

  // OrdersJob zaten normalize edilmiş shape sunar (from/to/vehicleType).
  const fromAddress = item.from.address || 'Adres belirtilmemiş';
  const toAddress = item.to.address || 'Adres belirtilmemiş';
  const vehicleInfo = item.vehicleType || 'Belirtilmemiş';
  const preferredDateInfo = formatPreferredDate(item.preferredDate);

  // Durum için renk ve ikon belirleme
  const getStatusInfo = () => {
    switch (item.status) {
      case 'pending':
        return {
          color: '#FF9800',
          bgColor: isDarkMode ? '#3e2e00' : '#FFF3E0',
          icon: 'clock-outline',
          text: 'Gelen İş'
        };
      case 'awaiting_approval':
        return {
          color: '#2196F3',
          bgColor: isDarkMode ? '#0d2137' : '#E3F2FD',
          icon: 'account-clock-outline',
          text: 'Onay Bekliyor'
        };
      case 'awaiting_payment':
        return {
          color: '#9C27B0',
          bgColor: isDarkMode ? '#2d1033' : '#F3E5F5',
          icon: 'credit-card-clock-outline',
          text: 'Ödeme Bekleniyor'
        };
      case 'in_progress':
        return {
          color: '#4CAF50',
          bgColor: isDarkMode ? '#1b3a1b' : '#E8F5E9',
          icon: 'truck-fast-outline',
          text: 'Devam Ediyor'
        };
      case 'completed':
        return {
          color: '#4CAF50',
          bgColor: isDarkMode ? '#1b3a1b' : '#E8F5E9',
          icon: 'check-circle-outline',
          text: 'Tamamlandı'
        };
      default:
        return {
          color: '#757575',
          bgColor: isDarkMode ? '#333' : '#F5F5F5',
          icon: 'information-outline',
          text: item.status
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <Card style={[styles.card, { backgroundColor: cardBg }]} elevation={2}>
      {/* Header - Talep ID ve Durum */}
      <View style={[styles.header, { borderBottomColor: isDarkMode ? '#333' : '#F0F0F0' }]}>
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons name={"clipboard-text" as any} size={20} color="#26a69a" />
          <Text variant="titleMedium" style={[styles.jobId, { marginLeft: 8, color: appColors.text.primary }]}>
            Talep #{item.id.toString().slice(-2).padStart(2, '0')}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusInfo.bgColor }]}>
          <MaterialCommunityIcons name={statusInfo.icon as any} size={14} color={statusInfo.color} />
          <Text style={[styles.statusText, { color: statusInfo.color, marginLeft: 4 }]}>
            {statusInfo.text}
          </Text>
        </View>
      </View>

      <Card.Content style={styles.content}>
        {/* Konum Bilgileri */}
        <View style={styles.locationSection}>
          <View style={styles.locationRow}>
            <View style={[styles.iconCircle, { backgroundColor: isDarkMode ? '#1a2e2c' : '#F5F5F5' }]}>
              <MaterialCommunityIcons name={"map-marker" as any} size={16} color="#26a69a" />
            </View>
            <View style={[styles.locationTextContainer, { marginLeft: 10 }]}>
              <Text variant="labelSmall" style={[styles.locationLabel, { color: appColors.text.secondary }]}>
                Konum
              </Text>
              <Text variant="bodyMedium" style={[styles.locationText, { color: appColors.text.primary }]} numberOfLines={2}>
                {fromAddress}
              </Text>
            </View>
          </View>

          {fromAddress !== toAddress && (
            <View style={styles.locationRow}>
              <View style={[styles.iconCircle, { backgroundColor: isDarkMode ? '#2d1a14' : '#F5F5F5' }]}>
                <MaterialCommunityIcons name={"map-marker-check" as any} size={16} color="#FF5722" />
              </View>
              <View style={[styles.locationTextContainer, { marginLeft: 10 }]}>
                <Text variant="labelSmall" style={[styles.locationLabel, { color: appColors.text.secondary }]}>
                  Bırakılacak
                </Text>
                <Text variant="bodyMedium" style={[styles.locationText, { color: appColors.text.primary }]} numberOfLines={2}>
                  {toAddress}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Araç/Hizmet Bilgisi */}
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name={"car" as any} size={18} color={appColors.text.secondary} />
          <Text variant="bodyMedium" style={[styles.infoText, { marginLeft: 8, color: appColors.text.secondary }]}>
            {vehicleInfo}
          </Text>
        </View>

        {/* Tercih Edilen Tarih (Nakliye için) */}
        {preferredDateInfo && (
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name={"calendar-clock" as any} size={18} color={preferredDateInfo.color} />
            <Text variant="bodyMedium" style={[styles.infoText, { marginLeft: 8, color: appColors.text.secondary }]}>
              {preferredDateInfo.formatted}{' '}
              <Text style={{ color: preferredDateInfo.color, fontWeight: '600' }}>
                {preferredDateInfo.daysText}
              </Text>
            </Text>
          </View>
        )}

        {/* Açıklama */}
        {item.description && (
          <View style={[styles.descriptionContainer, { backgroundColor: isDarkMode ? '#2C2C2C' : '#F9F9F9' }]}>
            <MaterialCommunityIcons name={"information-outline" as any} size={16} color={appColors.text.secondary} />
            <Text variant="bodySmall" style={[styles.descriptionText, { marginLeft: 6, color: appColors.text.secondary }]} numberOfLines={2}>
              {item.description}
            </Text>
          </View>
        )}

        {/* İş Detayına Gir Butonu */}
        <Button
          mode="contained"
          onPress={onPress}
          style={styles.detailButton}
          contentStyle={styles.detailButtonContent}
          labelStyle={styles.detailButtonLabel}
          icon="arrow-right-circle"
        >
          İş Detayına Gir
        </Button>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
    marginHorizontal: 4,
    borderRadius: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  jobId: {
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    paddingTop: 16,
  },
  locationSection: {
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationLabel: {
    marginBottom: 2,
    textTransform: 'uppercase',
    fontSize: 11,
  },
  locationText: {
    lineHeight: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    flex: 1,
  },
  descriptionContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 10,
    borderRadius: 8,
    marginTop: 4,
    marginBottom: 12,
  },
  descriptionText: {
    flex: 1,
    lineHeight: 18,
  },
  detailButton: {
    marginTop: 12,
    borderRadius: 8,
  },
  detailButtonContent: {
    paddingVertical: 6,
  },
  detailButtonLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
});
