// Rapor ve İşlem Geçmişi Ekranı - Reports and Transaction History Screen
// Bu ekran kullanıcının gelir raporu ve işlem geçmişini gösterir
// This screen shows user's income reports and transaction history
import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, ScrollView, View, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Text, Chip, Divider } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import { useAuthStore } from '../../store/authStore';
import { requestsAPI, TowTruckRequestDetail, CraneRequest, PeriodEarningsResponse, EarningsPeriod } from '../../api';
import AppBar from '../../components/common/AppBar';
import { useAppTheme } from '../../hooks/useAppTheme';

type Props = NativeStackScreenProps<RootStackParamList, 'ReportsAndHistory'>;

// Birleşik işlem verisi - Combined transaction data
interface Transaction {
  id: string;
  type: 'tow' | 'crane';
  amount: number;
  customerName: string;
  location: string;
  date: string;
  pickupLocation?: string;
  dropoffLocation?: string;
  distance?: number;
}

export default function ReportsAndHistoryScreen({ navigation }: Props) {
  const { screenBg, cardBg } = useAppTheme();
  const { currentUser } = useAuthStore();
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'year'>('month');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Backend earnings data - Kazanç verileri
  const [totalEarnings, setTotalEarnings] = useState<number>(0);
  const [earningsLoading, setEarningsLoading] = useState(false);
  const [periodEarnings, setPeriodEarnings] = useState<PeriodEarningsResponse | null>(null);
  const [periodLoading, setPeriodLoading] = useState(false);

  // Backend'den toplam kazancı yükle - Load total earnings from backend
  const loadTotalEarnings = useCallback(async () => {
    try {
      setEarningsLoading(true);
      const result = await requestsAPI.getTotalEarnings();
      console.log('💰 Reports: Toplam kazanç API response:', result);
      console.log('💰 Reports: Toplam kazanç değeri:', result.total_earnings);
      setTotalEarnings(parseFloat(result.total_earnings) || 0);
    } catch (error: any) {
      console.error('❌ Toplam kazanç yüklenirken hata:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      setTotalEarnings(0);
    } finally {
      setEarningsLoading(false);
    }
  }, []);

  // Backend'den dönemsel kazancı yükle - Load period earnings from backend
  const loadPeriodEarnings = useCallback(async (range: EarningsPeriod) => {
    try {
      setPeriodLoading(true);
      const data = await requestsAPI.getPeriodEarnings(range);
      console.log('📊 Reports: Dönemsel kazanç API response:', data);
      console.log('📊 Reports: Period:', range);
      setPeriodEarnings(data);
    } catch (error: any) {
      console.error('❌ Dönemsel kazanç yüklenirken hata:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      setPeriodEarnings(null);
    } finally {
      setPeriodLoading(false);
    }
  }, []);

  // Backend'den tamamlanan işleri yükle - Load completed jobs from backend
  const loadCompletedJobs = async () => {
    try {
      setLoading(true);

      // Hem çekici hem vinç completed işlerini çek
      const [towTruckJobs, craneJobs] = await Promise.all([
        requestsAPI.getCompletedTowTruckRequests(),
        requestsAPI.getCompletedCraneRequests(),
      ]);

      console.log('📊 Reports: Çekici işleri:', towTruckJobs.length);
      console.log('📊 Reports: Vinç işleri:', craneJobs.length);

      // Çekici işlerini transaction formatına çevir
      const towTransactions: Transaction[] = towTruckJobs.map((job) => {
        // Request ID'den müşteri bilgilerini çıkar
        const requestId = typeof job.request_id === 'object' ? job.request_id : null;
        const customerName = job.requestOwnerNameSurname || requestId?.requestOwnerNameSurname || job.request_owner_name || 'Bilinmeyen Müşteri';

        // Final price yoksa 0 kullan
        const price = job.final_price || 0;
        console.log(`💰 Çekici iş #${job.id}: final_price=${job.final_price}, kullanılan=${price}`);

        return {
          id: job.id.toString(),
          type: 'tow' as const,
          amount: price,
          customerName,
          location: `${job.pickup_address} → ${job.dropoff_address}`,
          pickupLocation: job.pickup_address,
          dropoffLocation: job.dropoff_address,
          distance: job.estimated_km,
          date: job.completed_at || job.updated_at || job.created_at,
        };
      });

      // Vinç işlerini transaction formatına çevir
      const craneTransactions: Transaction[] = craneJobs.map((job) => {
        // Request ID'den müşteri bilgilerini çıkar
        const requestId = typeof job.request_id === 'object' ? job.request_id : null;
        const customerName = job.requestOwnerNameSurname || requestId?.requestOwnerNameSurname || 'Bilinmeyen Müşteri';

        // Final price yoksa 0 kullan
        const price = job.final_price || 0;
        console.log(`💰 Vinç iş #${job.id}: final_price=${job.final_price}, kullanılan=${price}`);

        return {
          id: job.id.toString(),
          type: 'crane' as const,
          amount: price,
          customerName,
          location: job.address || 'Konum belirtilmemiş',
          date: job.completed_at || job.updated_at || job.created_at,
        };
      });

      // Tüm işleri birleştir ve tarihe göre sırala (en yeni en üstte)
      const allTransactions = [...towTransactions, ...craneTransactions].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setTransactions(allTransactions);
    } catch (error: any) {
      console.error('❌ Tamamlanan işler yüklenirken hata:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // İlk yüklemede ve ekrana her dönüldüğünde veri yükle
  useFocusEffect(
    React.useCallback(() => {
      loadCompletedJobs();
      loadTotalEarnings();
      loadPeriodEarnings(selectedPeriod);
    }, [loadTotalEarnings, loadPeriodEarnings, selectedPeriod])
  );

  // Pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    loadCompletedJobs();
    loadTotalEarnings();
    loadPeriodEarnings(selectedPeriod);
  };

  // Tarihe göre filtreleme - Filter by date period
  const filterByPeriod = (transactions: Transaction[]) => {
    const now = new Date();
    const filtered = transactions.filter((transaction) => {
      const transactionDate = new Date(transaction.date);
      const diffTime = now.getTime() - transactionDate.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);

      switch (selectedPeriod) {
        case 'today':
          return diffDays < 1;
        case 'week':
          return diffDays <= 7;
        case 'month':
          return diffDays <= 30;
        case 'year':
          return diffDays <= 365;
        default:
          return true;
      }
    });
    return filtered;
  };

  // Filtrelenmiş işlemler
  const filteredTransactions = filterByPeriod(transactions);

  // Hizmet türü emoji ve isim mapping - Service type emoji and name mapping
  const getServiceInfo = (type: string) => {
    switch (type) {
      case 'tow': return { emoji: '🚛', name: 'Çekici' };
      case 'crane': return { emoji: '🏗️', name: 'Vinç' };
      default: return { emoji: '🚗', name: 'Diğer' };
    }
  };

  // Toplam kazanç (Backend'den gelen veri) - Total earnings from backend
  const totalJobs = filteredTransactions.length;

  // Dönemsel kazançlar - Period earnings from backend
  const periodTowEarnings = parseFloat(periodEarnings?.by_service_type?.towTruck?.earnings || '0');
  const periodCraneEarnings = parseFloat(periodEarnings?.by_service_type?.crane?.earnings || '0');
  const periodTotalEarnings = parseFloat(periodEarnings?.total_earnings || '0');

  // Türk formatında para gösterimi (16227 -> 16.227)
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Loading durumu
  if (loading && transactions.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: screenBg }]} edges={["bottom"]}>
        <ActivityIndicator size="large" color="#26a69a" />
        <Text style={{ marginTop: 16, color: '#666' }}>İşlem geçmişi yükleniyor...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: screenBg }]} edges={["bottom"]}>
      {/* Ortak AppBar komponenti - Common AppBar component */}
      <AppBar title="Rapor Ve İşlem Geçmişi" />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#26a69a']} />
        }
      >
        {/* Dönem seçici - Period selector */}
        <Card style={styles.periodCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.periodTitle}>
              📊 Dönem Seçin
            </Text>
            <View style={styles.periodButtons}>
              {(['today', 'week', 'month', 'year'] as const).map((period) => (
                <Chip
                  key={period}
                  selected={selectedPeriod === period}
                  onPress={() => {
                    setSelectedPeriod(period);
                    loadPeriodEarnings(period);
                  }}
                  style={styles.periodChip}
                  mode={selectedPeriod === period ? 'flat' : 'outlined'}
                >
                  {period === 'today' ? 'Bugün' : period === 'week' ? 'Haftalık' : period === 'month' ? 'Aylık' : 'Yıllık'}
                </Chip>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* Genel Toplam Kazanç - Overall Total Earnings */}
        <Card style={styles.summaryCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.summaryTitle}>
              💰 Toplam Kazanç (Tüm Zamanlar)
            </Text>
            {earningsLoading ? (
              <ActivityIndicator size="small" color="#2e7d32" style={{ marginVertical: 16 }} />
            ) : (
              <View style={styles.summaryGrid}>
                <View style={styles.summaryItem}>
                  <Text variant="headlineMedium" style={styles.summaryAmount}>
                    ₺{formatCurrency(totalEarnings)}
                  </Text>
                  <Text variant="bodySmall" style={styles.summaryLabel}>
                    Tüm Zamanlar
                  </Text>
                </View>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Dönemsel Kazanç Özeti - Period Earnings Summary */}
        <Card style={styles.summaryCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.summaryTitle}>
              📊 Dönemsel Kazanç
            </Text>
            {periodLoading ? (
              <ActivityIndicator size="small" color="#2e7d32" style={{ marginVertical: 16 }} />
            ) : (
              <>
                <View style={styles.summaryGrid}>
                  <View style={styles.summaryItem}>
                    <Text variant="headlineMedium" style={styles.summaryAmount}>
                      ₺{formatCurrency(periodTotalEarnings)}
                    </Text>
                    <Text variant="bodySmall" style={styles.summaryLabel}>
                      {selectedPeriod === 'today' ? 'Bugün' : selectedPeriod === 'week' ? 'Bu Hafta' : selectedPeriod === 'month' ? 'Bu Ay' : 'Bu Yıl'}
                    </Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text variant="headlineMedium" style={styles.summaryJobs}>
                      {totalJobs}
                    </Text>
                    <Text variant="bodySmall" style={styles.summaryLabel}>
                      Tamamlanan İş
                    </Text>
                  </View>
                </View>
                <Divider style={styles.divider} />
                <View style={styles.earningsBreakdown}>
                  <View style={styles.breakdownItem}>
                    <Text variant="bodyMedium" style={styles.breakdownLabel}>
                      🚛 Çekici:
                    </Text>
                    <Text variant="bodyMedium" style={styles.breakdownAmount}>
                      ₺{formatCurrency(periodTowEarnings)}
                    </Text>
                  </View>
                  <View style={styles.breakdownItem}>
                    <Text variant="bodyMedium" style={styles.breakdownLabel}>
                      🏗️ Vinç:
                    </Text>
                    <Text variant="bodyMedium" style={styles.breakdownAmount}>
                      ₺{formatCurrency(periodCraneEarnings)}
                    </Text>
                  </View>
                </View>
                <Divider style={styles.divider} />
                <Text variant="bodySmall" style={styles.averageEarnings}>
                  Ortalama iş başı kazanç: ₺{totalJobs > 0 ? formatCurrency(Math.round(periodTotalEarnings / totalJobs)) : '0'}
                </Text>
              </>
            )}
          </Card.Content>
        </Card>

        {/* İşlem geçmişi - Transaction history */}
        <Card style={styles.historyCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.historyTitle}>
              📋 İşlem Geçmişi
            </Text>
            <Text variant="bodySmall" style={styles.historySubtitle}>
              Son işlemlerinizin detayları
            </Text>
          </Card.Content>
        </Card>

        {/* İşlem listesi - Transaction list */}
        {filteredTransactions.length === 0 ? (
          <Card style={styles.transactionCard}>
            <Card.Content style={{ padding: 40, alignItems: 'center' }}>
              <Text style={{ color: '#666', fontSize: 16, textAlign: 'center' }}>
                {selectedPeriod === 'today' ? 'Bugün' : selectedPeriod === 'week' ? 'Bu hafta' : selectedPeriod === 'month' ? 'Bu ay' : 'Bu yıl'} henüz tamamlanmış iş bulunmuyor.
              </Text>
            </Card.Content>
          </Card>
        ) : (
          filteredTransactions.map((transaction) => {
            const serviceInfo = getServiceInfo(transaction.type);
            return (
              <Card key={`${transaction.type}-${transaction.id}`} style={styles.transactionCard} mode="outlined">
                <Card.Content style={styles.transactionContent}>
                  <View style={styles.transactionHeader}>
                    <View style={styles.transactionInfo}>
                      <Text style={styles.serviceEmoji}>{serviceInfo.emoji}</Text>
                      <View style={styles.transactionDetails}>
                        <Text variant="titleSmall" style={styles.transactionService}>
                          {serviceInfo.name} Hizmeti
                        </Text>
                        <Text variant="bodySmall" style={styles.transactionCustomer}>
                          👤 {transaction.customerName}
                        </Text>
                        <Text variant="bodySmall" style={styles.transactionLocation}>
                          📍 {transaction.location}
                        </Text>
                        {transaction.distance && (
                          <Text variant="bodySmall" style={styles.transactionLocation}>
                            🛣️ {transaction.distance} km
                          </Text>
                        )}
                      </View>
                    </View>
                    <View style={styles.transactionAmount}>
                      <View style={styles.statusIconContainer}>
                        <MaterialCommunityIcons name="check-circle" size={28} color="#4caf50" />
                      </View>
                    </View>
                  </View>

                  <Divider style={styles.transactionDivider} />

                  <View style={styles.transactionFooter}>
                    <Text variant="bodySmall" style={styles.transactionDate}>
                      📅 {new Date(transaction.date).toLocaleDateString('tr-TR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                  </View>
                </Card.Content>
              </Card>
            );
          })
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  periodCard: {
    marginBottom: 16,
    borderRadius: 12,
  },
  periodTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#26a69a',
  },
  periodButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  periodChip: {
    flex: 1,
  },
  summaryCard: {
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: '#e8f5e8',
  },
  summaryTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#2e7d32',
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryAmount: {
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  summaryJobs: {
    fontWeight: 'bold',
    color: '#26a69a',
  },
  summaryLabel: {
    color: '#666',
    marginTop: 4,
  },
  divider: {
    marginBottom: 12,
  },
  averageEarnings: {
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  earningsBreakdown: {
    marginTop: 8,
    gap: 8,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownLabel: {
    color: '#333',
    fontWeight: '500',
  },
  breakdownAmount: {
    color: '#2e7d32',
    fontWeight: '600',
  },
  historyCard: {
    marginBottom: 16,
    borderRadius: 12,
  },
  historyTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#26a69a',
  },
  historySubtitle: {
    color: '#666',
  },
  transactionCard: {
    marginBottom: 12,
    borderRadius: 12,
  },
  transactionContent: {
    paddingVertical: 12,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  transactionInfo: {
    flexDirection: 'row',
    flex: 1,
    minWidth: 0, // Flex shrink için gerekli
  },
  serviceEmoji: {
    fontSize: 24,
    marginRight: 12,
    flexShrink: 0,
  },
  transactionDetails: {
    flex: 1,
    minWidth: 0, // Text overflow için
  },
  transactionService: {
    fontWeight: 'bold',
    marginBottom: 2,
    flexWrap: 'wrap',
  },
  transactionCustomer: {
    color: '#666',
    marginBottom: 2,
    flexWrap: 'wrap',
  },
  transactionLocation: {
    color: '#666',
    flexWrap: 'wrap',
  },
  transactionAmount: {
    alignItems: 'flex-end',
    flexShrink: 0, // Icon'un kaybolmaması için
    minWidth: 40, // Icon için minimum genişlik
    justifyContent: 'center',
  },
  amountText: {
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 8,
  },
  statusIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionDivider: {
    marginVertical: 8,
  },
  transactionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  transactionDate: {
    color: '#666',
  },
});