import React from 'react';
import { View, StyleSheet, Linking, Image, Text, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { FkButton } from '../../components/fk';
import { colors, radius, spacing } from '../../theme/design';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

// Müşteri uygulamasındaki AuthScreen hero gradyanı (açık → derin turkuaz)
const HERO_GRADIENT = [colors.primary[400], colors.primary[500], colors.primary[700]] as const;

const FEATURES = [
  { icon: 'tow-truck', label: 'Çekici' },
  { icon: 'crane', label: 'Vinç' },
  { icon: 'truck-delivery', label: 'Nakliye' },
  { icon: 'car-wrench', label: 'Yol Yardım' },
  { icon: 'bus', label: 'Transfer' },
];

export default function LoginScreen({ navigation }: Props) {
  return (
    <LinearGradient colors={HERO_GRADIENT} style={styles.gradient} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary[400]} />
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {/* Logo, başlık, servisler */}
        <View style={styles.header}>
          <View style={styles.logoCoin}>
            <Image source={require('../../../assets/yolyardimlogo.png')} style={styles.logoImage} resizeMode="cover" />
          </View>
          <Text style={styles.title}>Yol SepetiGO</Text>
          <Text style={styles.subtitle}>Sürücü ve hizmet sağlayıcı uygulaması</Text>
          <View style={styles.features}>
            {FEATURES.map((f) => (
              <View key={f.label} style={styles.featureChip}>
                <MaterialCommunityIcons name={f.icon} size={16} color={colors.white} />
                <Text style={styles.featureText}>{f.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Aksiyonlar */}
        <View style={styles.buttons}>
          <FkButton
            size="lg"
            fullWidth
            onPress={() => navigation.navigate('PhoneAuth')}
            style={styles.primaryButton}
            textStyle={styles.primaryButtonText}
          >
            Giriş Yap
          </FkButton>
          <FkButton
            variant="secondary"
            size="lg"
            fullWidth
            onPress={() => navigation.navigate('PhoneNumber')}
            style={styles.ghostButton}
            textStyle={styles.ghostButtonText}
          >
            Kayıt Ol
          </FkButton>
          <TouchableOpacity
            onPress={() => Linking.openURL('https://blog.yolsepetigo.com/nasil-kullanilir')}
            style={styles.howLink}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="help-circle-outline" size={16} color="rgba(255,255,255,0.85)" />
            <Text style={styles.howText}>Nasıl Çalışır?</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  // Logo dairesel "madeni para" (müşteri uygulamasıyla aynı)
  logoCoin: {
    width: 132,
    height: 132,
    borderRadius: 66,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.55)',
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 0.3,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.88)',
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  features: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  featureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  featureText: {
    fontSize: 13,
    color: colors.white,
    fontWeight: '600',
  },
  buttons: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.sm + 4,
  },
  // Ana aksiyon: beyaz dolu, turkuaz yazı
  primaryButton: {
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryButtonText: {
    color: colors.primary[600],
    fontWeight: '700',
  },
  // İkincil aksiyon: şeffaf, beyaz çerçeve
  ghostButton: {
    borderColor: 'rgba(255,255,255,0.85)',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  ghostButtonText: {
    color: colors.white,
    fontWeight: '600',
  },
  howLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
  },
  howText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
});
