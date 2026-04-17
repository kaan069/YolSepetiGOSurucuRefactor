import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Card, Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { TowTruckRequestDetail } from '../../../api';
import PaymentLogos from '../../../components/payment/PaymentLogos';

interface PaymentSectionProps {
  towTruckRequest: TowTruckRequestDetail;
  visible: boolean;
  onNFCPayment: () => void;
  onQRPayment: () => void;
  onPayPOSPayment?: () => void;
}

export default function PaymentSection({
  towTruckRequest,
  visible,
  onNFCPayment,
  onQRPayment,
  onPayPOSPayment,
}: PaymentSectionProps) {
  if (!visible) return null;

  const getAmount = () => {
    if (towTruckRequest.final_price) {
      return `₺${Number(towTruckRequest.final_price).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
    }
    if (towTruckRequest.my_offer?.driver_earnings) {
      return `₺${Number(towTruckRequest.my_offer.driver_earnings).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
    }
    return '₺0.00';
  };

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="contactless-payment" size={32} color="#26a69a" />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.title}>Temassız Ödeme Al</Text>
            <Text style={styles.subtitle}>
              Müşteriden kredi kartı ile ödeme alın
            </Text>
          </View>
        </View>

        {/* Tutar Gösterimi */}
        <View style={styles.amountContainer}>
          <Text style={styles.amountLabel}>Alınacak Tutar</Text>
          <Text style={styles.amountValue}>{getAmount()}</Text>
        </View>

        {/* Ödeme Butonları */}
        <View style={styles.buttonsContainer}>
          {/* PayPOS NFC Ödeme Butonu - Sadece Android'de göster (ÖNERİLEN) */}
          {Platform.OS === 'android' && onPayPOSPayment && (
            <TouchableOpacity
              style={styles.payposButton}
              onPress={onPayPOSPayment}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="contactless-payment" size={24} color="#fff" />
              <View style={styles.payposButtonContent}>
                <Text style={styles.payposButtonText}>PayPOS ile Ödeme Al</Text>
                <Text style={styles.payposButtonSubtext}>NFC temassız kart okuyucu</Text>
              </View>
            </TouchableOpacity>
          )}

          {/* QR Kod Ödeme Butonu - iOS ve Android'de göster */}
          <TouchableOpacity
            style={styles.qrButton}
            onPress={onQRPayment}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="qrcode-scan" size={24} color="#fff" />
            <Text style={styles.qrButtonText}>QR Kod ile Ödeme Al</Text>
          </TouchableOpacity>

          {/* Eski iyzico NFC Ödeme Butonu - Sadece Android'de göster (alternatif) */}
          {Platform.OS === 'android' && (
            <TouchableOpacity
              style={styles.nfcButton}
              onPress={onNFCPayment}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="cellphone-nfc" size={24} color="#fff" />
              <Text style={styles.nfcButtonText}>iyzico NFC Ödeme</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Güvenli ödeme bilgisi */}
        <View style={styles.securityInfo}>
          <MaterialCommunityIcons name="shield-check" size={16} color="#666" />
          <Text style={styles.securityText}>
            Tüm ödemeler güvenli altyapı ile işlenir
          </Text>
        </View>

        {/* Visa / MasterCard / iyzico Logoları */}
        <PaymentLogos size="small" />
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#26a69a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E0F2F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#666',
  },
  amountContainer: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  amountLabel: {
    fontSize: 12,
    color: '#2E7D32',
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2E7D32',
  },
  iyzicoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 16,
  },
  iyzicoText: {
    fontSize: 12,
    color: '#1a73e8',
  },
  buttonsContainer: {
    gap: 12,
  },
  payposButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1565C0',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 12,
    shadowColor: '#1565C0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  payposButtonContent: {
    flex: 1,
  },
  payposButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  payposButtonSubtext: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  nfcButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#78909C',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 10,
  },
  nfcButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  qrButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7B1FA2',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 10,
    shadowColor: '#7B1FA2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  qrButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
    marginBottom: 8,
  },
  securityText: {
    fontSize: 12,
    color: '#666',
  },
});
