/**
 * CommissionPaymentCard
 *
 * Vinç, Nakliye, Yol Yardım işleri için sürücünün komisyon ödemesi yapacağı kart.
 * Müşteri teklifi kabul ettikten sonra sürücü platforma komisyon öder ve iş başlar.
 *
 * Props:
 * - visible: Kartın görünürlüğü
 * - serviceType: 'crane' | 'nakliye' | 'roadAssistance'
 * - jobDetails: İş bilgileri
 * - onPayCommission: Komisyon ödeme fonksiyonu
 * - distanceKm: Müşteriye mesafe (opsiyonel)
 * - estimatedDuration: Tahmini süre (opsiyonel)
 */
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text, Button } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import PaymentLogos from './PaymentLogos';

export type CommissionServiceType = 'crane' | 'nakliye' | 'roadAssistance';

export interface CommissionJobDetails {
  finalPrice?: number | string;
  commissionAmount?: number;
  commissionVatRate?: number;
  commissionVatAmount?: number;
  commissionTotalWithVat?: number;
  customerName?: string;
  description?: string;
}

interface CommissionPaymentCardProps {
  visible: boolean;
  serviceType: CommissionServiceType;
  jobDetails: CommissionJobDetails;
  onPayCommission: () => void;
  distanceKm?: number | null;
  estimatedDuration?: number | string | null;
}

const serviceLabels: Record<CommissionServiceType, string> = {
  crane: 'Vinç Hizmeti',
  nakliye: 'Nakliye Hizmeti',
  roadAssistance: 'Yol Yardım Hizmeti',
};

const serviceIcons: Record<CommissionServiceType, string> = {
  crane: 'crane',
  nakliye: 'truck-cargo-container',
  roadAssistance: 'car-wrench',
};

const formatCurrency = (amount: number | string): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return num.toLocaleString('tr-TR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};

export default function CommissionPaymentCard({
  visible,
  serviceType,
  jobDetails,
  onPayCommission,
  distanceKm,
  estimatedDuration,
}: CommissionPaymentCardProps) {
  if (!visible) return null;

  const finalPrice = typeof jobDetails.finalPrice === 'string'
    ? parseFloat(jobDetails.finalPrice)
    : jobDetails.finalPrice || 0;

  // Backend'den gelen komisyon tutarını kullan
  const commissionAmount = jobDetails.commissionAmount || 0;
  const commissionVatRate = jobDetails.commissionVatRate;
  const commissionVatAmount = jobDetails.commissionVatAmount || 0;
  const commissionTotalWithVat = jobDetails.commissionTotalWithVat || commissionAmount;
  const hasVatInfo = jobDetails.commissionVatAmount !== undefined && jobDetails.commissionVatAmount > 0;
  const driverEarnings = finalPrice - commissionTotalWithVat;

  return (
    <View style={styles.container}>
      {/* Başarı Mesajı */}
      <View style={styles.successHeader}>
        <View style={styles.successIconContainer}>
          <MaterialCommunityIcons name="check-circle" size={48} color="#4CAF50" />
        </View>
        <Text style={styles.successTitle}>Teklifiniz Kabul Edildi!</Text>
        <Text style={styles.successSubtitle}>
          Müşteri teklifinizi onayladı. İşe başlamak için komisyonu ödemeniz gerekmektedir.
        </Text>
      </View>

      {/* Özet Bilgi Kartı */}
      <View style={styles.summaryCard}>
        {/* Servis Tipi */}
        <View style={styles.serviceRow}>
          <View style={styles.serviceIconContainer}>
            <MaterialCommunityIcons
              name={serviceIcons[serviceType]}
              size={24}
              color="#26a69a"
            />
          </View>
          <Text style={styles.serviceLabel}>{serviceLabels[serviceType]}</Text>
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
              {estimatedDuration} saat
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

      {/* Komisyon Detayı */}
      <View style={styles.commissionCard}>
        <View style={styles.commissionRow}>
          <Text style={styles.commissionLabel}>İş Toplam Tutarı</Text>
          <Text style={styles.commissionValue}>{formatCurrency(finalPrice)} ₺</Text>
        </View>
        <View style={styles.commissionRow}>
          <Text style={styles.commissionLabel}>Platform Komisyonu</Text>
          <Text style={styles.commissionDeduct}>-{formatCurrency(commissionAmount)} ₺</Text>
        </View>
        {hasVatInfo && (
          <>
            <View style={styles.commissionRow}>
              <Text style={styles.commissionLabel}>
                KDV ({commissionVatRate != null ? `%${commissionVatRate}` : ''})
              </Text>
              <Text style={styles.commissionDeduct}>-{formatCurrency(commissionVatAmount)} ₺</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.commissionRow}>
              <Text style={styles.commissionLabelBold}>Toplam Komisyon</Text>
              <Text style={styles.commissionDeductBold}>-{formatCurrency(commissionTotalWithVat)} ₺</Text>
            </View>
          </>
        )}
        <View style={styles.divider} />
        <View style={styles.commissionRow}>
          <Text style={styles.netLabel}>Net Kazancınız</Text>
          <Text style={styles.netValue}>{formatCurrency(driverEarnings)} ₺</Text>
        </View>
      </View>

      {/* Ödeme Butonu */}
      <TouchableOpacity style={styles.payButton} onPress={onPayCommission} activeOpacity={0.8}>
        <MaterialCommunityIcons name="credit-card" size={24} color="#fff" />
        <Text style={styles.payButtonText}>Komisyonu Öde ve İşe Başla</Text>
      </TouchableOpacity>

      {/* Bilgi Notu */}
      <View style={styles.infoNote}>
        <MaterialCommunityIcons name="information" size={20} color="#7B1FA2" />
        <Text style={styles.infoNoteText}>
          Ödeme tamamlandığında iş otomatik olarak başlayacaktır. Kayıtlı kartınızdan iyzico güvencesi ile tahsil edilecektir.
        </Text>
      </View>

      {/* Visa / MasterCard / iyzico Logoları */}
      <PaymentLogos size="medium" />
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
    marginBottom: 24,
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
  commissionCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  commissionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  commissionLabel: {
    fontSize: 14,
    color: '#666',
  },
  commissionValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  commissionDeduct: {
    fontSize: 14,
    fontWeight: '500',
    color: '#F44336',
  },
  commissionLabelBold: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  commissionDeductBold: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F44336',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 12,
  },
  netLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
  },
  netValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#9C27B0',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 10,
    shadowColor: '#9C27B0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 16,
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F3E5F5',
    padding: 12,
    borderRadius: 8,
  },
  infoNoteText: {
    fontSize: 13,
    color: '#6A1B9A',
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
});
