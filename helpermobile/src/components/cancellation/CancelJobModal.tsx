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
import { Text, TextInput } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { cancellationAPI } from '../../api/requests';
import type { CanCancelResponse } from '../../api/types';
import type { ServiceType } from '../../constants/serviceTypes';
import { colors } from '../../theme/design';
import { FkCard, FkButton } from '../fk';

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
            <MaterialCommunityIcons name="close" size={24} color={colors.neutral[800]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>İş İptali</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Kontrol aşaması - Loading */}
          {step === 'checking' && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.danger[500]} />
              <Text style={styles.loadingText}>İptal durumu kontrol ediliyor...</Text>
            </View>
          )}

          {/* Onay aşaması - Hata durumu */}
          {step === 'confirm' && errorMessage && (
            <View style={styles.contentContainer}>
              <FkCard style={styles.errorCard} padding={0}>
                <View style={styles.errorContent}>
                  <MaterialCommunityIcons name="alert-circle" size={56} color={colors.danger[500]} />
                  <Text style={styles.errorTitle}>İşlem Yapılamıyor</Text>
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              </FkCard>
              <FkButton onPress={onClose} style={styles.closeActionButton}>
                Kapat
              </FkButton>
            </View>
          )}

          {/* Onay aşaması - İptal edilemez */}
          {step === 'confirm' && !errorMessage && canCancelData && !canCancelData.can_cancel && (
            <View style={styles.contentContainer}>
              <FkCard style={styles.warningCard} padding={0}>
                <View style={styles.warningContent}>
                  <MaterialCommunityIcons name="cancel" size={56} color={colors.warning[500]} />
                  <Text style={styles.warningTitle}>İptal Edilemiyor</Text>
                  <Text style={styles.warningText}>
                    {canCancelData.reason || 'Bu iş şu anda iptal edilemiyor.'}
                  </Text>
                </View>
              </FkCard>
              <FkButton onPress={onClose} style={styles.closeActionButton}>
                Kapat
              </FkButton>
            </View>
          )}

          {/* Onay aşaması - İptal edilebilir */}
          {step === 'confirm' && !errorMessage && canCancelData?.can_cancel && (
            <View style={styles.contentContainer}>
              {/* Uyarı başlığı */}
              <FkCard style={styles.alertCard} padding={0}>
                <View style={styles.alertContent}>
                  <MaterialCommunityIcons name="alert-outline" size={40} color={colors.danger[500]} />
                  <Text style={styles.alertTitle}>İşi iptal etmek istediğinize emin misiniz?</Text>
                  {canCancelData.within_grace_period && (
                    <View style={styles.gracePeriodBadge}>
                      <MaterialCommunityIcons name="clock-check-outline" size={16} color={colors.success[500]} />
                      <Text style={styles.gracePeriodText}>
                        Ücretsiz iptal süresi içindesiniz
                      </Text>
                    </View>
                  )}
                </View>
              </FkCard>

              {/* İade bilgileri */}
              {canCancelData.refund_info && (
                <FkCard style={styles.refundCard}>
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
                      <Text style={[styles.refundValue, { color: colors.success[500] }]}>
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
                      <Text style={[styles.refundValue, { color: colors.danger[500] }]}>
                        {canCancelData.refund_info.deduction_amount} TL
                      </Text>
                    </View>
                  
                </FkCard>
              )}

              {/* İptal sebebi */}
              <FkCard style={styles.reasonCard}>
                  <Text style={styles.reasonTitle}>İptal Sebebi</Text>
                  <TextInput
                    mode="outlined"
                    placeholder="İptal sebebinizi yazın..."
                    value={reason}
                    onChangeText={setReason}
                    multiline
                    numberOfLines={3}
                    style={styles.reasonInput}
                    outlineColor={colors.neutral[200]}
                    activeOutlineColor={colors.danger[500]}
                  />
                
              </FkCard>

              {/* Aksiyon butonları */}
              <View style={styles.actionButtons}>
                <FkButton variant="secondary" onPress={onClose} style={styles.cancelButton}>
                  Vazgeç
                </FkButton>
                <FkButton variant="danger" onPress={handleCancel} style={styles.confirmButton} disabled={!reason.trim()} icon="cancel">
                  İptal Et
                </FkButton>
              </View>
            </View>
          )}

          {/* İptal işlemi devam ediyor */}
          {step === 'cancelling' && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.danger[500]} />
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
    backgroundColor: colors.neutral[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: colors.neutral[100],
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.neutral[800],
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
    color: colors.neutral[500],
  },
  contentContainer: {
    flex: 1,
  },
  // Hata kartı
  errorCard: {
    marginBottom: 16,
    backgroundColor: colors.danger[50],
  },
  errorContent: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.danger[700],
    marginTop: 12,
  },
  errorText: {
    fontSize: 14,
    color: colors.neutral[500],
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  // Uyarı kartı (iptal edilemez)
  warningCard: {
    marginBottom: 16,
    backgroundColor: colors.warning[50],
  },
  warningContent: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  warningTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.warning[700],
    marginTop: 12,
  },
  warningText: {
    fontSize: 14,
    color: colors.neutral[500],
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  // Alert kartı (iptal edilebilir - başlık)
  alertCard: {
    marginBottom: 16,
    backgroundColor: colors.danger[50],
  },
  alertContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.danger[700],
    marginTop: 8,
    textAlign: 'center',
  },
  gracePeriodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success[50],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 12,
    gap: 6,
  },
  gracePeriodText: {
    fontSize: 13,
    color: colors.success[700],
    fontWeight: '500',
  },
  // İade bilgileri kartı
  refundCard: {
    marginBottom: 16,
  },
  refundTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.neutral[800],
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
    color: colors.neutral[500],
  },
  refundValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.neutral[800],
  },
  refundAmount: {
    color: colors.success[500],
    fontSize: 16,
  },
  divider: {
    height: 1,
    backgroundColor: colors.neutral[100],
  },
  // Sebep kartı
  reasonCard: {
    marginBottom: 16,
  },
  reasonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.neutral[800],
    marginBottom: 8,
  },
  reasonInput: {
    backgroundColor: colors.white,
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
    borderColor: colors.neutral[300],
  },
  confirmButton: {
    flex: 1,
  },
  closeActionButton: {
    marginTop: 8,
  },
});
