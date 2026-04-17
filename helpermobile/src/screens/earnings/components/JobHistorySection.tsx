import React from 'react';
import { View, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Text } from 'react-native-paper';
import { EarningsServiceType } from '../../../api';
import JobHistoryCard from '../../../components/JobHistoryCard';
import { CompletedJob, SERVICE_TYPE_LABELS } from '../constants';
import { useAppTheme } from '../../../hooks/useAppTheme';

interface Props {
  jobs: CompletedJob[];
  listLoading: boolean;
  hasMore: boolean;
  loadingMore: boolean;
  totalCount: number;
  currentCount: number;
  selectedServiceTypes: EarningsServiceType[];
  onJobPress: (job: CompletedJob) => void;
  onLoadMore: () => void;
  onClearFilters: () => void;
}

export default function JobHistorySection({
  jobs,
  listLoading,
  hasMore,
  loadingMore,
  totalCount,
  currentCount,
  selectedServiceTypes,
  onJobPress,
  onLoadMore,
  onClearFilters,
}: Props) {
  const { isDarkMode, appColors, cardBg } = useAppTheme();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: appColors.text.primary }]}>İş Geçmişi</Text>
          <View style={[styles.countBadge, { backgroundColor: appColors.primary[50] }]}>
            <Text style={styles.countText}>{totalCount}</Text>
          </View>
        </View>
        {selectedServiceTypes.length > 0 && (
          <TouchableOpacity onPress={onClearFilters} style={[styles.clearButton, { backgroundColor: isDarkMode ? '#442726' : '#ffebee' }]}>
            <Text style={styles.clearText}>Filtreleri Temizle</Text>
          </TouchableOpacity>
        )}
      </View>

      {listLoading && jobs.length === 0 ? (
        <View style={[styles.loadingContainer, { backgroundColor: cardBg }]}>
          <ActivityIndicator size="small" color="#00897b" />
          <Text style={[styles.loadingText, { color: appColors.text.secondary }]}>Yükleniyor...</Text>
        </View>
      ) : jobs.length === 0 ? (
        <View style={[styles.emptyContainer, { backgroundColor: cardBg }]}>
          <View style={[styles.emptyIconContainer, { backgroundColor: isDarkMode ? '#333' : '#f5f5f5' }]}>
            <Text style={styles.emptyIcon}>📭</Text>
          </View>
          <Text style={[styles.emptyTitle, { color: appColors.text.primary }]}>
            {selectedServiceTypes.length > 0 ? 'Sonuç Bulunamadı' : 'Henüz İş Yok'}
          </Text>
          <Text style={[styles.emptySubtitle, { color: appColors.text.secondary }]}>
            {selectedServiceTypes.length > 0
              ? 'Seçili filtrelere uygun iş bulunamadı.'
              : 'Bu dönemde tamamlanan iş yok.'}
          </Text>
          {selectedServiceTypes.length > 0 && (
            <TouchableOpacity onPress={onClearFilters} style={[styles.emptyButton, { backgroundColor: appColors.primary[50] }]}>
              <Text style={styles.emptyButtonText}>Filtreleri Temizle</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <>
          {jobs.map((job) => (
            <JobHistoryCard
              key={`${job.serviceType}-${job.id}`}
              job={job}
              serviceTypeLabel={SERVICE_TYPE_LABELS[job.serviceType]}
              onPress={() => onJobPress(job)}
            />
          ))}

          {hasMore && (
            <TouchableOpacity
              style={[styles.loadMoreButton, { backgroundColor: cardBg }, loadingMore && { borderColor: isDarkMode ? '#444' : '#e0e0e0' }]}
              onPress={onLoadMore}
              disabled={loadingMore}
              activeOpacity={0.7}
            >
              {loadingMore ? (
                <ActivityIndicator size="small" color="#00897b" />
              ) : (
                <Text style={styles.loadMoreText}>
                  Daha Fazla Yükle ({currentCount}/{totalCount})
                </Text>
              )}
            </TouchableOpacity>
          )}

          {!hasMore && currentCount > 0 && (
            <View style={styles.endIndicator}>
              <View style={[styles.endLine, { backgroundColor: isDarkMode ? '#444' : '#e0e0e0' }]} />
              <Text style={[styles.endText, { color: appColors.text.secondary }]}>Tüm kayıtlar ({currentCount})</Text>
              <View style={[styles.endLine, { backgroundColor: isDarkMode ? '#444' : '#e0e0e0' }]} />
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00897b',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  clearText: {
    fontSize: 12,
    color: '#D32F2F',
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    borderRadius: 16,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyIcon: {
    fontSize: 28,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySubtitle: {
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 18,
  },
  emptyButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  emptyButtonText: {
    color: '#00897b',
    fontSize: 13,
    fontWeight: '600',
  },
  loadMoreButton: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#00897b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadMoreText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#00897b',
  },
  endIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 8,
    gap: 12,
  },
  endLine: {
    flex: 1,
    height: 1,
  },
  endText: {
    fontSize: 11,
    fontWeight: '500',
  },
});
