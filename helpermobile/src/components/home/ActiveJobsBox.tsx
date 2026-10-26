/**
 * Ana ekranın iş kutusu (duyuru kartıyla aynı 16:9 boyda): sürücünün üzerindeki işler yana
 * kaydırmalı kartlar olarak; iş yoksa bildirim ve konumu açık tutma hatırlatması.
 */
import React, { useCallback } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { FkButton, FkIconChip } from '../fk';
import { useFkTokens } from '../../hooks/useFkTokens';
import type { HomeJob } from '../../services/homeJobs';
import type { HomeJobsStatus } from '../../hooks/useHomeJobs';
import { colors, radius, spacing, text } from '../../theme/design';
import HomeCarousel, {
  CAROUSEL_PADDING_BOTTOM,
  CAROUSEL_PADDING_TOP,
  CarouselCardSize,
  useCarouselCardSize,
} from './HomeCarousel';
import JobShortcutCard from './JobShortcutCard';

interface Props {
  jobs: HomeJob[];
  status: HomeJobsStatus;
  onOpen: (job: HomeJob) => void;
  onRetry: () => void;
}

export default function ActiveJobsBox({ jobs, status, onOpen, onRetry }: Props) {
  const { tokens } = useFkTokens();
  const cardSize = useCarouselCardSize();

  const renderCard = useCallback(
    (job: HomeJob, size: CarouselCardSize) => <JobShortcutCard job={job} onOpen={onOpen} style={size} />,
    [onOpen],
  );

  if (jobs.length > 0) {
    return <HomeCarousel items={jobs} keyExtractor={(job) => job.key} renderCard={renderCard} />;
  }

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.placeholder,
          { height: cardSize.height, backgroundColor: tokens.colors.cardBg, borderColor: tokens.colors.border },
        ]}
      >
        {status === 'loading' ? (
          <ActivityIndicator color={colors.primary[500]} />
        ) : status === 'error' ? (
          <>
            <FkIconChip icon="wifi-off" color="neutral" size={48} shape="circle" />
            <Text style={[styles.title, { color: tokens.colors.textPrimary }]}>İşleriniz yüklenemedi</Text>
            <FkButton size="sm" variant="secondary" onPress={onRetry} style={styles.retry}>
              Tekrar Dene
            </FkButton>
          </>
        ) : (
          <>
            <FkIconChip icon="bell-ring-outline" size={48} shape="circle" />
            <Text style={[styles.title, { color: tokens.colors.textPrimary }]}>Şu an üzerinde talep yok</Text>
            <Text style={[styles.message, { color: tokens.colors.textSecondary }]}>
              Bildirimlerini ve konumunu açık tut.
            </Text>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingTop: CAROUSEL_PADDING_TOP,
    paddingBottom: CAROUSEL_PADDING_BOTTOM,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  title: {
    ...text.cardTitle,
    marginTop: spacing.sm + 4,
    textAlign: 'center',
  },
  message: {
    ...text.body,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  retry: {
    marginTop: spacing.sm + 4,
  },
});
