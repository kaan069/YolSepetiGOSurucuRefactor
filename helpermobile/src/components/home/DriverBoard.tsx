/**
 * Ana ekranın kayan duyuru / reklam panosu (HomeCarousel üzerinde, kendiliğinden kayar).
 * Görselli içerik tam görsel kart, görselsiz içerik bülten kartı olarak çizilir.
 */
import React, { useCallback } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import type { BoardItem } from '../../api/driverBoard';
import { useFkTokens } from '../../hooks/useFkTokens';
import { dateLabel } from '../../constants/backendLabels';
import { colors, radius, shadows, spacing, text } from '../../theme/design';
import HomeCarousel, { CarouselCardSize } from './HomeCarousel';

interface Props {
  items: BoardItem[];
  onPress: (item: BoardItem) => void;
}

export default function DriverBoard({ items, onPress }: Props) {
  const { tokens, isDarkMode } = useFkTokens();

  const renderCard = useCallback(
    (item: BoardItem, size: CarouselCardSize) => {
      const cardStyle = [styles.card, size];

      if (item.image_url) {
        return (
          <TouchableOpacity
            style={[cardStyle, { backgroundColor: tokens.colors.surfaceMuted }]}
            activeOpacity={0.9}
            onPress={() => onPress(item)}
            accessibilityRole="button"
            accessibilityLabel={item.title}
          >
            <Image source={{ uri: item.image_url }} style={styles.image} resizeMode="cover" />
            <View style={styles.imageCaption}>
              <Text style={styles.imageTitle} numberOfLines={1}>
                {item.title}
              </Text>
              {!!item.summary && (
                <Text style={styles.imageSummary} numberOfLines={2}>
                  {item.summary}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        );
      }

      // Bülten kartı
      return (
        <TouchableOpacity
          style={[
            cardStyle,
            styles.bulletin,
            {
              backgroundColor: isDarkMode ? tokens.colors.surfaceMuted : colors.primary[50],
              borderColor: isDarkMode ? tokens.colors.border : colors.primary[100],
            },
          ]}
          activeOpacity={0.85}
          onPress={() => onPress(item)}
          accessibilityRole="button"
          accessibilityLabel={item.title}
        >
          <View style={styles.bulletinHeader}>
            <View style={[styles.bulletinIcon, { backgroundColor: isDarkMode ? tokens.colors.cardBg : colors.primary[100] }]}>
              <MaterialCommunityIcons name="bullhorn-outline" size={18} color={colors.primary[500]} />
            </View>
            <Text style={[styles.bulletinKicker, { color: colors.primary[isDarkMode ? 400 : 600] }]}>Duyuru</Text>
            {!!item.published_at && (
              <Text style={[styles.bulletinDate, { color: tokens.colors.textSecondary }]} numberOfLines={1}>
                {dateLabel(item.published_at)}
              </Text>
            )}
          </View>
          <Text style={[styles.bulletinTitle, { color: tokens.colors.textPrimary }]} numberOfLines={2}>
            {item.title}
          </Text>
          {!!item.summary && (
            <Text style={[styles.bulletinSummary, { color: tokens.colors.textSecondary }]} numberOfLines={3}>
              {item.summary}
            </Text>
          )}
          <View style={styles.bulletinFooter}>
            <Text style={[styles.bulletinMore, { color: colors.primary[isDarkMode ? 400 : 500] }]}>Detayları gör</Text>
            <MaterialCommunityIcons name="chevron-right" size={18} color={colors.primary[isDarkMode ? 400 : 500]} />
          </View>
        </TouchableOpacity>
      );
    },
    [isDarkMode, tokens, onPress],
  );

  return <HomeCarousel items={items} keyExtractor={(item) => String(item.id)} renderCard={renderCard} autoScroll />;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  imageCaption: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  imageTitle: {
    ...text.cardTitle,
    color: colors.white,
  },
  imageSummary: {
    ...text.meta,
    color: 'rgba(255,255,255,0.88)',
    marginTop: 2,
  },
  bulletin: {
    borderWidth: 1,
    padding: spacing.md,
  },
  bulletinHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  bulletinIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bulletinKicker: {
    ...text.captionStrong,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bulletinDate: {
    ...text.caption,
    flex: 1,
    textAlign: 'right',
  },
  bulletinTitle: {
    ...text.cardTitle,
    marginTop: spacing.sm + 2,
  },
  bulletinSummary: {
    ...text.body,
    marginTop: spacing.xs,
    flexShrink: 1,
  },
  bulletinFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: spacing.xs,
  },
  bulletinMore: {
    ...text.captionStrong,
  },
});
