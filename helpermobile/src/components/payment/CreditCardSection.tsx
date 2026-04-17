import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { StyleSheet, View, TouchableOpacity, Alert, Dimensions, FlatList, Modal as RNModal } from 'react-native';
import { Button, Card, Text, TextInput, HelperText, IconButton, ActivityIndicator, Modal, Portal } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import WebView, { WebViewNavigation } from 'react-native-webview';
import { useNotificationStore } from '../../store/useNotificationStore';
import { paymentAPI, SavedCard } from '../../api';
import { getReadablePaymentError } from './commission/paymentUtils';
import { useAppTheme } from '../../hooks/useAppTheme';

interface CreditCardSectionProps {
  refreshTrigger?: number;
}

export default function CreditCardSection({ refreshTrigger }: CreditCardSectionProps) {
  const { isDarkMode, appColors, cardBg } = useAppTheme();
  const { showNotification } = useNotificationStore();

  // Kayitli kartlar
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [loadingCards, setLoadingCards] = useState(true);

  // Yeni kart ekleme modu
  const [showAddCard, setShowAddCard] = useState(false);

  // 3DS WebView
  const [show3DS, setShow3DS] = useState(false);
  const [threeDSHtml, setThreeDSHtml] = useState('');
  const [webViewLoading, setWebViewLoading] = useState(true);
  const callbackProcessedRef = useRef(false);

  // Kart takma adi duzenleme modal
  const [editAliasModal, setEditAliasModal] = useState(false);
  const [editingCard, setEditingCard] = useState<SavedCard | null>(null);
  const [newAlias, setNewAlias] = useState('');

  // Form state - Kart Bilgileri
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolderName, setCardHolderName] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [cvc, setCvc] = useState('');
  const [cardAlias, setCardAlias] = useState('');

  const [saving, setSaving] = useState(false);

  // Ay/Yil secim modal
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Ay secenekleri
  const months = useMemo(() => [
    { value: '01', label: '01 - Ocak' },
    { value: '02', label: '02 - Subat' },
    { value: '03', label: '03 - Mart' },
    { value: '04', label: '04 - Nisan' },
    { value: '05', label: '05 - Mayis' },
    { value: '06', label: '06 - Haziran' },
    { value: '07', label: '07 - Temmuz' },
    { value: '08', label: '08 - Agustos' },
    { value: '09', label: '09 - Eylul' },
    { value: '10', label: '10 - Ekim' },
    { value: '11', label: '11 - Kasim' },
    { value: '12', label: '12 - Aralik' },
  ], []);

  // Yil secenekleri (simdiki yildan 15 yil ileriye)
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 15 }, (_, i) => {
      const year = currentYear + i;
      const shortYear = String(year).slice(-2);
      return { value: shortYear, label: String(year) };
    });
  }, []);

  // Kayitli kartlari yukle
  const loadSavedCards = useCallback(async () => {
    try {
      setLoadingCards(true);
      const cards = await paymentAPI.getSavedCards();
      setSavedCards(cards);

      if (cards.length === 0) {
        setShowAddCard(true);
      }
    } catch (error: any) {
      console.error('Load saved cards error:', error);
      setSavedCards([]);
      setShowAddCard(true);
    } finally {
      setLoadingCards(false);
    }
  }, []);

  useEffect(() => {
    loadSavedCards();
  }, [loadSavedCards]);

  // refreshTrigger degisince kartlari yeniden yukle
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      loadSavedCards();
    }
  }, [refreshTrigger, loadSavedCards]);

  // Format card number with spaces
  const handleCardNumberChange = (text: string) => {
    const cleaned = text.replace(/\s/g, '');
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    setCardNumber(formatted);
    if (errors.cardNumber) {
      setErrors({ ...errors, cardNumber: '' });
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const cleanedCardNumber = cardNumber.replace(/\s/g, '');
    if (!cleanedCardNumber) {
      newErrors.cardNumber = 'Kart numarasi gerekli';
    } else if (cleanedCardNumber.length !== 16 || !/^\d+$/.test(cleanedCardNumber)) {
      newErrors.cardNumber = 'Gecersiz kart numarasi (16 hane olmali)';
    }

    if (!cardHolderName.trim()) {
      newErrors.cardHolderName = 'Kart sahibinin adi gerekli';
    } else if (cardHolderName.trim().length < 3) {
      newErrors.cardHolderName = 'Ad en az 3 karakter olmali';
    }

    if (!expiryMonth) {
      newErrors.expiryMonth = 'Ay gerekli';
    } else {
      const month = parseInt(expiryMonth);
      if (month < 1 || month > 12) {
        newErrors.expiryMonth = 'Gecersiz ay (01-12)';
      }
    }

    if (!expiryYear) {
      newErrors.expiryYear = 'Yil gerekli';
    } else {
      const year = parseInt(expiryYear);
      const currentYear = new Date().getFullYear() % 100;
      if (expiryYear.length !== 2 || year < currentYear) {
        newErrors.expiryYear = 'Gecersiz yil';
      }
    }

    if (!cvc) {
      newErrors.cvc = 'CVC gerekli';
    } else if (cvc.length < 3 || !/^\d+$/.test(cvc)) {
      newErrors.cvc = 'Gecersiz CVC (3-4 hane)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Formu temizle
  const resetForm = () => {
    setCardNumber('');
    setCardHolderName('');
    setExpiryMonth('');
    setExpiryYear('');
    setCvc('');
    setCardAlias('');
    setErrors({});
  };

  // Kart dogrulama baslat (yeni 3DS akisi)
  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      const result = await paymentAPI.initiateCardVerification({
        card_holder_name: cardHolderName,
        card_number: cardNumber.replace(/\s/g, ''),
        expire_month: expiryMonth.padStart(2, '0'),
        expire_year: expiryYear.length === 2 ? '20' + expiryYear : expiryYear,
        cvc: cvc,
        card_alias: cardAlias || undefined,
      });

      // 3DS HTML geldi, WebView'da goster
      callbackProcessedRef.current = false;
      setThreeDSHtml(result.html_content);
      setWebViewLoading(true);
      setShow3DS(true);
    } catch (error: any) {
      console.error('Card verification initiate error:', error);
      const errorData = error?.response?.data;
      let errorMessage = 'Kart dogrulama baslatilirken bir hata olustu.';

      if (errorData?.error?.message) {
        errorMessage = errorData.error.message;
      } else if (errorData?.error) {
        errorMessage = typeof errorData.error === 'string' ? errorData.error : JSON.stringify(errorData.error);
      } else if (errorData?.message) {
        errorMessage = errorData.message;
      }

      showNotification('error', errorMessage, 6000);
    } finally {
      setSaving(false);
    }
  };

  // 3DS WebView redirect yakalama
  const handleNavigationStateChange = useCallback((navState: WebViewNavigation) => {
    const { url } = navState;

    if (callbackProcessedRef.current) return;

    // Basarili: card-verification?status=success
    if (url.includes('card-verification') && url.includes('status=success')) {
      callbackProcessedRef.current = true;
      setShow3DS(false);
      setThreeDSHtml('');
      showNotification('success', 'Kartiniz basariyla dogrulandi ve kaydedildi! 1 TL dogrulama tutari iade edilecektir.');
      resetForm();
      setShowAddCard(false);
      loadSavedCards();
      return;
    }

    // Basarisiz: card-verification?status=failed
    if (url.includes('card-verification') && url.includes('status=failed')) {
      callbackProcessedRef.current = true;
      const errorMatch = url.match(/error=([^&]+)/);
      const rawError = errorMatch ? decodeURIComponent(errorMatch[1]) : 'Kart dogrulama basarisiz oldu';
      const errorMessage = getReadablePaymentError(rawError);
      setShow3DS(false);
      setThreeDSHtml('');
      showNotification('error', errorMessage, 6000);
      return;
    }

    // Genel odeme callback'leri (fallback)
    if (url.includes('payment=success')) {
      callbackProcessedRef.current = true;
      setShow3DS(false);
      setThreeDSHtml('');
      showNotification('success', 'Kartiniz basariyla kaydedildi!');
      resetForm();
      setShowAddCard(false);
      loadSavedCards();
      return;
    }

    if (url.includes('payment=failed')) {
      callbackProcessedRef.current = true;
      const errorMatch = url.match(/error=([^&]+)/);
      const rawError = errorMatch ? decodeURIComponent(errorMatch[1]) : 'Odeme basarisiz oldu';
      const errorMessage = getReadablePaymentError(rawError);
      setShow3DS(false);
      setThreeDSHtml('');
      showNotification('error', errorMessage, 6000);
      return;
    }

    // iyzico 3DS fail callback'leri
    if (url.includes('callback3ds/fail') || url.includes('callback3ds/error')) {
      callbackProcessedRef.current = true;
      setShow3DS(false);
      setThreeDSHtml('');
      showNotification('error', '3D Secure dogrulama basarisiz oldu. Lutfen tekrar deneyin.', 6000);
      return;
    }
  }, [showNotification, loadSavedCards]);

  // 3DS'i kapat
  const handle3DSClose = () => {
    Alert.alert(
      'Dogrulamayi Iptal Et',
      '3D Secure dogrulama islemini iptal etmek istediginize emin misiniz?',
      [
        { text: 'Devam Et', style: 'cancel' },
        {
          text: 'Iptal Et',
          style: 'destructive',
          onPress: () => {
            callbackProcessedRef.current = true;
            setShow3DS(false);
            setThreeDSHtml('');
          },
        },
      ]
    );
  };

  // Karti sil
  const handleDeleteCard = (card: SavedCard) => {
    Alert.alert(
      'Karti Sil',
      `${card.card_alias || card.masked_number} kartini silmek istediginize emin misiniz?`,
      [
        { text: 'Iptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await paymentAPI.deleteCard(card.id);
              showNotification('success', 'Kart silindi');
              await loadSavedCards();
            } catch (error: any) {
              showNotification('error', 'Kart silinemedi');
            }
          },
        },
      ]
    );
  };

  // Varsayilan kart yap
  const handleSetDefault = async (card: SavedCard) => {
    if (card.is_default) return;

    try {
      await paymentAPI.setDefaultCard(card.id);
      showNotification('success', 'Varsayilan kart guncellendi');
      await loadSavedCards();
    } catch (error: any) {
      showNotification('error', 'Varsayilan kart guncellenemedi');
    }
  };

  // Kart takma adini duzenle
  const handleEditAlias = (card: SavedCard) => {
    setEditingCard(card);
    setNewAlias(card.card_alias || '');
    setEditAliasModal(true);
  };

  const handleSaveAlias = async () => {
    if (!editingCard || !newAlias.trim()) return;

    try {
      await paymentAPI.updateCardAlias(editingCard.id, newAlias.trim());
      showNotification('success', 'Kart adi guncellendi');
      setEditAliasModal(false);
      setEditingCard(null);
      await loadSavedCards();
    } catch (error: any) {
      showNotification('error', 'Kart adi guncellenemedi');
    }
  };

  // Kart tipine gore renk ve icon
  const getCardBrandInfo = (cardAssociation: string) => {
    switch (cardAssociation) {
      case 'VISA':
        return { color: '#1A1F71', name: 'Visa' };
      case 'MASTER_CARD':
        return { color: '#EB001B', name: 'Mastercard' };
      case 'AMERICAN_EXPRESS':
        return { color: '#006FCF', name: 'Amex' };
      case 'TROY':
        return { color: '#00529B', name: 'Troy' };
      default:
        return { color: '#666', name: '' };
    }
  };

  // Kayitli kart render
  const renderSavedCard = (card: SavedCard) => {
    const brandInfo = getCardBrandInfo(card.card_association);

    return (
      <Card key={card.id} style={[styles.savedCard, { borderColor: isDarkMode ? '#444' : '#e0e0e0' }, card.is_default && styles.defaultCard]}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <View style={styles.cardInfo}>
              <View style={[styles.cardBrandBadge, { backgroundColor: brandInfo.color + '20' }]}>
                <MaterialCommunityIcons
                  name="credit-card"
                  size={28}
                  color={brandInfo.color}
                />
              </View>
              <View style={styles.cardDetails}>
                <Text style={[styles.cardAlias, { color: appColors.text.primary }]}>{card.card_alias || 'Kartim'}</Text>
                <Text style={[styles.cardNumber, { color: appColors.text.secondary }]}>{card.masked_number}</Text>
                <View style={styles.cardMeta}>
                  <Text style={[styles.cardBank, { color: appColors.text.secondary }]}>{card.bank_name}</Text>
                  {card.card_family && (
                    <Text style={[styles.cardFamily, { color: appColors.text.secondary }]}> - {card.card_family}</Text>
                  )}
                </View>
              </View>
            </View>
            <View style={styles.cardActions}>
              {card.is_default ? (
                <View style={[styles.defaultBadge, { backgroundColor: isDarkMode ? '#0d2e2b' : '#e0f2f1' }]}>
                  <MaterialCommunityIcons name="check-circle" size={16} color="#26a69a" />
                  <Text style={styles.defaultText}>Varsayilan</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.setDefaultButton}
                  onPress={() => handleSetDefault(card)}
                >
                  <Text style={styles.setDefaultText}>Varsayilan Yap</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Kart islemleri */}
          <View style={[styles.cardActionsRow, { borderTopColor: isDarkMode ? '#333' : '#f0f0f0' }]}>
            <TouchableOpacity
              style={styles.cardActionButton}
              onPress={() => handleEditAlias(card)}
            >
              <MaterialCommunityIcons name="pencil" size={18} color={appColors.text.secondary} />
              <Text style={[styles.cardActionText, { color: appColors.text.secondary }]}>Duzenle</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cardActionButton}
              onPress={() => handleDeleteCard(card)}
            >
              <MaterialCommunityIcons name="delete-outline" size={18} color="#f44336" />
              <Text style={[styles.cardActionText, { color: '#f44336' }]}>Sil</Text>
            </TouchableOpacity>
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <View>
      {/* Info Banner */}
      <View style={[styles.infoBanner, { backgroundColor: isDarkMode ? '#0d2e2b' : '#e0f2f1' }]}>
        <MaterialCommunityIcons name="shield-check" size={24} color="#26a69a" />
        <Text style={[styles.infoBannerText, { color: isDarkMode ? '#80cbc4' : '#00695c' }]}>
          Kart bilgileriniz iyzico guvencesiyle sifreli olarak saklanir. Kart dogrulamasi icin 1 TL cekilir ve otomatik iade edilir.
        </Text>
      </View>

      {/* Kayitli Kartlar */}
      {loadingCards ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#26a69a" />
          <Text style={[styles.loadingText, { color: appColors.text.secondary }]}>Kartlar yukleniyor...</Text>
        </View>
      ) : (
        <>
          {savedCards.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: appColors.text.primary }]}>Kayitli Kartlarim</Text>
              {savedCards.map(renderSavedCard)}
            </View>
          )}

          {/* Yeni Kart Ekle Butonu */}
          {!showAddCard && (
            <TouchableOpacity
              style={[styles.addCardButton, { backgroundColor: cardBg }]}
              onPress={() => setShowAddCard(true)}
            >
              <MaterialCommunityIcons name="plus-circle" size={24} color="#26a69a" />
              <Text style={styles.addCardButtonText}>Yeni Kart Ekle</Text>
            </TouchableOpacity>
          )}
        </>
      )}

      {/* Yeni Kart Ekleme Formu */}
      {showAddCard && (
        <Card style={styles.formCard}>
          <Card.Content>
            <View style={styles.formHeader}>
              <Text variant="titleMedium" style={styles.formTitle}>Yeni Kart Ekle</Text>
              {savedCards.length > 0 && (
                <IconButton
                  icon="close"
                  size={20}
                  onPress={() => {
                    setShowAddCard(false);
                    resetForm();
                  }}
                />
              )}
            </View>

            {/* 1 TL dogrulama bilgisi */}
            <View style={[styles.verificationInfo, { backgroundColor: isDarkMode ? '#0d2137' : '#e3f2fd' }]}>
              <MaterialCommunityIcons name="information-outline" size={18} color="#1565c0" />
              <Text style={styles.verificationInfoText}>
                Kart dogrulamasi icin 1 TL cekilecek ve otomatik iade edilecektir. 3D Secure dogrulamasi gereklidir.
              </Text>
            </View>

            <Text style={styles.formSectionTitle}>Kart Bilgileri</Text>

            {/* Card Number */}
            <TextInput
              label="Kart Numarasi *"
              value={cardNumber}
              onChangeText={handleCardNumberChange}
              error={!!errors.cardNumber}
              keyboardType="numeric"
              maxLength={19}
              style={styles.input}
              placeholder="1234 5678 9012 3456"
              left={<TextInput.Icon icon="credit-card" />}
            />
            {errors.cardNumber && (
              <HelperText type="error" visible={true}>
                {errors.cardNumber}
              </HelperText>
            )}

            {/* Cardholder Name */}
            <TextInput
              label="Kart Uzerindeki Isim *"
              value={cardHolderName}
              onChangeText={(text) => {
                setCardHolderName(text.toUpperCase());
                if (errors.cardHolderName) {
                  setErrors({ ...errors, cardHolderName: '' });
                }
              }}
              error={!!errors.cardHolderName}
              style={styles.input}
              placeholder="AHMET YILMAZ"
              autoCapitalize="characters"
              left={<TextInput.Icon icon="account" />}
            />
            {errors.cardHolderName && (
              <HelperText type="error" visible={true}>
                {errors.cardHolderName}
              </HelperText>
            )}

            {/* Son Kullanma Tarihi */}
            <Text style={[styles.fieldLabel, { color: appColors.text.secondary }]}>Son Kullanma Tarihi *</Text>
            <View style={styles.expiryRow}>
              <TouchableOpacity
                style={[styles.pickerButton, { backgroundColor: cardBg, borderColor: isDarkMode ? '#555' : '#ccc' }, errors.expiryMonth ? styles.pickerButtonError : null]}
                onPress={() => setShowMonthPicker(true)}
              >
                <MaterialCommunityIcons name="calendar-month" size={20} color="#26a69a" />
                <Text style={[styles.pickerText, !expiryMonth && styles.pickerPlaceholder]}>
                  {expiryMonth ? months.find(m => m.value === expiryMonth)?.label || expiryMonth : 'Ay'}
                </Text>
                <MaterialCommunityIcons name="chevron-down" size={20} color="#999" />
              </TouchableOpacity>

              <Text style={styles.dateSeparator}>/</Text>

              <TouchableOpacity
                style={[styles.pickerButton, { backgroundColor: cardBg, borderColor: isDarkMode ? '#555' : '#ccc' }, errors.expiryYear ? styles.pickerButtonError : null]}
                onPress={() => setShowYearPicker(true)}
              >
                <MaterialCommunityIcons name="calendar" size={20} color="#26a69a" />
                <Text style={[styles.pickerText, !expiryYear && styles.pickerPlaceholder]}>
                  {expiryYear ? '20' + expiryYear : 'Yil'}
                </Text>
                <MaterialCommunityIcons name="chevron-down" size={20} color="#999" />
              </TouchableOpacity>
            </View>
            {(errors.expiryMonth || errors.expiryYear) && (
              <HelperText type="error" visible={true}>
                {errors.expiryMonth || errors.expiryYear}
              </HelperText>
            )}

            {/* CVC */}
            <TextInput
              label="CVC / CVV *"
              value={cvc}
              onChangeText={(text) => {
                setCvc(text.replace(/\D/g, ''));
                if (errors.cvc) {
                  setErrors({ ...errors, cvc: '' });
                }
              }}
              error={!!errors.cvc}
              keyboardType="numeric"
              maxLength={4}
              placeholder="Kartinizin arkasindaki 3 haneli kod"
              secureTextEntry
              style={styles.input}
              left={<TextInput.Icon icon="lock" />}
            />
            {errors.cvc && (
              <HelperText type="error" visible={true}>
                {errors.cvc}
              </HelperText>
            )}

            {/* Card Alias */}
            <TextInput
              label="Kart Takma Adi (Opsiyonel)"
              value={cardAlias}
              onChangeText={setCardAlias}
              style={styles.input}
              placeholder="Is Bankasi Kartim"
              left={<TextInput.Icon icon="tag" />}
            />

            <Button
              mode="contained"
              onPress={handleSave}
              loading={saving}
              disabled={saving}
              style={styles.saveButton}
              icon="shield-check"
            >
              {saving ? 'Dogrulaniyor...' : 'Karti Dogrula ve Kaydet'}
            </Button>
          </Card.Content>
        </Card>
      )}

      {/* iyzico Logo */}
      <View style={styles.iyzicoSection}>
        <Text style={styles.securedBy}>Guvenli Odeme:</Text>
        <View style={styles.iyzicoLogo}>
          <MaterialCommunityIcons name="shield-lock" size={20} color="#1a73e8" />
          <Text style={styles.iyzicoText}>iyzico</Text>
        </View>
      </View>

      {/* 3DS WebView Modal - React Native Modal (tam ekran) */}
      <RNModal
        visible={show3DS}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={handle3DSClose}
      >
        <View style={styles.threeDSContainer}>
          {/* Header */}
          <View style={[styles.threeDSHeader, { backgroundColor: cardBg }]}>
            <TouchableOpacity onPress={handle3DSClose} style={styles.threeDSCloseButton}>
              <MaterialCommunityIcons name="close" size={24} color={appColors.text.primary} />
            </TouchableOpacity>
            <Text style={[styles.threeDSTitle, { color: appColors.text.primary }]}>3D Secure Dogrulama</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* WebView */}
          {threeDSHtml ? (
            <WebView
              source={{ html: threeDSHtml }}
              style={styles.webView}
              onNavigationStateChange={handleNavigationStateChange}
              onLoadStart={() => setWebViewLoading(true)}
              onLoadEnd={() => setWebViewLoading(false)}
              onError={() => {
                setWebViewLoading(false);
                showNotification('error', '3D Secure sayfasi yuklenemedi');
              }}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={true}
              scalesPageToFit={true}
              mixedContentMode="compatibility"
              originWhitelist={['*']}
              allowsBackForwardNavigationGestures={false}
              setSupportMultipleWindows={false}
              renderLoading={() => (
                <View style={styles.webViewLoadingOverlay}>
                  <ActivityIndicator size="large" color="#26a69a" />
                  <Text style={[styles.webViewLoadingText, { color: appColors.text.secondary }]}>3D Secure yukleniyor...</Text>
                </View>
              )}
            />
          ) : (
            <View style={styles.webViewLoadingOverlay}>
              <ActivityIndicator size="large" color="#26a69a" />
              <Text style={[styles.webViewLoadingText, { color: appColors.text.secondary }]}>Yukleniyor...</Text>
            </View>
          )}
        </View>
      </RNModal>

      {/* Kart Takma Adi Duzenleme Modal */}
      <Portal>
        <Modal
          visible={editAliasModal}
          onDismiss={() => {
            setEditAliasModal(false);
            setEditingCard(null);
          }}
          contentContainerStyle={[styles.modalContainer, { backgroundColor: cardBg }]}
        >
          <Text style={styles.modalTitle}>Kart Adini Duzenle</Text>
          <TextInput
            label="Kart Takma Adi"
            value={newAlias}
            onChangeText={setNewAlias}
            style={styles.modalInput}
            placeholder="Is Bankasi Kartim"
          />
          <View style={styles.modalActions}>
            <Button
              mode="outlined"
              onPress={() => {
                setEditAliasModal(false);
                setEditingCard(null);
              }}
              style={styles.modalButton}
            >
              Iptal
            </Button>
            <Button
              mode="contained"
              onPress={handleSaveAlias}
              style={styles.modalButton}
            >
              Kaydet
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* Ay Secim Modal */}
      <Portal>
        <Modal
          visible={showMonthPicker}
          onDismiss={() => setShowMonthPicker(false)}
          contentContainerStyle={[styles.pickerModal, { backgroundColor: cardBg }]}
        >
          <Text style={styles.pickerModalTitle}>Ay Secin</Text>
          <FlatList
            data={months}
            keyExtractor={(item) => item.value}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.pickerItem,
                  expiryMonth === item.value && [styles.pickerItemSelected, { backgroundColor: isDarkMode ? '#0d2e2b' : '#e0f2f1' }],
                ]}
                onPress={() => {
                  setExpiryMonth(item.value);
                  setShowMonthPicker(false);
                  if (errors.expiryMonth) {
                    setErrors({ ...errors, expiryMonth: '' });
                  }
                }}
              >
                <Text style={[
                  styles.pickerItemText, { color: appColors.text.primary },
                  expiryMonth === item.value && styles.pickerItemTextSelected,
                ]}>
                  {item.label}
                </Text>
                {expiryMonth === item.value && (
                  <MaterialCommunityIcons name="check" size={20} color="#26a69a" />
                )}
              </TouchableOpacity>
            )}
            style={styles.pickerList}
          />
        </Modal>
      </Portal>

      {/* Yil Secim Modal */}
      <Portal>
        <Modal
          visible={showYearPicker}
          onDismiss={() => setShowYearPicker(false)}
          contentContainerStyle={[styles.pickerModal, { backgroundColor: cardBg }]}
        >
          <Text style={styles.pickerModalTitle}>Yil Secin</Text>
          <FlatList
            data={years}
            keyExtractor={(item) => item.value}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.pickerItem,
                  expiryYear === item.value && [styles.pickerItemSelected, { backgroundColor: isDarkMode ? '#0d2e2b' : '#e0f2f1' }],
                ]}
                onPress={() => {
                  setExpiryYear(item.value);
                  setShowYearPicker(false);
                  if (errors.expiryYear) {
                    setErrors({ ...errors, expiryYear: '' });
                  }
                }}
              >
                <Text style={[
                  styles.pickerItemText, { color: appColors.text.primary },
                  expiryYear === item.value && styles.pickerItemTextSelected,
                ]}>
                  {item.label}
                </Text>
                {expiryYear === item.value && (
                  <MaterialCommunityIcons name="check" size={20} color="#26a69a" />
                )}
              </TouchableOpacity>
            )}
            style={styles.pickerList}
          />
        </Modal>
      </Portal>
    </View>
  );
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const styles = StyleSheet.create({
  infoBanner: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'flex-start',
    gap: 12,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  verificationInfo: {
    flexDirection: 'row',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'flex-start',
    gap: 8,
  },
  verificationInfoText: {
    flex: 1,
    fontSize: 12,
    color: '#1565c0',
    lineHeight: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  savedCard: {
    marginBottom: 12,
    borderWidth: 1,
  },
  defaultCard: {
    borderColor: '#26a69a',
    borderWidth: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  cardBrandBadge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardDetails: {
    flex: 1,
  },
  cardAlias: {
    fontSize: 16,
    fontWeight: '600',
  },
  cardNumber: {
    fontSize: 14,
    letterSpacing: 1,
    marginTop: 2,
  },
  cardMeta: {
    flexDirection: 'row',
    marginTop: 4,
  },
  cardBank: {
    fontSize: 12,
  },
  cardFamily: {
    fontSize: 12,
  },
  cardActions: {
    alignItems: 'flex-end',
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  defaultText: {
    fontSize: 11,
    color: '#26a69a',
    fontWeight: '600',
  },
  setDefaultButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  setDefaultText: {
    fontSize: 12,
    color: '#26a69a',
  },
  cardActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 16,
  },
  cardActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardActionText: {
    fontSize: 13,
  },
  addCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#26a69a',
    borderStyle: 'dashed',
    marginBottom: 16,
  },
  addCardButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#26a69a',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
  },
  formCard: {
    marginBottom: 20,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  formTitle: {
    fontWeight: '600',
  },
  formSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#26a69a',
    marginBottom: 12,
  },
  input: {
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 4,
  },
  expiryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  pickerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  pickerButtonError: {
    borderColor: '#f44336',
  },
  pickerText: {
    flex: 1,
    fontSize: 15,
  },
  pickerPlaceholder: {
    color: '#999',
  },
  dateSeparator: {
    fontSize: 24,
    color: '#999',
    fontWeight: '300',
  },
  // Picker modal styles
  pickerModal: {
    margin: 24,
    borderRadius: 16,
    maxHeight: SCREEN_HEIGHT * 0.5,
    overflow: 'hidden',
  },
  pickerModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    padding: 16,
    borderBottomWidth: 1,
  },
  pickerList: {
    maxHeight: SCREEN_HEIGHT * 0.4,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pickerItemSelected: {
  },
  pickerItemText: {
    fontSize: 16,
  },
  pickerItemTextSelected: {
    color: '#26a69a',
    fontWeight: '600',
  },
  saveButton: {
    marginTop: 16,
    borderRadius: 8,
    backgroundColor: '#26a69a',
  },
  iyzicoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    paddingVertical: 12,
  },
  securedBy: {
    fontSize: 12,
    color: '#999',
  },
  iyzicoLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iyzicoText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a73e8',
  },
  // 3DS Modal styles
  threeDSModal: {
    flex: 1,
    margin: 0,
  },
  threeDSContainer: {
    flex: 1,
    height: SCREEN_HEIGHT * 0.9,
  },
  threeDSHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  threeDSCloseButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  threeDSTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  webView: {
    flex: 1,
  },
  webViewLoadingOverlay: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  webViewLoadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  // Alias Modal styles
  modalContainer: {
    padding: 20,
    margin: 20,
    borderRadius: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  modalInput: {
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalButton: {
    minWidth: 100,
  },
});
