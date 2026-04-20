/**
 * Commission Payment Hook
 *
 * Komisyon ödeme akışının tüm state yönetimi ve business logic'i.
 * - Kayıtlı kart / yeni kart ile ödeme
 * - 3DS doğrulama (WebView)
 * - Ödeme durumu polling
 * - Animasyonlar
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { Animated, Easing } from 'react-native';
import { paymentAPI, SavedCard } from '../../../api/payment';
import { getReadablePaymentError } from './paymentUtils';
import { logger } from '../../../utils/logger';

export type PaymentStep = 'select' | 'processing' | 'threeds' | 'success' | 'failed';

interface UseCommissionPaymentProps {
  visible: boolean;
  requestId: number;
  commissionAmount: number;
  onPaymentSuccess: () => void;
  onPaymentFailed: (error: string) => void;
  onClose: () => void;
}

export function useCommissionPayment({
  visible,
  requestId,
  onPaymentSuccess,
  onPaymentFailed,
  onClose,
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

  // Animation values
  const spinValue = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(0)).current;
  const checkmarkProgress = useRef(new Animated.Value(0)).current;

  // Refs
  const callbackProcessedRef = useRef(false);
  const pollingCountRef = useRef(0);
  const maxPollingAttempts = 30;

  // Spin interpolation
  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Kayıtlı kartları getir
  useEffect(() => {
    if (visible) {
      setStep('select');
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
    setStep('select');
    setThreeDSHtml('');
    setErrorMessage('');
    pollingCountRef.current = 0;
    callbackProcessedRef.current = false;
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

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
        setStep('success');
        setTimeout(() => {
          onPaymentSuccess();
          handleClose();
        }, 1500);
      }
    } catch (error: any) {
      logger.error('payment', 'useCommissionPayment.handlePayment failure', { status: error?.response?.status });

      let message = 'Ödeme işlemi başarısız oldu';

      if (error?.response?.data) {
        const data = error.response.data;
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
        setStep('success');
        setTimeout(() => {
          onPaymentSuccess();
          handleClose();
        }, 1500);
      } else if (data.status === 'failed') {
        setErrorMessage(data.message || 'Ödeme başarısız oldu');
        setStep('failed');
      }
    } catch (e) {
      // JSON parse edilemezse ignore et
    }
  }, [onPaymentSuccess, handleClose]);

  // Ödeme durumunu kontrol et (polling)
  const checkPaymentStatus = async () => {
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
      const paymentStatus: string = response.status;

      if (paymentStatus === 'completed') {
        pollingCountRef.current = 0;
        setStep('success');
        setTimeout(() => {
          onPaymentSuccess();
          handleClose();
        }, 1500);
      } else if (paymentStatus === 'failed') {
        pollingCountRef.current = 0;
        const readableError = getReadablePaymentError(response.error_message || 'Ödeme başarısız oldu');
        setErrorMessage(readableError);
        setStep('failed');
      } else if (paymentStatus === 'no_payment') {
        pollingCountRef.current = 0;
        setErrorMessage('Ödeme işlemi başlatılamadı. Lütfen tekrar deneyin.');
        setStep('failed');
      } else if (paymentStatus === 'pending' || paymentStatus === 'processing' || paymentStatus === 'initiated') {
        setTimeout(() => checkPaymentStatus(), 2000);
      } else {
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

    // 1. Kesin sonuçlar: payment=success/failed
    if (url.includes('payment=success')) {
      if (step !== 'success') {
        callbackProcessedRef.current = true;
        pollingCountRef.current = 0;
        setStep('success');
        setTimeout(() => {
          onPaymentSuccess();
          handleClose();
        }, 1500);
      }
      return;
    }
    if (url.includes('payment=failed')) {
      if (step !== 'failed') {
        callbackProcessedRef.current = true;
        pollingCountRef.current = 0;
        const errorMatch = url.match(/error=([^&]+)/);
        const rawError = errorMatch ? decodeURIComponent(errorMatch[1]) : 'Ödeme başarısız oldu';
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
  }, [step, onPaymentSuccess, handleClose]);

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
    // Handlers
    handlePayment, handleClose, handleWebViewMessage, handleWebViewNavigationChange,
    // Validation
    isFormValid,
    // Animations
    spin, scaleValue, checkmarkProgress,
  };
}
