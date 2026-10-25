/**
 * Ana ekranın kayan duyuru / reklam panosu (müşteri uygulamasındaki CampaignSlider kalıbı).
 * Görselli içerik tam görsel kart, görselsiz içerik bülten kartı olarak çizilir.
 * Kart boyu bulunduğu alana göre ölçülür (ana ekranın %35'i).
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import type { BoardItem } from '../../api/driverBoard';
import { useFkTokens } from '../../hooks/useFkTokens';
import { dateLabel } from '../../constants/backendLabels';
import { colors, radius, shadows, spacing, text } from '../../theme/design';

const CARD_GAP = spacing.sm;
const DOTS_HEIGHT = 20;
const BOARD_PADDING_TOP = spacing.sm;
const AUTO_SCROLL_INTERVAL = 5000;

interface Props {
  items: BoardItem[];
  onPress: (item: BoardItem) => void;
}

export default function DriverBoard({ items, onPress }: Props) {
  const { tokens, isDarkMode } = useFkTokens();
  const isFocused = useIsFocused();
  const listRef = useRef<FlatList<BoardItem>>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [dragging, setDragging] = useState(false);

  const multiple = items.length > 1;
  const cardWidth = size ? size.width - spacing.md * 2 : 0;
  // Ölçülen yükseklik üst boşluğu da içerir; altta noktalar (tek içerikte küçük pay)
  const cardHeight = size ? size.height - BOARD_PADDING_TOP - (multiple ? DOTS_HEIGHT : spacing.sm) : 0;
  const interval = cardWidth + CARD_GAP;

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize((prev) => (prev && prev.width === width && prev.height === height ? prev : { width, height }));
  }, []);

  // Yenilemede içerik azaldıysa başa dön
  useEffect(() => {
    if (activeIndex >= items.length) {
      setActiveIndex(0);
      listRef.current?.scrollToOffset({ offset: 0, animated: false });
    }
  }, [items.length, activeIndex]);

  // Otomatik kaydırma: sürüklerken ve ekran odakta değilken durur
  useEffect(() => {
    if (!multiple || dragging || !isFocused || interval <= 0) return;
    const timer = setTimeout(() => {
      const next = (activeIndex + 1) % items.length;
      listRef.current?.scrollToOffset({ offset: next * interval, animated: true });
    }, AUTO_SCROLL_INTERVAL);
    return () => clearTimeout(timer);
  }, [multiple, dragging, isFocused, interval, activeIndex, items.length]);

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (interval <= 0) return;
      const index = Math.round(e.nativeEvent.contentOffset.x / interval);
      if (index >= 0 && index < items.length) setActiveIndex((prev) => (prev === index ? prev : index));
    },
    [interval, items.length],
  );

  const renderItem = useCallback(
    ({ item }: { item: BoardItem }) => {
      const cardStyle = [styles.card, { width: cardWidth, height: cardHeight }];

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
    [cardWidth, cardHeight, isDarkMode, tokens, onPress],
  );

  return (
    <View style={styles.container} onLayout={onLayout}>
      {size && cardWidth > 0 && cardHeight > 0 && (
        <>
          <FlatList
            ref={listRef}
            data={items}
            renderItem={renderItem}
            keyExtractor={(item) => String(item.id)}
            horizontal
            showsHorizontalScrollIndicator={false}
            scrollEnabled={multiple}
            onScroll={onScroll}
            scrollEventThrottle={16}
            onScrollBeginDrag={() => setDragging(true)}
            onScrollEndDrag={() => setDragging(false)}
            snapToInterval={interval}
            snapToAlignment="start"
            decelerationRate="fast"
            ItemSeparatorComponent={Separator}
            contentContainerStyle={styles.listContent}
            style={{ height: cardHeight, flexGrow: 0 }}
          />
          {multiple && (
            <View style={styles.dots}>
              {items.map((item, index) => (
                <View
                  key={item.id}
                  style={[
                    styles.dot,
                    { backgroundColor: isDarkMode ? tokens.colors.borderStrong : colors.neutral[300] },
                    index === activeIndex && styles.dotActive,
                  ]}
                />
              ))}
            </View>
          )}
        </>
      )}
    </View>
  );
}

function Separator() {
  return <View style={{ width: CARD_GAP }} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: BOARD_PADDING_TOP,
  },
  listContent: {
    paddingHorizontal: spacing.md,
  },
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
  dots: {
    height: DOTS_HEIGHT,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 18,
    backgroundColor: colors.primary[500],
  },
});
