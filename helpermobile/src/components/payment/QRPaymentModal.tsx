/**
 * QRPaymentModal
 *
 * QR kod ile ödeme modal'ı
 * Müşterinin iyzico üzerinden QR kod okutarak ödeme yapmasını sağlar
 * iOS ve Android'de çalışır
 *
 * Akış:
 * 1. Modal açılır, tutar gösterilir
 * 2. "QR Kod Oluştur" butonuna basılır
 * 3. Backend'den QR kod alınır ve gösterilir
 * 4. Müşteri QR kodu okutarak ödeme yapar
 * 5. Ödeme durumu kontrol edilir
 * 6. Başarılı/Başarısız sonuç gösterilir
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
  Vibration,
  Image,
  ActivityIndicator,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Ödeme durumları
type PaymentState = 'idle' | 'generating' | 'waiting_payment' | 'checking' | 'success' | 'error' | 'expired';

interface QRPaymentModalProps {
  visible: boolean;
  onClose: () => void;
  onPaymentSuccess?: (transactionId: string) => void;
  onPaymentError?: (error: string) => void;
  amount: number;
  currency?: string;
  jobId?: string;
  customerName?: string;
  description?: string;
}

// Para formatla
const formatCurrency = (amount: number): string => {
  return amount.toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// Süre formatla (mm:ss)
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export default function QRPaymentModal({
  visible,
  onClose,
  onPaymentSuccess,
  onPaymentError,
  amount,
  currency = 'TL',
  jobId,
  customerName,
  description,
}: QRPaymentModalProps) {
  const [paymentState, setPaymentState] = useState<PaymentState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(300); // 5 dakika = 300 saniye
  const [checkInterval, setCheckIntervalState] = useState<NodeJS.Timeout | null>(null);

  // Animasyon değerleri
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const qrScaleAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const successScaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Modal açıldığında animasyon
  useEffect(() => {
    if (visible) {
      setPaymentState('idle');
      setErrorMessage('');
      setTransactionId('');
      setQrCodeUrl(null);
      setQrCodeData(null);
      setTimeLeft(300);

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
      // Modal kapanırken temizle
      cleanup();

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

  // QR kod gösterildiğinde animasyon
  useEffect(() => {
    if (paymentState === 'waiting_payment' && qrCodeUrl) {
      // QR kod giriş animasyonu
      Animated.spring(qrScaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }).start();

      // Pulse animasyonu
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();

      return () => {
        pulseAnimation.stop();
        pulseAnim.setValue(1);
        qrScaleAnim.setValue(0);
      };
    }
  }, [paymentState, qrCodeUrl]);

  // Zamanlayıcı
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (paymentState === 'waiting_payment' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setPaymentState('expired');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [paymentState, timeLeft]);

  // Başarı animasyonu
  useEffect(() => {
    if (paymentState === 'success') {
      Animated.spring(successScaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }).start();

      // Başarı titreşimi
      Vibration.vibrate([0, 100, 100, 100]);
    } else {
      successScaleAnim.setValue(0);
    }
  }, [paymentState]);

  // Loading animasyonu
  useEffect(() => {
    if (paymentState === 'generating' || paymentState === 'checking') {
      const rotateAnimation = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        })
      );
      rotateAnimation.start();

      return () => {
        rotateAnimation.stop();
        rotateAnim.setValue(0);
      };
    }
  }, [paymentState]);

  // Temizle
  const cleanup = () => {
    if (checkInterval) {
      clearInterval(checkInterval);
      setCheckIntervalState(null);
    }
  };

  // QR Kod Oluştur
  const generateQRCode = async () => {
    setPaymentState('generating');

    try {
      // TODO: Backend'den QR kod al
      // const response = await api.generatePaymentQR({
      //   amount,
      //   currency,
      //   jobId,
      //   description,
      // });
      // setQrCodeUrl(response.qrCodeUrl);
      // setQrCodeData(response.paymentToken);

      // Simülasyon - gerçek implementasyonda backend çağrısı yapılacak
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Demo QR kod URL (gerçekte backend'den gelecek)
      const demoQRUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=iyzico-payment-${jobId}-${amount}-${Date.now()}`;
      setQrCodeUrl(demoQRUrl);
      setQrCodeData(`PAY-${Date.now()}`);
      setTimeLeft(300);
      setPaymentState('waiting_payment');

      // Ödeme durumunu periyodik olarak kontrol et
      startPaymentCheck();

    } catch (error: any) {
      setPaymentState('error');
      setErrorMessage(error?.message || 'QR kod oluşturulamadı');
      onPaymentError?.(error?.message);
    }
  };

  // Ödeme durumunu kontrol et
  const startPaymentCheck = () => {
    // Her 5 saniyede bir ödeme durumunu kontrol et
    const interval = setInterval(async () => {
      try {
        // TODO: Backend'den ödeme durumunu kontrol et
        // const status = await api.checkPaymentStatus(qrCodeData);
        // if (status.completed) {
        //   clearInterval(interval);
        //   setTransactionId(status.transactionId);
        //   setPaymentState('success');
        //   onPaymentSuccess?.(status.transactionId);
        // }

        // Simülasyon - Gerçek implementasyonda backend kontrolü yapılacak
        // Demo için rastgele başarı simülasyonu (30 saniye sonra)

      } catch (error) {
        console.error('Payment check error:', error);
      }
    }, 5000);

    setCheckIntervalState(interval);
  };

  // Manuel ödeme kontrolü
  const checkPaymentManually = async () => {
    setPaymentState('checking');

    try {
      // TODO: Backend'den ödeme durumunu kontrol et
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Demo - Rastgele başarı/başarısızlık
      const isSuccess = Math.random() > 0.3;

      if (isSuccess) {
        cleanup();
        const txId = 'TXN' + Date.now();
        setTransactionId(txId);
        setPaymentState('success');
        onPaymentSuccess?.(txId);
      } else {
        setPaymentState('waiting_payment');
      }

    } catch (error: any) {
      setPaymentState('error');
      setErrorMessage('Ödeme durumu kontrol edilemedi');
    }
  };

  // Tekrar dene
  const handleRetry = () => {
    cleanup();
    setPaymentState('idle');
    setErrorMessage('');
    setQrCodeUrl(null);
    setQrCodeData(null);
    setTimeLeft(300);
  };

  // Modal kapat
  const handleClose = () => {
    if (paymentState !== 'generating' && paymentState !== 'checking') {
      cleanup();
      onClose();
    }
  };

  // Rotate interpolation
  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Zamanlayıcı rengi
  const getTimerColor = () => {
    if (timeLeft <= 60) return '#F44336';
    if (timeLeft <= 120) return '#FF9800';
    return '#4CAF50';
  };

  // İçerik render
  const renderContent = () => {
    switch (paymentState) {
      case 'generating':
        return (
          <View style={styles.stateContainer}>
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <MaterialCommunityIcons name="qrcode" size={80} color="#26a69a" />
            </Animated.View>
            <Text style={styles.loadingTitle}>QR Kod Oluşturuluyor</Text>
            <Text style={styles.loadingSubtitle}>Lütfen bekleyin...</Text>
          </View>
        );

      case 'waiting_payment':
        return (
          <View style={styles.stateContainer}>
            {/* QR Kod */}
            <Animated.View
              style={[
                styles.qrContainer,
                {
                  transform: [
                    { scale: Animated.multiply(qrScaleAnim, pulseAnim) },
                  ],
                },
              ]}
            >
              <View style={styles.qrWrapper}>
                {qrCodeUrl && (
                  <Image
                    source={{ uri: qrCodeUrl }}
                    style={styles.qrImage}
                    resizeMode="contain"
                  />
                )}
                <View style={styles.qrCornerTL} />
                <View style={styles.qrCornerTR} />
                <View style={styles.qrCornerBL} />
                <View style={styles.qrCornerBR} />
              </View>
            </Animated.View>

            {/* Zamanlayıcı */}
            <View style={styles.timerContainer}>
              <MaterialCommunityIcons
                name="clock-outline"
                size={20}
                color={getTimerColor()}
              />
              <Text style={[styles.timerText, { color: getTimerColor() }]}>
                {formatTime(timeLeft)}
              </Text>
            </View>

            {/* Talimatlar */}
            <View style={styles.instructions}>
              <View style={styles.instructionItem}>
                <View style={styles.instructionNumber}>
                  <Text style={styles.instructionNumberText}>1</Text>
                </View>
                <Text style={styles.instructionText}>
                  Müşteriniz iyzico uygulamasını açsın
                </Text>
              </View>
              <View style={styles.instructionItem}>
                <View style={styles.instructionNumber}>
                  <Text style={styles.instructionNumberText}>2</Text>
                </View>
                <Text style={styles.instructionText}>
                  "QR ile Öde" seçeneğine tıklasın
                </Text>
              </View>
              <View style={styles.instructionItem}>
                <View style={styles.instructionNumber}>
                  <Text style={styles.instructionNumberText}>3</Text>
                </View>
                <Text style={styles.instructionText}>
                  Ekrandaki QR kodu okutup ödemeyi onaylasın
                </Text>
              </View>
            </View>

            {/* Tutar */}
            <View style={styles.amountBadge}>
              <Text style={styles.amountBadgeLabel}>Alınacak Tutar</Text>
              <Text style={styles.amountBadgeValue}>
                {formatCurrency(amount)} {currency}
              </Text>
            </View>

            {/* Butonlar */}
            <TouchableOpacity style={styles.checkButton} onPress={checkPaymentManually}>
              <MaterialCommunityIcons name="refresh" size={20} color="#fff" />
              <Text style={styles.checkButtonText}>Ödemeyi Kontrol Et</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
              <Text style={styles.cancelButtonText}>İptal Et</Text>
            </TouchableOpacity>
          </View>
        );

      case 'checking':
        return (
          <View style={styles.stateContainer}>
            <ActivityIndicator size="large" color="#26a69a" />
            <Text style={styles.loadingTitle}>Ödeme Kontrol Ediliyor</Text>
            <Text style={styles.loadingSubtitle}>Lütfen bekleyin...</Text>
          </View>
        );

      case 'success':
        return (
          <View style={styles.stateContainer}>
            <Animated.View
              style={[
                styles.successIconContainer,
                { transform: [{ scale: successScaleAnim }] },
              ]}
            >
              <MaterialCommunityIcons name="check-circle" size={100} color="#4CAF50" />
            </Animated.View>
            <Text style={styles.successTitle}>Ödeme Başarılı!</Text>
            <Text style={styles.successSubtitle}>
              {formatCurrency(amount)} {currency} tahsil edildi
            </Text>

            {transactionId && (
              <View style={styles.transactionInfo}>
                <Text style={styles.transactionLabel}>İşlem No:</Text>
                <Text style={styles.transactionValue}>{transactionId}</Text>
              </View>
            )}

            <TouchableOpacity style={styles.doneButton} onPress={handleClose}>
              <Text style={styles.doneButtonText}>Tamam</Text>
            </TouchableOpacity>
          </View>
        );

      case 'expired':
        return (
          <View style={styles.stateContainer}>
            <View style={styles.expiredIconContainer}>
              <MaterialCommunityIcons name="clock-alert-outline" size={100} color="#FF9800" />
            </View>
            <Text style={styles.expiredTitle}>Süre Doldu</Text>
            <Text style={styles.expiredMessage}>
              QR kod geçerlilik süresi doldu. Yeni bir QR kod oluşturabilirsiniz.
            </Text>

            <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
              <MaterialCommunityIcons name="qrcode" size={20} color="#fff" />
              <Text style={styles.retryButtonText}>Yeni QR Kod Oluştur</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
              <Text style={styles.cancelButtonText}>Vazgeç</Text>
            </TouchableOpacity>
          </View>
        );

      case 'error':
        return (
          <View style={styles.stateContainer}>
            <View style={styles.errorIconContainer}>
              <MaterialCommunityIcons name="close-circle" size={100} color="#F44336" />
            </View>
            <Text style={styles.errorTitle}>Hata Oluştu</Text>
            <Text style={styles.errorMessage}>{errorMessage}</Text>

            <View style={styles.errorActions}>
              <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                <MaterialCommunityIcons name="refresh" size={20} color="#fff" />
                <Text style={styles.retryButtonText}>Tekrar Dene</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
                <Text style={styles.cancelButtonText}>Vazgeç</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      default: // idle
        return (
          <>
            {/* Başlık */}
            <View style={styles.header}>
              <View style={styles.qrBadge}>
                <MaterialCommunityIcons name="qrcode-scan" size={40} color="#26a69a" />
              </View>
              <Text style={styles.title}>QR Kod ile Ödeme</Text>
              <Text style={styles.subtitle}>
                Müşteriniz iyzico ile QR kodu okutarak ödeme yapacak
              </Text>
            </View>

            {/* Avantajlar */}
            <View style={styles.features}>
              <View style={styles.featureItem}>
                <MaterialCommunityIcons name="cellphone" size={24} color="#26a69a" />
                <Text style={styles.featureText}>iOS ve Android'de çalışır</Text>
              </View>
              <View style={styles.featureItem}>
                <MaterialCommunityIcons name="shield-check" size={24} color="#26a69a" />
                <Text style={styles.featureText}>Güvenli iyzico altyapısı</Text>
              </View>
              <View style={styles.featureItem}>
                <MaterialCommunityIcons name="flash" size={24} color="#26a69a" />
                <Text style={styles.featureText}>Hızlı ve kolay ödeme</Text>
              </View>
            </View>

            {/* İş Detayları */}
            {(customerName || description) && (
              <View style={styles.jobDetails}>
                {customerName && (
                  <View style={styles.detailRow}>
                    <MaterialCommunityIcons name="account" size={20} color="#666" />
                    <Text style={styles.detailLabel}>Müşteri:</Text>
                    <Text style={styles.detailValue}>{customerName}</Text>
                  </View>
                )}
                {description && (
                  <View style={styles.detailRow}>
                    <MaterialCommunityIcons name="information" size={20} color="#666" />
                    <Text style={styles.detailLabel}>Hizmet:</Text>
                    <Text style={styles.detailValue} numberOfLines={2}>{description}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Tutar */}
            <View style={styles.amountContainer}>
              <Text style={styles.amountTitleLabel}>Alınacak Tutar</Text>
              <Text style={styles.amountMain}>
                {formatCurrency(amount)}
                <Text style={styles.amountCurrency}> {currency}</Text>
              </Text>
            </View>

            {/* Butonlar */}
            <TouchableOpacity style={styles.startButton} onPress={generateQRCode}>
              <MaterialCommunityIcons name="qrcode" size={24} color="#fff" />
              <Text style={styles.startButtonText}>QR Kod Oluştur</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Text style={styles.closeButtonText}>Vazgeç</Text>
            </TouchableOpacity>
          </>
        );
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={paymentState === 'generating' || paymentState === 'checking' ? undefined : handleClose}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View
          style={[
            styles.modalContainer,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          {/* Kapat butonu */}
          {(paymentState === 'idle' || paymentState === 'error' || paymentState === 'expired') && (
            <TouchableOpacity style={styles.closeIconButton} onPress={handleClose}>
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 24,
    width: SCREEN_WIDTH - 40,
    maxWidth: 400,
    padding: 24,
    position: 'relative',
  },
  closeIconButton: {
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
  qrBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E0F2F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  features: {
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  jobDetails: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 13,
    color: '#666',
    minWidth: 60,
  },
  detailValue: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  amountContainer: {
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  amountTitleLabel: {
    fontSize: 14,
    color: '#2E7D32',
    marginBottom: 8,
  },
  amountMain: {
    fontSize: 40,
    fontWeight: '700',
    color: '#2E7D32',
  },
  amountCurrency: {
    fontSize: 24,
    fontWeight: '600',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#26a69a',
    borderRadius: 16,
    paddingVertical: 18,
    gap: 12,
    shadowColor: '#26a69a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  closeButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  closeButtonText: {
    fontSize: 14,
    color: '#666',
  },
  // State containers
  stateContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  loadingTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    marginTop: 24,
    marginBottom: 8,
  },
  loadingSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  // QR Kod
  qrContainer: {
    marginBottom: 16,
  },
  qrWrapper: {
    position: 'relative',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  qrImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
  },
  qrCornerTL: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 30,
    height: 30,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#26a69a',
    borderTopLeftRadius: 16,
  },
  qrCornerTR: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 30,
    height: 30,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: '#26a69a',
    borderTopRightRadius: 16,
  },
  qrCornerBL: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 30,
    height: 30,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#26a69a',
    borderBottomLeftRadius: 16,
  },
  qrCornerBR: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: '#26a69a',
    borderBottomRightRadius: 16,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 20,
    gap: 8,
  },
  timerText: {
    fontSize: 18,
    fontWeight: '700',
  },
  instructions: {
    width: '100%',
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  instructionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFA000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  instructionText: {
    flex: 1,
    fontSize: 13,
    color: '#5D4037',
    lineHeight: 18,
  },
  amountBadge: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  amountBadgeLabel: {
    fontSize: 12,
    color: '#2E7D32',
    marginBottom: 4,
  },
  amountBadgeValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2E7D32',
  },
  checkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#26a69a',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 8,
    width: '100%',
    marginBottom: 8,
  },
  checkButtonText: {
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
    color: '#F44336',
    fontWeight: '500',
  },
  // Success
  successIconContainer: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#4CAF50',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  transactionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 24,
    gap: 8,
  },
  transactionLabel: {
    fontSize: 13,
    color: '#666',
  },
  transactionValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  doneButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 48,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  // Expired
  expiredIconContainer: {
    marginBottom: 16,
  },
  expiredTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FF9800',
    marginBottom: 8,
  },
  expiredMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  // Error
  errorIconContainer: {
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#F44336',
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
});
