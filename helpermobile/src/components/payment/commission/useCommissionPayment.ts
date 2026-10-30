/**
 * Commission Payment Hook
 *
 * Komisyon ödeme akışının tüm state yönetimi ve business logic'i.
 * - Kayıtlı kart / yeni kart ile ödeme
 * - 3DS doğrulama (WebView)
 * - Ödeme durumu polling
 * - Animasyonlar
 * - Talep iptali / işin sürücüden alınması: WebSocket/FCM/banka dönüşü/durum sorgusu ile
 *   anında algılanır, modal kapanır ve sebep koduna göre popup gösterilir (bkz. cancelReason.ts)
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { Alert, Animated, Easing } from 'react-native';
import { useCancellationEventStore } from '../../../store/useCancellationEventStore';
import { jobsWebSocket } from '../../../services/jobsWebSocket';
import { paymentAPI, SavedCard } from '../../../api/payment';
import { getReadablePaymentError } from './paymentUtils';
import {
  CommissionCancel,
  cancelFromEventReason,
  getCancelAlertMessage,
  getCancelAlertTitle,
  getUrlParam,
  toCommissionCancel,
} from './cancelReason';
import { logger } from '../../../utils/logger';

export type PaymentStep = 'select' | 'processing' | 'threeds' | 'success' | 'failed';

interface UseCommissionPaymentProps {
  visible: boolean;
  requestId: number;
  commissionAmount: number;
  onPaymentSuccess: () => void;
  onPaymentFailed: (error: string) => void;
  onClose: () => void;
  // Backend job status'unu doğrular:
  //   true             -> ödeme işlendi, iş devam ediyor (in_progress / completed)
  //   CommissionCancel -> talep iptal edildi / iş sürücüden alındı (detaydaki cancelReason)
  //   false            -> henüz değişmedi (beklemeye devam)
  // Verilmezse modal 1500ms sonra success'i tetikler (geriye dönük uyumlu).
  verifyJobCleared?: () => Promise<boolean | CommissionCancel>;
}

export function useCommissionPayment({
  visible,
  requestId,
  onPaymentSuccess,
  onPaymentFailed,
  onClose,
  verifyJobCleared,
}: UseCommissionPaymentProps) {
  // Screen state
  const [step, setStep] = useState<PaymentStep>('select');

  // Card state
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [loadingCards, setLoadingCards] = useState(true);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [showNewCardForm, setShowNewCardForm] = useState(false);

  // Form state
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolderName, setCardHolderName] = useState('');
  const [expireDate, setExpireDate] = useState('');
  const [cvc, setCvc] = useState('');
  const [saveCard, setSaveCard] = useState(true);

  // 3DS state
  const [threeDSHtml, setThreeDSHtml] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Ödeme başarılı sonrası backend job status doğrulama state'i
  const [verifyingJobStatus, setVerifyingJobStatus] = useState(false);

  // Animation values
  const spinValue = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(0)).current;
  const checkmarkProgress = useRef(new Animated.Value(0)).current;

  // Refs
  const callbackProcessedRef = useRef(false);
  const pollingCountRef = useRef(0);
  const maxPollingAttempts = 30;
  // İptal bir kez işlensin (WS + FCM + polling aynı anda gelebilir)
  const cancelledHandledRef = useRef(false);
  // Modal açılış zamanı: bundan önceki iptal event'leri yok sayılır
  const openedAtRef = useRef(0);
  // Modal açık mı: kapandıktan sonra bekleyen polling / doğrulama döngüleri durur
  const activeRef = useRef(false);

  // Spin interpolation
  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Kayıtlı kartları getir
  useEffect(() => {
    activeRef.current = visible;
    if (visible) {
      setStep('select');
      cancelledHandledRef.current = false;
      openedAtRef.current = Date.now();
      fetchSavedCards();
    }
  }, [visible]);

  // Spinner animasyonu
  useEffect(() => {
    if (step === 'processing') {
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    } else {
      spinValue.setValue(0);
    }
  }, [step]);

  // Success animasyonu
  useEffect(() => {
    if (step === 'success') {
      Animated.sequence([
        Animated.spring(scaleValue, {
          toValue: 1,
          friction: 5,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.timing(checkmarkProgress, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleValue.setValue(0);
      checkmarkProgress.setValue(0);
    }
  }, [step]);

  const fetchSavedCards = async () => {
    try {
      setLoadingCards(true);
      const cards = await paymentAPI.getSavedCards();
      setSavedCards(cards);

      const defaultCard = cards.find(c => c.is_default);
      if (defaultCard) {
        setSelectedCardId(defaultCard.id);
      } else if (cards.length > 0) {
        setSelectedCardId(cards[0].id);
      }

      if (cards.length === 0) {
        setShowNewCardForm(true);
      }
    } catch (error: any) {
      logger.error('payment', 'useCommissionPayment.fetchSavedCards failure', { status: error?.response?.status });
      setSavedCards([]);
      setShowNewCardForm(true);
    } finally {
      setLoadingCards(false);
    }
  };

  const resetForm = useCallback(() => {
    setCardNumber('');
    setCardHolderName('');
    setExpireDate('');
    setCvc('');
    setSaveCard(true);
    setShowNewCardForm(false);
    setThreeDSHtml('');
    setErrorMessage('');
    pollingCountRef.current = 0;
    callbackProcessedRef.current = false;
  }, []);

  const handleClose = useCallback(() => {
    activeRef.current = false;
    resetForm();
    setVerifyingJobStatus(false);
    onClose();
  }, [resetForm, onClose]);

  // Ekranlar fonksiyonları her render'da yeniden oluşturduğu için ref kullanılır
  // (aksi halde aşağıdaki interval sürekli sıfırlanır ve hiç tetiklenmezdi).
  const verifyRef = useRef(verifyJobCleared);
  verifyRef.current = verifyJobCleared;

  // Talep iptal edildi / iş sürücüden alındı: modalı (3DS dahil) kapat, popup göster.
  // Backend bu durumlarda banka dönüşünde tahsilatı tamamlamaz.
  const handleRequestCancelled = useCallback((cancel: CommissionCancel) => {
    if (cancelledHandledRef.current) return;
    cancelledHandledRef.current = true;
    logger.info('payment', 'useCommissionPayment.requestCancelled', { requestId, code: cancel.code });
    handleClose();
    // Ekran hâlâ "ödeme bekliyor" gösteriyor olabilir: detayı tazele (setRequest)
    verifyRef.current?.().catch(() => {});
    // iOS: Modal kapanırken açılan Alert yutulabiliyor, kapanış animasyonundan sonra göster
    setTimeout(() => {
      Alert.alert(
        getCancelAlertTitle(cancel.code),
        getCancelAlertMessage(cancel),
        [{ text: 'Tamam' }]
      );
    }, 400);
  }, [handleClose, requestId]);

  // WebSocket job_cancelled veya FCM request_cancelled -> anında kapat
  const { lastCancelledJobId, lastCancelledAt, lastCancelledReason } = useCancellationEventStore();
  useEffect(() => {
    if (!visible || !lastCancelledJobId || !lastCancelledAt) return;
    if (lastCancelledAt < openedAtRef.current) return;
    if (Number(lastCancelledJobId) === Number(requestId)) {
      handleRequestCancelled(cancelFromEventReason(lastCancelledReason));
    }
  }, [visible, lastCancelledJobId, lastCancelledAt, lastCancelledReason, requestId, handleRequestCancelled]);

  // Yedek kontrol: WebSocket bağlı değilse modal açıkken iş durumunu yokla.
  const cancelHandlerRef = useRef(handleRequestCancelled);
  cancelHandlerRef.current = handleRequestCancelled;
  const hasVerifier = !!verifyJobCleared;
  useEffect(() => {
    if (!visible || !hasVerifier || step === 'success') return;
    const interval = setInterval(async () => {
      if (cancelledHandledRef.current || jobsWebSocket.hasActiveConnections()) return;
      try {
        const result = await verifyRef.current?.();
        if (result && typeof result === 'object') {
          cancelHandlerRef.current(result);
        }
      } catch {
        // ağ hatası: bir sonraki denemede tekrar
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [visible, step, hasVerifier]);

  // Backend job status'unun güncel olduğunu doğrula.
  // Race condition: backend WebSocket event'ini transaction commit ÖNCESİ atabiliyor.
  // Bu yüzden iyzico success URL'inden sonra hemen onPaymentSuccess'i tetiklemek yerine
  // verifyJobCleared() ile DB'nin gerçekten 'in_progress'e döndüğünü garantiliyoruz.
  // true: iş devam ediyor (başarı akışına geç); false: iptal edildi / modal kapandı
  const waitForJobStatusUpdate = useCallback(async (): Promise<boolean> => {
    if (!verifyJobCleared) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      return true;
    }

    setVerifyingJobStatus(true);
    try {
      // Status değişene kadar polle. Backend fix sonrası tipik olarak 1-2 saniyede biter.
      // İptal gelirse veya modal kapandıysa döngüden çık.
      while (activeRef.current && !cancelledHandledRef.current) {
        try {
          const result = await verifyJobCleared();
          if (result && typeof result === 'object') {
            handleRequestCancelled(result);
            return false;
          }
          if (result) return true;
        } catch {
          // Network hatası vs. → yine de polling'e devam et
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      return false;
    } finally {
      setVerifyingJobStatus(false);
    }
  }, [verifyJobCleared, handleRequestCancelled]);

  const completeSuccessFlow = useCallback(async () => {
    setStep('success');
    const jobActive = await waitForJobStatusUpdate();
    if (!jobActive) return;
    onPaymentSuccess();
    handleClose();
  }, [waitForJobStatusUpdate, onPaymentSuccess, handleClose]);

  // Ödeme yap
  const handlePayment = async () => {
    setStep('processing');
    setErrorMessage('');

    try {
      let response;

      if (selectedCardId) {
        response = await paymentAPI.initiateCommissionPaymentSavedCard(requestId, selectedCardId);
      } else {
        const [expireMonth, expireYearShort] = expireDate.split('/');
        const expireYear = `20${expireYearShort}`;

        const cardInfo = {
          card_holder_name: cardHolderName,
          card_number: cardNumber.replace(/\s/g, ''),
          expire_month: expireMonth,
          expire_year: expireYear,
          cvc: cvc,
          register_card: saveCard,
        };

        response = await paymentAPI.initiateCommissionPaymentNewCard(requestId, cardInfo);
      }

      if (response.html_content) {
        setThreeDSHtml(response.html_content);
        setStep('threeds');
      } else {
        if (callbackProcessedRef.current) return;
        callbackProcessedRef.current = true;
        completeSuccessFlow();
      }
    } catch (error: any) {
      logger.error('payment', 'useCommissionPayment.handlePayment failure', { status: error?.response?.status });

      // Ödeme isteği responseType 'text' ile atılıyor: hata gövdesi JSON string gelir
      let errorData = error?.response?.data;
      if (typeof errorData === 'string') {
        try { errorData = JSON.parse(errorData); } catch { /* düz metin */ }
      }
      // Acente ödemeli işte ödeme yoktur (409, kod alanı `code`): iş ekranına dön
      if (errorData?.code === 'PAYMENT_NOT_REQUIRED') {
        handleClose();
        return;
      }

      // 409: talep iptal edildi / iş bu sürücüden alındı
      const cancel = toCommissionCancel(errorData?.error?.code, errorData?.error?.message);
      if (cancel) {
        handleRequestCancelled(cancel);
        return;
      }

      let message = 'Ödeme işlemi başarısız oldu';

      if (errorData) {
        const data = errorData;
        if (data.error?.message) {
          message = data.error.message;
        } else if (typeof data.error === 'string') {
          message = data.error;
        } else if (data.card_info) {
          const validationErrors = Object.values(data.card_info).flat();
          message = (validationErrors as string[]).join(', ');
        } else if (typeof data === 'string') {
          message = data;
        }
      } else if (error?.message) {
        message = error.message;
      }

      if (error?.response?.status === 500) {
        message = 'Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.';
      }

      setErrorMessage(message);
      setStep('failed');
    }
  };

  // 3DS WebView mesaj handler
  const handleWebViewMessage = useCallback((event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.status === 'success') {
        if (callbackProcessedRef.current) return;
        callbackProcessedRef.current = true;
        completeSuccessFlow();
      } else if (data.status === 'failed') {
        setErrorMessage(data.message || 'Ödeme başarısız oldu');
        setStep('failed');
      }
    } catch (e) {
      // JSON parse edilemezse ignore et
    }
  }, [completeSuccessFlow]);

  // Ödeme durumunu kontrol et (polling)
  const checkPaymentStatus = async () => {
    // Modal kapandı / iptal işlendi: bekleyen zamanlayıcılar sorgu atmasın
    if (!activeRef.current || cancelledHandledRef.current) return;
    try {
      pollingCountRef.current += 1;

      if (pollingCountRef.current > maxPollingAttempts) {
        setErrorMessage('Ödeme durumu kontrol edilemedi. Lütfen sayfayı yenileyip tekrar deneyin.');
        setStep('failed');
        pollingCountRef.current = 0;
        return;
      }

      setStep('processing');
      const response = await paymentAPI.getCommissionPaymentStatus(requestId);
      const paymentStatus = response.status;

      // Ödeme alınamayan durum (iptal / iş sürücüden alındı / ödeme geçersiz).
      // Tamamlanmış ödemede backend sebep eklemez.
      const cancel = toCommissionCancel(response.cancel_reason, response.cancel_message);
      if (cancel) {
        pollingCountRef.current = 0;
        handleRequestCancelled(cancel);
        return;
      }

      if (paymentStatus === 'completed') {
        if (callbackProcessedRef.current) return;
        callbackProcessedRef.current = true;
        pollingCountRef.current = 0;
        completeSuccessFlow();
      } else if (paymentStatus === 'failed') {
        pollingCountRef.current = 0;
        // Bu uç hata mesajı döndürmüyor
        setErrorMessage('Ödeme başarısız oldu. Lütfen tekrar deneyin.');
        setStep('failed');
      } else if (paymentStatus === 'refunded') {
        pollingCountRef.current = 0;
        setErrorMessage('Bu ödeme iade edildi. Lütfen tekrar deneyin.');
        setStep('failed');
      } else if (paymentStatus === 'cancelled') {
        // Sebep kodu gelmeyen iptal edilmiş ödeme kaydı
        pollingCountRef.current = 0;
        handleRequestCancelled(toCommissionCancel('PAYMENT_NOT_ACTIVE')!);
      } else if (paymentStatus === 'no_payment') {
        pollingCountRef.current = 0;
        setErrorMessage('Ödeme işlemi başlatılamadı. Lütfen tekrar deneyin.');
        setStep('failed');
      } else {
        // pending / initiated / processing
        setTimeout(() => checkPaymentStatus(), 2000);
      }
    } catch (error: any) {
      logger.error('payment', 'useCommissionPayment.checkPaymentStatus failure', { status: error?.response?.status });

      if (error?.response?.status === 404) {
        pollingCountRef.current = 0;
        setErrorMessage('Ödeme kaydı bulunamadı. Lütfen tekrar deneyin.');
        setStep('failed');
        return;
      }

      if (pollingCountRef.current < 5) {
        setTimeout(() => checkPaymentStatus(), 2000);
      } else {
        pollingCountRef.current = 0;
        setErrorMessage('Ödeme durumu kontrol edilemedi. Lütfen sayfayı yenileyip tekrar deneyin.');
        setStep('failed');
      }
    }
  };

  // 3DS WebView URL değişikliğini kontrol et
  const handleWebViewNavigationChange = useCallback((navState: any) => {
    const { url } = navState;

    // 0. Banka dönüşü: talep iptal edildi / iş sürücüden alındı (backend tahsilatı tamamlamadı).
    // Backend her durumda reason=<KOD>&error=<mesaj> ekler.
    const cancel = toCommissionCancel(getUrlParam(url, 'reason'), getUrlParam(url, 'error'));
    if (cancel) {
      handleRequestCancelled(cancel);
      return;
    }

    // 1. Kesin sonuçlar: payment=success/failed
    if (url.includes('payment=success')) {
      if (step !== 'success') {
        callbackProcessedRef.current = true;
        pollingCountRef.current = 0;
        completeSuccessFlow();
      }
      return;
    }
    if (url.includes('payment=failed')) {
      if (step !== 'failed') {
        callbackProcessedRef.current = true;
        pollingCountRef.current = 0;
        const rawError = getUrlParam(url, 'error') || 'Ödeme başarısız oldu';
        const errorMsg = getReadablePaymentError(rawError);
        setErrorMessage(errorMsg);
        setStep('failed');
      }
      return;
    }

    // 2. iyzico 3DS fail callback
    if (url.includes('callback3ds/fail') || url.includes('callback3ds/error')) {
      if (!callbackProcessedRef.current) {
        callbackProcessedRef.current = true;
        setErrorMessage('3D Secure doğrulama başarısız oldu');
        setStep('failed');
      }
      return;
    }

    // 3. Backend commission callback URL - polling başlat
    if (url.includes('/payment/commission-callback/') && !callbackProcessedRef.current) {
      callbackProcessedRef.current = true;
      setTimeout(() => {
        checkPaymentStatus();
      }, 2000);
    }
  }, [step, completeSuccessFlow, handleRequestCancelled]);

  const isFormValid = useCallback((): boolean => {
    return (
      cardNumber.length >= 16 &&
      cardHolderName.length >= 3 &&
      expireDate.length === 5 &&
      cvc.length >= 3
    );
  }, [cardNumber, cardHolderName, expireDate, cvc]);

  return {
    // Screen state
    step, setStep,
    // Card state
    savedCards, loadingCards, selectedCardId, setSelectedCardId, showNewCardForm, setShowNewCardForm,
    // Form state
    cardNumber, setCardNumber, cardHolderName, setCardHolderName,
    expireDate, setExpireDate, cvc, setCvc, saveCard, setSaveCard,
    // 3DS state
    threeDSHtml, errorMessage,
    // Backend job status verification (post-payment)
    verifyingJobStatus,
    // Handlers
    handlePayment, handleClose, handleWebViewMessage, handleWebViewNavigationChange,
    // Validation
    isFormValid,
    // Animations
    spin, scaleValue, checkmarkProgress,
  };
}
