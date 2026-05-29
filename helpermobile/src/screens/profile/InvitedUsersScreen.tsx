import React, { useCallback, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, Card, Chip, Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation';
import { referralAPI } from '../../api';
import { InvitedUser, InvitedUsersResponse } from '../../api/types';
import AppBar from '../../components/common/AppBar';
import { FkButton } from '../../components/fk';
import { useAppTheme } from '../../hooks/useAppTheme';
import { formatMoney, formatDate } from '../earnings/constants';
import { logger } from '../../utils/logger';

type Props = NativeStackScreenProps<RootStackParamList, 'InvitedUsers'>;

const maskPhone = (raw: string): string => {
  if (!raw) return '';
  // +905551234567 → +90 555 *** ** 67
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 7) return raw;
  const cc = raw.startsWith('+') ? `+${digits.slice(0, digits.length - 10)}` : '';
  const local = digits.slice(-10);
  return `${cc} ${local.slice(0, 3)} *** ** ${local.slice(-2)}`.trim();
};

export default function InvitedUsersScreen({ navigation }: Props) {
  const { screenBg, cardBg, appColors } = useAppTheme();
  const [data, setData] = useState<InvitedUsersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (showSpinner: boolean) => {
    try {
      if (showSpinner) setLoading(true);
      const response = await referralAPI.getInvitedUsers();
      setData(response);
    } catch (error) {
      logger.error('orders', 'InvitedUsers.load failure');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(true);
    }, [load]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    load(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: screenBg }]} edges={['bottom']}>
        <AppBar title="Davet Ettiklerim" />
        <View style={styles.loadingWrapper}>
          <ActivityIndicator size="large" color={appColors.primary[400]} />
        </View>
      </SafeAreaView>
    );
  }

  const invitedCount = data?.invited_count ?? 0;
  const recentlyActiveCount = data?.recently_active_count ?? 0;
  const results = data?.results ?? [];
  const totals = data?.totals;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: screenBg }]} edges={['bottom']}>
      <AppBar title="Davet Ettiklerim" />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {invitedCount === 0 ? (
          <Card mode="outlined" style={[styles.card, { backgroundColor: cardBg }]}>
            <Card.Content style={styles.emptyContent}>
              <MaterialCommunityIcons
                name="account-multiple-plus-outline"
                size={48}
                color={appColors.text.secondary}
              />
              <Text variant="titleMedium" style={[styles.emptyTitle, { color: appColors.text.primary }]}>
                Henüz kimseyi davet etmedin
              </Text>
              <Text variant="bodyMedium" style={[styles.emptyText, { color: appColors.text.secondary }]}>
                Referans kodunu paylaş, davet ettiğin sürücülerin işlerinden pay kazan.
              </Text>
              <FkButton
                variant="primary"
                icon="gift-outline"
                onPress={() => navigation.navigate('ReferralCode')}
                style={{ marginTop: 12 }}
              >
                Referans Kodumu Gör
              </FkButton>
            </Card.Content>
          </Card>
        ) : (
          <>
            {/* Totals Card */}
            {totals ? (
              <Card mode="outlined" style={[styles.card, { backgroundColor: cardBg }]}>
                <Card.Content>
                  <View style={styles.totalRow}>
                    <MaterialCommunityIcons name="cash-multiple" size={22} color={appColors.primary[400]} />
                    <View style={styles.totalTextWrapper}>
                      <Text variant="bodySmall" style={{ color: appColors.text.secondary }}>
                        Toplam kazandırdı
                      </Text>
                      <Text variant="titleLarge" style={{ color: appColors.text.primary, fontWeight: 'bold' }}>
                        {formatMoney(parseFloat(totals.lifetime) || 0)} ₺
                      </Text>
                    </View>
                  </View>
                  <View style={styles.totalsBreakdown}>
                    <View style={styles.breakdownCol}>
                      <Text variant="bodySmall" style={{ color: appColors.text.secondary }}>
                        Bekleyen
                      </Text>
                      <Text variant="titleMedium" style={{ color: '#ff9800', fontWeight: '600' }}>
                        {formatMoney(parseFloat(totals.pending) || 0)} ₺
                      </Text>
                    </View>
                    <View style={styles.breakdownCol}>
                      <Text variant="bodySmall" style={{ color: appColors.text.secondary }}>
                        Ödenen
                      </Text>
                      <Text variant="titleMedium" style={{ color: '#26a69a', fontWeight: '600' }}>
                        {formatMoney(parseFloat(totals.paid) || 0)} ₺
                      </Text>
                    </View>
                  </View>
                </Card.Content>
              </Card>
            ) : null}

            {/* Stats Line */}
            <Card mode="outlined" style={[styles.card, { backgroundColor: cardBg }]}>
              <Card.Content style={styles.statsCardContent}>
                <Text variant="bodyMedium" style={{ color: appColors.text.primary }}>
                  {invitedCount} sürücü davet ettin
                </Text>
                <Text variant="bodySmall" style={{ color: appColors.text.secondary }}>
                  {recentlyActiveCount} tanesi son 30 günde aktif
                </Text>
              </Card.Content>
            </Card>

            {/* Invited User List */}
            {results.map((u) => (
              <InvitedUserCard key={u.id} user={u} cardBg={cardBg} appColors={appColors} />
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function InvitedUserCard({
  user,
  cardBg,
  appColors,
}: {
  user: InvitedUser;
  cardBg: string;
  appColors: any;
}) {
  const fullName = `${user.first_name} ${user.last_name}`.trim() || 'Sürücü';
  const totalEarned =
    (parseFloat(user.earnings_from_this_user.pending_total) || 0) +
    (parseFloat(user.earnings_from_this_user.paid_total) || 0);

  return (
    <Card mode="outlined" style={[styles.card, { backgroundColor: cardBg }]}>
      <Card.Content style={styles.userCardContent}>
        <View style={styles.userHeader}>
          <MaterialCommunityIcons name="account-circle" size={32} color={appColors.primary[400]} />
          <View style={styles.userNameWrapper}>
            <Text variant="titleMedium" style={{ color: appColors.text.primary, fontWeight: '600' }}>
              {fullName}
            </Text>
            <Text variant="bodySmall" style={{ color: appColors.text.secondary }}>
              {maskPhone(user.phone_number)}
            </Text>
          </View>
          <Chip
            compact
            mode="flat"
            style={{
              backgroundColor: user.is_recently_active ? '#e0f2f1' : '#f0f0f0',
            }}
            textStyle={{
              color: user.is_recently_active ? '#26a69a' : '#9e9e9e',
              fontSize: 11,
            }}
          >
            {user.is_recently_active ? 'Aktif' : 'Pasif'}
          </Chip>
        </View>

        <View style={styles.userMetaRow}>
          <Text variant="bodySmall" style={{ color: appColors.text.secondary }}>
            Davet: {formatDate(user.referred_at)}
          </Text>
        </View>

        <View style={styles.userStatsRow}>
          <View style={styles.userStatCol}>
            <Text variant="bodySmall" style={{ color: appColors.text.secondary }}>
              Son 30 gün
            </Text>
            <Text variant="titleSmall" style={{ color: appColors.text.primary, fontWeight: '600' }}>
              {user.completed_recent_30d} iş
            </Text>
          </View>
          <View style={styles.userStatCol}>
            <Text variant="bodySmall" style={{ color: appColors.text.secondary }}>
              Toplam
            </Text>
            <Text variant="titleSmall" style={{ color: appColors.text.primary, fontWeight: '600' }}>
              {user.total_completed} iş
            </Text>
          </View>
          <View style={styles.userStatCol}>
            <Text variant="bodySmall" style={{ color: appColors.text.secondary }}>
              Kazandırdığı
            </Text>
            <Text variant="titleSmall" style={{ color: '#26a69a', fontWeight: '600' }}>
              {formatMoney(totalEarned)} ₺
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 12 },
  loadingWrapper: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { borderRadius: 12 },

  emptyContent: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyTitle: { fontWeight: '600' },
  emptyText: { textAlign: 'center', paddingHorizontal: 16 },

  totalRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  totalTextWrapper: { flex: 1 },
  totalsBreakdown: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e0e0e0',
  },
  breakdownCol: { flex: 1 },

  statsCardContent: { gap: 4 },

  userCardContent: { gap: 10 },
  userHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  userNameWrapper: { flex: 1 },
  userMetaRow: { flexDirection: 'row' },
  userStatsRow: {
    flexDirection: 'row',
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e0e0e0',
  },
  userStatCol: { flex: 1, alignItems: 'center' },
});
