import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, Linking } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Card, Text } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Responsive size calculations based on screen height
const getResponsiveSizes = (screenHeight: number) => {
  const isSmallScreen = screenHeight < 700;
  const isMediumScreen = screenHeight >= 700 && screenHeight < 800;

  return {
    logoSize: isSmallScreen ? 80 : isMediumScreen ? 90 : 100,
    logoImageSize: isSmallScreen ? 64 : isMediumScreen ? 72 : 80,
    paddingTop: isSmallScreen ? 10 : isMediumScreen ? 20 : 30,
    paddingBottom: isSmallScreen ? 10 : isMediumScreen ? 15 : 20,
    logoMarginBottom: isSmallScreen ? 10 : 16,
    titleMarginBottom: isSmallScreen ? 6 : 8,
    cardMarginBottom: isSmallScreen ? 12 : 20,
    featureBadgePadding: isSmallScreen ? 8 : 12,
    featureIconSize: isSmallScreen ? 20 : 24,
    featureFontSize: isSmallScreen ? 10 : 11,
  };
};

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  // Rotation animation
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const sizes = getResponsiveSizes(SCREEN_HEIGHT);

  useEffect(() => {
    // Continuous rotation animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#26a69a', '#00897b', '#00695c']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          <View style={[styles.content, { paddingTop: sizes.paddingTop, paddingBottom: sizes.paddingBottom }]}>
          {/* Logo Section */}
          <View style={[styles.logoSection, { marginBottom: sizes.logoMarginBottom }]}>
            <Animated.View
              style={[
                {
                  width: sizes.logoSize,
                  height: sizes.logoSize,
                  borderRadius: sizes.logoSize / 2,
                  backgroundColor: '#fff',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: sizes.logoMarginBottom,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 10,
                  overflow: 'hidden',
                  borderWidth: 2,
                  borderColor: 'rgba(255, 255, 255, 0.8)',
                  transform: [{ rotate: spin }],
                },
              ]}
            >
              <Animated.Image
                source={require('../../../assets/yolyardimlogo.png')}
                style={[
                  {
                    width: sizes.logoImageSize,
                    height: sizes.logoImageSize,
                    borderRadius: sizes.logoImageSize / 2,
                    transform: [{ rotate: spin }],
                  },
                ]}
                resizeMode="contain"
              />
            </Animated.View>
            <Text variant="displaySmall" style={[styles.title, { marginBottom: sizes.titleMarginBottom }]}>
              Yol SepetiGO
            </Text>
            <Text variant="titleMedium" style={styles.subtitle}>
              Çekici Vinç Nakliye Yol Yardım{'\n'}Hizmetleri Platformu
            </Text>
          </View>

          {/* Welcome Card */}
          <Card style={[styles.welcomeCard, { marginBottom: sizes.cardMarginBottom }]}>
            <Card.Content>
              <Text variant="headlineMedium" style={styles.welcomeTitle}>
                Hoş Geldiniz
              </Text>
              <Text variant="bodyLarge" style={styles.welcomeSubtitle}>
                Hizmet vermeye başlamak için devam edin
              </Text>

              {/* Action Buttons */}
              <View style={styles.buttonContainer}>
                <Button
                  mode="contained"
                  onPress={() => navigation.navigate('PhoneAuth')}
                  style={styles.primaryButton}
                  contentStyle={styles.buttonContent}
                  buttonColor="#26a69a"
                >
                  Giriş Yap
                </Button>

                <Button
                  mode="outlined"
                  onPress={() => navigation.navigate('PhoneNumber')}
                  style={styles.secondaryButton}
                  contentStyle={styles.buttonContent}
                  textColor="#26a69a"
                >
                  Kayıt Ol
                </Button>

                <Button
                  mode="text"
                  onPress={() => Linking.openURL('https://blog.yolsepetigo.com/nasil-kullanilir')}
                  textColor="#666"
                >
                  Nasıl Çalışır?
                </Button>
              </View>
            </Card.Content>
          </Card>

          {/* Feature Badges */}
          <View style={styles.featuresContainer}>
            <View style={[styles.featureBadge, { padding: sizes.featureBadgePadding }]}>
              <MaterialCommunityIcons name="tow-truck" size={sizes.featureIconSize} color="#fff" />
              <Text style={[styles.featureText, { fontSize: sizes.featureFontSize }]}>Çekici</Text>
            </View>
            <View style={[styles.featureBadge, { padding: sizes.featureBadgePadding }]}>
              <MaterialCommunityIcons name="crane" size={sizes.featureIconSize} color="#fff" />
              <Text style={[styles.featureText, { fontSize: sizes.featureFontSize }]}>Vinç</Text>
            </View>
            <View style={[styles.featureBadge, { padding: sizes.featureBadgePadding }]}>
              <MaterialCommunityIcons name="truck-delivery" size={sizes.featureIconSize} color="#fff" />
              <Text style={[styles.featureText, { fontSize: sizes.featureFontSize }]}>Nakliye</Text>
            </View>
            <View style={[styles.featureBadge, { padding: sizes.featureBadgePadding }]}>
              <MaterialCommunityIcons name="car-wrench" size={sizes.featureIconSize} color="#fff" />
              <Text style={[styles.featureText, { fontSize: sizes.featureFontSize }]}>Yol Yardım</Text>
            </View>
          </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoSection: {
    alignItems: 'center',
  },
  title: {
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    color: '#fff',
    textAlign: 'center',
    opacity: 0.95,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  welcomeCard: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  welcomeTitle: {
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#00695c',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 20,
  },
  buttonContainer: {
    gap: 12,
  },
  primaryButton: {
    borderRadius: 16,
    elevation: 4,
  },
  buttonContent: {
    paddingVertical: 10,
  },
  secondaryButton: {
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#26a69a',
  },
  featuresContainer: {
    width: '100%',
    maxWidth: 500,
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
  },
  featureBadge: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  featureText: {
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
});
