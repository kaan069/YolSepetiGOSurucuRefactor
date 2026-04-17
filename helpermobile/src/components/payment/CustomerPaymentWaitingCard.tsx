/**
 * CustomerPaymentWaitingCard
 *
 * Çekici işleri için müşterinin ödeme yapmasını bekleyen kart.
 * Müşteri teklifi kabul ettikten sonra web'den veya araçta (NFC/QR) ödeme yapacak.
 * Ödeme yapıldığında iş otomatik olarak "Devam Eden"e geçer.
 *
 * Props:
 * - visible: Kartın görünürlüğü
 * - jobDetails: İş bilgileri
 * - distanceKm: Müşteriye mesafe (opsiyonel)
 * - estimatedDuration: Tahmini süre (opsiyonel)
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export interface CustomerPaymentJobDetails {
  finalPrice?: number | string;
  driverEarnings?: number | string;
  customerName?: string;
  description?: string;
  vehicleType?: string;
}

interface CustomerPaymentWaitingCardProps {
  visible: boolean;
  jobDetails: CustomerPaymentJobDetails;
  distanceKm?: number | null;
  estimatedDuration?: number | string | null;
}

const formatCurrency = (amount: number | string): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return num.toLocaleString('tr-TR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};

export default function CustomerPaymentWaitingCard({
  visible,
  jobDetails,
  distanceKm,
  estimatedDuration,
}: CustomerPaymentWaitingCardProps) {
  if (!visible) return null;

  const driverEarnings = typeof jobDetails.driverEarnings === 'string'
    ? parseFloat(jobDetails.driverEarnings)
    : jobDetails.driverEarnings || 0;

  const finalPrice = typeof jobDetails.finalPrice === 'string'
    ? parseFloat(jobDetails.finalPrice)
    : jobDetails.finalPrice || driverEarnings;

  return (
    <View style={styles.container}>
      {/* Başarı Mesajı */}
      <View style={styles.successHeader}>
        <View style={styles.successIconContainer}>
          <MaterialCommunityIcons name="check-circle" size={48} color="#4CAF50" />
        </View>
        <Text style={styles.successTitle}>Teklifiniz Kabul Edildi!</Text>
        <Text style={styles.successSubtitle}>
          Müşteri teklifinizi onayladı. Müşterinin ödeme yapmasını bekliyorsunuz.
        </Text>
      </View>

      {/* Bekleme Animasyonu */}
      <View style={styles.waitingCard}>
        <View style={styles.waitingIconRow}>
          <ActivityIndicator size="large" color="#FF9800" />
          <View style={styles.waitingTextContainer}>
            <Text style={styles.waitingTitle}>Müşteri Ödemesi Bekleniyor</Text>
            <Text style={styles.waitingSubtitle}>
              Müşteri web'den veya araçta ödeme yapacak
            </Text>
          </View>
        </View>
      </View>

      {/* Özet Bilgi Kartı */}
      <View style={styles.summaryCard}>
        {/* Servis Tipi */}
        <View style={styles.serviceRow}>
          <View style={styles.serviceIconContainer}>
            <MaterialCommunityIcons name="tow-truck" size={24} color="#26a69a" />
          </View>
          <Text style={styles.serviceLabel}>
            Çekici Hizmeti {jobDetails.vehicleType ? `- ${jobDetails.vehicleType}` : ''}
          </Text>
        </View>

        {/* Mesafe */}
        {distanceKm !== null && distanceKm !== undefined && (
          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <MaterialCommunityIcons name="map-marker-distance" size={24} color="#1976D2" />
              <Text style={styles.infoLabel}>Mesafe</Text>
            </View>
            <Text style={styles.infoValue}>{distanceKm.toFixed(1)} km</Text>
          </View>
        )}

        {/* Süre */}
        {estimatedDuration && (
          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <MaterialCommunityIcons name="clock-outline" size={24} color="#FF9800" />
              <Text style={styles.infoLabel}>Tahmini Süre</Text>
            </View>
            <Text style={[styles.infoValue, { color: '#FF9800' }]}>
              {estimatedDuration} dk
            </Text>
          </View>
        )}

        {/* Kazanç */}
        <View style={[styles.infoRow, styles.earningsRow]}>
          <View style={styles.infoLeft}>
            <MaterialCommunityIcons name="cash" size={24} color="#4CAF50" />
            <Text style={styles.infoLabel}>Kazancınız</Text>
          </View>
          <Text style={styles.earningsValue}>{formatCurrency(driverEarnings)} ₺</Text>
        </View>
      </View>

      {/* Ödeme Seçenekleri Bilgisi */}
      <View style={styles.paymentOptionsCard}>
        <Text style={styles.paymentOptionsTitle}>Müşteri Ödeme Seçenekleri</Text>

        <View style={styles.paymentOption}>
          <View style={styles.paymentOptionIcon}>
            <MaterialCommunityIcons name="web" size={20} color="#1976D2" />
          </View>
          <View style={styles.paymentOptionInfo}>
            <Text style={styles.paymentOptionLabel}>Web'den Ödeme</Text>
            <Text style={styles.paymentOptionDesc}>Tracking linki üzerinden kredi kartı ile</Text>
          </View>
        </View>

        <View style={styles.paymentOption}>
          <View style={styles.paymentOptionIcon}>
            <MaterialCommunityIcons name="contactless-payment" size={20} color="#26a69a" />
          </View>
          <View style={styles.paymentOptionInfo}>
            <Text style={styles.paymentOptionLabel}>Araçta NFC Ödeme</Text>
            <Text style={styles.paymentOptionDesc}>Telefonunuzdan temassız ödeme</Text>
          </View>
        </View>

        <View style={styles.paymentOption}>
          <View style={styles.paymentOptionIcon}>
            <MaterialCommunityIcons name="qrcode" size={20} color="#7B1FA2" />
          </View>
          <View style={styles.paymentOptionInfo}>
            <Text style={styles.paymentOptionLabel}>Araçta QR Ödeme</Text>
            <Text style={styles.paymentOptionDesc}>QR kod okutarak ödeme</Text>
          </View>
        </View>
      </View>

      {/* Bilgi Notu */}
      <View style={styles.infoNote}>
        <MaterialCommunityIcons name="information" size={20} color="#FF9800" />
        <Text style={styles.infoNoteText}>
          Müşteri ödeme yaptığında size bildirim gönderilecek ve iş otomatik olarak "Devam Eden" sekmesine geçecektir.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  successHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  successIconContainer: {
    backgroundColor: '#E8F5E9',
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32',
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  waitingCard: {
    backgroundColor: '#FFF3E0',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  waitingIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  waitingTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  waitingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E65100',
  },
  waitingSubtitle: {
    fontSize: 13,
    color: '#F57C00',
    marginTop: 4,
  },
  summaryCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    marginBottom: 12,
  },
  serviceIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0F2F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  serviceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  earningsRow: {
    borderBottomWidth: 0,
    paddingTop: 16,
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976D2',
  },
  earningsValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  paymentOptionsCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  paymentOptionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  paymentOptionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paymentOptionInfo: {
    flex: 1,
  },
  paymentOptionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  paymentOptionDesc: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
  },
  infoNoteText: {
    fontSize: 13,
    color: '#E65100',
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
});
