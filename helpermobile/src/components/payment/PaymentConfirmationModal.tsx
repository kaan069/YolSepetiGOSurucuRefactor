/**
 * PaymentConfirmationModal
 *
 * Vinç, nakliye, lastik tamir, yardım işleri için ödeme onay popup'ı
 * iyzico entegrasyonu ile çalışır (şimdilik mock)
 *
 * Akış:
 * 1. İş kabul et → Modal açılır
 * 2. Ödeme bilgileri gösterilir
 * 3. Onayla → iyzico'dan ödeme alınır
 * 4. Başarılı → Yeşil tick animasyonu
 * 5. İş devam eden'e düşer
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Servis tipleri - ileride genişletilebilir
export type ServiceType = 'crane' | 'towTruck' | 'transport' | 'tireFix' | 'roadHelp';

// İş detayları tipi
export interface JobDetails {
  jobId?: string;
  serviceType?: ServiceType;
  customerName?: string;
  customerPhone?: string;
  serviceDescription?: string;
  address?: string;
  totalPrice?: number;           // Müşteri toplam fiyatı (yeni format)
  price?: number;                // Müşteri toplam fiyatı (eski format)
  driverEarnings?: number;       // Sürücü kazancı
  commissionAmount?: number;     // Platform komisyon tutarı (yeni format)
  platformCommission?: number;   // Platform komisyon tutarı (eski format)
  distance?: number;             // km
  duration?: number;             // saat (vinç için)
  additionalInfo?: string;
}

// Modal props
interface PaymentConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm?: () => Promise<void>;       // Yeni: Dışarıdan ödeme fonksiyonu
  onPaymentSuccess?: () => void;         // Eski: İç mock ödeme sonrası callback
  onPaymentError?: (error: string) => void;
  jobDetails: JobDetails;
  serviceType?: ServiceType;             // Alternatif service type geçme yolu
  trackingToken?: string;
}

// Ödeme durumları
type PaymentState = 'idle' | 'processing' | 'success' | 'error';

// Servis tipi başlıkları
const serviceTypeLabels: Record<ServiceType, string> = {
  crane: 'Vinç Hizmeti',
  towTruck: 'Çekici Hizmeti',
  transport: 'Nakliye Hizmeti',
  tireFix: 'Lastik Tamir',
  roadHelp: 'Yol Yardımı',
};

// Servis tipi ikonları
const serviceTypeIcons: Record<ServiceType, string> = {
  crane: 'crane',
  towTruck: 'tow-truck',
  transport: 'truck-cargo-container',
  tireFix: 'tire',
  roadHelp: 'car-wrench',
};

// Para formatla
const formatCurrency = (amount: number): string => {
  return amount.toLocaleString('tr-TR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};

export default function PaymentConfirmationModal({
  visible,
  onClose,
  onConfirm,
  onPaymentSuccess,
  onPaymentError,
  jobDetails,
  serviceType: propServiceType,
  trackingToken,
}: PaymentConfirmationModalProps) {
  // Service type - prop'tan veya jobDetails'den al
  const effectiveServiceType = propServiceType || jobDetails.serviceType || 'crane';

  // Price değerlerini normalize et (eski ve yeni format desteği)
  const totalPrice = jobDetails.totalPrice ?? jobDetails.price ?? 0;
  const commission = jobDetails.commissionAmount ?? jobDetails.platformCommission ?? 0;
  const driverEarnings = jobDetails.driverEarnings ?? (totalPrice - commission);
  const [paymentState, setPaymentState] = useState<PaymentState>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Animasyon değerleri
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const tickAnim = useRef(new Animated.Value(0)).current;
  const tickRotateAnim = useRef(new Animated.Value(0)).current;

  // Modal açıldığında animasyon
  useEffect(() => {
    if (visible) {
      setPaymentState('idle');
      setErrorMessage('');
      tickAnim.setValue(0);
      tickRotateAnim.setValue(0);

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  // Başarı animasyonu
  const playSuccessAnimation = () => {
    Animated.sequence([
      Animated.spring(tickAnim, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(tickRotateAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  /**
   * iyzico Mock Ödeme Fonksiyonu
   * TODO: Gerçek iyzico entegrasyonu yapıldığında bu fonksiyon güncellenecek
   */
  const simulateIyzicoPayment = async (): Promise<{ success: boolean; error?: string }> => {
    // Mock: 2 saniye bekle (gerçek ödeme süresi simülasyonu)
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock: %95 başarı oranı (test için)
    const isSuccess = Math.random() > 0.05;

    if (isSuccess) {
      return { success: true };
    } else {
      return {
        success: false,
        error: 'Ödeme işlemi başarısız oldu. Lütfen kart bilgilerinizi kontrol edin.'
      };
    }
  };

  // Ödeme işlemini başlat
  const handlePayment = async () => {
    setPaymentState('processing');
    setErrorMessage('');

    try {
      // Eğer dışarıdan onConfirm fonksiyonu verilmişse onu kullan (gerçek API)
      if (onConfirm) {
        await onConfirm();
        setPaymentState('success');
        playSuccessAnimation();

        // 2 saniye sonra modal kapat
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        // Mock: iyzico ödeme simülasyonu
        const result = await simulateIyzicoPayment();

        if (result.success) {
          setPaymentState('success');
          playSuccessAnimation();

          // 2 saniye sonra callback çağır ve modal kapat
          setTimeout(() => {
            onPaymentSuccess?.();
            onClose();
          }, 2000);
        } else {
          setPaymentState('error');
          setErrorMessage(result.error || 'Bilinmeyen bir hata oluştu');
          onPaymentError?.(result.error || 'Bilinmeyen bir hata oluştu');
        }
      }
    } catch (error: any) {
      setPaymentState('error');
      const errMsg = error?.response?.data?.error || error?.message || 'Ödeme işlemi sırasında bir hata oluştu';
      setErrorMessage(errMsg);
      onPaymentError?.(errMsg);
    }
  };

  // Tekrar dene
  const handleRetry = () => {
    setPaymentState('idle');
    setErrorMessage('');
  };

  // Tick animasyonu için rotate değeri
  const tickRotate = tickRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // İçerik render
  const renderContent = () => {
    switch (paymentState) {
      case 'processing':
        return (
          <View style={styles.stateContainer}>
            <ActivityIndicator size="large" color="#26a69a" />
            <Text style={styles.stateTitle}>Ödeme İşleniyor</Text>
            <Text style={styles.stateSubtitle}>
              iyzico üzerinden ödeme alınıyor...
            </Text>
            <Text style={styles.stateHint}>
              Lütfen bekleyin, bu işlem birkaç saniye sürebilir.
            </Text>
          </View>
        );

      case 'success':
        return (
          <View style={styles.stateContainer}>
            <Animated.View
              style={[
                styles.successIconContainer,
                {
                  transform: [
                    { scale: tickAnim },
                    { rotate: tickRotate },
                  ],
                },
              ]}
            >
              <MaterialCommunityIcons name="check-circle" size={80} color="#4CAF50" />
            </Animated.View>
            <Text style={styles.successTitle}>Ödeme Başarılı!</Text>
            <Text style={styles.successSubtitle}>
              İş devam eden işlere aktarılıyor...
            </Text>
            <View style={styles.successEarningsCard}>
              <Text style={styles.successEarningsLabel}>Kazancınız</Text>
              <Text style={styles.successEarningsValue}>
                {formatCurrency(driverEarnings)} ₺
              </Text>
            </View>
          </View>
        );

      case 'error':
        return (
          <View style={styles.stateContainer}>
            <View style={styles.errorIconContainer}>
              <MaterialCommunityIcons name="close-circle" size={80} color="#F44336" />
            </View>
            <Text style={styles.errorTitle}>Ödeme Başarısız</Text>
            <Text style={styles.errorMessage}>{errorMessage}</Text>
            <View style={styles.errorActions}>
              <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                <MaterialCommunityIcons name="refresh" size={20} color="#fff" />
                <Text style={styles.retryButtonText}>Tekrar Dene</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>İptal</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      default: // idle
        return (
          <>
            {/* Başlık */}
            <View style={styles.header}>
              <View style={styles.serviceIconContainer}>
                <MaterialCommunityIcons
                  name={serviceTypeIcons[effectiveServiceType]}
                  size={32}
                  color="#26a69a"
                />
              </View>
              <Text style={styles.title}>
                {jobDetails.serviceDescription || serviceTypeLabels[effectiveServiceType]}
              </Text>
              <Text style={styles.subtitle}>Komisyon Ödemesi</Text>
            </View>

            {/* İş Detayları */}
            <View style={styles.detailsContainer}>
              {jobDetails.customerName && (
                <View style={styles.detailRow}>
                  <MaterialCommunityIcons name="account" size={20} color="#666" />
                  <Text style={styles.detailLabel}>Müşteri:</Text>
                  <Text style={styles.detailValue}>{jobDetails.customerName}</Text>
                </View>
              )}

              {jobDetails.address && (
                <View style={styles.detailRow}>
                  <MaterialCommunityIcons name="map-marker" size={20} color="#666" />
                  <Text style={styles.detailLabel}>Konum:</Text>
                  <Text style={styles.detailValue} numberOfLines={2}>
                    {jobDetails.address}
                  </Text>
                </View>
              )}

              {jobDetails.distance !== undefined && (
                <View style={styles.detailRow}>
                  <MaterialCommunityIcons name="map-marker-distance" size={20} color="#666" />
                  <Text style={styles.detailLabel}>Mesafe:</Text>
                  <Text style={styles.detailValue}>{jobDetails.distance} km</Text>
                </View>
              )}

              {jobDetails.duration !== undefined && (
                <View style={styles.detailRow}>
                  <MaterialCommunityIcons name="clock-outline" size={20} color="#666" />
                  <Text style={styles.detailLabel}>Süre:</Text>
                  <Text style={styles.detailValue}>{jobDetails.duration} saat</Text>
                </View>
              )}
            </View>

            {/* Fiyat Özeti */}
            <View style={styles.pricingContainer}>
              <View style={styles.pricingRow}>
                <Text style={styles.pricingLabel}>İş Toplam Ücreti</Text>
                <Text style={styles.pricingValue}>{formatCurrency(totalPrice)} ₺</Text>
              </View>
              <View style={styles.pricingRow}>
                <Text style={styles.pricingLabel}>Platform Komisyonu</Text>
                <Text style={styles.pricingCommission}>
                  -{formatCurrency(commission)} ₺
                </Text>
              </View>
              <View style={styles.pricingDivider} />
              <View style={styles.pricingRow}>
                <Text style={styles.earningsLabel}>Sizin Kazancınız</Text>
                <Text style={styles.earningsValue}>
                  {formatCurrency(driverEarnings)} ₺
                </Text>
              </View>
            </View>

            {/* iyzico Bilgilendirme */}
            <View style={styles.iyzicoInfoContainer}>
              <MaterialCommunityIcons name="credit-card-check" size={24} color="#1E88E5" />
              <Text style={styles.iyzicoInfoText}>
                Ödeme iyzico güvencesi ile alınacaktır. Kayıtlı kartınızdan otomatik tahsil edilecektir.
              </Text>
            </View>

            {/* Aksiyon Butonları */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handlePayment}
              >
                <MaterialCommunityIcons name="credit-card" size={24} color="#fff" />
                <Text style={styles.confirmButtonText}>Komisyonu Öde ve İşe Başla</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.declineButton} onPress={onClose}>
                <Text style={styles.declineButtonText}>Vazgeç</Text>
              </TouchableOpacity>
            </View>
          </>
        );
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={paymentState === 'processing' ? undefined : onClose}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Kapat butonu - sadece idle ve error durumunda göster */}
          {(paymentState === 'idle' || paymentState === 'error') && (
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <MaterialCommunityIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          )}

          {renderContent()}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: SCREEN_WIDTH - 40,
    maxWidth: 400,
    padding: 24,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    padding: 4,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  serviceIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E0F2F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  detailsContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    minWidth: 70,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  pricingContainer: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pricingLabel: {
    fontSize: 14,
    color: '#666',
  },
  pricingValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  pricingCommission: {
    fontSize: 14,
    color: '#F44336',
    fontWeight: '500',
  },
  pricingDivider: {
    height: 1,
    backgroundColor: '#C8E6C9',
    marginVertical: 8,
  },
  earningsLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
  },
  earningsValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2E7D32',
  },
  iyzicoInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    gap: 12,
  },
  iyzicoInfoText: {
    flex: 1,
    fontSize: 12,
    color: '#1565C0',
    lineHeight: 18,
  },
  actionsContainer: {
    gap: 12,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#26a69a',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  declineButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  declineButtonText: {
    fontSize: 14,
    color: '#666',
  },
  // State containers
  stateContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  stateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  stateSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  stateHint: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
  // Success state
  successIconContainer: {
    marginBottom: 8,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4CAF50',
    marginTop: 16,
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  successEarningsCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    width: '100%',
  },
  successEarningsLabel: {
    fontSize: 14,
    color: '#2E7D32',
    marginBottom: 4,
  },
  successEarningsValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2E7D32',
  },
  // Error state
  errorIconContainer: {
    marginBottom: 8,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F44336',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  errorActions: {
    width: '100%',
    gap: 12,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#26a69a',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#666',
  },
});
