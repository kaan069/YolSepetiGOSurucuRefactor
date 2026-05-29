import React, { useCallback, useState } from 'react';
import {
  Alert,
  Clipboard,
  ScrollView,
  Share,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, Card, Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation';
import { authAPI } from '../../api';
import { User } from '../../api/types';
import AppBar from '../../components/common/AppBar';
import { FkButton } from '../../components/fk';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useFkTokens } from '../../hooks/useFkTokens';
import { logger } from '../../utils/logger';

type Props = NativeStackScreenProps<RootStackParamList, 'ReferralCode'>;

export default function ReferralCodeScreen({ navigation }: Props) {
  const { screenBg, cardBg, appColors } = useAppTheme();
  const { tokens } = useFkTokens();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Her ekrana girildiğinde fresh profili çek — invited_count anlık olsun
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          setLoading(true);
          const response = await authAPI.getProfile();
          if (!cancelled) setUser(response.user as User);
        } catch (error) {
          logger.error('general', 'ReferralCode.getProfile failure');
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const code = user?.referral_code ?? '';
  const invitedCount = user?.invited_count ?? 0;
  const referredByName = user?.referred_by_name ?? null;

  const handleCopy = () => {
    if (!code) return;
    Clipboard.setString(code);
    Alert.alert('Kopyalandı', 'Referans kodu panoya kopyalandı');
  };

  const handleShare = async () => {
    if (!code) return;
    try {
      await Share.share({
        message: `YolSepetiGO sürücü uygulamasına referansım ile kaydol: ${code}`,
      });
    } catch (error) {
      logger.error('general', 'ReferralCode.share failure');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: screenBg }]} edges={['bottom']}>
      <AppBar title="Referans Kodum" />
      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <View style={styles.loadingWrapper}>
            <ActivityIndicator size="large" color={appColors.primary[400]} />
          </View>
        ) : (
          <>
            {/* Kod Kartı */}
            <Card mode="outlined" style={[styles.card, { backgroundColor: cardBg }]}>
              <Card.Content style={styles.codeCardContent}>
                <MaterialCommunityIcons
                  name="gift-outline"
                  size={32}
                  color={appColors.primary[400]}
                />
                <Text variant="titleMedium" style={[styles.cardTitle, { color: appColors.text.primary }]}>
                  Referans Kodum
                </Text>
                <View style={[styles.codeBox, { borderColor: appColors.primary[400] }]}>
                  <Text style={[styles.codeText, { color: appColors.primary[400] }]}>
                    {code || '—'}
                  </Text>
                </View>
                <View style={styles.actionRow}>
                  <FkButton
                    variant="primary"
                    icon="content-copy"
                    onPress={handleCopy}
                    disabled={!code}
                    style={styles.actionButton}
                  >
                    Kopyala
                  </FkButton>
                  <FkButton
                    variant="secondary"
                    icon="share-variant"
                    onPress={handleShare}
                    disabled={!code}
                    style={styles.actionButton}
                  >
                    Paylaş
                  </FkButton>
                </View>
                <Text style={[styles.helperText, { color: appColors.text.secondary }]}>
                  Bu kodu paylaşarak davet ettiğin sürücülerin işlerinden komisyon pay'ı kazan.
                </Text>
              </Card.Content>
            </Card>

            {/* Davet Ettiklerim Linki */}
            <TouchableOpacity onPress={() => navigation.navigate('InvitedUsers')}>
              <Card mode="outlined" style={[styles.card, { backgroundColor: cardBg }]}>
                <Card.Content style={styles.linkCardContent}>
                  <MaterialCommunityIcons
                    name="account-multiple-outline"
                    size={24}
                    color={appColors.primary[400]}
                  />
                  <View style={styles.linkTextWrapper}>
                    <Text variant="titleMedium" style={{ color: appColors.text.primary, fontWeight: '600' }}>
                      Davet Ettiklerim
                    </Text>
                    <Text variant="bodySmall" style={{ color: appColors.text.secondary }}>
                      {invitedCount > 0
                        ? `${invitedCount} sürücü davet ettin — detayları gör`
                        : 'Henüz kimseyi davet etmedin'}
                    </Text>
                  </View>
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={24}
                    color={appColors.text.secondary}
                  />
                </Card.Content>
              </Card>
            </TouchableOpacity>

            {/* Seni Davet Eden */}
            {referredByName ? (
              <Card mode="outlined" style={[styles.card, { backgroundColor: cardBg }]}>
                <Card.Content style={styles.linkCardContent}>
                  <MaterialCommunityIcons
                    name="account-arrow-down-outline"
                    size={24}
                    color={appColors.text.secondary}
                  />
                  <View style={styles.linkTextWrapper}>
                    <Text variant="bodySmall" style={{ color: appColors.text.secondary }}>
                      Seni davet eden
                    </Text>
                    <Text variant="titleMedium" style={{ color: appColors.text.primary, fontWeight: '600' }}>
                      {referredByName}
                    </Text>
                  </View>
                </Card.Content>
              </Card>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 12 },
  loadingWrapper: { paddingVertical: 64, alignItems: 'center' },
  card: { borderRadius: 12 },
  codeCardContent: { alignItems: 'center', paddingVertical: 24, gap: 12 },
  cardTitle: { fontWeight: '600' },
  codeBox: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderWidth: 2,
    borderRadius: 12,
    marginVertical: 8,
  },
  codeText: {
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 4,
  },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  actionButton: { minWidth: 120 },
  helperText: {
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 8,
    lineHeight: 18,
  },
  linkCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    gap: 12,
  },
  linkTextWrapper: { flex: 1 },
});
