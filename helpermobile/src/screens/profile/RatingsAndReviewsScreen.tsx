// Yorumlar ve Puan Ekranı - Ratings and Reviews Screen
// Sürücü puanlama istatistikleri ve yorumları gösterir
import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, RefreshControl, Modal, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Text, Divider, Appbar } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import LoadingSpinner from '../../components/LoadingSpinner';
import ratingsAPI, { RatingStats } from '../../api/ratings';
import AppBar from '../../components/common/AppBar';
import { useAppTheme } from '../../hooks/useAppTheme';
import { logger } from '../../utils/logger';

type Props = NativeStackScreenProps<RootStackParamList, 'RatingsAndReviews'>;

interface Review {
  id: number;
  rating: number;
  comment: string;
  customer_name: string;
  created_at: string;
}

export default function RatingsAndReviewsScreen({ navigation }: Props) {
  const { screenBg, cardBg } = useAppTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<RatingStats | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [tipsModalVisible, setTipsModalVisible] = useState(false);

  // API'den veri yükle - Load data from API
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await ratingsAPI.getMyRatings();

      logger.debug('orders', 'RatingsScreen.load ok', {
        average: response.stats.average_rating,
        total: response.stats.total_ratings,
        reviewCount: response.count,
      });

      setStats(response.stats);
      setReviews(response.results);
      setTotalCount(response.count);
    } catch (error: any) {
      logger.error('orders', 'RatingsScreen.load failure', { status: error?.response?.status });
      // Hata axios interceptor tarafından yönetiliyor (bildirim gösterilecek)
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getRatingBenchmark = (rating: number): string => {
    if (rating >= 4.80) return 'Mükemmel';
    if (rating >= 4.50) return 'Çok İyi';
    if (rating >= 4.00) return 'İyi';
    if (rating >= 3.50) return 'Ortalama';
    return 'İyileştirme Gerekli';
  };

  const getRatingColor = (rating: number): string => {
    if (rating >= 4.80) return '#2E7D32';
    if (rating >= 4.50) return '#388E3C';
    if (rating >= 4.00) return '#689F38';
    if (rating >= 3.50) return '#F57C00';
    return '#D32F2F';
  };

  // Müşteri adını gizle (Ahmet Yılmaz → A*** Y***)
  const anonymizeCustomerName = (fullName: string): string => {
    if (!fullName || fullName.trim() === '') return 'Müşteri';

    const parts = fullName.trim().split(' ');
    return parts.map(part => {
      if (part.length === 0) return '';
      if (part.length === 1) return part + '***';
      return part.charAt(0) + '***';
    }).join(' ');
  };

  const renderStars = (rating: number) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <MaterialCommunityIcons
            key={star}
            name={star <= rating ? 'star' : 'star-outline'}
            size={18}
            color="#FFC107"
            style={{ marginRight: 2 }}
          />
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: screenBg }]}>
        <View style={styles.loadingContainer}>
          <LoadingSpinner size={80} />
          <Text style={styles.loadingText}>Puanlama verileri yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: screenBg }]} edges={["bottom"]}>
      {/* Ortak AppBar komponenti - Common AppBar component */}
      <AppBar
        title="Puanlama ve Yorumlar"
        rightActions={
          <Appbar.Action
            icon="help-circle-outline"
            onPress={() => setTipsModalVisible(true)}
          />
        }
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#26a69a']}
            tintColor="#26a69a"
          />
        }
      >
        {/* Genel Bakış Kartı */}
        <Card style={[styles.card, { backgroundColor: cardBg }]}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              📊 Puanlama İstatistikleriniz
            </Text>

            {stats && (
              <>
                <View style={styles.overviewContainer}>
                  <View style={styles.ratingCircle}>
                    <Text style={[styles.averageRating, { color: getRatingColor(parseFloat(stats.average_rating)) }]}>
                      {stats.average_rating}
                    </Text>
                    <Text style={styles.outOfFive}>/ 5.0</Text>
                  </View>

                  <View style={styles.ratingDetails}>
                    {renderStars(Math.round(parseFloat(stats.average_rating)))}
                    <Text style={styles.totalRatings}>
                      {stats.total_ratings} değerlendirme
                    </Text>
                    <Text style={[styles.benchmark, { color: getRatingColor(parseFloat(stats.average_rating)) }]}>
                      {getRatingBenchmark(parseFloat(stats.average_rating))}
                    </Text>
                  </View>
                </View>
              </>
            )}
          </Card.Content>
        </Card>

        {/* Yorumlar */}
        <Card style={[styles.card, { backgroundColor: cardBg }]}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              💬 Müşteri Yorumları ({totalCount})
            </Text>

            {reviews.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="comment-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>Henüz puanlama bulunmuyor</Text>
                <Text style={styles.emptySubtext}>
                  Müşteriler servis sonrası sizin hakkınızda puanlama yapabilir
                </Text>
              </View>
            ) : (
              reviews.map((review) => (
                <View key={review.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <View style={styles.reviewerInfo}>
                      <MaterialCommunityIcons name="account-circle" size={32} color="#26a69a" />
                      <View style={{ marginLeft: 8 }}>
                        <Text style={styles.reviewerName}>{anonymizeCustomerName(review.customer_name)}</Text>
                        <Text style={styles.reviewDate}>
                          {new Date(review.created_at).toLocaleDateString('tr-TR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </Text>
                      </View>
                    </View>
                    {renderStars(review.rating)}
                  </View>

                  {review.comment && review.comment.trim() !== '' && (
                    <Text style={styles.reviewComment}>{review.comment}</Text>
                  )}
                  <Divider style={styles.reviewDivider} />
                </View>
              ))
            )}
          </Card.Content>
        </Card>

        {/* Bilgi Notları */}
        <Card style={[styles.card, styles.infoCard]}>
          <Card.Content>
            <View style={styles.infoHeader}>
              <MaterialCommunityIcons name="information" size={24} color="#1976D2" />
              <Text variant="titleSmall" style={[styles.sectionTitle, { marginLeft: 8, marginBottom: 0 }]}>
                Önemli Bilgiler
              </Text>
            </View>
            <Text style={styles.infoText}>
              • Puanlamalar müşteriler tarafından servis sonrası verilir{'\n'}
              • Tüm puanlamalar kalıcıdır ve değiştirilemez{'\n'}
              • Puanlarınız herkese açık olarak görüntülenir{'\n'}
              • Yüksek puan daha fazla müşteri anlamına gelir{'\n'}
              • Müşteri yorumlarına yanıt veremezsiniz
            </Text>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* İpuçları Modal */}
      <Modal
        visible={tipsModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setTipsModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setTipsModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <MaterialCommunityIcons name="lightbulb-on" size={32} color="#FFC107" />
              <Text variant="titleLarge" style={styles.modalTitle}>
                Puanınızı İyileştirme İpuçları
              </Text>
            </View>

            <View style={styles.tipsContainer}>
              <View style={styles.tipRow}>
                <MaterialCommunityIcons name="clock-check" size={24} color="#26a69a" />
                <Text style={styles.tipText}>Zamanında gelin veya gecikmeleri bildirin</Text>
              </View>

              <View style={styles.tipRow}>
                <MaterialCommunityIcons name="account-tie" size={24} color="#26a69a" />
                <Text style={styles.tipText}>Profesyonel ve nazik olun</Text>
              </View>

              <View style={styles.tipRow}>
                <MaterialCommunityIcons name="check-circle" size={24} color="#26a69a" />
                <Text style={styles.tipText}>İşi verimli ve güvenli bir şekilde tamamlayın</Text>
              </View>

              <View style={styles.tipRow}>
                <MaterialCommunityIcons name="car-wash" size={24} color="#26a69a" />
                <Text style={styles.tipText}>Aracınızı temiz ve bakımlı tutun</Text>
              </View>

              <View style={styles.tipRow}>
                <MaterialCommunityIcons name="message-text" size={24} color="#26a69a" />
                <Text style={styles.tipText}>Müşterilerle açık iletişim kurun</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setTipsModalVisible(false)}
            >
              <Text style={styles.modalCloseButtonText}>Anladım</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  card: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#26a69a',
  },
  overviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  ratingCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  averageRating: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  outOfFive: {
    fontSize: 14,
    color: '#666',
  },
  ratingDetails: {
    flex: 1,
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  totalRatings: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  benchmark: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#bbb',
    marginTop: 4,
    textAlign: 'center',
  },
  reviewCard: {
    marginBottom: 16,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reviewerName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  reviewDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  reviewComment: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginTop: 8,
  },
  reviewDivider: {
    marginTop: 16,
  },
  infoCard: {
    backgroundColor: '#E3F2FD',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 13,
    color: '#1565C0',
    lineHeight: 20,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff', // Modal always light for readability
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    marginTop: 12,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  tipsContainer: {
    marginBottom: 20,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  tipText: {
    flex: 1,
    fontSize: 15,
    color: '#666',
    marginLeft: 12,
    lineHeight: 22,
  },
  modalCloseButton: {
    backgroundColor: '#26a69a',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
