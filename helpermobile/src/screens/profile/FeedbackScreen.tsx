import React from 'react';
import { View, TouchableOpacity, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useResponsive } from '../../hooks/useResponsive';
import { useAppTheme } from '../../hooks/useAppTheme';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Feedback'>;

export default function FeedbackScreen({ navigation }: Props) {
  const { spacing, moderateScale } = useResponsive();
  const { screenBg, cardBg, appColors } = useAppTheme();

  const openWhatsApp = () => {
    const phone = '905550103434';
    const message = 'Merhaba, bir öneri/şikayetim var.';
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

    Linking.openURL(url).catch(() => {
      Alert.alert('Hata', 'WhatsApp açılamadı. Lütfen WhatsApp uygulamasının yüklü olduğundan emin olun.');
    });
  };

  const openEmail = () => {
    const email = 'info@yolsepetigo.com';
    const subject = 'Öneri / Şikayet';
    const url = `mailto:${email}?subject=${encodeURIComponent(subject)}`;

    Linking.openURL(url).catch(() => {
      Alert.alert('Hata', 'Mail uygulaması açılamadı.');
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: screenBg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: spacing.md, backgroundColor: cardBg, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: spacing.md }}>
          <MaterialCommunityIcons name="arrow-left" size={moderateScale(24)} color={appColors.text.primary} />
        </TouchableOpacity>
        <Text variant="titleLarge" style={{ fontWeight: 'bold' }}>Şikayet ve Öneri</Text>
      </View>

      <View style={{ flex: 1, padding: spacing.md }}>
        <Card mode="outlined" style={{ backgroundColor: cardBg, marginBottom: spacing.lg }}>
          <Card.Content style={{ alignItems: 'center', paddingVertical: spacing.lg }}>
            <MaterialCommunityIcons name="message-text-outline" size={moderateScale(48)} color={appColors.primary[400]} style={{ marginBottom: spacing.md }} />
            <Text variant="titleMedium" style={{ fontWeight: 'bold', textAlign: 'center', marginBottom: spacing.sm }}>
              Görüşleriniz Bizim İçin Değerli
            </Text>
            <Text variant="bodyMedium" style={{ color: appColors.text.secondary, textAlign: 'center', lineHeight: 22 }}>
              Öneri ve şikayetlerinizi aşağıdaki kanallardan bizimle paylaşabilirsiniz. Size en kısa sürede dönüş yapacağız.
            </Text>
          </Card.Content>
        </Card>

        <TouchableOpacity onPress={openWhatsApp} style={{ marginBottom: spacing.md }}>
          <Card mode="outlined" style={{ backgroundColor: cardBg, borderColor: '#25D366', borderWidth: 1.5 }}>
            <Card.Content style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md }}>
              <View style={{
                width: moderateScale(48),
                height: moderateScale(48),
                borderRadius: moderateScale(24),
                backgroundColor: '#25D366',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: spacing.md,
              }}>
                <MaterialCommunityIcons name="whatsapp" size={moderateScale(28)} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="titleMedium" style={{ fontWeight: '600', color: '#25D366' }}>WhatsApp ile Yazın</Text>
                <Text variant="bodySmall" style={{ color: appColors.text.secondary, marginTop: 2 }}>+90 555 010 3434</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={moderateScale(20)} color="#25D366" />
            </Card.Content>
          </Card>
        </TouchableOpacity>

        <TouchableOpacity onPress={openEmail} style={{ marginBottom: spacing.md }}>
          <Card mode="outlined" style={{ backgroundColor: cardBg, borderColor: appColors.primary[400], borderWidth: 1.5 }}>
            <Card.Content style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md }}>
              <View style={{
                width: moderateScale(48),
                height: moderateScale(48),
                borderRadius: moderateScale(24),
                backgroundColor: appColors.primary[400],
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: spacing.md,
              }}>
                <MaterialCommunityIcons name="email-outline" size={moderateScale(28)} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="titleMedium" style={{ fontWeight: '600', color: appColors.primary[400] }}>E-posta Gönderin</Text>
                <Text variant="bodySmall" style={{ color: appColors.text.secondary, marginTop: 2 }}>info@yolsepetigo.com</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={moderateScale(20)} color={appColors.primary[400]} />
            </Card.Content>
          </Card>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
