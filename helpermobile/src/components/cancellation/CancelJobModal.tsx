/**
 * İş İptal Modal'ı
 *
 * Tüm servis tipleri için ortak iptal modal'ı.
 * 3 aşamalı akış: kontrol → onay → iptal
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Text, Button, TextInput, Card } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { cancellationAPI } from '../../api/requests';
import type { CanCancelResponse } from '../../api/types';
import type { ServiceType } from '../../constants/serviceTypes';

type ModalStep = 'checking' | 'confirm' | 'cancelling';

interface CancelJobModalProps {
  visible: boolean;
  onClose: () => void;
  serviceType: ServiceType;
  trackingToken: string;
  onCancelSuccess: () => void;
}

export default function CancelJobModal({
  visible,
  onClose,
  serviceType,
  trackingToken,
  onCancelSuccess,
}: CancelJobModalProps) {
  const [step, setStep] = useState<ModalStep>('checking');
  const [canCancelData, setCanCancelData] = useState<CanCancelResponse | null>(null);
  const [reason, setReason] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal açılınca can-cancel kontrolü yap
  useEffect(() => {
    if (visible && trackingToken) {
      checkCanCancel();
    }
  }, [visible, trackingToken]);

  // Modal kapanınca state'leri sıfırla
  useEffect(() => {
    if (!visible) {
      setStep('checking');
      setCanCancelData(null);
      setReason('');
      setErrorMessage(null);
    }
  }, [visible]);

  const checkCanCancel = async () => {
    setStep('checking');
    setErrorMessage(null);
    try {
      const response = await cancellationAPI.canCancel(serviceType, trackingToken);
      setCanCancelData(response);
      setStep('confirm');
    } catch (error: any) {
      if (error?.response?.status === 403) {
        setErrorMessage(
          error?.response?.data?.error || 'Bu işlemi yapma yetkiniz bulunmuyor.'
        );
      } else {
        setErrorMessage('İptal kontrolü yapılırken bir hata oluştu. Lütfen tekrar deneyin.');
      }
      setStep('confirm');
    }
  };

  const handleCancel = async () => {
    setStep('cancelling');
    try {
      const response = await cancellationAPI.cancelJob(serviceType, trackingToken, reason.trim());

      onClose();

      // Kısa bir gecikme ile Alert göster (modal kapanma animasyonu için)
      setTimeout(() => {
        if (response.cancellation) {
          Alert.alert(
            'İade Başlatıldı',
            `Talep iptal edildi. İade işleminiz başlatıldı.\n\nİade Tutarı: ${response.cancellation.refund_amount} TL`,
            [{ text: 'Tamam', onPress: onCancelSuccess }]
          );
        } else {
          Alert.alert(
            'Talep İptal Edildi',
            response.message || 'Talep başarıyla iptal edildi.',
            [{ text: 'Tamam', onPress: onCancelSuccess }]
          );
        }
      }, 300);
    } catch (error: any) {
      setStep('confirm');
      const msg =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        'İptal işlemi sırasında bir hata oluştu.';
      Alert.alert('Hata', msg);
    }
  };

  const handleClose = useCallback(() => {
    if (step === 'cancelling') return; // İptal işlemi devam ediyorken kapatma
    onClose();
  }, [step, onClose]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            disabled={step === 'cancelling'}
          >
            <MaterialCommunityIcons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>İş İptali</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Kontrol aşaması - Loading */}
          {step === 'checking' && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#F44336" />
              <Text style={styles.loadingText}>İptal durumu kontrol ediliyor...</Text>
            </View>
          )}

          {/* Onay aşaması - Hata durumu */}
          {step === 'confirm' && errorMessage && (
            <View style={styles.contentContainer}>
              <Card style={styles.errorCard}>
                <Card.Content style={styles.errorContent}>
                  <MaterialCommunityIcons name="alert-circle" size={56} color="#F44336" />
                  <Text style={styles.errorTitle}>İşlem Yapılamıyor</Text>
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </Card.Content>
              </Card>
              <Button
                mode="contained"
                onPress={onClose}
                style={styles.closeActionButton}
                buttonColor="#666"
              >
                Kapat
              </Button>
            </View>
          )}

          {/* Onay aşaması - İptal edilemez */}
          {step === 'confirm' && !errorMessage && canCancelData && !canCancelData.can_cancel && (
            <View style={styles.contentContainer}>
              <Card style={styles.warningCard}>
                <Card.Content style={styles.warningContent}>
                  <MaterialCommunityIcons name="cancel" size={56} color="#FF9800" />
                  <Text style={styles.warningTitle}>İptal Edilemiyor</Text>
                  <Text style={styles.warningText}>
                    {canCancelData.reason || 'Bu iş şu anda iptal edilemiyor.'}
                  </Text>
                </Card.Content>
              </Card>
              <Button
                mode="contained"
                onPress={onClose}
                style={styles.closeActionButton}
                buttonColor="#666"
              >
                Kapat
              </Button>
            </View>
          )}

          {/* Onay aşaması - İptal edilebilir */}
          {step === 'confirm' && !errorMessage && canCancelData?.can_cancel && (
            <View style={styles.contentContainer}>
              {/* Uyarı başlığı */}
              <Card style={styles.alertCard}>
                <Card.Content style={styles.alertContent}>
                  <MaterialCommunityIcons name="alert-outline" size={40} color="#F44336" />
                  <Text style={styles.alertTitle}>İşi iptal etmek istediğinize emin misiniz?</Text>
                  {canCancelData.within_grace_period && (
                    <View style={styles.gracePeriodBadge}>
                      <MaterialCommunityIcons name="clock-check-outline" size={16} color="#4CAF50" />
                      <Text style={styles.gracePeriodText}>
                        Ücretsiz iptal süresi içindesiniz
                      </Text>
                    </View>
                  )}
                </Card.Content>
              </Card>

              {/* İade bilgileri */}
              {canCancelData.refund_info && (
                <Card style={styles.refundCard}>
                  <Card.Content>
                    <Text style={styles.refundTitle}>İade / Kesinti Bilgisi</Text>
                    <View style={styles.refundRow}>
                      <Text style={styles.refundLabel}>Toplam Tutar</Text>
                      <Text style={styles.refundValue}>
                        {canCancelData.refund_info.original_amount} TL
                      </Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.refundRow}>
                      <Text style={styles.refundLabel}>İade Oranı</Text>
                      <Text style={[styles.refundValue, { color: '#4CAF50' }]}>
                        %{canCancelData.refund_info.refund_rate}
                      </Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.refundRow}>
                      <Text style={styles.refundLabel}>İade Tutarı</Text>
                      <Text style={[styles.refundValue, styles.refundAmount]}>
                        {canCancelData.refund_info.refund_amount} TL
                      </Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.refundRow}>
                      <Text style={styles.refundLabel}>Kesinti</Text>
                      <Text style={[styles.refundValue, { color: '#F44336' }]}>
                        {canCancelData.refund_info.deduction_amount} TL
                      </Text>
                    </View>
                  </Card.Content>
                </Card>
              )}

              {/* İptal sebebi */}
              <Card style={styles.reasonCard}>
                <Card.Content>
                  <Text style={styles.reasonTitle}>İptal Sebebi</Text>
                  <TextInput
                    mode="outlined"
                    placeholder="İptal sebebinizi yazın..."
                    value={reason}
                    onChangeText={setReason}
                    multiline
                    numberOfLines={3}
                    style={styles.reasonInput}
                    outlineColor="#ddd"
                    activeOutlineColor="#F44336"
                  />
                </Card.Content>
              </Card>

              {/* Aksiyon butonları */}
              <View style={styles.actionButtons}>
                <Button
                  mode="outlined"
                  onPress={onClose}
                  style={styles.cancelButton}
                  textColor="#666"
                >
                  Vazgeç
                </Button>
                <Button
                  mode="contained"
                  onPress={handleCancel}
                  style={styles.confirmButton}
                  buttonColor="#F44336"
                  disabled={!reason.trim()}
                  icon="cancel"
                >
                  İptal Et
                </Button>
              </View>
            </View>
          )}

          {/* İptal işlemi devam ediyor */}
          {step === 'cancelling' && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#F44336" />
              <Text style={styles.loadingText}>İş iptal ediliyor...</Text>
            </View>
          )}
        </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: '#666',
  },
  contentContainer: {
    flex: 1,
  },
  // Hata kartı
  errorCard: {
    marginBottom: 16,
    backgroundColor: '#FFEBEE',
  },
  errorContent: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#C62828',
    marginTop: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  // Uyarı kartı (iptal edilemez)
  warningCard: {
    marginBottom: 16,
    backgroundColor: '#FFF3E0',
  },
  warningContent: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  warningTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E65100',
    marginTop: 12,
  },
  warningText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  // Alert kartı (iptal edilebilir - başlık)
  alertCard: {
    marginBottom: 16,
    backgroundColor: '#FFEBEE',
  },
  alertContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#C62828',
    marginTop: 8,
    textAlign: 'center',
  },
  gracePeriodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 12,
    gap: 6,
  },
  gracePeriodText: {
    fontSize: 13,
    color: '#2E7D32',
    fontWeight: '500',
  },
  // İade bilgileri kartı
  refundCard: {
    marginBottom: 16,
  },
  refundTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  refundRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  refundLabel: {
    fontSize: 14,
    color: '#666',
  },
  refundValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  refundAmount: {
    color: '#4CAF50',
    fontSize: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
  },
  // Sebep kartı
  reasonCard: {
    marginBottom: 16,
  },
  reasonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  reasonInput: {
    backgroundColor: '#fff',
  },
  // Aksiyon butonları
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 32,
  },
  cancelButton: {
    flex: 1,
    borderColor: '#ccc',
  },
  confirmButton: {
    flex: 1,
  },
  closeActionButton: {
    marginTop: 8,
  },
});
