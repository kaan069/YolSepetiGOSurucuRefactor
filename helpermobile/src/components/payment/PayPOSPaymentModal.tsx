/**
 * PayPOSPaymentModal
 *
 * PayPOS App2App NFC odeme modali
 * Sadece Android cihazlarda calisir
 * Sadece towTruck (cekici) servisi icin kullanilir
 *
 * Akis:
 * 1. Modal acilir, tutar gosterilir
 * 2. "Odeme Al" butonuna basilir
 * 3. Backend'e istek atilir -> PayPOS deeplink URL alinir
 * 4. PayPOS uygulamasi deeplink ile acilir
 * 5. Musteri kartini NFC cihazina yaklastirir
 * 6. Backend callback alir, WebSocket ile bildirir
 * 7. Basarili/Basarisiz sonuc gosterilir
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
  Linking,
  AppState,
  AppStateStatus,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { requestsAPI } from '../../api';
import { deviceService } from '../../services/deviceService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Odeme durumlari
type PaymentState = 'idle' | 'initiating' | 'waiting_paypos' | 'polling' | 'success' | 'error';

interface PayPOSPaymentModalProps {
  visible: boolean;
  onClose: () => void;
  onPaymentSuccess?: (transactionId?: string) => void;
  onPaymentError?: (error: string) => void;
  amount: number;
  currency?: string;
  requestId: number;
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

export default function PayPOSPaymentModal({
  visible,
  onClose,
  onPaymentSuccess,
  onPaymentError,
  amount,
  currency = 'TL',
  requestId,
  customerName,
  description,
}: PayPOSPaymentModalProps) {
  const [paymentState, setPaymentState] = useState<PaymentState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [paymentSessionId, setPaymentSessionId] = useState('');
  const [isPayPOSInstalled, setIsPayPOSInstalled] = useState<boolean | null>(null);
  const [checkingPayPOS, setCheckingPayPOS] = useState(false);

  // Animasyon degerleri
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const successScaleAnim = useRef(new Animated.Value(0)).current;

  // Polling interval ref
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  // iOS'ta PayPOS desteklenmiyor - sadece Android
  const isAndroid = Platform.OS === 'android';

  // Modal acildiginda animasyon ve PayPOS kontrolu
  useEffect(() => {
    if (visible) {
      setPaymentState('idle');
      setErrorMessage('');
      setPaymentSessionId('');

      // PayPOS yuklu mu kontrol et (sadece Android)
      if (isAndroid) {
        setCheckingPayPOS(true);
        deviceService.checkPayPOSInstalled()
          .then((installed) => {
            setIsPayPOSInstalled(installed);
            console.log(`📱 [PayPOSModal] PayPOS durumu: ${installed ? 'Yüklü' : 'Yüklü değil'}`);
          })
          .catch(() => {
            setIsPayPOSInstalled(false);
          })
          .finally(() => {
            setCheckingPayPOS(false);
          });
      }

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
      stopPolling();

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

  // PayPOS bekleme animasyonu (pulse)
  useEffect(() => {
    if (paymentState === 'waiting_paypos' || paymentState === 'polling') {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
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

      return () => {
        pulseAnimation.stop();
        pulseAnim.setValue(1);
      };
    }
  }, [paymentState]);

  // Basari animasyonu
  useEffect(() => {
    if (paymentState === 'success') {
      Animated.spring(successScaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }).start();

      Vibration.vibrate([0, 100, 100, 100]);
    } else {
      successScaleAnim.setValue(0);
    }
  }, [paymentState]);

  // AppState dinle - PayPOS'tan donunce polling baslat
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [paymentState]);

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    // PayPOS'tan geri donuldugunde (background -> active)
    if (
      appStateRef.current.match(/inactive|background/) &&
      nextAppState === 'active' &&
      paymentState === 'waiting_paypos'
    ) {
      console.log('PayPOS\'tan geri donuldu, polling baslatiliyor...');
      startPolling();
    }
    appStateRef.current = nextAppState;
  };

  // Polling baslat
  const startPolling = () => {
    setPaymentState('polling');

    // Hemen bir kontrol yap
    checkPaymentStatus();

    // Her 3 saniyede bir kontrol et (max 2 dakika = 40 deneme)
    let attempts = 0;
    const maxAttempts = 40;

    pollingIntervalRef.current = setInterval(async () => {
      attempts++;

      if (attempts >= maxAttempts) {
        stopPolling();
        setPaymentState('error');
        setErrorMessage('Odeme suresi doldu. Lutfen tekrar deneyin.');
        return;
      }

      await checkPaymentStatus();
    }, 3000);
  };

  // Polling durdur
  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  // Odeme durumunu kontrol et
  const checkPaymentStatus = async () => {
    try {
      const response = await requestsAPI.getPaymentStatus(requestId);

      if (response.payment_status === 'completed') {
        stopPolling();
        setPaymentState('success');
        onPaymentSuccess?.();
      } else if (response.payment_status === 'failed') {
        stopPolling();
        setPaymentState('error');
        setErrorMessage('Odeme basarisiz oldu. Lutfen tekrar deneyin.');
        onPaymentError?.('Odeme basarisiz');
      }
    } catch (error) {
      console.error('Payment status check error:', error);
      // Hata durumunda polling devam etsin
    }
  };

  // PayPOS odeme baslat
  const initiatePayment = async () => {
    if (!isAndroid) {
      Alert.alert(
        'Desteklenmiyor',
        'PayPOS NFC odeme sadece Android cihazlarda kullanilabilir.',
        [{ text: 'Tamam' }]
      );
      return;
    }

    try {
      setPaymentState('initiating');

      // Backend'e istek at
      const response = await requestsAPI.initiatePayPOSPayment(requestId);

      if (response.success && response.deeplink_url) {
        setPaymentSessionId(response.payment_session_id);
        setPaymentState('waiting_paypos');

        // PayPOS uygulamasini ac
        const canOpen = await Linking.canOpenURL(response.deeplink_url);

        if (canOpen) {
          await Linking.openURL(response.deeplink_url);
        } else {
          // PayPOS yuklu degil
          setPaymentState('error');
          setErrorMessage(
            'PayPOS uygulamasi yuklu degil. Lutfen Play Store\'dan PayPOS uygulamasini yukleyin.'
          );

          // Play Store'a yonlendir
          Alert.alert(
            'PayPOS Gerekli',
            'Odeme alabilmek icin PayPOS uygulamasini yuklemeniz gerekmektedir.',
            [
              { text: 'Vazgec', style: 'cancel' },
              {
                text: 'Play Store\'a Git',
                onPress: () => {
                  Linking.openURL('market://details?id=com.paynet.paypos').catch(() => {
                    Linking.openURL(
                      'https://play.google.com/store/apps/details?id=com.paynet.paypos'
                    );
                  });
                },
              },
            ]
          );
        }
      } else {
        throw new Error(response.message || 'PayPOS session olusturulamadi');
      }
    } catch (error: any) {
      console.error('PayPOS initiate error:', error);
      setPaymentState('error');
      setErrorMessage(
        error?.response?.data?.error ||
          error?.message ||
          'Odeme baslatilirken bir hata olustu'
      );
      onPaymentError?.(error?.message);
    }
  };

  // Iptal et
  const handleCancel = () => {
    if (paymentState === 'initiating') return;

    stopPolling();
    setPaymentState('idle');
    onClose();
  };

  // Tekrar dene
  const handleRetry = () => {
    stopPolling();
    setPaymentState('idle');
    setErrorMessage('');
  };

  // Icerik render
  const renderContent = () => {
    switch (paymentState) {
      case 'initiating':
        return (
          <View style={styles.stateContainer}>
            <View style={styles.processingIcon}>
              <MaterialCommunityIcons name="loading" size={60} color="#26a69a" />
            </View>
            <Text style={styles.processingTitle}>Odeme Hazirlaniyor</Text>
            <Text style={styles.processingSubtitle}>
              PayPOS ile baglanti kuruluyor...
            </Text>
          </View>
        );

      case 'waiting_paypos':
        return (
          <View style={styles.stateContainer}>
            <Animated.View
              style={[
                styles.waitingIconContainer,
                { transform: [{ scale: pulseAnim }] },
              ]}
            >
              <MaterialCommunityIcons
                name="contactless-payment"
                size={80}
                color="#26a69a"
              />
            </Animated.View>
            <Text style={styles.waitingTitle}>PayPOS Acildi</Text>
            <Text style={styles.waitingSubtitle}>
              PayPOS uygulamasinda odeme islemini tamamlayin.{'\n'}
              Musterinin kartini NFC okuyucuya yaklastirmasini isteyin.
            </Text>

            <View style={styles.amountCard}>
              <Text style={styles.amountLabel}>Alinacak Tutar</Text>
              <Text style={styles.amountValue}>
                {formatCurrency(amount)} {currency}
              </Text>
            </View>

            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.cancelButtonText}>Iptal Et</Text>
            </TouchableOpacity>
          </View>
        );

      case 'polling':
        return (
          <View style={styles.stateContainer}>
            <Animated.View
              style={[
                styles.waitingIconContainer,
                { transform: [{ scale: pulseAnim }] },
              ]}
            >
              <MaterialCommunityIcons name="sync" size={60} color="#26a69a" />
            </Animated.View>
            <Text style={styles.waitingTitle}>Odeme Kontrol Ediliyor</Text>
            <Text style={styles.waitingSubtitle}>
              Odeme durumu kontrol ediliyor...{'\n'}
              Lutfen bekleyin.
            </Text>

            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.cancelButtonText}>Iptal Et</Text>
            </TouchableOpacity>
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
              <MaterialCommunityIcons
                name="check-circle"
                size={100}
                color="#4CAF50"
              />
            </Animated.View>
            <Text style={styles.successTitle}>Odeme Basarili!</Text>
            <Text style={styles.successSubtitle}>
              {formatCurrency(amount)} {currency} tahsil edildi
            </Text>

            <TouchableOpacity style={styles.doneButton} onPress={onClose}>
              <Text style={styles.doneButtonText}>Tamam</Text>
            </TouchableOpacity>
          </View>
        );

      case 'error':
        return (
          <View style={styles.stateContainer}>
            <View style={styles.errorIconContainer}>
              <MaterialCommunityIcons
                name="close-circle"
                size={100}
                color="#F44336"
              />
            </View>
            <Text style={styles.errorTitle}>Odeme Basarisiz</Text>
            <Text style={styles.errorMessage}>{errorMessage}</Text>

            <View style={styles.errorActions}>
              <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                <MaterialCommunityIcons name="refresh" size={20} color="#fff" />
                <Text style={styles.retryButtonText}>Tekrar Dene</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.errorCancelButton}
                onPress={onClose}
              >
                <Text style={styles.errorCancelButtonText}>Vazgec</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      default: // idle
        return (
          <>
            {/* Baslik */}
            <View style={styles.header}>
              <View style={styles.payposBadge}>
                <MaterialCommunityIcons
                  name="contactless-payment"
                  size={40}
                  color="#26a69a"
                />
              </View>
              <Text style={styles.title}>PayPOS ile Odeme</Text>
              <Text style={styles.subtitle}>NFC temassiz kart okuyucu</Text>
            </View>

            {/* iOS icin uyari */}
            {!isAndroid && (
              <View style={styles.warning}>
                <MaterialCommunityIcons name="apple" size={24} color="#F44336" />
                <Text style={styles.warningText}>
                  PayPOS NFC odeme sadece Android cihazlarda kullanilabilir.
                </Text>
              </View>
            )}

            {/* PayPOS yuklu degil uyarisi (Android) */}
            {isAndroid && isPayPOSInstalled === false && !checkingPayPOS && (
              <View style={styles.payposNotInstalledWarning}>
                <MaterialCommunityIcons name="download" size={24} color="#FF6F00" />
                <View style={styles.payposNotInstalledContent}>
                  <Text style={styles.payposNotInstalledText}>
                    PayPOS uygulamasi yuklu degil
                  </Text>
                  <TouchableOpacity
                    style={styles.installPayPOSButton}
                    onPress={() => deviceService.openPayPOSInStore()}
                  >
                    <Text style={styles.installPayPOSButtonText}>Play Store'dan Yukle</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Is Detaylari */}
            {(customerName || description) && (
              <View style={styles.jobDetails}>
                {customerName && (
                  <View style={styles.detailRow}>
                    <MaterialCommunityIcons name="account" size={20} color="#666" />
                    <Text style={styles.detailLabel}>Musteri:</Text>
                    <Text style={styles.detailValue}>{customerName}</Text>
                  </View>
                )}
                {description && (
                  <View style={styles.detailRow}>
                    <MaterialCommunityIcons
                      name="information"
                      size={20}
                      color="#666"
                    />
                    <Text style={styles.detailLabel}>Hizmet:</Text>
                    <Text style={styles.detailValue} numberOfLines={2}>
                      {description}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Tutar */}
            <View style={styles.amountContainer}>
              <Text style={styles.amountTitleLabel}>Alinacak Tutar</Text>
              <Text style={styles.amountMain}>
                {formatCurrency(amount)}
                <Text style={styles.amountCurrency}> {currency}</Text>
              </Text>
            </View>

            {/* PayPOS Bilgilendirme */}
            <View style={styles.infoBox}>
              <MaterialCommunityIcons name="information" size={20} color="#1a73e8" />
              <Text style={styles.infoText}>
                "Odeme Al" butonuna bastiginizda PayPOS uygulamasi acilacak.
                Musterinin kredi kartini NFC okuyucuya yaklastirmasini isteyin.
              </Text>
            </View>

            {/* Butonlar */}
            <TouchableOpacity
              style={[
                styles.startButton,
                (!isAndroid || isPayPOSInstalled === false || checkingPayPOS) && styles.startButtonDisabled,
              ]}
              onPress={initiatePayment}
              disabled={!isAndroid || isPayPOSInstalled === false || checkingPayPOS}
            >
              <MaterialCommunityIcons
                name="contactless-payment"
                size={24}
                color="#fff"
              />
              <Text style={styles.startButtonText}>
                {checkingPayPOS ? 'Kontrol ediliyor...' : 'Odeme Al'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Vazgec</Text>
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
      onRequestClose={
        paymentState === 'initiating' ? undefined : handleCancel
      }
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View
          style={[styles.modalContainer, { transform: [{ scale: scaleAnim }] }]}
        >
          {/* Kapat butonu - sadece idle ve error'da goster */}
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
  payposBadge: {
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
  warning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#C62828',
    fontWeight: '500',
  },
  payposNotInstalledWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 12,
  },
  payposNotInstalledContent: {
    flex: 1,
  },
  payposNotInstalledText: {
    fontSize: 13,
    color: '#E65100',
    fontWeight: '500',
    marginBottom: 8,
  },
  installPayPOSButton: {
    backgroundColor: '#FF6F00',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
  installPayPOSButtonText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
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
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    gap: 12,
  },
  infoText: {
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
    textAlign: 'center',
  },
  // Waiting state
  waitingIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E0F2F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
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
    lineHeight: 22,
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
    marginBottom: 24,
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
