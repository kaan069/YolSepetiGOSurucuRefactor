/**
 * NFCPaymentModal
 *
 * Temassız NFC ödeme modal'ı
 * Müşterinin kredi kartından iyzico üzerinden ödeme alır
 * Mobil POS özelliği - SoftPOS
 *
 * Akış:
 * 1. Modal açılır, tutar gösterilir
 * 2. "Ödeme Al" butonuna basılır
 * 3. NFC okuma modu aktif olur (kart yaklaştırma animasyonu)
 * 4. Kart algılanır, iyzico'ya işlem gönderilir
 * 5. Başarılı/Başarısız sonuç gösterilir
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
  Platform,
  Alert,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import NfcManager, { NfcTech } from 'react-native-nfc-manager';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Ödeme durumları
type PaymentState = 'idle' | 'checking_nfc' | 'waiting_card' | 'reading' | 'processing' | 'success' | 'error';

interface NFCPaymentModalProps {
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

export default function NFCPaymentModal({
  visible,
  onClose,
  onPaymentSuccess,
  onPaymentError,
  amount,
  currency = 'TL',
  jobId,
  customerName,
  description,
}: NFCPaymentModalProps) {
  const [paymentState, setPaymentState] = useState<PaymentState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [isNfcSupported, setIsNfcSupported] = useState<boolean | null>(null);
  const [isNfcEnabled, setIsNfcEnabled] = useState<boolean | null>(null);

  // Animasyon değerleri
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;
  const cardMoveAnim = useRef(new Animated.Value(100)).current;
  const successScaleAnim = useRef(new Animated.Value(0)).current;

  // iOS'ta NFC ödeme desteklenmiyor
  const isIOS = Platform.OS === 'ios';

  // NFC durumunu kontrol et
  const checkNfcStatus = async () => {
    // iOS'ta NFC ödeme çalışmaz - Apple kısıtlaması
    if (isIOS) {
      setIsNfcSupported(false);
      return;
    }

    try {
      const supported = await NfcManager.isSupported();
      setIsNfcSupported(supported);

      if (supported) {
        const enabled = await NfcManager.isEnabled();
        setIsNfcEnabled(enabled);
      }
    } catch (error) {
      console.error('NFC status check error:', error);
      setIsNfcSupported(false);
    }
  };

  // Component mount olduğunda NFC durumunu kontrol et
  useEffect(() => {
    checkNfcStatus();
  }, []);

  // Modal açıldığında animasyon
  useEffect(() => {
    if (visible) {
      setPaymentState('idle');
      setErrorMessage('');
      setTransactionId('');
      checkNfcStatus();

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
      // Modal kapanırken NFC'yi temizle
      cleanupNfc();

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

  // NFC bekleme animasyonu (pulse + wave)
  useEffect(() => {
    if (paymentState === 'waiting_card') {
      // Pulse animasyonu
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();

      // Wave animasyonu (NFC sinyali)
      const waveAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(waveAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(waveAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
      waveAnimation.start();

      return () => {
        pulseAnimation.stop();
        waveAnimation.stop();
        pulseAnim.setValue(1);
        waveAnim.setValue(0);
      };
    }
  }, [paymentState]);

  // Kart okuma animasyonu
  useEffect(() => {
    if (paymentState === 'reading') {
      // Kart yaklaşma animasyonu
      Animated.timing(cardMoveAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start();

      // Titreşim
      Vibration.vibrate(100);
    } else {
      cardMoveAnim.setValue(100);
    }
  }, [paymentState]);

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

  // NFC temizle
  const cleanupNfc = async () => {
    try {
      await NfcManager.cancelTechnologyRequest();
    } catch (error) {
      // İgnore
    }
  };

  // NFC okumayı başlat
  const startNfcReading = async () => {
    try {
      setPaymentState('checking_nfc');

      // NFC desteğini kontrol et
      const supported = await NfcManager.isSupported();
      if (!supported) {
        setPaymentState('error');
        setErrorMessage('Bu cihaz NFC desteklemiyor. Lütfen NFC destekli bir cihaz kullanın.');
        return;
      }

      // NFC açık mı kontrol et
      const enabled = await NfcManager.isEnabled();
      if (!enabled) {
        setPaymentState('error');
        setErrorMessage('NFC kapalı. Lütfen cihazınızın NFC ayarını açın ve tekrar deneyin.');
        return;
      }

      // NFC Manager'ı başlat
      await NfcManager.start();

      setPaymentState('waiting_card');

      // NFC tag okumayı başlat
      await NfcManager.requestTechnology(NfcTech.IsoDep, {
        alertMessage: 'Kredi kartını telefonun arkasına yaklaştırın',
      });

      // Kart algılandı
      setPaymentState('reading');

      // Kart bilgilerini oku (EMV standardı)
      const tag = await NfcManager.getTag();
      console.log('NFC Tag detected:', tag);

      // İyzico'ya ödeme isteği gönder
      await processPaymentWithIyzico(tag);

    } catch (error: any) {
      console.error('NFC Error:', error);

      if (error.message?.includes('cancelled') || error.message?.includes('canceled')) {
        setPaymentState('idle');
      } else {
        setPaymentState('error');
        setErrorMessage(
          error.message === 'No tech request available'
            ? 'NFC okuma iptal edildi'
            : 'Kart okunamadı. Lütfen kartı tekrar yaklaştırın.'
        );
      }
    } finally {
      await cleanupNfc();
    }
  };

  // iyzico ile ödeme işlemi
  const processPaymentWithIyzico = async (nfcTag: any) => {
    setPaymentState('processing');

    try {
      // TODO: Backend'e NFC tag bilgilerini ve ödeme tutarını gönder
      // Backend iyzico SoftPOS API'sini çağıracak

      // Simülasyon - gerçek implementasyonda backend çağrısı yapılacak
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Başarılı ödeme simülasyonu
      const txId = 'TXN' + Date.now();
      setTransactionId(txId);
      setPaymentState('success');
      onPaymentSuccess?.(txId);

    } catch (error: any) {
      setPaymentState('error');
      setErrorMessage(error?.message || 'Ödeme işlemi başarısız oldu');
      onPaymentError?.(error?.message);
    }
  };

  // Ödeme başlat
  const startPayment = () => {
    startNfcReading();
  };

  // İptal et
  const handleCancel = async () => {
    if (paymentState === 'waiting_card' || paymentState === 'checking_nfc') {
      await cleanupNfc();
    }

    if (paymentState !== 'processing' && paymentState !== 'reading') {
      setPaymentState('idle');
      onClose();
    }
  };

  // Tekrar dene
  const handleRetry = () => {
    setPaymentState('idle');
    setErrorMessage('');
  };

  // NFC ayarlarını aç
  const openNfcSettings = () => {
    if (Platform.OS === 'android') {
      NfcManager.goToNfcSetting();
    } else {
      Alert.alert(
        'NFC Ayarları',
        'Ayarlar > NFC yolunu izleyerek NFC\'yi açabilirsiniz.',
        [{ text: 'Tamam' }]
      );
    }
  };

  // Wave animasyonu için opacity ve scale
  const waveOpacity = waveAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.8, 0.4, 0],
  });
  const waveScale = waveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2],
  });

  // İçerik render
  const renderContent = () => {
    switch (paymentState) {
      case 'checking_nfc':
        return (
          <View style={styles.stateContainer}>
            <View style={styles.processingIcon}>
              <MaterialCommunityIcons name="nfc-search-variant" size={60} color="#26a69a" />
            </View>
            <Text style={styles.processingTitle}>NFC Kontrol Ediliyor</Text>
            <Text style={styles.processingSubtitle}>Lütfen bekleyin...</Text>
          </View>
        );

      case 'waiting_card':
        return (
          <View style={styles.stateContainer}>
            {/* NFC İkon ve Dalga Animasyonu */}
            <View style={styles.nfcContainer}>
              {/* Dalga efekti */}
              <Animated.View
                style={[
                  styles.wave,
                  {
                    opacity: waveOpacity,
                    transform: [{ scale: waveScale }],
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.wave,
                  styles.wave2,
                  {
                    opacity: waveOpacity,
                    transform: [{ scale: waveScale }],
                  },
                ]}
              />

              {/* Ana NFC ikonu */}
              <Animated.View
                style={[
                  styles.nfcIconContainer,
                  { transform: [{ scale: pulseAnim }] },
                ]}
              >
                <MaterialCommunityIcons name="contactless-payment" size={80} color="#26a69a" />
              </Animated.View>
            </View>

            <Text style={styles.waitingTitle}>Kartı Yaklaştırın</Text>
            <Text style={styles.waitingSubtitle}>
              Müşterinin kredi kartını telefonun arkasına yaklaştırmasını isteyin
            </Text>

            {/* Tutar */}
            <View style={styles.amountCard}>
              <Text style={styles.amountLabel}>Alınacak Tutar</Text>
              <Text style={styles.amountValue}>
                {formatCurrency(amount)} {currency}
              </Text>
            </View>

            {/* İptal Butonu */}
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.cancelButtonText}>İptal Et</Text>
            </TouchableOpacity>
          </View>
        );

      case 'reading':
        return (
          <View style={styles.stateContainer}>
            <View style={styles.readingContainer}>
              <Animated.View
                style={[
                  styles.cardIcon,
                  { transform: [{ translateY: cardMoveAnim }] },
                ]}
              >
                <MaterialCommunityIcons name="credit-card-wireless" size={60} color="#26a69a" />
              </Animated.View>
              <View style={styles.phoneIcon}>
                <MaterialCommunityIcons name="cellphone" size={80} color="#333" />
              </View>
            </View>
            <Text style={styles.readingTitle}>Kart Okunuyor...</Text>
            <Text style={styles.readingSubtitle}>Lütfen kartı hareket ettirmeyin</Text>
          </View>
        );

      case 'processing':
        return (
          <View style={styles.stateContainer}>
            <View style={styles.processingIcon}>
              <MaterialCommunityIcons name="loading" size={60} color="#26a69a" />
            </View>
            <Text style={styles.processingTitle}>İşlem Yapılıyor</Text>
            <Text style={styles.processingSubtitle}>
              iyzico üzerinden ödeme alınıyor...
            </Text>
            <View style={styles.processingAmount}>
              <Text style={styles.processingAmountValue}>
                {formatCurrency(amount)} {currency}
              </Text>
            </View>
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

            <TouchableOpacity style={styles.doneButton} onPress={onClose}>
              <Text style={styles.doneButtonText}>Tamam</Text>
            </TouchableOpacity>
          </View>
        );

      case 'error':
        return (
          <View style={styles.stateContainer}>
            <View style={styles.errorIconContainer}>
              <MaterialCommunityIcons name="close-circle" size={100} color="#F44336" />
            </View>
            <Text style={styles.errorTitle}>Ödeme Başarısız</Text>
            <Text style={styles.errorMessage}>{errorMessage}</Text>

            <View style={styles.errorActions}>
              {errorMessage.includes('NFC kapalı') && (
                <TouchableOpacity style={styles.settingsButton} onPress={openNfcSettings}>
                  <MaterialCommunityIcons name="cog" size={20} color="#fff" />
                  <Text style={styles.settingsButtonText}>NFC Ayarlarını Aç</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                <MaterialCommunityIcons name="refresh" size={20} color="#fff" />
                <Text style={styles.retryButtonText}>Tekrar Dene</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.errorCancelButton} onPress={onClose}>
                <Text style={styles.errorCancelButtonText}>Vazgeç</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      default: // idle
        return (
          <>
            {/* Başlık */}
            <View style={styles.header}>
              <View style={styles.nfcBadge}>
                <MaterialCommunityIcons name="contactless-payment" size={40} color="#26a69a" />
              </View>
              <Text style={styles.title}>Temassız Ödeme</Text>
              <Text style={styles.subtitle}>Mobil POS ile kredi kartı ödemesi</Text>
            </View>

            {/* NFC Durumu - iOS için özel mesaj */}
            {isIOS && (
              <View style={styles.nfcWarning}>
                <MaterialCommunityIcons name="apple" size={24} color="#F44336" />
                <Text style={styles.nfcWarningText}>
                  iOS cihazlarda NFC ödeme desteklenmiyor. Lütfen QR kod ile ödeme alın.
                </Text>
              </View>
            )}

            {/* Android - NFC desteklenmiyor */}
            {!isIOS && isNfcSupported === false && (
              <View style={styles.nfcWarning}>
                <MaterialCommunityIcons name="alert-circle" size={24} color="#F44336" />
                <Text style={styles.nfcWarningText}>
                  Bu cihaz NFC desteklemiyor
                </Text>
              </View>
            )}

            {isNfcSupported && isNfcEnabled === false && (
              <TouchableOpacity style={styles.nfcWarning} onPress={openNfcSettings}>
                <MaterialCommunityIcons name="nfc-off" size={24} color="#FF9800" />
                <Text style={styles.nfcWarningText}>
                  NFC kapalı - Açmak için dokunun
                </Text>
              </TouchableOpacity>
            )}

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

            {/* iyzico Bilgilendirme */}
            <View style={styles.iyzicoInfo}>
              <MaterialCommunityIcons name="shield-check" size={20} color="#1a73e8" />
              <Text style={styles.iyzicoInfoText}>
                Ödeme iyzico SoftPOS altyapısı ile güvenle alınacaktır
              </Text>
            </View>

            {/* Butonlar */}
            <TouchableOpacity
              style={[
                styles.startButton,
                (isNfcSupported === false || isNfcEnabled === false) && styles.startButtonDisabled
              ]}
              onPress={startPayment}
              disabled={isNfcSupported === false}
            >
              <MaterialCommunityIcons name="contactless-payment" size={24} color="#fff" />
              <Text style={styles.startButtonText}>Ödeme Al</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
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
      onRequestClose={paymentState === 'processing' || paymentState === 'reading' ? undefined : handleCancel}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View
          style={[
            styles.modalContainer,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          {/* Kapat butonu - sadece idle ve error'da göster */}
          {(paymentState === 'idle' || paymentState === 'error') && (
            <TouchableOpacity style={styles.closeIconButton} onPress={onClose}>
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
  nfcBadge: {
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
  },
  nfcWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 12,
  },
  nfcWarningText: {
    flex: 1,
    fontSize: 13,
    color: '#E65100',
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
  iyzicoInfo: {
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
  startButtonDisabled: {
    backgroundColor: '#BDBDBD',
    shadowColor: '#BDBDBD',
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
  // Waiting state
  nfcContainer: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  wave: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#26a69a',
  },
  wave2: {
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  nfcIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E0F2F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  waitingTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  waitingSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  amountCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    marginBottom: 24,
  },
  amountLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2E7D32',
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#F44336',
    fontWeight: '600',
  },
  // Reading state
  readingContainer: {
    height: 140,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 24,
  },
  cardIcon: {
    position: 'absolute',
    top: 0,
  },
  phoneIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  readingTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#26a69a',
    marginBottom: 8,
  },
  readingSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  // Processing state
  processingIcon: {
    marginBottom: 24,
  },
  processingTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  processingSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  processingAmount: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  processingAmountValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2E7D32',
  },
  // Success state
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
  // Error state
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
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF9800',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  settingsButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
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
  errorCancelButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  errorCancelButtonText: {
    fontSize: 14,
    color: '#666',
  },
});
