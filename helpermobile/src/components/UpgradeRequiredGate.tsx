/**
 * UpgradeRequiredGate
 *
 * Backend `426 Upgrade Required` döndürdüğünde veya splash'taki proactive
 * versiyon kontrolünde min versiyondan düşükse açılır. Kapanmaz, geri tuşu
 * çalışmaz; kullanıcı yalnızca "Uygulamayı Güncelle" butonu ile mağazaya
 * yönlendirilir. Mağazayı açtıktan sonra dahi uygulamada kalırsa modal
 * görünmeye devam eder — yeni sürüm yüklenip uygulama yeniden açılana kadar.
 *
 * App.tsx en üstte mount edilir; tüm akışları override eder.
 */
import React from 'react';
import { View, StyleSheet, Modal, Linking, Alert, BackHandler } from 'react-native';
import { Text, Button } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useUpgradeStore } from '../store/useUpgradeStore';

export default function UpgradeRequiredGate() {
  const { isUpgradeRequired, info } = useUpgradeStore();

  // Gate aktifken Android geri tuşunu sessizce yut (uygulamadan çıkışı engelleme amacında değil,
  // ama modal'dan herhangi bir şekilde kaçışı önlemek için).
  React.useEffect(() => {
    if (!isUpgradeRequired) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => subscription.remove();
  }, [isUpgradeRequired]);

  if (!isUpgradeRequired || !info) {
    return null;
  }

  const handleOpenStore = async () => {
    if (!info.updateUrl) {
      Alert.alert('Hata', 'Güncelleme bağlantısı bulunamadı. Lütfen mağazadan manuel kontrol edin.');
      return;
    }
    try {
      const canOpen = await Linking.canOpenURL(info.updateUrl);
      if (!canOpen) {
        Alert.alert(
          'Mağaza Açılamıyor',
          'Cihazda uygulama mağazası bulunamadı. Lütfen App Store veya Play Store üzerinden manuel olarak güncelleyin.'
        );
        return;
      }
      await Linking.openURL(info.updateUrl);
    } catch {
      Alert.alert('Hata', 'Güncelleme sayfası açılamadı. Lütfen mağazadan manuel kontrol edin.');
    }
  };

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => { /* kapanmaz */ }}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="cellphone-arrow-down" size={48} color="#26a69a" />
          </View>

          <Text variant="titleLarge" style={styles.title}>
            Güncelleme Gerekli
          </Text>

          <Text variant="bodyMedium" style={styles.message}>
            {info.messageTr || 'Devam edebilmek için uygulamayı güncellemeniz gerekiyor.'}
          </Text>

          {(info.currentVersion || info.minVersion) && (
            <View style={styles.versionBox}>
              {!!info.currentVersion && (
                <Text variant="bodySmall" style={styles.versionText}>
                  Mevcut sürüm: <Text style={styles.versionValue}>{info.currentVersion}</Text>
                </Text>
              )}
              {!!info.minVersion && (
                <Text variant="bodySmall" style={styles.versionText}>
                  Gereken sürüm: <Text style={styles.versionValue}>{info.minVersion}</Text>
                </Text>
              )}
            </View>
          )}

          <Button
            mode="contained"
            onPress={handleOpenStore}
            style={styles.button}
            contentStyle={styles.buttonContent}
            icon="download"
            buttonColor="#26a69a"
          >
            Uygulamayı Güncelle
          </Button>

          <Text variant="bodySmall" style={styles.footnote}>
            Bu ekrandan çıkış yapılamaz. Yeni sürümü yükledikten sonra uygulamayı yeniden açın.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e0f2f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    color: '#555',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  versionBox: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    width: '100%',
    marginBottom: 20,
  },
  versionText: {
    color: '#666',
    textAlign: 'center',
    marginVertical: 2,
  },
  versionValue: {
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  button: {
    width: '100%',
    borderRadius: 8,
    marginBottom: 12,
  },
  buttonContent: {
    paddingVertical: 6,
  },
  footnote: {
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 4,
  },
});
