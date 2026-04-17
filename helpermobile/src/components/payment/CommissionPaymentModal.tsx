/**
 * Commission Payment Modal - Coordinator
 *
 * Komisyon ödeme modal'ının ana koordinatör component'i.
 * Tüm state ve logic useCommissionPayment hook'unda,
 * ekranlar ayrı component'lerde tanımlıdır.
 */
import React from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

import { useCommissionPayment } from './commission/useCommissionPayment';
import PaymentSelectScreen from './commission/PaymentSelectScreen';
import { ProcessingScreen, SuccessScreen, FailedScreen } from './commission/PaymentResultScreens';

interface CommissionPaymentModalProps {
  visible: boolean;
  onClose: () => void;
  requestId: number;
  commissionAmount: number;
  commissionBaseAmount?: number;
  commissionVatRate?: number;
  commissionVatAmount?: number;
  onPaymentSuccess: () => void;
  onPaymentFailed: (error: string) => void;
}

export default function CommissionPaymentModal({
  visible,
  onClose,
  requestId,
  commissionAmount,
  commissionBaseAmount,
  commissionVatRate,
  commissionVatAmount,
  onPaymentSuccess,
  onPaymentFailed,
}: CommissionPaymentModalProps) {
  const payment = useCommissionPayment({
    visible,
    requestId,
    commissionAmount,
    onPaymentSuccess,
    onPaymentFailed,
    onClose,
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={payment.handleClose}
    >
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {/* Header - sadece select ekranında */}
        {payment.step === 'select' && (
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={payment.handleClose}>
              <MaterialCommunityIcons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Komisyon Ödemesi</Text>
            <View style={styles.placeholder} />
          </View>
        )}

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {payment.step === 'select' && (
            <PaymentSelectScreen
              commissionAmount={commissionAmount}
              commissionBaseAmount={commissionBaseAmount}
              commissionVatRate={commissionVatRate}
              commissionVatAmount={commissionVatAmount}
              savedCards={payment.savedCards}
              selectedCardId={payment.selectedCardId}
              showNewCardForm={payment.showNewCardForm}
              isFormValid={payment.isFormValid()}
              formProps={{
                cardNumber: payment.cardNumber,
                setCardNumber: payment.setCardNumber,
                cardHolderName: payment.cardHolderName,
                setCardHolderName: payment.setCardHolderName,
                expireDate: payment.expireDate,
                setExpireDate: payment.setExpireDate,
                cvc: payment.cvc,
                setCvc: payment.setCvc,
                saveCard: payment.saveCard,
                setSaveCard: payment.setSaveCard,
              }}
              onCardSelect={(id) => {
                payment.setSelectedCardId(id);
                payment.setShowNewCardForm(false);
              }}
              onShowNewCardForm={() => {
                payment.setSelectedCardId(null);
                payment.setShowNewCardForm(true);
              }}
              onBackToSaved={() => payment.setShowNewCardForm(false)}
              onPay={payment.handlePayment}
            />
          )}

          {payment.step === 'processing' && (
            <ProcessingScreen amount={commissionAmount} spin={payment.spin} />
          )}

          {payment.step === 'threeds' && (
            <View style={styles.threeDSContainer}>
              <View style={styles.threeDSHeader}>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => {
                    payment.setStep('select');
                  }}
                >
                  <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>3D Secure Doğrulama</Text>
                <View style={styles.placeholder} />
              </View>
              <WebView
                source={{ html: payment.threeDSHtml }}
                style={{ flex: 1 }}
                onMessage={payment.handleWebViewMessage}
                onNavigationStateChange={payment.handleWebViewNavigationChange}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                startInLoadingState={true}
                renderLoading={() => (
                  <View style={styles.webViewLoading}>
                    <Animated.View style={{ transform: [{ rotate: payment.spin }] }}>
                      <MaterialCommunityIcons name="loading" size={40} color="#4CAF50" />
                    </Animated.View>
                    <Text style={styles.webViewLoadingText}>Yükleniyor...</Text>
                  </View>
                )}
              />
            </View>
          )}

          {payment.step === 'success' && (
            <SuccessScreen amount={commissionAmount} scaleValue={payment.scaleValue} />
          )}

          {payment.step === 'failed' && (
            <FailedScreen
              errorMessage={payment.errorMessage}
              onRetry={() => payment.setStep('select')}
              onCancel={payment.handleClose}
            />
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  // 3DS
  threeDSContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  threeDSHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  webViewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  webViewLoadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
});
