/**
 * 3DS WebView Component
 *
 * iyzico 3DS doğrulama sayfasını gösteren WebView componenti.
 * Backend'den gelen HTML içeriğini render eder ve callback URL'i dinler.
 */
import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Text } from 'react-native-paper';
import { WebView, WebViewNavigation } from 'react-native-webview';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getReadablePaymentError } from './commission/paymentUtils';

const { width } = Dimensions.get('window');

interface ThreeDSWebViewProps {
  visible: boolean;
  htmlContent: string;
  onClose: () => void;
  onPaymentSuccess: () => void;
  onPaymentFailed: (errorMessage?: string) => void;
  title?: string;
}

export default function ThreeDSWebView({
  visible,
  htmlContent,
  onClose,
  onPaymentSuccess,
  onPaymentFailed,
  title = '3D Secure Doğrulama',
}: ThreeDSWebViewProps) {
  const [loading, setLoading] = useState(true);
  const webViewRef = useRef<WebView>(null);

  // URL değişikliklerini dinle
  const handleNavigationStateChange = (navState: WebViewNavigation) => {
    const { url } = navState;

    if (url.includes('payment=success')) {
      onPaymentSuccess();
      return;
    }

    if (url.includes('payment=failed')) {
      // Error message'ı URL'den çıkar ve kullanıcı dostu hale getir
      const errorMatch = url.match(/error=([^&]+)/);
      const rawError = errorMatch ? decodeURIComponent(errorMatch[1]) : 'Ödeme başarısız oldu';
      const errorMessage = getReadablePaymentError(rawError);
      onPaymentFailed(errorMessage);
      return;
    }
  };

  // Sayfa yüklendiğinde
  const handleLoadEnd = () => {
    setLoading(false);
  };

  // Sayfa yüklenmeye başladığında
  const handleLoadStart = () => {
    setLoading(true);
  };

  // WebView hatası
  const handleError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('❌ 3DS WebView hatası:', nativeEvent);
    onPaymentFailed('Sayfa yüklenirken hata oluştu');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <MaterialCommunityIcons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <MaterialCommunityIcons name="shield-lock" size={20} color="#1a73e8" />
            <Text style={styles.title}>{title}</Text>
          </View>
          <View style={styles.placeholder} />
        </View>

        {/* Bilgilendirme */}
        <View style={styles.infoBar}>
          <MaterialCommunityIcons name="information" size={16} color="#666" />
          <Text style={styles.infoText}>
            Bankanız tarafından doğrulama yapılıyor
          </Text>
        </View>

        {/* WebView */}
        <View style={styles.webViewContainer}>
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#1a73e8" />
              <Text style={styles.loadingText}>Yükleniyor...</Text>
            </View>
          )}

          <WebView
            ref={webViewRef}
            source={{ html: htmlContent }}
            style={styles.webView}
            onNavigationStateChange={handleNavigationStateChange}
            onLoadStart={handleLoadStart}
            onLoadEnd={handleLoadEnd}
            onError={handleError}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            scalesPageToFit={true}
            mixedContentMode="compatibility"
            allowsInlineMediaPlayback={true}
            originWhitelist={['*']}
            // iOS özel ayarlar
            allowsBackForwardNavigationGestures={false}
            // Android özel ayarlar
            setSupportMultipleWindows={false}
          />
        </View>

        {/* Alt bilgi */}
        <View style={styles.footer}>
          <View style={styles.securityBadge}>
            <MaterialCommunityIcons name="shield-check" size={16} color="#2E7D32" />
            <Text style={styles.securityText}>SSL ile korunuyor</Text>
          </View>
          <View style={styles.iyzicoLogo}>
            <Text style={styles.poweredBy}>powered by</Text>
            <Text style={styles.iyzicoText}>iyzico</Text>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  infoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
  },
  infoText: {
    fontSize: 12,
    color: '#666',
  },
  webViewContainer: {
    flex: 1,
    position: 'relative',
  },
  webView: {
    flex: 1,
    width: width,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#f9f9f9',
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  securityText: {
    fontSize: 12,
    color: '#2E7D32',
  },
  iyzicoLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  poweredBy: {
    fontSize: 10,
    color: '#999',
  },
  iyzicoText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a73e8',
  },
});
