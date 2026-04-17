import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Button, Card, Text, useTheme, ProgressBar, IconButton, Checkbox } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import { useRegistrationDataStore } from '../../store/useRegistrationDataStore';
import authAPI from '../../api/auth';

type Props = NativeStackScreenProps<RootStackParamList, 'ServiceTypeSelection'>;

type ServiceType = 'towTruck' | 'crane' | 'transfer';

export default function ServiceTypeSelectionScreen({ navigation }: Props) {
  const theme = useTheme();
  const { setSelectedServiceTypes } = useRegistrationDataStore();
  const [selectedServices, setSelectedServices] = useState<ServiceType[]>(['towTruck']);
  const [loading, setLoading] = useState(false);

  const toggleService = (service: ServiceType) => {
    setSelectedServices(prev => {
      if (prev.includes(service)) {
        // En az bir seçim olmalı
        if (prev.length === 1) {
          Alert.alert('Uyarı', 'En az bir hizmet türü seçmelisiniz');
          return prev;
        }
        return prev.filter(s => s !== service);
      } else {
        return [...prev, service];
      }
    });
  };

  const handleContinue = async () => {
    if (selectedServices.length === 0) {
      Alert.alert('Uyarı', 'Lütfen en az bir hizmet türü seçin');
      return;
    }

    try {
      setLoading(true);

      // Backend'e PATCH ile user_type gönder
      await authAPI.updateUserType(selectedServices);

      // Store'a kaydet
      setSelectedServiceTypes(selectedServices);

      // Navigate to personal info
      navigation.navigate('PersonalInfoNew');
    } catch (error) {
      console.error('Service type update error:', error);
      Alert.alert('Hata', 'Hizmet türü kaydedilemedi. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const serviceOptions = [
    {
      id: 'towTruck' as ServiceType,
      title: 'Çekici Hizmeti',
      description: 'Araç çekme ve kurtarma hizmetleri',
      features: [
        'Araç çekme ve taşıma',
        'Yol kenarında arıza desteği',
        'Oto galeri taşımaları',
        'Kaza sonrası araç kurtarma'
      ],
      icon: '🚛',
    },
    {
      id: 'crane' as ServiceType,
      title: 'Vinç Hizmeti',
      description: 'Yüksek yerlerden kaldırma ve taşıma',
      features: [
        'Yüksek katlarda eşya taşıma',
        'İnşaat malzemesi kaldırma',
        'Ağır eşya yerleştirme',
        'Endüstriyel kaldırma işleri'
      ],
      icon: '🏗️',
    },
    {
      id: 'transfer' as ServiceType,
      title: 'Transfer Hizmeti',
      description: 'VIP ve servis araçları ile transfer hizmeti',
      features: [
        'VIP araç transferi',
        'Servis araçları ile toplu taşıma',
        'Havaalanı transferi',
        'Organizasyon transferi'
      ],
      icon: 'transfer',
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        />
        <ProgressBar
          progress={0.3}
          style={styles.progressBar}
          color={theme.colors.primary}
        />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.titleContainer}>
          <Text variant="headlineMedium" style={styles.title}>
            Hizmet Türünüz
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Hangi hizmetleri sağlayacaksınız? (Birden fazla seçebilirsiniz)
          </Text>
        </View>

        <View style={styles.optionsContainer}>
          {serviceOptions.map((option) => (
            <Card
              key={option.id}
              style={[
                styles.optionCard,
                selectedServices.includes(option.id) && {
                  borderColor: theme.colors.primary,
                  borderWidth: 2,
                  backgroundColor: theme.colors.primaryContainer,
                }
              ]}
              onPress={() => toggleService(option.id)}
            >
              <Card.Content style={styles.optionContent}>
                <View style={styles.optionHeader}>
                  <View style={styles.optionTitleContainer}>
                    {option.icon === 'transfer' ? (
                      <View style={styles.transferIconRow}>
                        <MaterialCommunityIcons name="bus-side" size={28} color="#5C6BC0" />
                        <MaterialCommunityIcons name="van-passenger" size={28} color="#FFB300" style={{ marginLeft: 10 }} />
                      </View>
                    ) : (
                      <Text style={styles.optionIcon}>{option.icon}</Text>
                    )}
                    <View style={styles.optionTextContainer}>
                      <Text variant="titleLarge" style={styles.optionTitle}>
                        {option.title}
                      </Text>
                      <Text variant="bodyMedium" style={styles.optionDescription}>
                        {option.description}
                      </Text>
                    </View>
                  </View>
                  <Checkbox
                    status={selectedServices.includes(option.id) ? 'checked' : 'unchecked'}
                    onPress={() => toggleService(option.id)}
                  />
                </View>

                <View style={styles.featuresContainer}>
                  {option.features.map((feature, index) => (
                    <View key={index} style={styles.featureItem}>
                      <Text style={styles.featureBullet}>•</Text>
                      <Text variant="bodySmall" style={styles.featureText}>
                        {feature}
                      </Text>
                    </View>
                  ))}
                </View>
              </Card.Content>
            </Card>
          ))}
        </View>

        <Card style={styles.infoCard}>
          <Card.Content style={styles.infoContent}>
            <Text variant="titleMedium" style={styles.infoTitle}>
              💡 Bilgi
            </Text>
            <Text variant="bodyMedium" style={styles.infoText}>
              İstediğiniz zaman farklı hizmet türleri ekleyebilirsiniz.
              Aynı hesapla hem çekici hem vinç hizmeti verebilirsiniz.
            </Text>
          </Card.Content>
        </Card>

        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={handleContinue}
            loading={loading}
            disabled={loading || selectedServices.length === 0}
            style={styles.continueButton}
            contentStyle={styles.buttonContent}
          >
            Devam Et
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: 'white',
    elevation: 2,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  titleContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.7,
  },
  optionsContainer: {
    gap: 16,
    marginBottom: 20,
  },
  optionCard: {
    borderRadius: 16,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  optionContent: {
    padding: 20,
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  optionTitleContainer: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'flex-start',
  },
  optionIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  transferIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  optionDescription: {
    opacity: 0.7,
  },
  featuresContainer: {
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureBullet: {
    marginRight: 8,
    color: '#666',
    fontSize: 16,
  },
  featureText: {
    flex: 1,
    opacity: 0.8,
  },
  infoCard: {
    borderRadius: 12,
    backgroundColor: '#e3f2fd',
    elevation: 1,
    marginBottom: 24,
  },
  infoContent: {
    padding: 16,
  },
  infoTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#26a69a',
  },
  infoText: {
    color: '#26a69a',
    lineHeight: 20,
  },
  buttonContainer: {
    paddingBottom: 20,
  },
  continueButton: {
    borderRadius: 12,
  },
  buttonContent: {
    paddingVertical: 8,
  },
});